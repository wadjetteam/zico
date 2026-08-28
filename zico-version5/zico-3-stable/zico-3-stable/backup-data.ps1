param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$app = Get-ChildItem -LiteralPath $root -Directory | Where-Object {
  (Test-Path -LiteralPath (Join-Path $_.FullName 'server\mock-server.mjs')) -and
  (Test-Path -LiteralPath (Join-Path $_.FullName 'client\package.json'))
} | Select-Object -First 1
$auditDb = Join-Path $root 'audit-module\backend\prisma\dev.db'

if (-not $app) { throw 'Could not locate the active application data directory.' }
if (-not (Test-Path -LiteralPath $auditDb)) { throw 'Could not locate the Audit SQLite database.' }

New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
$dataPath = Join-Path $app.FullName 'server\data'
if (Test-Path -LiteralPath $dataPath) {
  Copy-Item -LiteralPath $dataPath -Destination (Join-Path $BackupPath 'main-data') -Recurse -Force
}
Copy-Item -LiteralPath $auditDb -Destination (Join-Path $BackupPath 'audit-dev.db') -Force

Write-Output "Backup created: $BackupPath"
Get-ChildItem -LiteralPath $BackupPath -File | Select-Object -ExpandProperty Name
