param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$app = Get-ChildItem -LiteralPath $root -Directory | Where-Object {
  Test-Path -LiteralPath (Join-Path $_.FullName 'server\data\database.json')
} | Select-Object -First 1
$auditDb = Join-Path $root 'audit-module\backend\prisma\dev.db'

if (-not $app) { throw 'Could not locate the active application data directory.' }
if (-not (Test-Path -LiteralPath $auditDb)) { throw 'Could not locate the Audit SQLite database.' }

New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
$dataPath = Join-Path $app.FullName 'server\data'
Copy-Item -LiteralPath (Join-Path $dataPath 'database.json') -Destination (Join-Path $BackupPath 'database.json') -Force
Copy-Item -LiteralPath (Join-Path $dataPath 'risks.json') -Destination (Join-Path $BackupPath 'risks.json') -Force
Copy-Item -LiteralPath (Join-Path $dataPath 'email-config.json') -Destination (Join-Path $BackupPath 'email-config.json') -Force
Copy-Item -LiteralPath $auditDb -Destination (Join-Path $BackupPath 'audit-dev.db') -Force

Write-Output "Backup created: $BackupPath"
Get-ChildItem -LiteralPath $BackupPath -File | Select-Object -ExpandProperty Name
