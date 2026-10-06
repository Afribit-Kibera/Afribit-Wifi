# HP service host: existing Podman relay and a lab-only TCP front door.
# Run by an interactive scheduled task after the operator signs into Windows.
# Windows PowerShell treats native stderr (including Podman's progress) as
# error records. Check native exit codes explicitly instead of aborting on it.
$ErrorActionPreference='Continue'
$ProgressPreference='SilentlyContinue'
$env:CONTAINERS_MACHINE_PROVIDER='wsl'
$kmRoot = Split-Path -Parent $PSCommandPath
$kmPodman = Join-Path $env:ProgramFiles 'RedHat\Podman\podman.exe'
$kmPython = Join-Path $env:LOCALAPPDATA 'Python\pythoncore-3.14-64\python.exe'
$kmImage = 'docker.io/scsibug/nostr-rs-relay@sha256:48d54c2d2781577cf3ed2951112f0953dc2c5e7c9d2ea20c64e8c0fa37d16e4d'
function Set-KmPhase($phase,$detail='') {
    @{phase=$phase;detail=$detail;utc=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $kmRoot 'relay-state.json') -ErrorAction Stop
}
function Assert-KmExit($operation) {
    if ($LASTEXITCODE -ne 0) { throw "$operation failed: exit $LASTEXITCODE" }
}
try {
    Set-KmPhase 'initializing-machine'
    $kmMachines = @((& $kmPodman machine list --format json | ConvertFrom-Json))
    Assert-KmExit 'List machines'
    if ('km-lab-002' -notin $kmMachines.Name) {
        & $kmPodman machine init --memory 2048 --cpus 2 --disk-size 20 km-lab-002
        Assert-KmExit 'Initialize machine'
    }
    Set-KmPhase 'starting-machine'
    $kmMachine = @((& $kmPodman machine inspect km-lab-002 | ConvertFrom-Json))[0]
    Assert-KmExit 'Inspect machine'
    if ($kmMachine.State -ne 'running') {
        & $kmPodman machine start km-lab-002
        Assert-KmExit 'Start machine'
    }
    # This WSL image lacks delegated rootless resource-control groups. Use
    # the root backend inside the isolated VM so container limits apply.
    # The relay image itself still runs as its unprivileged appuser.
    & $kmPodman system connection default km-lab-002-root
    Assert-KmExit 'Select lab machine connection'
    Set-KmPhase 'checking-image'
    & $kmPodman image exists $kmImage
    if ($LASTEXITCODE -ne 0) {
        Set-KmPhase 'pulling-image'
        & $kmPodman pull $kmImage
        Assert-KmExit 'Pull pinned relay image'
    }
    & $kmPodman container exists kibera-nostr-relay-002
    if ($LASTEXITCODE -ne 0) {
        & $kmPodman volume exists kibera-nostr-db-002
        if ($LASTEXITCODE -ne 0) { & $kmPodman volume create kibera-nostr-db-002; Assert-KmExit 'Create database volume' }
        & $kmPodman network exists kibera-nostr-lab
        if ($LASTEXITCODE -ne 0) { & $kmPodman network create kibera-nostr-lab; Assert-KmExit 'Create lab network' }
        $kmConfigPath = '/mnt/c/' + $kmRoot.Substring(3).Replace('\','/') + '/config.toml'
        & $kmPodman run --detach --name kibera-nostr-relay-002 --network kibera-nostr-lab --publish 127.0.0.1:7778:8080 --mount 'type=volume,source=kibera-nostr-db-002,target=/usr/src/app/db' --mount "type=bind,source=$kmConfigPath,target=/usr/src/app/config.toml,readonly" --memory 256m --cpus 1 --cap-drop ALL --security-opt no-new-privileges --restart unless-stopped $kmImage
        Assert-KmExit 'Create relay'
    } else {
        & $kmPodman start kibera-nostr-relay-002
        Assert-KmExit 'Start relay'
    }
    Set-KmPhase 'waiting-for-lab-address'
    for ($kmAttempt=0; $kmAttempt -lt 60; $kmAttempt++) {
        if (Get-NetIPAddress -AddressFamily IPv4 -IPAddress '10.21.0.198' -ErrorAction SilentlyContinue) { break }
        Start-Sleep -Seconds 2
    }
    if (-not(Get-NetIPAddress -AddressFamily IPv4 -IPAddress '10.21.0.198' -ErrorAction SilentlyContinue)) { throw 'HP lab address 10.21.0.198 is absent; reconnect KiberaMesh-Node2.' }
    $kmReady=$false
    for ($kmAttempt=0; $kmAttempt -lt 30; $kmAttempt++) {
        try {
            $kmMetadata=Invoke-RestMethod -Uri 'http://127.0.0.1:7778/' -Headers @{Accept='application/nostr+json'} -TimeoutSec 2
            if ($kmMetadata.name -eq 'Kibera Mesh Lab Relay 002 HP') { $kmReady=$true;break }
        } catch { Start-Sleep -Seconds 2 }
    }
    if (-not $kmReady) { throw 'Expected local HP relay did not become ready.' }
    Set-KmPhase 'serving' 'Independent HP relay; lab front door starting.'
    & $kmPython (Join-Path $kmRoot 'forward-nostr-relay.py') --bind 10.21.0.198
    Assert-KmExit 'Lab front door'
    throw 'Lab front door exited; the task needs restart.'
} catch {
    Set-KmPhase 'failed' $_.Exception.Message
    throw
}
