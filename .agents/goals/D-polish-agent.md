# Subagent D — Polish Agent

## Mission
Complete the app's remaining UX surfaces: download history, full settings page, OBS-style update checker, system tray, Windows toast notifications, keyboard shortcuts, and all error handling polish. You turn a functional tool into a finished product.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **Depends on:** Subagents B and C must be complete (Download UX + all option panels)
- **You do NOT modify:** ytdlp-args.ts, any panel components, or Rust commands

## Decisions (locked)
| Setting | Value |
|---|---|
| Update check | Silent startup check → non-blocking banner → manual "Update Now" |
| yt-dlp update | Separate from app update; manual button in Settings |
| Tray behavior | Minimize to tray (optional in settings), show progress tooltip |
| Notifications | Windows Toast via tauri-plugin-notification (opt-in in settings) |
| Keyboard shortcuts | Global within app window (not system-wide) |

## Ordered Task List (commit after each ✅)

### HISTORY-01: History data model
Add to `src/store/downloadStore.ts` (or new `historyStore.ts`):
```typescript
interface HistoryEntry {
  id: string
  url: string
  title?: string
  uploader?: string
  duration?: number
  thumbnail?: string
  outputPath?: string
  outputFilename?: string
  format?: string
  filesize?: number
  downloadedAt: number
  status: 'done' | 'error'
  error?: string
  options: Partial<YtdlpOptions>   // options used for this download (for re-download)
}
```
- Persisted via tauri-plugin-store to `history.json` in AppData
- Max 500 entries (circular, oldest deleted when over limit — user configurable in settings)
- When a job completes (`status: done`), write a HistoryEntry automatically

Commit: `feat: implement download history data model and persistence`

### HISTORY-02: HistoryPage component
Create `src/pages/HistoryPage.tsx`:
- Search bar (filters by title, URL, uploader)
- Sort by: Date ↓, Date ↑, Title A-Z, Size
- Date grouping headers: "Today", "Yesterday", "This Week", "Older"
- Each row shows:
  - Thumbnail (small, 56×32 px, cached from download time if available)
  - Title + uploader
  - Date/time
  - Format / filesize
  - Status badge (done/error)
  - Actions: [📂 Open Folder] [▶ Re-download] [🗑 Delete from history]
- "Clear All History" button (with confirmation dialog)
- Empty state with illustration

Re-download: applies the saved `options` + URL to a new download job.

Commit: `feat: implement HistoryPage with search, sort, and re-download`

### SETTINGS-01: Settings page structure
Create `src/pages/SettingsPage.tsx`:
Organized into collapsible sections:
1. **Appearance** — Theme, window opacity, font size
2. **Downloads** — Default output dir, filename template, max concurrent downloads, global rate limit
3. **Tools** — yt-dlp path override, ffmpeg path override, external downloader defaults
4. **Updates** — App update channel (stable/nightly), auto-check on startup, yt-dlp auto-check
5. **Notifications** — Notify on complete, notify on error, sound
6. **Advanced** — History max entries, cache dir, clear cache button, reset all settings
7. **About** — Version info, links, licenses

Commit: `feat: implement SettingsPage structure with all sections`

### SETTINGS-02: Wire settings to settingsStore
For every control in SettingsPage, wire `onChange` to `settingsStore.setXxx()`.
Changes must persist immediately (tauri-plugin-store `store.set()` + `store.save()`).

Commit: `feat: wire all SettingsPage controls to settingsStore with persistence`

### UPDATE-01: App update checker
Create `src/hooks/useUpdateCheck.ts`:
```typescript
// On startup (if settingsStore.checkUpdatesOnStartup === true):
// - Call Tauri updater: invoke('check_update') from tauri-plugin-updater
// - If update available: set updateAvailable: { version, notes, downloadUrl } in store
// - Do NOT auto-download, do NOT show modal — just set the store flag

// Manual check: same flow, triggered by button
```

Create `src/store/updateStore.ts`:
```typescript
interface UpdateStore {
  appUpdate: { version: string; notes: string } | null
  ytdlpUpdate: { currentVersion: string; latestVersion: string } | null
  isCheckingApp: boolean
  isCheckingYtdlp: boolean
  isDownloadingUpdate: boolean
  downloadProgress: number
}
```
Commit: `feat: implement app update checker hook and store`

### UPDATE-02: Update banner component
Create `src/components/shared/UpdateBanner.tsx`:
- Renders in the StatusBar area when `updateStore.appUpdate !== null`
- Non-blocking (does not prevent use of the app)
- Design: `[🔔 YTDeck v2025.x.x available — Release Notes | Update Now | Dismiss]`
- "Release Notes" → opens GitHub release page in system browser (tauri-plugin-opener)
- "Update Now":
  1. Calls `invoke('download_update')` from tauri-plugin-updater
  2. Shows download progress in the banner (e.g. "Downloading... 45%")
  3. When ready: shows `[🔄 Restart to Update]` button
  4. "Restart to Update" calls `invoke('install_update')` — which restarts the app
- "Dismiss" → hides banner until next startup (clears `updateStore.appUpdate`)

Commit: `feat: implement OBS-style update banner in StatusBar`

### UPDATE-03: yt-dlp update button
In SettingsPage → Updates section:
- Shows current yt-dlp version (fetched via `yt-dlp --version` sidecar on startup)
- "Check for yt-dlp Update" button → runs `yt-dlp --version` + checks GitHub yt-dlp releases API
- If newer: shows "New version: 2025.x.x — [Update yt-dlp]"
- "Update yt-dlp" → runs `yt-dlp -U` as sidecar, shows log output in a dialog
- Weekly auto-check: if `settingsStore.checkYtdlpUpdatesWeekly`, compare stored check date

