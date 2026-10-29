<#
.SYNOPSIS
    Installs the yt-dlp-gui AI Agent Skill across supported AI development environments.
.DESCRIPTION
    Scans the system for installed AI developer tools (Claude Desktop, Google Antigravity,
    Cursor, Windsurf, Continue.dev, VS Code) and installs the SKILL.md reference manual.
#>

[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillFile = Join-Path $scriptDir "SKILL.md"

if (-not (Test-Path $skillFile)) {
    Write-Error "SKILL.md not found in '$scriptDir'. Installation aborted."
    exit 1
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Installing yt-dlp-gui AI Agent Skill              " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Source: $skillFile`n"

$toolTargets = @(
    @{
        Name = "Claude Desktop"
        DetectPath = "$env:APPDATA\Claude"
        SkillDir   = "$env:APPDATA\Claude\skills\yt-dlp-gui"
    },
    @{
        Name = "Google Antigravity"
        DetectPath = "$env:USERPROFILE\.gemini"
        SkillDir   = "$env:USERPROFILE\.gemini\config\skills\yt-dlp-gui"
    },
    @{
        Name = "Cursor"
        DetectPath = "$env:APPDATA\Cursor"
        SkillDir   = "$env:APPDATA\Cursor\skills\yt-dlp-gui"
    },
    @{
        Name = "Cursor User Home"
        DetectPath = "$env:USERPROFILE\.cursor"
        SkillDir   = "$env:USERPROFILE\.cursor\skills\yt-dlp-gui"
    },
    @{
        Name = "Windsurf"
        DetectPath = "$env:APPDATA\Windsurf"
        SkillDir   = "$env:APPDATA\Windsurf\skills\yt-dlp-gui"
    },
    @{
        Name = "Continue.dev"
        DetectPath = "$env:USERPROFILE\.continue"
        SkillDir   = "$env:USERPROFILE\.continue\skills\yt-dlp-gui"
    },
    @{
        Name = "VS Code Continue"
        DetectPath = "$env:APPDATA\Code\User"
        SkillDir   = "$env:APPDATA\Code\User\skills\yt-dlp-gui"
    }
)

$installedCount = 0

foreach ($target in $toolTargets) {
    $detected = Test-Path $target.DetectPath
    if ($detected -or $Force) {
        try {
            if (-not (Test-Path $target.SkillDir)) {
                New-Item -ItemType Directory -Force -Path $target.SkillDir | Out-Null
            }
            $destFile = Join-Path $target.SkillDir "SKILL.md"
            Copy-Item -Path $skillFile -Destination $destFile -Force
            Write-Host "  [OK] $($target.Name): Installed to $($target.SkillDir)" -ForegroundColor Green
            $installedCount++
        } catch {
            Write-Warning "  [FAIL] Failed to install to $($target.Name): $_"
        }
    } else {
        Write-Host "  [SKIP] $($target.Name): Environment not detected at '$($target.DetectPath)'" -ForegroundColor DarkGray
    }
}

Write-Host "`nSummary: Successfully installed to $installedCount location(s)." -ForegroundColor Cyan
Write-Host "Done. Re-run this script whenever new AI developer tools are installed.`n"
