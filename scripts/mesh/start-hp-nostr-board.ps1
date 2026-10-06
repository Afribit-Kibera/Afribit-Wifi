# Local board startup, independent of WSL and any Internet connection.
# Keep this foreground process owned by the existing login task.
$ErrorActionPreference='Continue'
$ProgressPreference='SilentlyContinue'
$kmRoot=Split-Path -Parent $PSCommandPath
$kmPython=Join-Path $env:LOCALAPPDATA 'Python\pythoncore-3.14-64\python.exe'
function Set-KmBoardPhase($phase,$detail='') {
    @{phase=$phase;detail=$detail;utc=[DateTime]::UtcNow.ToString('o')} |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $kmRoot 'board-state.json') -ErrorAction Stop
}
try {
    Set-KmBoardPhase 'waiting-for-lab-address'
    for ($kmTry=0;$kmTry -lt 90;$kmTry++) {
        if (Get-NetIPAddress -AddressFamily IPv4 -IPAddress 10.21.0.198 -ErrorAction SilentlyContinue) { break }
        Start-Sleep -Seconds 2
    }
    if (-not(Get-NetIPAddress -AddressFamily IPv4 -IPAddress 10.21.0.198 -ErrorAction SilentlyContinue)) {
        throw 'Node2 Wi-Fi address 10.21.0.198 did not become available'
    }
    Set-KmBoardPhase 'starting-board'
    & $kmPython (Join-Path $kmRoot 'serve-nostr-client.py') (Join-Path $kmRoot 'public') --bind 10.21.0.198 *> (Join-Path $kmRoot 'board-runtime.log')
    $kmExit=$LASTEXITCODE
    throw "Board exited: code $kmExit; see board-runtime.log"
} catch {
    Set-KmBoardPhase 'failed' $_.Exception.Message
    throw
}
