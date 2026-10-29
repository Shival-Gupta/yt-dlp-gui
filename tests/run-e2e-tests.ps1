<#
.SYNOPSIS
    Automated E2E Test Runner for yt-dlp-gui across Tiers 1-4.
.DESCRIPTION
    Executes Vitest E2E suites (Tiers 1-4) and PowerShell script syntax validation.
#>

param(
    [string]$Tier = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  yt-dlp-gui End-to-End Test Suite Runner (Tiers 1-4)    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$testsDir = $PSScriptRoot
$projectRoot = Split-Path -Parent $testsDir

Set-Location $projectRoot

# 1. Run Vitest across target tiers
Write-Host "[1/2] Executing Vitest Suites..." -ForegroundColor Yellow

if ($Tier -ne "all") {
    & pnpm exec vitest run "tests/e2e/$Tier"
} else {
    & pnpm exec vitest run
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Vitest suites failed with exit code $LASTEXITCODE!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Vitest suites passed successfully!" -ForegroundColor Green

# 2. PowerShell syntax and script checks
Write-Host ""
Write-Host "[2/2] Validating PowerShell installer and skill scripts..." -ForegroundColor Yellow

$psScripts = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.ps1" -ErrorAction SilentlyContinue

foreach ($script in $psScripts) {
    if ($script.FullName -match "node_modules|\.git") { continue }
    Write-Host "  Testing syntax of $($script.Name)... " -NoNewline
    $errors = $null
    $tokens = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($script.FullName, [ref]$tokens, [ref]$errors)
    if ($null -eq $errors -or $errors.Count -eq 0) {
        Write-Host "OK" -ForegroundColor Green
    } else {
        Write-Host "FAILED with $($errors.Count) errors" -ForegroundColor Red
        $errors | ForEach-Object { Write-Warning $_.Message }
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ALL E2E TEST SUITES PASSED VERIFICATION (TIERS 1-4)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
exit 0
