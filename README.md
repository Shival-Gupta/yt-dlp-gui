# yt-dlp GUI

[![Build](https://github.com/Shival-Gupta/yt-dlp-gui/actions/workflows/build.yml/badge.svg)](https://github.com/Shival-Gupta/yt-dlp-gui/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/Shival-Gupta/yt-dlp-gui?label=Latest%20Release&style=flat)](https://github.com/Shival-Gupta/yt-dlp-gui/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2B%20x64-blue.svg)](#installation)
[![Powered by yt-dlp](https://img.shields.io/badge/powered%20by-yt--dlp-red.svg)](https://github.com/yt-dlp/yt-dlp)

A full-featured **Tauri 2 / Rust + React 19** desktop GUI for [yt-dlp](https://github.com/yt-dlp/yt-dlp) — every CLI option exposed in a polished interface, with a Windows installer, MCP server for AI agents, and an AI agent Skill.

---

## Features

- 🎬 **Complete yt-dlp GUI** — all 14 CLI option groups, every flag, in a clean tabbed interface
- 🎯 **Smart Format Selector** — visual table of available formats with quality badges
- 📋 **Download Queue** — pause, resume, cancel, retry, drag-reorder
- 📁 **Download History** — searchable, re-downloadable, persisted
- 🎨 **Light / Dark / System theme**
- 💾 **Presets** — 5 built-in + unlimited user-defined saved option sets
- 🖥️ **CLI Command Preview** — see the exact yt-dlp command as you configure options
- 🔔 **OBS-style updates** — notified, you choose when to update
- 🤖 **MCP Server** (`ytdeck-mcp`) — AI agents can control downloads programmatically
- 📚 **AI Agent Skill** — `SKILL.md` for Claude, Antigravity, Codex, Cursor, and more
- 📦 **Windows Installer** — one EXE, downloads ffmpeg + Deno at install time

## Installation

> **Windows 10+ (x64)** | ~25 MB installer + downloads ffmpeg at runtime

1. Download `YTDeck-Setup-vX.X.X.exe` from [Releases](https://github.com/Shival-Gupta/yt-dlp-gui/releases/latest)
2. Run the installer — Windows SmartScreen may warn (self-signed cert) — click **More info → Run anyway**
3. Select your components and click Install

**Note:** FFmpeg, yt-dlp, and Deno are downloaded at install time. Internet connection required.

## Architecture

```
yt-dlp-gui/
├── src/                  ← React 19 + TypeScript frontend
├── src-tauri/            ← Rust backend (Tauri 2)
│   └── binaries/         ← Bundled yt-dlp, ffmpeg, ffprobe sidecars
├── ytdeck-mcp/           ← Standalone MCP server (Rust)
├── skill/
│   ├── SKILL.md          ← AI agent documentation skill
│   └── install-skill.ps1
└── installer/            ← NSIS installer scripts
```

## AI Agent Integration

### MCP Server
```json
// Add to your AI tool's MCP config:
{
  "mcpServers": {
    "ytdeck": {
      "command": "C:\\Program Files\\yt-dlp GUI\\ytdeck-mcp.exe",
      "args": []
    }
  }
}
```

### Skill
```powershell
# Install SKILL.md for all detected AI tools:
.\skill\install-skill.ps1
```

## Development

```powershell
# Prerequisites: Rust 1.79+, Node 20+, pnpm 9+
git clone https://github.com/Shival-Gupta/yt-dlp-gui
cd yt-dlp-gui
pnpm install
cargo tauri dev
```

## License

- **App code:** [MIT](LICENSE)
- **yt-dlp:** [Unlicense](https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE)
- **FFmpeg:** [LGPL 2.1+ / GPL](https://ffmpeg.org/legal.html) depending on build
