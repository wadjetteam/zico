$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$app = Get-ChildItem -LiteralPath $Root -Directory | Where-Object {
  (Test-Path -LiteralPath (Join-Path $_.FullName 'server\mock-server.mjs')) -and
  (Test-Path -LiteralPath (Join-Path $_.FullName 'client\package.json'))
} | Select-Object -First 1
$audit = Join-Path $Root 'audit-module\backend'

if (-not $app) { throw 'Could not locate the WADJET main API and frontend.' }
if (-not (Test-Path -LiteralPath (Join-Path $audit 'package.json'))) { throw 'Could not locate the Audit backend.' }

Start-Process -FilePath 'cmd.exe' -WorkingDirectory $audit -ArgumentList '/k', 'npm.cmd run build && npm.cmd start'
Start-Process -FilePath 'node.exe' -WorkingDirectory (Join-Path $app.FullName 'server') -ArgumentList 'mock-server.mjs'
Start-Process -FilePath 'cmd.exe' -WorkingDirectory (Join-Path $app.FullName 'client') -ArgumentList '/k', 'npm.cmd run dev -- --host 0.0.0.0'

Write-Output "Started Audit backend from $audit"
Write-Output "Started Main API from $(Join-Path $app.FullName 'server')"
Write-Output "Started frontend from $(Join-Path $app.FullName 'client')"
