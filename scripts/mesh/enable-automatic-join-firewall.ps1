$ErrorActionPreference = 'Stop'
$kmPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $kmPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run this scoped firewall setup as Administrator.' }
$kmRule = Get-NetFirewallRule -Name 'AfribitMeshAutomaticJoin' -ErrorAction SilentlyContinue
if ($kmRule) {
    $kmPort = $kmRule | Get-NetFirewallPortFilter
    $kmAddress = $kmRule | Get-NetFirewallAddressFilter
    if ($kmPort.LocalPort -ne '8040' -or $kmAddress.RemoteAddress -ne '10.30.0.0/24') { throw 'Existing Mesh rule differs; inspect before changing it.' }
    Enable-NetFirewallRule -Name 'AfribitMeshAutomaticJoin' | Out-Null
} else {
    New-NetFirewallRule -Name 'AfribitMeshAutomaticJoin' -DisplayName 'Afribit Mesh automatic checkout join' `
      -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8040 -LocalAddress 10.20.0.10 `
      -RemoteAddress 10.30.0.0/24 -Profile Any | Out-Null
}
Write-Output 'Mesh join port 8040 allowed only from customer subnet 10.30.0.0/24.'
