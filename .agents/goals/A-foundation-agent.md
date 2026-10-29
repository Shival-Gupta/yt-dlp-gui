# Subagent A — Foundation Agent

## Mission
Scaffold the entire project structure and deliver a working Tauri 2 + React 19 skeleton that can spawn yt-dlp, stream output to the frontend, and render a basic download UI with theme support. Every other subagent depends on your output.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **GitHub:** `https://github.com/Shival-Gupta/yt-dlp-gui`
- **Stack:** Tauri 2.x · Rust · React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · Zustand · tauri-plugin-store · tauri-plugin-shell · tauri-plugin-updater · tauri-plugin-notification

## Decisions (locked — do not change)
| Decision | Value |
|---|---|
| App name | `yt-dlp-gui` |
| Tauri identifier | `com.shival-gupta.yt-dlp-gui` |
| Window style | Frameless (custom titlebar) |
| Theme | Light / Dark / System (Tailwind `dark:` class strategy) |
| State library | Zustand (no Redux, no Context API for global state) |
| Persistence | tauri-plugin-store (JSON file in AppData) |
| IPC | Tauri `invoke()` frontend→Rust, `emit()` Rust→frontend |
| Sidecar binaries | yt-dlp.exe, ffmpeg.exe, ffprobe.exe in `src-tauri/binaries/` |
| Commit style | Conventional commits: `feat:`, `chore:`, `fix:`, `refactor:` |

## Prerequisites to install / verify
```powershell
# Verify these exist before starting:
cargo --version          # 1.79+
node --version           # 20+
pnpm --version           # 9+  (use pnpm, not npm)
rustup target list --installed  # windows target present
# Install Tauri CLI if missing:
cargo install tauri-cli --version "^2"
```

## Ordered Task List (commit after each ✅)

### INIT-01: Scaffold Tauri 2 project
```powershell
cd d:\Projects\yt-ig-dowloader\yt-dlp-gui
cargo tauri init
# When prompted:
#   App name: yt-dlp-gui
#   Window title: yt-dlp GUI
#   Web assets relative path: ../dist
#   Dev server URL: http://localhost:5173
#   Frontend dev command: pnpm dev
#   Frontend build command: pnpm build
```
Then scaffold Vite + React 19 + TypeScript:
```powershell
pnpm create vite@latest . --template react-ts --force
pnpm install
```
Commit: `chore: scaffold Tauri 2 + React 19 + Vite project`

### INIT-02: Install and configure Tailwind CSS v4 + shadcn/ui
```powershell
pnpm add tailwindcss@next @tailwindcss/vite@next
pnpm dlx shadcn@latest init
# Choose: TypeScript=yes, style=default, baseColor=slate, cssVariables=yes
```
- Configure `vite.config.ts` to use `@tailwindcss/vite` plugin
- Set `darkMode: 'class'` in tailwind config (or v4 equivalent via CSS variable)
- Commit: `chore: configure Tailwind CSS v4 and shadcn/ui`

### INIT-03: Install all required shadcn components
```powershell
pnpm dlx shadcn@latest add button input label checkbox select slider textarea
pnpm dlx shadcn@latest add tabs card badge progress toast tooltip
pnpm dlx shadcn@latest add dropdown-menu dialog scroll-area separator
pnpm dlx shadcn@latest add collapsible switch alert
```
Commit: `chore: add all shadcn/ui component primitives`

### INIT-04: Install Zustand + TanStack Query + React Hook Form + Zod
```powershell
pnpm add zustand @tanstack/react-query react-hook-form zod @hookform/resolvers
pnpm add lucide-react
pnpm add -D @types/node
```
Commit: `chore: install state, query, form, and validation libraries`

### INIT-05: Configure Tauri plugins
In `src-tauri/Cargo.toml`, add:
```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-shell = "2"
tauri-plugin-store = "2"
tauri-plugin-updater = "2"
tauri-plugin-notification = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```
Register plugins in `src-tauri/src/main.rs`.
Commit: `chore: configure Tauri 2 plugins (shell, store, updater, notification, dialog)`

