# Subagent C — Panels Agent

## Mission
Implement all 12 remaining option panels (every yt-dlp CLI flag group exposed as a UI panel) and wire them all into `ytdlp-args.ts`. This is the broadest task — every CLI capability the tool has must be reachable from the GUI.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **Depends on:** Subagent A (Foundation) — types, stores, and ytdlp-args.ts skeleton must exist
- **Runs in parallel with:** Subagent B (Download UX) — you work on different files
- **You will fill in:** 12 of the 14 arg-builder functions in `ytdlp-args.ts`

## Panel Architecture Pattern
Every panel follows this pattern:
```typescript
// src/components/panels/XxxPanel.tsx

interface XxxPanelProps {
  options: YtdlpOptions           // current options state
  onChange: (patch: Partial<YtdlpOptions>) => void  // partial update
}

export function XxxPanel({ options, onChange }: XxxPanelProps) {
  return (
    <CollapsibleSection title="Section Name" icon={<IconName />}>
      {/* Basic options always visible */}
      {/* Advanced options inside <AdvancedSection> */}
    </CollapsibleSection>
  )
}
```
Create shared `CollapsibleSection` and `AdvancedSection` wrapper components in `src/components/shared/`.

Each panel also needs a Zod schema for validation. Put schemas in `src/lib/schemas/`.

## Ordered Task List (commit after each ✅)

### SHARED-01: Panel wrapper components
Create `src/components/shared/CollapsibleSection.tsx`:
- Has title, icon (lucide), expand/collapse toggle
- Remembers expanded state in local state (or sessionStorage)

Create `src/components/shared/AdvancedSection.tsx`:
- "Advanced ▾" expander inside a panel — hides less-common options
- Default: collapsed

Create `src/components/shared/OptionRow.tsx`:
- Consistent layout: `label | control | [?] tooltip button`

Create `src/components/shared/OptionsContainer.tsx`:
- Scrollable container for all panels (right sidebar or tab area)

Commit: `feat: create shared panel wrapper components`

### PANEL-01: Subtitle Panel
File: `src/components/panels/SubtitlePanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Write subtitles | Toggle | `--write-subs` |
| Write auto-generated | Toggle | `--write-auto-subs` |
| Subtitle languages | Multi-select (text input + chip) | `--sub-langs LANGS` (comma-sep) |
| List subtitles | Button (calls fetch_info) | `--list-subs` |
| Subtitle format | Select (srt, vtt, ass, lrc, json3, ttml) | `--sub-format FORMAT` |
| Convert to format | Select same options | `--convert-subs FORMAT` |
| Embed in video | Toggle | `--embed-subs` |

Language presets: `en`, `en.*` (all English), `all`

Schema (`src/lib/schemas/subtitle.schema.ts`):
```typescript
z.object({
  writeSubs: z.boolean(),
  writeAutoSubs: z.boolean(),
  subLangs: z.string().optional(),
  subFormat: z.enum(['best','srt','vtt','ass','lrc','json3','ttml']).optional(),
  convertSubs: z.enum(['srt','vtt','ass','lrc']).optional(),
  embedSubs: z.boolean(),
})
```

Implement `buildSubtitleArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement SubtitlePanel + buildSubtitleArgs`

### PANEL-02: Thumbnail Panel
File: `src/components/panels/ThumbnailPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Write thumbnail | Toggle | `--write-thumbnail` |
| Write all thumbnails | Toggle | `--write-all-thumbnails` |
| List thumbnails | Button | `--list-thumbnails` |
| Convert thumbnail | Select (jpg, png, webp) | `--convert-thumbnails FORMAT` |
| Embed as cover art | Toggle | `--embed-thumbnail` |

Implement `buildThumbnailArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement ThumbnailPanel + buildThumbnailArgs`

