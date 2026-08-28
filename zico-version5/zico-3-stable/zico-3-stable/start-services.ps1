$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$app = Get-ChildItem -LiteralPath $Root -Directory | Where-Object {
  (Test-Path -LiteralPath (Join-Path $_.FullName 'server\mock-server.mjs')) -and
  (Test-Path -LiteralPath (Join-Path $_.FullName 'client\package.json'))
} | Select-Object -First 1
$audit = Join-Path $Root 'audit-module\backend'
$ragApi = 'D:\GitRepos\NLP_Rag_final'

if (-not $app) { throw 'Could not locate the WADJET main API and frontend.' }
if (-not (Test-Path -LiteralPath (Join-Path $audit 'package.json'))) { throw 'Could not locate the Audit backend.' }

# Ensure a directory is on this process's PATH (and therefore inherited by
# every child process we spawn below), so we can call bare command names
# instead of quoted full paths. Quoted paths chained with && inside
# `cmd /k` trip a long-standing cmd.exe quote-stripping quirk.
function Add-ToPathIfMissing {
  param([string]$Dir)
  if ($Dir -and (Test-Path -LiteralPath $Dir) -and (";$env:PATH;" -notlike "*;$Dir;*")) {
    $env:PATH = "$Dir;$env:PATH"
  }
}

function Resolve-Node {
  try {
    & node --version *> $null
    if ($LASTEXITCODE -eq 0) { return $true }
  } catch {}
  $candidates = @("$env:ProgramFiles\nodejs", "${env:ProgramFiles(x86)}\nodejs", "$env:LOCALAPPDATA\Programs\nodejs")
  foreach ($dir in $candidates) {
    if ((Test-Path -LiteralPath (Join-Path $dir 'node.exe')) -and (Test-Path -LiteralPath (Join-Path $dir 'npm.cmd'))) {
      Add-ToPathIfMissing $dir
      return $true
    }
  }
  return $false
}

if (-not (Resolve-Node)) { throw 'Could not find node.exe/npm.cmd (checked PATH and the default Program Files locations). Install Node.js and re-run.' }

Start-Process -FilePath 'cmd.exe' -WorkingDirectory $audit -ArgumentList '/k', 'npm.cmd run build && npm.cmd start'
Start-Process -FilePath 'node.exe' -WorkingDirectory (Join-Path $app.FullName 'server') -ArgumentList 'mock-server.mjs'
Start-Process -FilePath 'cmd.exe' -WorkingDirectory (Join-Path $app.FullName 'client') -ArgumentList '/k', 'npm.cmd run dev -- --host 0.0.0.0'

Write-Output "Started Audit backend from $audit"
Write-Output "Started Main API from $(Join-Path $app.FullName 'server')"
Write-Output "Started frontend from $(Join-Path $app.FullName 'client')"

function Resolve-Python {
  try {
    & python --version *> $null
    if ($LASTEXITCODE -eq 0) { return $true }
  } catch {}
  $candidate = Get-ChildItem -LiteralPath "$env:LOCALAPPDATA\Programs\Python" -Directory -Filter 'Python3*' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
  if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate.FullName 'python.exe'))) {
    Add-ToPathIfMissing $candidate.FullName
    return $true
  }
  return $false
}

$pythonOk = Resolve-Python

if ((Test-Path -LiteralPath (Join-Path $ragApi 'api.py')) -and $pythonOk) {
  Start-Process -FilePath 'cmd.exe' -WorkingDirectory $ragApi -ArgumentList '/k', 'python -m uvicorn api:app --port 8008'
  Write-Output "Started RAG API from $ragApi"
} else {
  Write-Warning "Skipping RAG API: not found at '$ragApi' or Python is not installed. The AI Assistant will show a fallback message until it is running (see D:\GitRepos\NLP_Rag_final\api.py)."
}
