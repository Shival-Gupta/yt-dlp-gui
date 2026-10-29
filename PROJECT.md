# Project: yt-dlp-gui

## Architecture
`yt-dlp-gui` is a high-performance, production-grade desktop application and ecosystem for yt-dlp, structured into modular components:
1. **Desktop GUI App (`src-tauri` & `src/`)**: Built on Tauri 2, Rust backend, React 19, TypeScript, Vite, Tailwind CSS v4, and shadcn/ui.
   - **Frontend Architecture**: Component-driven UI using Zustand stores (`downloadStore`, `settingsStore`, `queueStore`, `presetStore`, `updateStore`), frameless draggable titlebar, navigation sidebar, real-time streaming console, tabbed panels with Zod validation, format tables, and queue management.
   - **Backend Architecture**: Rust Tauri core managing sidecars (`yt-dlp`, `ffmpeg`, `ffprobe`) via `tauri-plugin-shell`, IPC command handlers, state management, background thread pool, Windows system tray, and toast notifications.
2. **Standalone MCP Server (`ytdeck-mcp/`)**: Independent Rust crate in the Cargo workspace implementing the Model Context Protocol over stdio (JSON-RPC 2.0 with strict stderr logging) and HTTP SSE (port 7531). Exposes 12 tools and 4 resources for programmatic AI control.
3. **AI Agent Skill (`skill/`)**: Comprehensive 11-section documentation (`SKILL.md`) and automated multi-agent installer/config-patching scripts (`install-skill.ps1`, `patch-mcp-configs.ps1`) for Claude Desktop, Antigravity, Cursor, Windsurf, and Continue.
4. **Windows NSIS Installer (`installer/`)**: Modern lightweight installer with custom NSDialogs component selection, runtime sidecar fetching for FFmpeg and Deno, Explorer context menus, `ytdeck://` protocol handler, user PATH registration, uninstaller, and code signing.
5. **CI/CD & Release Pipeline (`.github/workflows/`)**: Automated GitHub Actions workflows for continuous integration, multi-target testing, linting, release bundling with NSIS/MCP binaries, automated updater manifest generation (`updates/latest.json`), and weekly sidecar auto-updates pushed to `https://github.com/Shival-Gupta/yt-dlp-gui`.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Frameless Window & Titlebar | Custom draggable titlebar with min/max/close, theme toggle, help | M1 | Goal A |
| 2 | Theme System | Light, Dark, System theme cycling via `.dark` class | M1 | Goal A |
| 3 | App Shell & Navigation | Shell holding Titlebar, Nav, Main content, and StatusBar | M1 | Goal A |
| 4 | StatusBar | Indicators for active/queued/done counts, versions, and update banner | M1 | Goal A |
| 5 | Collapsible Log Panel | Real-time console streaming stdout/stderr with color-coded tags | M1 | Goal A |
| 6 | Sidecar Management | Spawning and process control of bundled `yt-dlp`, `ffmpeg`, `ffprobe` | M1 | Goal A |
| 7 | Core IPC Contract | 12 Tauri commands & 4 IPC events for process control and events | M1 | Goal A |
| 8 | Core Types & Zustand Stores | Shared models (`DownloadJob`, `JobStatus`, etc.) and stores | M1 | Goal A |
| 9 | URL Input Bar | Multi-line URL entry with validation, paste, and auto-preview | M2 | Goal B |
| 10 | Video Metadata Auto-Preview | Debounced (800ms) metadata preview (thumbnail, title, duration) | M2 | Goal B |
| 11 | Batch Input & File Loader | Bulk URL input supporting text pasting and `.txt` file loading | M2 | Goal B |
| 12 | Drag and Drop Handler | Window-level drag-and-drop for URLs and `.txt` files with visual overlay | M2 | Goal B |
| 13 | Live Command Preview | Real-time syntax-colored CLI preview with credential masking (`***`) | M2 | Goal B |
| 14 | Progress Card | Detailed progress card with speed, ETA, size, and status badges | M2 | Goal B |
| 15 | Job Control Actions | Pause, resume, cancel, retry, open file, open folder | M2 | Goal B |
| 16 | Download Queue List | Reactive list of active/queued/completed downloads | M2 | Goal B |
| 17 | Dedicated Queue Page | Full-page queue dashboard with tab filtering and bulk controls | M2 | Goal B |
| 18 | Format Fetcher | Asynchronous probe calling `fetch_formats` and parsing `yt-dlp -F` | M2 | Goal B |
| 19 | Format Selector Table | Sortable/filterable table showing formats, codecs, bitrates, resolutions | M2 | Goal B |
| 20 | Quality Badges & Quick Buttons | Visual badges (4K, 1080p) and quick presets (Best Video+Audio, Audio Only) | M2 | Goal B |
| 21 | Output Directory & Template | Directory browser and template picker with syntax popover and expander | M2 | Goal B |
| 22 | Built-in Presets System | 5 built-in immutable presets (Best Quality, Audio MP3, Reels, Playlist, X) | M2 | Goal B |
| 23 | Custom User Presets | Save, apply, export, and delete named custom presets | M2 | Goal B |
| 24 | Subtitle Panel | Options for write-subs, auto-subs, sub-langs, embed-subs, format | M3 | Goal C |
| 25 | Thumbnail Panel | Options for write-thumbnail, all-thumbnails, convert, embed-thumbnail | M3 | Goal C |
| 26 | Metadata & Files Panel | Options for info-json, description, chapters, xattrs, embed-metadata | M3 | Goal C |
| 27 | Post-Processing Panel | Audio extraction, audio formats/bitrates, remuxing, recoding, exec | M3 | Goal C |
| 28 | SponsorBlock Panel | Removal and marking of sponsored segments, categories, custom API | M3 | Goal C |
| 29 | Network & Proxy Panel | Proxy URL, rate limit, retries, socket timeout, impersonation, headers | M3 | Goal C |
| 30 | Authentication Panel | Credentials, 2FA, video password, netrc, cookies file/browser, AP | M3 | Goal C |
| 31 | Video Selection / Filters | Playlist items, date ranges, min/max filesize, age limit, match filters | M3 | Goal C |
| 32 | Filesystem Panel | Windows filenames, restrict filenames, part files, cache dir, subpaths | M3 | Goal C |
| 33 | Extractor Options Panel | Extractor arguments, use-extractors, flat playlist, JS runtimes | M3 | Goal C |
| 34 | External Downloader Panel | Downloader engine (aria2c, etc.), downloader args, HLS settings | M3 | Goal C |
| 35 | Verbosity & Simulation Panel | Simulation mode, skip download, dump JSON, verbose, ignore errors | M3 | Goal C |
| 36 | Download History Tracking | Auto-recording completed/failed downloads into `history.json` (max 500) | M4 | Goal D |
| 37 | History Page & Management | Search, sort, date grouping, re-download trigger, clear history | M4 | Goal D |
| 38 | App Settings Configuration | 7-section settings manager (Appearance, Downloads, Tools, Updates, etc.) | M4 | Goal D |
| 39 | OBS-Style App Update Checker | Silent startup / manual check against updater manifest; non-blocking | M4 | Goal D |
| 40 | Non-Intrusive App Installer | User-directed update download and explicit "Restart to Update" click | M4 | Goal D |
| 41 | yt-dlp Sidecar Update Manager | Checks latest yt-dlp GitHub release; modal with `yt-dlp -U` output | M4 | Goal D |
| 42 | System Tray & Tooltip | Minimize to tray, tray menu, dynamic tooltip updated every 2s | M4 | Goal D |
| 43 | Windows Toast Notifications | Native OS toasts on download completion or failure (opt-in) | M4 | Goal D |
| 44 | Global Keyboard Shortcuts | 8 in-app accelerator keys (`Ctrl+V`, `Ctrl+Enter`, `Ctrl+L`, etc.) | M4 | Goal D |
| 45 | Error Translation Framework | Regex mapping table converting raw yt-dlp stderr to user advice | M4 | Goal D |
| 46 | MCP Stdio Transport | JSON-RPC 2.0 over stdin/stdout with strict stderr logging | M5 | Goal E |
| 47 | MCP HTTP SSE Transport | Server-Sent Events on `/sse` and POST on `/message` on port 7531 | M5 | Goal E |
| 48 | MCP Server Lifecycle | Handlers for `initialize`, `notifications/initialized`, and `ping` | M5 | Goal E |
| 49 | MCP Tool: `download` | Spawns yt-dlp download job asynchronously and registers in JobStore | M5 | Goal E |
| 50 | MCP Tool: `get_job_status` | Returns real-time status, progress, speed, ETA, output path | M5 | Goal E |
| 51 | MCP Tool: `cancel_job` | Terminates active download process tree (SIGTERM/kill) | M5 | Goal E |
| 52 | MCP Tool: `list_jobs` | Lists all tracked download jobs with optional status filter | M5 | Goal E |
| 53 | MCP Tool: `fetch_info` | Fetches JSON metadata info for a URL using `yt-dlp -j` | M5 | Goal E |
| 54 | MCP Tool: `fetch_formats` | Runs `yt-dlp -F` and returns raw table and parsed formats | M5 | Goal E |
| 55 | MCP Tool: `fetch_thumbnails` | Extracts array of thumbnails with dimensions and resolutions | M5 | Goal E |
| 56 | MCP Tool: `search` | Searches video platforms via prefixes (`ytsearch`, `ytmsearch`) | M5 | Goal E |
| 57 | MCP Tool: `check_dependency` | Checks installation status and version of CLI dependencies | M5 | Goal E |
| 58 | MCP Tool: `get_supported_sites` | Returns list/count of extractors via `yt-dlp --list-extractors` | M5 | Goal E |
| 59 | MCP Tool: `build_command` | Reconstructs CLI command string from parameter object | M5 | Goal E |
| 60 | MCP Tool: `update_ytdlp` | Runs `yt-dlp -U` and streams progress | M5 | Goal E |
| 61 | MCP Resource: `ytdeck://queue` | Live JSON view of active and pending download jobs | M5 | Goal E |
| 62 | MCP Resource: `ytdeck://history` | JSON view of download history | M5 | Goal E |
| 63 | MCP Resource: `ytdeck://settings` | Current configuration options in JSON | M5 | Goal E |
| 64 | MCP Resource: `ytdeck://supported-sites` | Cached list of supported extractors | M5 | Goal E |
| 65 | MCP Binary Resolution | Deterministic 4-level executable resolution hierarchy | M5 | Goal E |
| 66 | AI Agent Skill `SKILL.md` | Comprehensive 11-section reference manual with 18+ recipes | M5 | Goal F |
| 67 | Skill Multi-Agent Installer | `install-skill.ps1` targeting Claude, Antigravity, Cursor, etc. | M5 | Goal F |
| 68 | MCP Config Patcher Script | `patch-mcp-configs.ps1` configuring client JSON configs | M5 | Goal F |
| 69 | Windows NSIS Core Installer | Lightweight x64 currentUser installer script (`installer.nsi`) | M6 | Goal G |
| 70 | Custom NSDialogs Components Page | 12+ component checkboxes across 7 groups | M6 | Goal G |
| 71 | Sidecar Runtime Downloaders | Background downloading of FFmpeg and Deno with non-blocking fallback | M6 | Goal G |
| 72 | Explorer Context Menu Integration | Right-click context menus on files and directories | M6 | Goal G |
| 73 | Protocol Handler `ytdeck://` | Windows protocol registration routing URLs to the app | M6 | Goal G |
| 74 | User PATH & Autostart Registry | Adds `$INSTDIR\bin` to user PATH and sets MCP autostart run key | M6 | Goal G |
| 75 | Clean Uninstaller | Removes files/registry, prompts before deleting user history/settings | M6 | Goal G |
| 76 | Code Signing Certificate | Self-signed PFX generation and signing with SmartScreen bypass docs | M6 | Goal G |
| 77 | CI Build Workflow | `build.yml` compiling Windows binaries on push/PR | M6 | Goal H |
| 78 | CI Release Workflow | `release.yml` on `v*` tag publishing installer and MCP binary | M6 | Goal H |
| 79 | Updater Manifest Generator | Auto-generation of `updates/latest.json` committed back to `main` | M6 | Goal H |
| 80 | CI Lint & Test Workflows | `lint.yml` (ESLint, TS, clippy) and `test.yml` (Vitest, cargo test) | M6 | Goal H |
| 81 | Sidecar Auto-Updater Workflow | `update-ytdlp.yml` running weekly to update bundled yt-dlp | M6 | Goal H |
| 82 | Dependabot Integration | Automated dependency tracking for npm, cargo, and github-actions | M6 | Goal H |
| 83 | Remote Repository Delivery | Pushing all commits to `https://github.com/Shival-Gupta/yt-dlp-gui` | M6 | Goal H |
| 84 | E2E Acceptance & Adversarial Hardening | 100% pass across Tiers 1-4 tests, followed by Tier 5 adversarial hardening | M7 | Dual Track |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation & Core Shell | Tauri 2 + Rust setup, React 19 + Vite frontend, sidecars, IPC commands & events, AppLayout, Titlebar, ThemeToggle, LogPanel, types, stores | none | DONE |
| M2 | Download UX & Queue | UrlInput, auto-preview, batch loader, drag-and-drop, format selector table, quality badges, presets, command preview, progress cards, queue | M1 | DONE |
| M3 | Option Panels Suite | All 14 CLI option panels, shared collapsible panel architecture, Zod schemas, argument builders in `ytdlp-args.ts` | M1, M2 | DONE |
| M4 | Polish, History & Updates | History persistence & page, 7-section Settings, OBS-style updater, system tray, toast notifications, keyboard shortcuts, error translation | M1, M2, M3 | IN_PROGRESS |
| M5 | Standalone MCP Server & Skill | `ytdeck-mcp` crate (stdio + SSE transports, 12 tools, 4 resources), `skill/SKILL.md`, `install-skill.ps1`, `patch-mcp-configs.ps1` | none | DONE |
| M6 | Installer & CI/CD Delivery | NSIS installer script, NSDialogs page, sidecar downloaders, context menus, registry, signing, GitHub Actions workflows, git push to remote | M1, M2, M3, M4, M5 | IN_PROGRESS |
| M7 | E2E Testing & Coverage Hardening | 100% pass of E2E test suite (Tiers 1-4), followed by Tier 5 white-box adversarial coverage hardening | M1, M2, M3, M4, M5, M6 | PLANNED (TEST_READY.md published) |

