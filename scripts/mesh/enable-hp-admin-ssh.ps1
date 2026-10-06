# Run on the HP in an elevated PowerShell window after joining Tailscale.
# Public key only. The private key stays on the operator computer.
# References: Microsoft OpenSSH installation and server configuration guides.
$ErrorActionPreference = 'Stop'
$kmIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$kmPrincipal = New-Object Security.Principal.WindowsPrincipal($kmIdentity)
if (-not $kmPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Open PowerShell with Run as administrator, then run this script again.'
}
$kmTailscale = Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'
if (-not (Test-Path -LiteralPath $kmTailscale)) { throw 'Install Tailscale and sign in first.' }
$kmStatusText = & $kmTailscale status --json
if ($LASTEXITCODE -ne 0) { throw 'Cannot read Tailscale state.' }
$kmStatus = $kmStatusText | ConvertFrom-Json
if ($kmStatus.BackendState -ne 'Running') { throw 'Sign in to Tailscale first.' }
$kmTailIPv4 = @($kmStatus.Self.TailscaleIPs | Where-Object { $_ -match '^100\.' })
if ($kmTailIPv4.Count -ne 1) { throw 'Expected one Tailscale IPv4 address.' }
# Check before any mutation: use the HP's existing account, never a root account.
$kmUser = $kmIdentity.Name.ToLowerInvariant()
if ($kmUser -notmatch '^[a-z0-9_.-]+\\[a-z0-9_.-]+$') {
    throw 'Account format needs inspection before configuring SSH.'
}
$kmParts = $kmUser.Split('\')
if ($kmParts[0] -eq $env:COMPUTERNAME.ToLowerInvariant()) { $kmUser = $kmParts[1] }
$kmCapability = Get-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'
if ($kmCapability.State -ne 'Installed') {
    $kmInstall = Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'
    if ($kmInstall.RestartNeeded) { throw 'Windows requests a restart. Restart, then rerun this script.' }
}
$kmSshDir = Join-Path $env:ProgramData 'ssh'
New-Item -ItemType Directory -Path $kmSshDir -Force | Out-Null
$kmConfig = Join-Path $kmSshDir 'sshd_config'
$kmDefault = Join-Path $env:WINDIR 'System32\OpenSSH\sshd_config_default'
if (-not (Test-Path -LiteralPath $kmConfig)) { Copy-Item -LiteralPath $kmDefault -Destination $kmConfig }
$kmStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath $kmConfig -Destination "$kmConfig.before-kibera-$kmStamp"
$kmAuth = Join-Path $kmSshDir 'administrators_authorized_keys'
if (Test-Path -LiteralPath $kmAuth) { Copy-Item -LiteralPath $kmAuth -Destination "$kmAuth.before-kibera-$kmStamp" }
$kmKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEyOaRhpkgKBWbH6IN257KNK+mQx2dVwLwvTRANuDBxp kibera-hp-lab-admin'
$kmKeys = if (Test-Path -LiteralPath $kmAuth) { @(Get-Content -LiteralPath $kmAuth) } else { @() }
if ($kmKeys -notcontains $kmKey) { Add-Content -LiteralPath $kmAuth -Value $kmKey -Encoding ascii }
& icacls.exe $kmAuth /inheritance:r /grant:r '*S-1-5-32-544:F' '*S-1-5-18:F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not secure administrator authorized keys.' }
# Remove inherited/pre-existing extra ACL entries, retaining only SYSTEM and Administrators.
$kmAcl = Get-Acl -LiteralPath $kmAuth
foreach ($kmRule in @($kmAcl.Access)) {
    $kmSid = $kmRule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
    if ($kmSid -notin @('S-1-5-32-544', 'S-1-5-18')) { $kmAcl.RemoveAccessRuleSpecific($kmRule) }
}
Set-Acl -LiteralPath $kmAuth -AclObject $kmAcl
$kmOriginal = Get-Content -LiteralPath $kmConfig -Raw
# Replace global authentication directives; place them before any Match section.
# Preserve the remaining configuration and its original file in the backup above.
$kmClean = [regex]::Replace($kmOriginal, '(?mi)^\s*(PubkeyAuthentication|PasswordAuthentication|AuthenticationMethods|AllowUsers)\s+[^\r\n]*', '# Previous directive replaced by Kibera lab setup')
$kmPrefix = "PubkeyAuthentication yes`r`nPasswordAuthentication no`r`nAuthenticationMethods publickey`r`nAllowUsers $kmUser`r`n"
if ($kmClean -notmatch '(?mi)^\s*Match\s+Group\s+administrators\s*$') {
    $kmClean += "`r`nMatch Group administrators`r`n    AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys`r`n"
}
[IO.File]::WriteAllText($kmConfig, $kmPrefix + $kmClean, [Text.Encoding]::ASCII)
$kmKeygen = Join-Path $env:WINDIR 'System32\OpenSSH\ssh-keygen.exe'
$kmDaemon = Join-Path $env:WINDIR 'System32\OpenSSH\sshd.exe'
& $kmKeygen -A
if ($LASTEXITCODE -ne 0) { throw 'Could not prepare SSH host keys.' }
# The LocalSystem service must accept host-key ownership, not only the
# interactive administrator who generated them. Preserve key material.
foreach ($kmHostKeyName in @('ssh_host_rsa_key','ssh_host_ecdsa_key','ssh_host_ed25519_key')) {
    $kmHostKey = Join-Path $kmSshDir $kmHostKeyName
    $kmExistingAcl = Get-Acl -LiteralPath $kmHostKey
    $kmExistingAcl.Sddl | Set-Content -LiteralPath "$kmHostKey.before-kibera-$kmStamp.acl.txt"
    & icacls.exe $kmHostKey /setowner '*S-1-5-32-544' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not normalize SSH host-key ownership.' }
    $kmHostAcl = New-Object Security.AccessControl.FileSecurity
    $kmHostAcl.SetOwner((New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544')))
    $kmHostAcl.SetAccessRuleProtection($true, $false)
    foreach ($kmHostSid in @('S-1-5-18','S-1-5-32-544')) {
        $kmHostRule = New-Object Security.AccessControl.FileSystemAccessRule((New-Object Security.Principal.SecurityIdentifier($kmHostSid)), 'FullControl', 'Allow')
        $kmHostAcl.AddAccessRule($kmHostRule)
    }
    Set-Acl -LiteralPath $kmHostKey -AclObject $kmHostAcl
}
& $kmDaemon -t -f $kmConfig
if ($LASTEXITCODE -ne 0) {
    Copy-Item -LiteralPath "$kmConfig.before-kibera-$kmStamp" -Destination $kmConfig -Force
    throw 'SSH syntax validation failed; original configuration restored.'
}
$kmFirewall = Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue
if ($kmFirewall) { Disable-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' | Out-Null }
$kmRuleName = 'Kibera-HP-SSH-Operator'
if (Get-NetFirewallRule -Name $kmRuleName -ErrorAction SilentlyContinue) { Remove-NetFirewallRule -Name $kmRuleName }
New-NetFirewallRule -Name $kmRuleName -DisplayName 'Kibera HP SSH from operator only' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 22 -RemoteAddress '100.120.190.75' -Profile Any | Out-Null
Set-Service -Name sshd -StartupType Automatic
if ((Get-Service sshd).Status -eq 'Running') { Restart-Service sshd } else { Start-Service sshd }
Write-Output "SSH account: $kmUser"
Write-Output "HP Tailscale IPv4: $($kmTailIPv4[0])"
Write-Output 'Host key fingerprint (share this with the operator):'
& $kmKeygen -lf (Join-Path $kmSshDir 'ssh_host_ed25519_key.pub') -E sha256
Write-Output 'SSH enabled with public-key authentication from Doja only.'
