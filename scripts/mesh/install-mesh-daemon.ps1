param(
    [string]$EnvFile = '',
    [switch]$Enable,
    [switch]$StartNow
)
$ErrorActionPreference = 'Stop'
$kmWorkspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if (-not $EnvFile) { $EnvFile = Join-Path $kmWorkspace '.env.mesh-native' }
$kmEnvPath = (Resolve-Path -LiteralPath $EnvFile).Path
if (-not (Test-Path -LiteralPath $kmEnvPath -PathType Leaf)) { throw 'Private daemon environment file is missing.' }
$kmNode = (Get-Command node.exe -ErrorAction Stop).Source
$kmTsx = Join-Path $kmWorkspace 'node_modules\tsx\dist\cli.mjs'
$kmDaemon = Join-Path $kmWorkspace 'gateway-agent\mesh-daemon.ts'
foreach ($kmFile in @($kmTsx, $kmDaemon)) {
    if (-not (Test-Path -LiteralPath $kmFile -PathType Leaf)) { throw 'Install the project dependencies before installing the Mesh task.' }
}
if ($StartNow -and -not $Enable) { throw 'StartNow requires Enable after the native policy and cloud deployment are commissioned.' }
if ($Enable) {
    # Read configuration only in memory. Never print private environment values.
    $kmEnvironment = [System.IO.File]::ReadAllText($kmEnvPath)
    if ($kmEnvironment -notmatch '(?m)^\s*MESH_AUTOMATIC_AGENT_ENABLED\s*=\s*["'']?true["'']?\s*$') {
        throw 'Set MESH_AUTOMATIC_AGENT_ENABLED=true in the private daemon configuration before enabling the task.'
    }
    $kmEnvironment = $null
}
$kmAccount = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$kmTaskName = 'AfribitMeshAutomaticAccess'
$kmArguments = '--env-file="' + $kmEnvPath + '" "' + $kmTsx + '" "' + $kmDaemon + '"'
$kmAction = New-ScheduledTaskAction -Execute $kmNode -Argument $kmArguments -WorkingDirectory $kmWorkspace
$kmTrigger = New-ScheduledTaskTrigger -AtLogOn -User $kmAccount
$kmPrincipal = New-ScheduledTaskPrincipal -UserId $kmAccount -LogonType Interactive -RunLevel Limited
$kmSettings = New-ScheduledTaskSettingsSet -Hidden -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$kmSettings.Enabled = [bool]$Enable
$kmTask = New-ScheduledTask -Action $kmAction -Trigger $kmTrigger -Principal $kmPrincipal -Settings $kmSettings `
    -Description 'Router-scoped Mesh automatic access; private local credentials; no customer login credentials.'
$kmExisting = Get-ScheduledTask -TaskName $kmTaskName -ErrorAction SilentlyContinue
if ($kmExisting -and $kmExisting.Principal.UserId -ne $kmAccount) {
    throw 'An existing Mesh task belongs to another Windows account. Inspect it before replacing it.'
}
Register-ScheduledTask -TaskName $kmTaskName -InputObject $kmTask -Force | Out-Null
if ($StartNow) { Start-ScheduledTask -TaskName $kmTaskName }
[pscustomobject]@{ Task = $kmTaskName; Enabled = [bool]$Enable; Started = [bool]$StartNow; Trigger = 'Current user sign-in' }