---

## Interface Contracts

### 1. Tauri Backend ↔ React Frontend IPC
- **Commands**:
  - `spawn_ytdlp(job_id: String, args: Vec<String>) -> Result<(), String>`
  - `cancel_download(job_id: String) -> Result<(), String>`
  - `fetch_info(url: String) -> Result<YtdlpInfo, String>`
  - `fetch_formats(url: String) -> Result<Vec<YtdlpFormat>, String>`
  - `check_update() -> Result<UpdateCheckResult, String>`
  - `download_update() -> Result<(), String>`
  - `install_update() -> Result<(), String>`
  - `update_ytdlp_sidecar() -> Result<(), String>`
  - `open_path(path: String) -> Result<(), String>`
  - `get_app_version() -> Result<String, String>`
  - `get_ytdlp_version() -> Result<String, String>`
- **Events**:
  - `ytdlp-output`: Payload `{ job_id: String, line: String, is_stderr: bool }`
  - `ytdlp-done`: Payload `{ job_id: String, exit_code: i32, success: bool, error_message: Option<String> }`
  - `update-available`: Payload `{ version: String, notes: String, pub_date: String }`
  - `update-progress`: Payload `{ downloaded_bytes: u64, total_bytes: u64 }`

### 2. Standalone MCP Server (`ytdeck-mcp`) Interface
- **Transports**:
  - `stdio`: JSON-RPC 2.0 messages over standard input/output. Standard output must strictly contain valid JSON; all diagnostics and tracing must be directed to standard error.
  - `http-sse`: Port 7531 default (`--port <port>`); GET `/sse` emits SSE event stream; POST `/message` accepts JSON-RPC requests.