### SIDECAR-01: Add yt-dlp.exe sidecar
- Download latest `yt-dlp.exe` from https://github.com/yt-dlp/yt-dlp/releases/latest
- Place at `src-tauri/binaries/yt-dlp-x86_64-pc-windows-msvc.exe`
- In `tauri.conf.json` add:
```json
{
  "bundle": {
    "externalBin": ["binaries/yt-dlp"]
  }
}
```
- Add capability in `src-tauri/capabilities/default.json`:
```json
{ "permissions": ["shell:allow-execute", "shell:allow-spawn"] }
```
Commit: `feat: add yt-dlp.exe as Tauri sidecar binary`

### SIDECAR-02: Add ffmpeg.exe + ffprobe.exe sidecars
- Download ffmpeg builds from https://github.com/yt-dlp/FFmpeg-Builds/releases
- Place `ffmpeg-x86_64-pc-windows-msvc.exe` and `ffprobe-x86_64-pc-windows-msvc.exe` in `src-tauri/binaries/`
- Add both to `externalBin` in `tauri.conf.json`
Commit: `feat: add ffmpeg + ffprobe as Tauri sidecar binaries`

### RUST-01: Implement download Rust command
Create `src-tauri/src/commands/download.rs`:
```rust
// Exposes: spawn_ytdlp(args: Vec<String>, window: tauri::Window)
// 1. Use tauri_plugin_shell::process::Command to spawn yt-dlp sidecar
// 2. Pass args vec as CLI arguments
// 3. Stream stdout/stderr lines via window.emit("ytdlp-output", line)
// 4. Emit "ytdlp-done" event with exit code when process finishes
// 5. Store process handle in AppState so it can be killed later
// 6. Return job_id (UUID) immediately
```
Implement `cancel_download(job_id: String, state: tauri::State<AppState>)`.

AppState in `src-tauri/src/state.rs`:
```rust
pub struct AppState {
    pub processes: Mutex<HashMap<String, Arc<Mutex<Child>>>>,
}
```

Register commands in `main.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    commands::download::spawn_ytdlp,
    commands::download::cancel_download,
])
```
Commit: `feat: implement spawn_ytdlp Rust command with stdout/stderr streaming`

### RUST-02: Implement metadata fetch command
Create `src-tauri/src/commands/metadata.rs`:
```rust
// fetch_info(url: String) → runs `yt-dlp -j --no-playlist <url>` and returns stdout as String
// fetch_formats(url: String) → runs `yt-dlp -F <url>` and returns raw text output as String
// These are one-shot, not streamed
```
Commit: `feat: implement fetch_info and fetch_formats Rust commands`

### STORE-01: Define TypeScript types
Create `src/types/ytdlp.ts`:
```typescript
export type JobStatus = 'queued' | 'downloading' | 'processing' | 'done' | 'error' | 'cancelled'

export interface DownloadJob {
  id: string
  url: string
  title?: string
  progress: number          // 0-100
  speed?: string
  eta?: string
  status: JobStatus
  error?: string
  outputPath?: string
  startedAt: number
  finishedAt?: number
}

export interface YtdlpFormat {
  formatId: string
  ext: string
  resolution?: string
  fps?: number
  filesize?: number
  tbr?: number
  vcodec?: string
  acodec?: string
  note?: string
}

export interface YtdlpInfo {
  id: string
  title: string
  uploader?: string
  duration?: number
  thumbnail?: string
  formats: YtdlpFormat[]
  subtitles?: Record<string, unknown>
  automaticCaptions?: Record<string, unknown>
}

// Full options type — ALL panels feed into this
export interface YtdlpOptions {
  // Panel 1 - Download
  urls: string[]
  outputDir?: string
  outputTemplate?: string
  playlist: boolean
  playlistItems?: string
  concurrentFragments?: number
  archiveFile?: string
  maxDownloads?: number
  // ... (stub all remaining options — panels agent will fill them in)
  // Panel 2 - Format
  formatSelector?: string
  mergeOutputFormat?: string
  // [STUB: panels agent fills remaining fields]
  _raw?: string[]  // escape hatch for any raw args
}
```
Commit: `feat: define TypeScript types for yt-dlp jobs, formats, and options`

### STORE-02: Implement Zustand stores
Create `src/store/`:

**`downloadStore.ts`** — manages active jobs:
```typescript
interface DownloadStore {
  jobs: Record<string, DownloadJob>
  addJob: (job: DownloadJob) => void
  updateJob: (id: string, updates: Partial<DownloadJob>) => void
  removeJob: (id: string) => void
}
```

