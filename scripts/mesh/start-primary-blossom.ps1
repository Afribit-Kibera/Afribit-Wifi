$ErrorActionPreference='Stop'
$kmRepo=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$kmPython=Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'
$kmWrapper=Join-Path $PSScriptRoot 'run-lab-podman.py'
$kmImage='ghcr.io/hzrd149/blossom-server@sha256:36f87c950992b8e8a1a0ac8fbf15fd5afa34e9283068a6916b63b05ea3a8d817'
& $kmPython $kmWrapper container exists kibera-blossom-001
if ($LASTEXITCODE -ne 0) {
    # This lab checkout is on drive D:, mounted by the existing runtime at /mnt/d.
    $kmConfig='/mnt/d/' + $kmRepo.Substring(3).Replace('\','/') + '/scripts/mesh/blossom-lab.yml'
    & $kmPython $kmWrapper run --detach --name kibera-blossom-001 --network kibera-nostr-lab --publish 127.0.0.1:8031:3000 --mount 'type=volume,source=kibera-blossom-data-001,target=/app/data' --mount "type=bind,source=$kmConfig,target=/app/config.yml,readonly" --env BLOSSOM_REQUIRE_CONFIG=1 --memory 384m --cpus 1 --cap-drop ALL --security-opt no-new-privileges --restart unless-stopped $kmImage
} else {
    & $kmPython $kmWrapper start kibera-blossom-001
}
if ($LASTEXITCODE -ne 0) { throw 'Blossom container startup failed' }
for ($kmTry=0;$kmTry -lt 60;$kmTry++) {
    if (Get-NetIPAddress -IPAddress 10.20.0.10 -ErrorAction SilentlyContinue) { break }
    Start-Sleep -Seconds 2
}
if (-not(Get-NetIPAddress -IPAddress 10.20.0.10 -ErrorAction SilentlyContinue)) { throw 'Primary lab address absent' }
& $kmPython (Join-Path $PSScriptRoot 'forward-blossom-server.py') --bind 10.20.0.10
if ($LASTEXITCODE -ne 0) { throw 'Blossom front door exited' }
