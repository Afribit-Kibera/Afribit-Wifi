$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repo "artifacts"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location -LiteralPath $repo
npm run gateway:dev *> (Join-Path $logDir "gateway-agent.task.log")