**`settingsStore.ts`** — persisted via tauri-plugin-store:
```typescript
interface SettingsStore {
  theme: 'light' | 'dark' | 'system'
  defaultOutputDir: string
  maxConcurrentDownloads: number
  checkUpdatesOnStartup: boolean
  checkYtdlpUpdatesWeekly: boolean
  ytdlpPathOverride?: string
  ffmpegPathOverride?: string
  notifyOnComplete: boolean
  setTheme: (t: 'light' | 'dark' | 'system') => void
  // ... setters for all fields
}
```

**`queueStore.ts`** — ordered queue management (add, remove, reorder, pause all, resume all)

Commit: `feat: implement Zustand stores (download, settings, queue)`

### LIB-01: Create ytdlp-args.ts skeleton
Create `src/lib/ytdlp-args.ts`:
```typescript
// PURPOSE: Single source of truth for translating YtdlpOptions → string[]
// Every panel writes to YtdlpOptions; this file reads it and builds the args array.
// Panels agent (C) will implement each function. You write the structure only.

export function buildArgs(opts: YtdlpOptions): string[] {
  return [
    ...buildDownloadArgs(opts),
    ...buildFormatArgs(opts),
    ...buildSubtitleArgs(opts),
    ...buildThumbnailArgs(opts),
    ...buildMetadataArgs(opts),
    ...buildPostProcessArgs(opts),
    ...buildSponsorBlockArgs(opts),
    ...buildNetworkArgs(opts),
    ...buildAuthArgs(opts),
    ...buildFilterArgs(opts),
    ...buildFilesystemArgs(opts),
    ...buildExtractorArgs(opts),
    ...buildExternalDownloaderArgs(opts),
    ...buildVerbosityArgs(opts),
    ...(opts._raw ?? []),
  ]
}

// STUBS — panels agent fills in the bodies:
export const buildDownloadArgs = (opts: YtdlpOptions): string[] => []
export const buildFormatArgs = (opts: YtdlpOptions): string[] => []
export const buildSubtitleArgs = (opts: YtdlpOptions): string[] => []
export const buildThumbnailArgs = (opts: YtdlpOptions): string[] => []
export const buildMetadataArgs = (opts: YtdlpOptions): string[] => []
export const buildPostProcessArgs = (opts: YtdlpOptions): string[] => []
export const buildSponsorBlockArgs = (opts: YtdlpOptions): string[] => []
export const buildNetworkArgs = (opts: YtdlpOptions): string[] => []
export const buildAuthArgs = (opts: YtdlpOptions): string[] => []
export const buildFilterArgs = (opts: YtdlpOptions): string[] => []
export const buildFilesystemArgs = (opts: YtdlpOptions): string[] => []
export const buildExtractorArgs = (opts: YtdlpOptions): string[] => []
export const buildExternalDownloaderArgs = (opts: YtdlpOptions): string[] => []
export const buildVerbosityArgs = (opts: YtdlpOptions): string[] => []
```
Commit: `feat: create ytdlp-args.ts argument builder skeleton`

### LIB-02: Create progress-parser.ts
Create `src/lib/progress-parser.ts`:
```typescript
// yt-dlp is invoked with --progress-template JSON so output is stable
// Template: '{"status":"%(progress.status)s","downloaded":%(progress.downloaded_bytes)s,"total":%(progress.total_bytes)s,"speed":%(progress.speed)s,"eta":%(progress.eta)s,"filename":"%(filename)s"}'
// Parse each stdout line as JSON; handle non-JSON lines gracefully

export interface ProgressEvent {
  status: 'downloading' | 'finished' | 'error'
  downloaded: number
  total: number
  speed: number
  eta: number
  filename: string
  percent: number  // computed: (downloaded / total) * 100
}

export function parseProgressLine(line: string): ProgressEvent | null {
  // try JSON.parse, return null if not a progress line
}
```
Commit: `feat: create progress-parser.ts for yt-dlp JSON progress output`

### LIB-03: Create format-utils.ts
Create `src/lib/format-utils.ts`:
```typescript
// parseFFormats(rawText: string): YtdlpFormat[]  — parses `yt-dlp -F` output table text
// formatFilesize(bytes: number): string           — "1.2 GB", "450 MB"
// formatSpeed(bps: number): string               — "2.4 MB/s"
// formatEta(seconds: number): string             — "1:23"
// getCodecBadge(codec: string): 'video'|'audio'|'av'|'unknown'
// qualityLabel(format: YtdlpFormat): string      — "1080p 60fps HDR"
```
Commit: `feat: create format-utils.ts for parsing and display helpers`