- **Sidecar Binary Resolution Hierarchy**:
  1. `--ytdlp-path <path>` CLI argument
  2. `YTDECK_YTDLP_PATH` environment variable
  3. Sibling executable in same directory (`./yt-dlp.exe`)
  4. System `PATH` lookup

### 3. Desktop Application & MCP Server Data Sharing Contract
- Configuration directory: `%APPDATA%\com.shival-gupta.yt-dlp-gui\`
- Shared artifacts:
  - `history.json`: Array of `HistoryEntry` JSON objects (circular buffer, 500 entries max)
  - `settings.json`: User configuration settings
  - `presets.json`: Custom user presets list

---

## Code Layout

```
yt-dlp-gui/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── build.yml
│       ├── lint.yml
│       ├── release.yml
│       ├── test.yml
│       └── update-ytdlp.yml
├── installer/
│   ├── components.nsi
│   ├── dev-signing.pfx
│   ├── installer.nsi
│   └── resources/
│       ├── app.ico
│       ├── header.bmp
│       └── patch-mcp-configs.ps1
├── skill/
│   ├── SKILL.md
│   └── install-skill.ps1
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── binaries/
│   │   ├── ffmpeg-x86_64-pc-windows-msvc.exe
│   │   ├── ffprobe-x86_64-pc-windows-msvc.exe
│   │   └── yt-dlp-x86_64-pc-windows-msvc.exe
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── commands.rs
│       ├── sidecar.rs
│       ├── state.rs
│       ├── tray.rs
│       └── updater.rs
├── ytdeck-mcp/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── cli.rs
│       ├── jobs.rs
│       ├── resolution.rs
│       ├── resources.rs
│       ├── server_sse.rs
│       ├── server_stdio.rs
│       └── tools.rs
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── LogPanel.tsx
│   │   │   ├── Nav.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── Titlebar.tsx
│   │   ├── download/
│   │   │   ├── BatchInput.tsx
│   │   │   ├── CommandPreview.tsx
│   │   │   ├── DownloadQueue.tsx
│   │   │   ├── FormatSelector.tsx
│   │   │   ├── OutputConfig.tsx
│   │   │   ├── PresetSelector.tsx
│   │   │   ├── ProgressCard.tsx
│   │   │   └── UrlInput.tsx
│   │   ├── panels/
│   │   │   ├── AuthPanel.tsx
│   │   │   ├── ExternalDownloaderPanel.tsx
│   │   │   ├── ExtractorPanel.tsx
│   │   │   ├── FilesystemPanel.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── FormatPanel.tsx
│   │   │   ├── MetadataPanel.tsx
│   │   │   ├── NetworkPanel.tsx
│   │   │   ├── PanelContainer.tsx
│   │   │   ├── PostProcessPanel.tsx
│   │   │   ├── SponsorBlockPanel.tsx
│   │   │   ├── SubtitlePanel.tsx
│   │   │   ├── ThumbnailPanel.tsx
│   │   │   └── VerbosityPanel.tsx
│   │   └── ui/              # shadcn/ui primitives
│   ├── hooks/
│   │   ├── useShortcuts.ts
│   │   ├── useUpdateCheck.ts
│   │   └── useVideoInfo.ts
│   ├── lib/
│   │   ├── error-messages.ts
│   │   ├── format-utils.ts
│   │   ├── progress-parser.ts
│   │   ├── ytdlp-args.ts
│   │   └── schemas/
│   ├── stores/
│   │   ├── downloadStore.ts
│   │   ├── presetStore.ts
│   │   ├── queueStore.ts
│   │   ├── settingsStore.ts
│   │   └── updateStore.ts
│   └── types/
│       ├── index.ts
│       ├── ipc.ts
│       ├── options.ts
│       └── presets.ts
├── tests/
│   ├── e2e/
│   └── unit/
├── Cargo.toml               # Workspace manifest uniting src-tauri & ytdeck-mcp
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── vite.config.ts
```
