$ErrorActionPreference = "Continue"
$root = "C:\Users\elshinawy\Documents\Default Project\mens-only"
$prompt = Get-Content -LiteralPath (Join-Path $root "data\hermes-prompt.txt") -Raw
& (Join-Path $root "..\hermes-bridge.ps1") -Prompt $prompt *> (Join-Path $root "data\hermes-content.log")
Write-Host "hermes done"