### UI-01: Custom titlebar + frameless window
- Set `"decorations": false` in `tauri.conf.json`
- Create `src/components/shared/Titlebar.tsx`:
  - Drag region via `data-tauri-drag-region`
  - App name + icon on left
  - Theme toggle (moon/sun) in center-right
  - Min / Max / Close buttons using `tauri-plugin-window`
Commit: `feat: implement frameless window with custom Titlebar component`

### UI-02: App layout shell
Create `src/components/layout/AppLayout.tsx`:
```
┌────────────────────────────────────┐
│ <Titlebar />                       │
├────────┬───────────────────────────┤
│ <Nav/> │ <main>{children}</main>   │
├────────┴───────────────────────────┤
│ <StatusBar />                      │
└────────────────────────────────────┘
```
Nav items: Download, Queue, History, Presets, Settings, About
Commit: `feat: implement AppLayout shell with Nav and StatusBar`

### UI-03: URL input bar
Create `src/components/download/UrlInput.tsx`:
- Large textarea (auto-resize, accepts multiple URLs, one per line)
- [Paste] button (reads clipboard via `navigator.clipboard`)
- [▶ Start Download] primary button
- URL validation (shows error for obviously invalid input)
- Wired to `queueStore.addUrls()`
Commit: `feat: implement UrlInput component`

### UI-04: Log panel
Create `src/components/shared/LogPanel.tsx`:
- Collapsible bottom sheet (default: 120px, expandable to 40% height)
- Listens to Tauri `ytdlp-output` events
- Colors lines by prefix: `[download]` blue, `ERROR` red, `[info]` gray, `[warning]` yellow
- Auto-scroll to bottom (with "pause scroll" when user scrolls up)
- Clear button, copy-all button
Commit: `feat: implement LogPanel with colored real-time output`

### UI-05: Theme toggle + theme application
- `ThemeToggle` component: cycles Light → Dark → System
- Reads from `settingsStore.theme`
- Applies `document.documentElement.classList.toggle('dark', ...)`
- On app start: read saved theme and apply immediately (in `App.tsx` before first render)
Commit: `feat: implement Light/Dark/System theme toggle`

### UI-06: Status bar
Create `src/components/layout/StatusBar.tsx`:
- Shows: `[Active: N] [Queued: N] [Done: N]`
- yt-dlp version (read from `yt-dlp --version` sidecar call on startup)
- App version from Tauri `getVersion()`
Commit: `feat: implement StatusBar with queue stats and version info`

### UI-07: About page stub
`src/pages/AboutPage.tsx`:
- App name, version, links to GitHub repo and yt-dlp repo
- Licenses section (MIT, Unlicense, LGPL)
Commit: `feat: implement About page`

### VALIDATE-01: Verify everything runs
```powershell
cd d:\Projects\yt-ig-dowloader\yt-dlp-gui
cargo tauri dev
```
- Confirm: window opens, theme toggle works, URL input renders, log panel renders
- Test: paste a YouTube URL, click Start, see yt-dlp output in log panel
- Fix any compilation or runtime errors before declaring done

Commit: `chore: verify foundation end-to-end (yt-dlp spawns and streams output)`

### GIT-01: Push to GitHub
```powershell
git push origin main
```

## Definition of Done
- [ ] `cargo tauri dev` launches without errors
- [ ] Frameless window with custom titlebar renders
- [ ] Theme toggle works (light/dark/system)
- [ ] URL input accepts URLs
- [ ] Clicking "Start Download" spawns yt-dlp sidecar and streams output to log panel
- [ ] StatusBar shows queue stats and version
- [ ] All TypeScript types in `src/types/ytdlp.ts` defined
- [ ] All Zustand stores created with correct shape
- [ ] `ytdlp-args.ts` skeleton (stubs) exported
- [ ] `progress-parser.ts` exported
- [ ] `format-utils.ts` exported
- [ ] All commits pushed to `main`

## What NOT to do
- Do not implement any option panels (that's Subagent C)
- Do not implement the format selector table (that's Subagent B)
- Do not implement the MCP server (that's Subagent E)
- Do not write the installer (that's Subagent G)
- Keep all stub functions returning `[]` — don't fill them in