### PANEL-03: Metadata & Files Panel
File: `src/components/panels/MetadataPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Write description | Toggle | `--write-description` |
| Write info JSON | Toggle | `--write-info-json` |
| Write playlist metafiles | Toggle | `--write-playlist-metafiles` |
| Clean info JSON | Toggle | `--clean-info-json` |
| Write comments | Toggle | `--write-comments` |
| Embed metadata | Toggle | `--embed-metadata` |
| Embed chapters | Toggle | `--embed-chapters` |
| Embed info JSON | Toggle | `--embed-info-json` (mkv/mka only) |
| Split into chapters | Toggle | `--split-chapters` |
| Write internet shortcut | Select (none, .url, .webloc, .desktop) | `--write-url-link` etc. |
| xattrs | Toggle | `--xattrs` |
| Load info JSON file | File picker (.json) | `--load-info-json FILE` |
| Parse metadata rules | Repeatable key-value editor | `--parse-metadata WHEN:FROM:TO` |
| Replace in metadata | Repeatable (fields, regex, replace) | `--replace-in-metadata FIELDS REGEX REPLACE` |

The parse-metadata and replace-in-metadata controls are "Advanced ▾".

Implement `buildMetadataArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement MetadataPanel + buildMetadataArgs`

### PANEL-04: Post-Processing Panel
File: `src/components/panels/PostProcessPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Extract audio only | Toggle | `-x / --extract-audio` |
| Audio format | Select (best, aac, alac, flac, m4a, mp3, opus, vorbis, wav) | `--audio-format FORMAT` |
| Audio quality | Slider 0-10 or text input for bitrate (e.g. 128K) | `--audio-quality QUALITY` |
| Remux video | Select/text (avi, flv, mkv, mov, mp4, webm, etc.) | `--remux-video FORMAT` |
| Re-encode video | Select/text | `--recode-video FORMAT` |
| Keep intermediate video | Toggle | `-k / --keep-video` |
| Post overwrites | Toggle | `--post-overwrites` |
| Fixup | Select (never, warn, detect_or_warn, force) | `--fixup POLICY` |
| Exec command | Text input | `--exec CMD` |
| FFmpeg postprocessor args | Key-value editor | `--postprocessor-args NAME:ARGS` |

Implement `buildPostProcessArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement PostProcessPanel + buildPostProcessArgs`

### PANEL-05: SponsorBlock Panel
File: `src/components/panels/SponsorBlockPanel.tsx`

Categories (multi-checkbox for each of remove/mark):
- `sponsor`, `intro`, `outro`, `selfpromo`, `preview`, `filler`, `music_offtopic`, `poi_highlight`, `chapter`, `all`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Remove segments | Category checkboxes | `--sponsorblock-remove CATS` |
| Mark segments | Category checkboxes | `--sponsorblock-mark CATS` |
| Chapter title template | Text | `--sponsorblock-chapter-title TEMPLATE` |
| API URL override | Text (Advanced) | `--sponsorblock-api URL` |

Show info tooltip: "Requires SponsorBlock community data. Works on YouTube."

Implement `buildSponsorBlockArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement SponsorBlockPanel + buildSponsorBlockArgs`

### PANEL-06: Network & Proxy Panel
File: `src/components/panels/NetworkPanel.tsx`

Basic section:
| Control | Type | CLI Flag |
|---|---|---|
| Proxy URL | Text | `--proxy URL` |
| Rate limit | Text (e.g. 1M, 500K) | `-r / --throttled-rate RATE` |
| Retries | Number | `-R / --retries N` |
| Socket timeout | Number (seconds) | `--socket-timeout SECONDS` |

Advanced section:
| Control | Type | CLI Flag |
|---|---|---|
| Source address | Text | `--source-address IP` |
| Geo verification proxy | Text | `--geo-verification-proxy URL` |
| X-Forwarded-For | Text | `--xff VALUE` |
| Fragment retries | Number | `--fragment-retries N` |
| Sleep interval | Number | `--sleep-interval SECONDS` |
| Max sleep interval | Number | `--max-sleep-interval SECONDS` |
| Sleep between requests | Number | `--sleep-requests SECONDS` |
| Custom headers | Key-value repeatable | `--add-headers KEY:VALUE` (multiple) |
| Impersonate browser | Select (chrome, edge, safari, etc.) | `--impersonate CLIENT[:OS]` |
| Enable file:// URLs | Toggle | `--enable-file-urls` |
| Skip unavailable fragments | Toggle | `--skip-unavailable-fragments` |
| Abort on unavailable fragment | Toggle | `--abort-on-unavailable-fragment` |
| Buffer size | Text | `--buffer-size SIZE` |
| HTTP chunk size | Text | `--http-chunk-size SIZE` |
| Min sleep interval | Number | `--min-sleep-interval SECONDS` |
| Keep fragments | Toggle | `--keep-fragments` |

Implement `buildNetworkArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement NetworkPanel + buildNetworkArgs`

### PANEL-07: Authentication Panel
File: `src/components/panels/AuthPanel.tsx`

