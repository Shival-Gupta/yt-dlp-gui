# Subagent B — Download UX Agent

## Mission
Build the full download workflow UX: queue management, format selector, preset system, command preview, and batch input. This is the heart of the app — the thing users interact with on every session.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **Depends on:** Subagent A (Foundation) — must be complete first
- **You will fill in:** `buildDownloadArgs()` and `buildFormatArgs()` in `src/lib/ytdlp-args.ts`

## Prerequisites (confirm before starting)
- [ ] `cargo tauri dev` runs without errors (Subagent A done)
- [ ] `src/types/ytdlp.ts` exists with `DownloadJob`, `YtdlpFormat`, `YtdlpOptions`
- [ ] `src/store/downloadStore.ts`, `queueStore.ts`, `settingsStore.ts` exist
- [ ] `src/lib/ytdlp-args.ts` skeleton exists

## Ordered Task List (commit after each ✅)

### QUEUE-01: ProgressCard component
Create `src/components/download/ProgressCard.tsx`:
- Shows: thumbnail (if available), title, URL domain, status badge, progress bar, speed, ETA, file size
- Status badges: `queued` (gray), `downloading` (blue pulse), `processing` (yellow), `done` (green), `error` (red), `cancelled` (gray strikethrough)
- Action buttons: Pause ⏸ / Resume ▶ / Cancel ✕ / Retry ↺ / Open File 📂 / Open Folder 🗀
- Pause/Resume calls `invoke('pause_download', { jobId })` / `invoke('resume_download', { jobId })`
- Cancel calls `invoke('cancel_download', { jobId })`
- Open File/Folder uses `tauri-plugin-opener`
Commit: `feat: implement ProgressCard component`

### QUEUE-02: DownloadQueue component
Create `src/components/download/DownloadQueue.tsx`:
- Reads from `downloadStore.jobs` + `queueStore`
- Renders list of `<ProgressCard />` sorted by: active first, then queued, then done/error
- "Clear Completed" button (removes done/cancelled from view, not from history)
- "Cancel All" button
- Empty state: illustrated empty queue with hint text
Commit: `feat: implement DownloadQueue component`

### FORMAT-01: Format fetch hook
Create `src/hooks/useYtdlpFormats.ts`:
```typescript
// useFetchFormats(url: string) → {
//   formats: YtdlpFormat[] | null,
//   isLoading: boolean,
//   error: string | null,
//   refetch: () => void
// }
// Calls invoke('fetch_formats', { url })
// Passes raw text through parseFFormats() from format-utils.ts
// Uses TanStack Query with url as cache key (staleTime: 5 minutes)
```
Commit: `feat: implement useFetchFormats hook`

### FORMAT-02: FormatSelector component
Create `src/components/download/FormatSelector.tsx`:
- Triggered by [Fetch Formats] button near URL input
- Shows loading skeleton while fetching
- Renders a sortable/filterable table of formats:
  | Format ID | Extension | Resolution | FPS | Codec | Size | Bitrate | Note |
  |---|---|---|---|---|---|---|---|
- Color-coded rows: video-only (blue tint), audio-only (green tint), combined (purple tint)
- Quality badges: 4K 🔴, 1080p 🟠, 720p 🟡, 480p ⚪, audio 🟢
- Row click → select format → writes `formatSelector` to `YtdlpOptions`
- "Best Video + Best Audio" quick button → sets `formatSelector` to `"bv*+ba/b"`
- "Audio Only" quick button → sets `formatSelector` to `"ba/b[acodec!=none]"`, enables `-x`
- Manual format string input (for power users)
Commit: `feat: implement FormatSelector component with quality table`

### FORMAT-03: Fill buildFormatArgs() in ytdlp-args.ts
Implement `buildFormatArgs(opts: YtdlpOptions): string[]`:
```typescript
// Maps:
// opts.formatSelector → ['-f', opts.formatSelector]
// opts.mergeOutputFormat → ['--merge-output-format', opts.mergeOutputFormat]
// opts.allowUnplayable → ['--allow-unplayable-formats']
// opts.preferFreeFormats → ['--prefer-free-formats']
// opts.checkFormats → ['--check-formats']
// opts.videoMultiStreams → ['--allow-multiple-video-streams']
// opts.audioMultiStreams → ['--allow-multiple-audio-streams']
// opts.formatSort → ['-S', opts.formatSort]  (e.g. "res:1080,fps")
// opts.noVideoFormat → ['--ignore-no-formats-error']
```
Commit: `feat: implement buildFormatArgs in ytdlp-args.ts`

### OUTPUT-01: OutputConfig component
Create `src/components/download/OutputConfig.tsx`:
- Output directory picker (uses `tauri-plugin-dialog` `open({ directory: true })`)
- Filename template input with placeholder `%(title)s.%(ext)s`
- [?] tooltip that opens a popover explaining output template syntax with examples:
  - `%(title)s.%(ext)s` — Basic
  - `%(uploader)s/%(title)s.%(ext)s` — Organized by uploader
  - `%(upload_date)s - %(title)s.%(ext)s` — Date prefix
- Path-by-type expander (Advanced ▾):
  - Subtitle dir, Thumbnail dir, Chapter dir
- Filename safety options: Windows-safe toggle, Restrict ASCII toggle, Trim length input
Commit: `feat: implement OutputConfig component with template picker`

### OUTPUT-02: Fill buildDownloadArgs() in ytdlp-args.ts
Implement `buildDownloadArgs(opts: YtdlpOptions): string[]`:
```typescript
// Maps every field in opts related to:
// urls, outputDir (-P), outputTemplate (-o), playlist flags,
// playlistItems (-I), concurrentFragments (-N), archiveFile,
// maxDownloads, breakOnExisting, skipPlaylistAfterErrors,
// batchFile (-a), waitForVideo, liveFromStart, markWatched
```
Commit: `feat: implement buildDownloadArgs in ytdlp-args.ts`

