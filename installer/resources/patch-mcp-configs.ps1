<#
.SYNOPSIS
    Configures and registers the ytdeck-mcp server across installed AI developer client configs.
.DESCRIPTION
    Updates mcpServers configuration for Claude Desktop, Cursor, Windsurf, and Continue.
    Safely parses existing JSON files, creates backups (.bak), and adds or updates the 'ytdeck' entry.
.PARAMETER McpBinaryPath
    Explicit path to ytdeck-mcp.exe. If omitted, searches common release and local install paths.
.PARAMETER Transport
    MCP transport to configure ("stdio" or "http", default: "stdio").
.PARAMETER HttpUrl
    Server URL if using HTTP SSE transport (default: "http://127.0.0.1:7531/sse").
#>

[CmdletBinding()]
param(
    [Alias("McpPath")]
    [string]$McpBinaryPath,
    [ValidateSet("stdio", "http")]
    [string]$Transport = "stdio",
    [string]$HttpUrl = "http://127.0.0.1:7531/sse"
)

$ErrorActionPreference = 'Stop'

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Registering ytdeck MCP Server in AI Client Configs " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Resolve binary path if in stdio mode
if ($Transport -eq "stdio" -and [string]::IsNullOrWhiteSpace($McpBinaryPath)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $candidatePaths = @(
        (Join-Path $scriptDir "..\..\target\release\ytdeck-mcp.exe"),
        (Join-Path $scriptDir "..\..\target\debug\ytdeck-mcp.exe"),
        "$env:LOCALAPPDATA\Programs\yt-dlp-gui\bin\ytdeck-mcp.exe",
        "$env:ProgramFiles\yt-dlp-gui\bin\ytdeck-mcp.exe"
    )

    foreach ($path in $candidatePaths) {
        if (Test-Path $path) {
            $McpBinaryPath = (Resolve-Path $path).Path
            break
        }
    }

    if ([string]::IsNullOrWhiteSpace($McpBinaryPath)) {
        # Check PATH
        $pathCmd = Get-Command "ytdeck-mcp.exe" -ErrorAction SilentlyContinue
        if ($pathCmd) {
            $McpBinaryPath = $pathCmd.Source
        }
    }

    if ([string]::IsNullOrWhiteSpace($McpBinaryPath)) {
        # Fallback to default expected install location
        $McpBinaryPath = "$env:LOCALAPPDATA\Programs\yt-dlp-gui\bin\ytdeck-mcp.exe"
        Write-Warning "ytdeck-mcp executable not found locally; registering standard install path '$McpBinaryPath'."
    } else {
        Write-Host "Resolved MCP Binary: $McpBinaryPath" -ForegroundColor Green
    }
}

$clientConfigs = @(
    @{
        Name = "Claude Desktop"
        ConfigPath = "$env:APPDATA\Claude\claude_desktop_config.json"
        Type = "standard" # standard mcpServers object
    },
    @{
        Name = "Cursor"
        ConfigPath = "$env:USERPROFILE\.cursor\mcp.json"
        Type = "standard"
    },
    @{
        Name = "Windsurf"
        ConfigPath = "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"
        Type = "standard"
    },
    @{
        Name = "Continue"
        ConfigPath = "$env:USERPROFILE\.continue\config.json"
        Type = "standard"
    },
    @{
        Name = "Antigravity"
        ConfigPath = "$env:USERPROFILE\.gemini\config\mcp_servers.json"
        Type = "standard"
    }
)

$configuredCount = 0

foreach ($client in $clientConfigs) {
    $configPath = $client.ConfigPath
    $parentDir = Split-Path -Parent $configPath

    if (-not (Test-Path $parentDir)) {
        Write-Host "  [SKIP] $($client.Name): Directory '$parentDir' does not exist." -ForegroundColor DarkGray
        continue
    }

    Write-Host "  Configuring $($client.Name)..." -ForegroundColor White

    $configObj = [ordered]@{}
    if (Test-Path $configPath) {
        try {
            $rawContent = Get-Content -Path $configPath -Raw -ErrorAction Stop
            if (-not [string]::IsNullOrWhiteSpace($rawContent)) {
                $configObj = $rawContent | ConvertFrom-Json -AsHashtable
            }
            # Create backup
            Copy-Item -Path $configPath -Destination "$configPath.bak" -Force
        } catch {
            Write-Warning "    Could not parse existing config '$configPath'. Creating backup."
            Copy-Item -Path $configPath -Destination "$configPath.corrupted.bak" -Force
            $configObj = [ordered]@{}
        }
    }

    if (-not $configObj.ContainsKey("mcpServers")) {
        $configObj["mcpServers"] = [ordered]@{}
    }

    if ($Transport -eq "stdio") {
        $configObj["mcpServers"]["ytdeck"] = [ordered]@{
            "command" = $McpBinaryPath
            "args"    = @("--transport", "stdio")
        }
    } else {
        $configObj["mcpServers"]["ytdeck"] = [ordered]@{
            "url" = $HttpUrl
        }
    }

    try {
        $jsonStr = $configObj | ConvertTo-Json -Depth 10
        Set-Content -Path $configPath -Value $jsonStr -Encoding UTF8 -Force
        Write-Host "    [OK] Successfully updated '$configPath'" -ForegroundColor Green
        $configuredCount++
    } catch {
        Write-Warning "    [FAIL] Failed to write config to '$configPath': $_"
    }
}

Write-Host "`nSummary: Configured ytdeck MCP server for $configuredCount client(s)." -ForegroundColor Cyan
Write-Host "Done. Restart your AI client(s) to load the new MCP server.`n"