> ⚠️ IMPORTANT: Password fields must use `type="password"`. Never log credentials to the log panel.

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Username | Text | `-u / --username USER` |
| Password | Password | `-p / --password PASS` |
| Two-factor code | Text | `--twofactor CODE` |
| Video password | Password | `--video-password PASS` |
| Netrc mode | Toggle | `--netrc` |
| Netrc file | File picker | `--netrc-location FILE` |
| Netrc command | Text (Advanced) | `--netrc-cmd CMD` |
| Cookies file | File picker (.txt) | `--cookies FILE` |
| Cookies from browser | Select (chrome, firefox, brave, edge, opera, safari, chromium, vivaldi) + optional profile field | `--cookies-from-browser BROWSER[+KEYRING][:PROFILE][::CONTAINER]` |

TV Provider (Advanced):
| Control | Type | CLI Flag |
|---|---|---|
| MSO | Text | `--ap-mso MSO` |
| AP Username | Text | `--ap-username USER` |
| AP Password | Password | `--ap-password PASS` |

Implement `buildAuthArgs(opts)` in ytdlp-args.ts.
Note: **never** include `--username`, `--password` etc. in CommandPreview — replace values with `***` for display.
Commit: `feat: implement AuthPanel + buildAuthArgs (with credential masking)`

### PANEL-08: Video Selection / Filter Panel
File: `src/components/panels/FilterPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Date (exact) | Date picker | `--date DATE` |
| Date before | Date picker | `--datebefore DATE` |
| Date after | Date picker | `--dateafter DATE` |
| Min filesize | Text (e.g. 10M, 1G) | `--min-filesize SIZE` |
| Max filesize | Text | `--max-filesize SIZE` |
| Age limit | Number | `--age-limit YEARS` |
| Match filter | Text (Advanced) | `--match-filters FILTER` |
| Break match filter | Text (Advanced) | `--break-match-filters FILTER` |
| Skip on N errors | Number | `--skip-playlist-after-errors N` |
| Break on existing | Toggle | `--break-on-existing` |
| Break per input | Toggle | `--break-per-input` |
| Max downloads | Number | `--max-downloads NUMBER` |

Show tooltip on match-filter with examples: `"view_count > 1000"`, `"like_count > 100 & dislike_count <? 50"`

Implement `buildFilterArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement FilterPanel + buildFilterArgs`

### PANEL-09: Filesystem Panel
File: `src/components/panels/FilesystemPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Windows-safe filenames | Toggle | `--windows-filenames` |
| Restrict to ASCII | Toggle | `--restrict-filenames` |
| Trim filename length | Number | `--trim-filenames LENGTH` |
| No overwrite | Toggle | `-w / --no-overwrites` |
| Force overwrite | Toggle | `--force-overwrites` |
| Resume partial | Toggle | `-c / --continue` |
| Use .part files | Toggle | `--part` |
| Set mtime from header | Toggle | `--mtime` |
| Cache directory | Dir picker | `--cache-dir DIR` |
| No cache | Toggle | `--no-cache-dir` |
| Paths by type (subtitle dir) | Dir picker | `-P "subtitle:DIR"` |
| Paths by type (thumbnail dir) | Dir picker | `-P "thumbnail:DIR"` |
| Paths by type (chapter dir) | Dir picker | `-P "chapter:DIR"` |
| Paths by type (temp dir) | Dir picker | `-P "temp:DIR"` |
| Force write archive | Toggle | `--force-write-archive` |

Implement `buildFilesystemArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement FilesystemPanel + buildFilesystemArgs`

### PANEL-10: Extractor Options Panel
File: `src/components/panels/ExtractorPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Extractor arguments | Key-value repeatable (extractor:key=value) | `--extractor-args EXTRACTOR:KEY=VALUE` |
| Use specific extractors | Text (comma-separated) | `--use-extractors NAMES` |
| Flat playlist | Toggle | `--flat-playlist` |
| Live from start | Toggle | `--live-from-start` |
| Wait for video | Range input (MIN[-MAX] seconds) | `--wait-for-video MIN[-MAX]` |
| Mark watched | Toggle | `--mark-watched` |
| JavaScript runtime | Select (auto, deno, node, bun, quickjs) + path override | `--js-runtimes RUNTIME[:PATH]` |
| Remote components | Select (auto, none, ytdlp-ejs) | `--remote-components COMPONENT` |
| Default search prefix | Text (e.g. ytsearch, ytmsearch) | `--default-search PREFIX` |
| Config file location | File picker | `--config-locations PATH` |
| Plugin directories | Dir picker (repeatable) | `--plugin-dirs DIR` |

Implement `buildExtractorArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement ExtractorPanel + buildExtractorArgs`

### PANEL-11: External Downloader Panel
File: `src/components/panels/ExternalDownloaderPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| External downloader | Select (default, aria2c, axel, curl, httpie, wget) | `--downloader NAME` |
| Downloader args | Text (key:value) | `--downloader-args NAME:ARGS` |
| HLS prefer | Radio (native / ffmpeg / auto) | `--hls-prefer-native` or `--hls-prefer-ffmpeg` |
| HLS use MPEG-TS | Toggle | `--hls-use-mpegts` |
| HLS split discontinuity | Toggle | `--hls-split-discontinuity` |