Commit: `feat: implement yt-dlp version check and self-update in Settings`

### UPDATE-04: Rust side of update (tauri-plugin-updater)
In `src-tauri/src/commands/updater.rs`:
```rust
#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String>

#[tauri::command]
async fn download_update(app: tauri::AppHandle, window: tauri::Window) -> Result<(), String>
// Emits "update-progress" events during download

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String>
```
tauri.conf.json:
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://raw.githubusercontent.com/Shival-Gupta/yt-dlp-gui/main/updates/latest.json"],
      "pubkey": ""
    }
  }
}
```
Also create `updates/latest.json` stub in the repo (will be populated by CI).

Commit: `feat: implement Rust update commands with tauri-plugin-updater`

### TRAY-01: System tray icon
Create tray in `src-tauri/src/main.rs`:
```rust
// SystemTray with menu:
// - "Show YTDeck" → focus/show window
// - "---"
// - "Active downloads: N" (dynamic label, not clickable)
// - "---"
// - "Pause All" → invoke pause_all command
// - "Resume All" → invoke resume_all command
// - "---"
// - "Quit" → app.exit(0)

// On minimize: if settingsStore.minimizeToTray === true, hide window instead
// Double-click tray icon → show window
```
Commit: `feat: implement system tray icon with dynamic queue status menu`

### TRAY-02: Tray tooltip dynamic update
Update tray tooltip text every 2 seconds from active download count and speed:
`"yt-dlp GUI | Active: 2 | ↓ 3.4 MB/s"`
Commit: `feat: dynamic tray tooltip with download speed`

### NOTIFY-01: Completion toast notifications
Using `tauri-plugin-notification`:
```typescript
// When a job transitions to status 'done':
if (settingsStore.notifyOnComplete) {
  await sendNotification({
    title: 'Download Complete',
    body: job.title ?? job.url,
    icon: 'icons/icon.png',
  })
}
// When a job transitions to status 'error':
if (settingsStore.notifyOnError) {
  await sendNotification({
    title: 'Download Failed',
    body: `${job.title ?? job.url}: ${job.error}`,
  })
}
```
Commit: `feat: implement Windows toast notifications for completed/failed downloads`

### KEYS-01: Keyboard shortcuts
Add a `KeyboardShortcuts` component (mount in App.tsx, uses `useEffect` + `keydown` listener):
| Shortcut | Action |
|---|---|
| `Ctrl+V` | Focus URL input + paste |
| `Ctrl+Enter` | Start download (if URL entered) |
| `Ctrl+L` | Clear URL input |
| `Ctrl+,` | Open Settings |
| `Ctrl+H` | Open History |
| `Ctrl+Q` | Open Queue |
| `Escape` | Close any open dialog |
| `F5` | Check for yt-dlp update |

Show a "Keyboard Shortcuts" reference in Help menu or a `?` button in the titlebar.
Commit: `feat: implement keyboard shortcuts`

### ERROR-01: Error handling polish
Create `src/lib/error-messages.ts`:
Map common yt-dlp stderr patterns to user-friendly messages:
```typescript
const ERROR_MAP = [
  { pattern: /ERROR: \[youtube\] .+: Sign in to confirm your age/, message: "Age-restricted video — use --cookies-from-browser to authenticate", action: "Open Auth Panel" },
  { pattern: /ERROR: .+: Video unavailable/, message: "This video is unavailable or has been removed" },
  { pattern: /ERROR: .+: Private video/, message: "This video is private — you need to authenticate" },
  { pattern: /HTTP Error 429/, message: "Rate limited by the server — try again later or use a proxy" },
  { pattern: /ffmpeg.*not found/, message: "FFmpeg is not installed or not in PATH — check Settings > Tools" },
  { pattern: /ERROR: .+: No video formats found/, message: "No downloadable formats found. Try a different format selector." },
  { pattern: /ERROR: .+: Unable to extract initial player response/, message: "yt-dlp may be outdated — update yt-dlp in Settings" },
  // ... more patterns
]
```
In `ProgressCard`, show the mapped error message instead of raw stderr.
Add an "Show Details" expandable with the raw error.
Commit: `feat: implement user-friendly error message mapping for common yt-dlp errors`

### VALIDATE-D01: Full app walkthrough
- Launch app → update check banner should not appear (no update available in dev)
- Minimize to tray → tray icon appears, double-click shows app
- Download a video → completion notification fires
- Test Ctrl+Enter, Ctrl+, keyboard shortcuts
- Open Settings → change all settings, reload app, verify they persisted
- View History → verify completed downloads appear, re-download works

Commit: `chore: manual validation of polish features complete`

## Definition of Done
- [ ] HistoryPage with search, filter, re-download, clear
- [ ] History auto-written on download completion (persisted)
- [ ] SettingsPage all sections wired and persisted
- [ ] OBS-style update banner (non-blocking, download progress, manual restart)
- [ ] yt-dlp version check and self-update in Settings
- [ ] System tray icon with dynamic tooltip + menu
- [ ] Windows toast notifications (on complete + on error, opt-in)
- [ ] Keyboard shortcuts (8 shortcuts + help reference)
- [ ] User-friendly error messages for 8+ common yt-dlp errors
- [ ] `updates/latest.json` stub committed to repo
- [ ] All commits pushed to `main`
