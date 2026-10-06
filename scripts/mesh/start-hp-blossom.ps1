$ErrorActionPreference='Continue'
$kmRoot=Split-Path -Parent $PSCommandPath
$kmPodman=Join-Path $env:ProgramFiles 'RedHat\Podman\podman.exe'
$kmPython=Join-Path $env:LOCALAPPDATA 'Python\pythoncore-3.14-64\python.exe'
$kmImage='ghcr.io/hzrd149/blossom-server@sha256:36f87c950992b8e8a1a0ac8fbf15fd5afa34e9283068a6916b63b05ea3a8d817'
function Assert-KmExit($operation) { if ($LASTEXITCODE -ne 0) { throw "$operation failed: exit $LASTEXITCODE" } }
function Set-KmPhase($phase,$detail='') { @{phase=$phase;detail=$detail;utc=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $kmRoot 'blossom-state.json') -ErrorAction Stop }
try {
    # Relay startup owns machine activation. Wait for that local runtime;
    # login tasks can start concurrently after a cold boot.
    Set-KmPhase 'waiting-for-runtime'
    $kmReady=$false
    for ($kmTry=0;$kmTry -lt 60;$kmTry++) {
        & $kmPodman --connection km-lab-002-root info *> $null
        if ($LASTEXITCODE -eq 0) { $kmReady=$true;break }
        Start-Sleep -Seconds 2
    }
    if (-not $kmReady) { throw 'Local HP runtime unavailable; check the relay startup task' }
    Set-KmPhase 'checking-cached-image'
    & $kmPodman --connection km-lab-002-root image exists $kmImage
    if ($LASTEXITCODE -eq 1) {
        Set-KmPhase 'pulling-image'
        & $kmPodman --connection km-lab-002-root pull $kmImage
        Assert-KmExit 'Pull pinned Blossom image'
    } else { Assert-KmExit 'Check pinned Blossom image' }
    & $kmPodman --connection km-lab-002-root container exists kibera-blossom-002
    if ($LASTEXITCODE -ne 0) {
        $kmConfig='/mnt/c/' + $kmRoot.Substring(3).Replace('\','/') + '/blossom-lab.yml'
        & $kmPodman --connection km-lab-002-root run --detach --name kibera-blossom-002 --network kibera-nostr-lab --publish 127.0.0.1:8031:3000 --mount 'type=volume,source=kibera-blossom-data-002,target=/app/data' --mount "type=bind,source=$kmConfig,target=/app/config.yml,readonly" --env BLOSSOM_REQUIRE_CONFIG=1 --memory 384m --cpus 1 --cap-drop ALL --security-opt no-new-privileges --restart unless-stopped $kmImage
        Assert-KmExit 'Create Blossom container'
    } else {
        & $kmPodman --connection km-lab-002-root start kibera-blossom-002
        Assert-KmExit 'Start Blossom container'
    }
    for ($kmTry=0;$kmTry -lt 60;$kmTry++) {
        if (Get-NetIPAddress -IPAddress 10.21.0.198 -ErrorAction SilentlyContinue) { break }
        Start-Sleep -Seconds 2
    }
    if (-not (Get-NetIPAddress -IPAddress 10.21.0.198 -ErrorAction SilentlyContinue)) { throw 'HP lab address absent' }
    Set-KmPhase 'serving'
    & $kmPython (Join-Path $kmRoot 'forward-blossom-server.py') --bind 10.21.0.198
    Assert-KmExit 'Blossom front door'
} catch { Set-KmPhase 'failed' $_.Exception.Message; throw }