Implement `buildExternalDownloaderArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement ExternalDownloaderPanel + buildExternalDownloaderArgs`

### PANEL-12: Verbosity / Simulation Panel
File: `src/components/panels/VerbosityPanel.tsx`

Controls:
| Control | Type | CLI Flag |
|---|---|---|
| Simulate only | Toggle | `-s / --simulate` |
| Skip download (write only) | Toggle | `--skip-download` |
| Print template | Text | `-O / --print TEMPLATE` |
| Dump JSON | Toggle | `-j / --dump-json` |
| Dump single JSON | Toggle | `-J / --dump-single-json` |
| Verbose | Toggle | `-v / --verbose` |
| Print traffic | Toggle | `--print-traffic` |
| No warnings | Toggle | `--no-warnings` |
| Print to file | File path + template | `--print-to-file TEMPLATE FILE` |
| Compat options | Text (Advanced) | `--compat-options OPTS` |
| Ignore errors | Toggle | `-i / --ignore-errors` |
| No abort on error | Toggle | `--no-abort-on-error` |
| Ignore config | Toggle | `--ignore-config` |

Implement `buildVerbosityArgs(opts)` in ytdlp-args.ts.
Commit: `feat: implement VerbosityPanel + buildVerbosityArgs`

### WIRING-01: Complete YtdlpOptions type
Update `src/types/ytdlp.ts` `YtdlpOptions` to include ALL fields from all 14 panels.
Make sure every panel has a corresponding set of fields (no stubs left).
Commit: `refactor: complete YtdlpOptions type with all panel fields`

### WIRING-02: PanelContainer + panel navigation
Create `src/components/panels/PanelContainer.tsx`:
- Tab bar with icons for each panel group:
  - 🎬 Format & Quality
  - 💬 Subtitles
  - 🖼️ Thumbnails
  - 📋 Metadata
  - ⚙️ Post-Process
  - 🚫 SponsorBlock
  - 🌐 Network
  - 🔑 Auth
  - 🔍 Selection
  - 📁 Filesystem
  - 🔌 Extractor
  - ⬇️ Downloader
  - 🛠️ Verbosity
- Each tab renders the corresponding panel
- Panels share a `YtdlpOptions` state (from parent page) and emit partial updates
Commit: `feat: implement PanelContainer with all 12 panels tabbed`

### WIRING-03: All buildXxx functions verified
Run through each arg builder function and verify:
1. Every flag in the panel has a corresponding arg builder entry
2. Boolean flags only emit the flag when true (no `--no-flag` unless the user explicitly chose it)
3. Optional string/number values only emit their flag when the value is non-empty
4. Write a simple TypeScript test file `src/lib/__tests__/ytdlp-args.test.ts` with at least 3 assertions per builder

Commit: `test: add unit tests for all arg builder functions`

### VALIDATE-C01: End-to-end panel validation
- Open each panel tab in the running app
- Toggle every control
- Verify the CommandPreview updates correctly with the right flags
- Verify no TypeScript errors

Commit: `chore: manual validation of all 12 option panels complete`

## Definition of Done
- [ ] 12 panels implemented (Subtitle, Thumbnail, Metadata, PostProcess, SponsorBlock, Network, Auth, Filter, Filesystem, Extractor, ExternalDownloader, Verbosity)
- [ ] All 12 `buildXxx()` functions fully implemented in `ytdlp-args.ts`
- [ ] Zod schemas in `src/lib/schemas/` for each panel
- [ ] `YtdlpOptions` type fully populated (no stubs)
- [ ] Credentials masked in CommandPreview
- [ ] PanelContainer with tabbed navigation
- [ ] Unit tests for all arg builder functions
- [ ] All commits pushed to `main`