### PRESET-01: Preset data model + store
Add `presetStore.ts` to `src/store/`:
```typescript
interface Preset {
  id: string           // uuid
  name: string
  description?: string
  icon?: string        // lucide icon name
  options: Partial<YtdlpOptions>
  createdAt: number
  isBuiltIn: boolean
}

interface PresetStore {
  presets: Preset[]
  activePresetId: string | null
  applyPreset: (id: string) => void
  saveCurrentAsPreset: (name: string, opts: YtdlpOptions) => void
  deletePreset: (id: string) => void
}
```
Built-in presets (isBuiltIn: true, not deletable):
1. **Best Quality** — `formatSelector: "bv*+ba/b"`, `embedMetadata: true`, `embedChapters: true`
2. **Audio Only MP3** — `extractAudio: true`, `audioFormat: "mp3"`, `audioQuality: "192K"`, `embedThumbnail: true`, `embedMetadata: true`
3. **Instagram Reel** — `cookiesFromBrowser: "chrome"`, `formatSelector: "bv*+ba/b"`, `writeThumbnail: true`
4. **YouTube Playlist** — `yesPlaylist: true`, `outputTemplate: "%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s"`, `writeInfoJson: true`, `writeDescription: true`
5. **Twitter/X Video** — `formatSelector: "bv*+ba/b"`, `writeThumbnail: true`

Commit: `feat: implement preset store with 5 built-in presets`

### PRESET-02: PresetSelector component
Create `src/components/download/PresetSelector.tsx`:
- Dropdown showing all presets (built-in grouped separately from user presets)
- Click preset → applies to current options state
- [+ Save Current] button → opens dialog to name new preset
- Delete button on user presets (with confirmation dialog)
- Active preset highlighted
Commit: `feat: implement PresetSelector component`

### CMD-01: CommandPreview component
Create `src/components/shared/CommandPreview.tsx`:
- Collapsible panel (default: collapsed)
- Shows: `yt-dlp <args...>` reconstructed from current `YtdlpOptions` via `buildArgs()`
- Syntax highlighted (yt-dlp flags in blue, values in green, URL in yellow)
- [Copy] button (copies raw command)
- Updates live as options change (debounced 300ms)
- Shows a warning if no URL is entered
Commit: `feat: implement CommandPreview live CLI display`

### BATCH-01: Batch input component
Create `src/components/download/BatchInput.tsx`:
- Two modes (tabbed): "Paste URLs" (textarea, one per line) | "Load File" (.txt file picker)
- URL count indicator: "5 URLs detected"
- Validates each line (skip empty lines, warn on non-URL lines)
- [Add to Queue] button → adds all valid URLs with current options
Commit: `feat: implement BatchInput component for bulk URL handling`

### DND-01: Drag and drop handler
In `App.tsx` or `AppLayout.tsx`:
- Listen to `window` `dragover` + `drop` events
- If dropped items are URLs (from browser): add to URL input
- If dropped item is a `.txt` file: read file via Tauri fs, parse URLs, add to batch
- Show a drag-over overlay: "Drop URLs or .txt file here"
Commit: `feat: implement drag-and-drop URL and .txt file handling`

### INFO-01: Video info fetch hook + thumbnail preview
Create `src/hooks/useYtdlpInfo.ts`:
```typescript
// useVideoInfo(url: string) → { info: YtdlpInfo | null, isLoading, error }
// Calls invoke('fetch_info', { url })
// Parses JSON string into YtdlpInfo
// Used to show thumbnail + title in ProgressCard before download starts
```
When a URL is entered and user pauses (debounced 800ms), auto-fetch info and show:
- Thumbnail preview (small, top-right of URL input)
- Video title
- Duration
- Uploader
Commit: `feat: implement useVideoInfo hook with auto-preview on URL entry`

### QUEUE-03: Queue page
Create `src/pages/QueuePage.tsx`:
- Full-page view of the download queue
- Tabs: "Active" | "Queued" | "Done" | "Errors"
- "Pause All" / "Resume All" / "Clear Done" actions at top
Commit: `feat: implement QueuePage with filtered tab views`

### TEST-B01: Manual validation
- Start a YouTube download → verify ProgressCard shows progress bar updating
- Test format selector → fetch formats from a YouTube URL → select a format → verify it appears in command preview
- Apply "Audio Only MP3" preset → verify `-x --audio-format mp3` appears in command preview
- Save a custom preset → reload app → verify it persists
- Drag a .txt file with URLs → verify they're added to batch

Commit: `test: manual validation of download UX complete`

## Definition of Done
- [ ] ProgressCard renders with progress, speed, ETA, actions
- [ ] DownloadQueue shows all jobs with correct status sorting
- [ ] FormatSelector fetches and displays yt-dlp format table
- [ ] "Best Video + Best Audio" and "Audio Only" quick buttons work
- [ ] OutputConfig lets user pick dir and template
- [ ] 5 built-in presets work and apply correctly
- [ ] User can save/load/delete custom presets (persisted)
- [ ] CommandPreview updates live as options change
- [ ] BatchInput handles textarea + .txt file
- [ ] Drag & drop works for URLs and .txt files
- [ ] Video info auto-previews thumbnail + title on URL entry
- [ ] `buildDownloadArgs()` and `buildFormatArgs()` fully implemented in ytdlp-args.ts
- [ ] All commits pushed to `main`
