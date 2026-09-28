# svutils Harness Initialization & Verification (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "=== svutils Harness Initialization & Verification ===" -ForegroundColor Cyan

Write-Host ">> Checking dependencies..." -ForegroundColor Yellow
bun install

Write-Host ">> Running typecheck (svelte-check)..." -ForegroundColor Yellow
bun run check

Write-Host ">> Running format check (oxfmt)..." -ForegroundColor Yellow
bun run format

Write-Host ">> Running linter (oxlint & eslint)..." -ForegroundColor Yellow
bun run lint

Write-Host ">> Testing library packaging (prepack)..." -ForegroundColor Yellow
bun run prepack

Write-Host "=== All Checks Passed Successfully ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps for agent:"
Write-Host "1. Read AGENTS.md and .agents/rules/*.md (package harness lives here)"
Write-Host "2. Check feature_list.json for the next unfinished utility to port from VueUse"
Write-Host "3. Follow Svelte 5 Runes & SSR-safe architecture guidelines"
Write-Host "4. Update progress.md and feature_list.json upon completion"
