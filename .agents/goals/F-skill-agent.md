# Subagent F — Skill Agent

## Mission
Write the complete `SKILL.md` for yt-dlp-gui — a documentation file that lets any AI agent understand yt-dlp's full capabilities and use them via CLI or the MCP server. This must be a standalone, self-contained reference document.

## Context
- **Repo:** `d:\Projects\yt-ig-dowloader\yt-dlp-gui`
- **Output file:** `skill/SKILL.md`
- **Installer script:** `skill/install-skill.ps1`
- **Depends on:** Nothing (pure documentation task — start immediately)
- **Reference:** `d:\Projects\yt-ig-dowloader\yt-dlp\` (cloned yt-dlp repo)

## Design Principles
1. **Standalone** — Works without the MCP server. Agent reads SKILL.md and constructs CLI commands.
2. **Composable** — Has an optional section on using the MCP server when available.
3. **Practical** — Organized by what the agent wants to DO, not by flag name.
4. **Complete** — Every CLI option group covered with at least one example.
5. **AI-optimized** — Use clear headings, tables, code blocks. Avoid walls of prose.

## Ordered Task List (commit after each ✅)

### SKILL-01: SKILL.md — Header and frontmatter
```yaml
---
name: yt-dlp-gui
description: >
  Download videos, audio, subtitles, thumbnails, and metadata from YouTube,
  Instagram, TikTok, Twitter, and 1750+ other sites using yt-dlp.
  Includes a full GUI app (yt-dlp-gui), a standalone MCP server (ytdeck-mcp),
  and this skill for CLI and programmatic use.
version: 1.0.0
author: Shival-Gupta
repo: https://github.com/Shival-Gupta/yt-dlp-gui
---
```
Commit: `docs: create SKILL.md with frontmatter`

### SKILL-02: Section 1 — What is yt-dlp
Write `## 1. What is yt-dlp`:
- One-paragraph overview
- Key stats: 1,754+ extractors, CLI + Python API
- How yt-dlp-gui extends it (GUI + MCP)
- Installation locations (sidecar in app, PATH, or standalone)

Commit: `docs: SKILL.md Section 1 — overview`

### SKILL-03: Section 2 — Quick Reference (most-used commands)
Write `## 2. Quick Reference` as a table:
| Goal | Command |
|---|---|
| Download best quality video | `yt-dlp "URL"` |
| Extract audio as MP3 | `yt-dlp -x --audio-format mp3 "URL"` |
| Download specific format | `yt-dlp -f 137+140 "URL"` |
| List available formats | `yt-dlp -F "URL"` |
| Download with subtitles | `yt-dlp --write-subs --embed-subs "URL"` |
| Download thumbnail | `yt-dlp --write-thumbnail "URL"` |
| Download playlist | `yt-dlp --yes-playlist "URL"` |
| Download with cookies | `yt-dlp --cookies-from-browser chrome "URL"` |
| Download Instagram reel | `yt-dlp --cookies-from-browser chrome "https://instagram.com/reel/..."` |
| Download Twitter/X video | `yt-dlp "https://twitter.com/.../status/..."` |
| Search and download | `yt-dlp "ytsearch5:lo-fi music"` |
| Download age-restricted | `yt-dlp --cookies-from-browser chrome "URL"` |
| Resume partial download | `yt-dlp -c "URL"` |
| Limit download speed | `yt-dlp -r 1M "URL"` |
| Batch download from file | `yt-dlp -a urls.txt` |
| Remove sponsor segments | `yt-dlp --sponsorblock-remove sponsor "URL"` |

Commit: `docs: SKILL.md Section 2 — quick reference table`

### SKILL-04: Section 3 — Supported Sources
Write `## 3. Supported Sources` with:
- Total extractor count (1,754+)
- Top platforms table with what content types they support:
  | Platform | Videos | Playlists | Live | Reels/Shorts | Audio | Images |
  |---|---|---|---|---|---|---|
  | YouTube | ✅ | ✅ | ✅ | ✅ Shorts | ✅ (Music) | ❌ |
  | Instagram | ✅ | ✅ (user profile) | ❌ | ✅ Reels | ❌ | ✅ carousels |
  | Twitter/X | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
  | TikTok | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
  | Facebook | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
  | Reddit | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ galleries |
  | Twitch | ✅ VOD | ✅ | ✅ | ❌ | ❌ | ❌ |
  | SoundCloud | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
  | Vimeo | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
  | Bilibili | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
  | ... | ... | ... | ... | ... | ... | ... |
- Note on generic extractor (works on many unlisted sites)
- How to check if a site is supported: `yt-dlp --list-extractors | grep -i sitename`

Commit: `docs: SKILL.md Section 3 — supported sources`

### SKILL-05: Section 4 — Media Types
Write `## 4. What Can Be Downloaded`:
| Media Type | Formats | Flags |
|---|---|---|
| Video | mp4, mkv, webm, avi, flv, mov, ts, 4K/8K HDR 60fps | `-f "bv*+ba/b"` |
| Audio only | mp3, m4a, flac, opus, wav, aac, vorbis, alac | `-x --audio-format mp3` |
| Subtitles | srt, vtt, ass, lrc, ttml, json3 | `--write-subs --sub-langs en` |
| Auto-captions | srt, vtt (AI-generated, where available) | `--write-auto-subs` |
| Thumbnails | jpg, png, webp | `--write-thumbnail` |
| Metadata | JSON (title, tags, views, duration, comments) | `--write-info-json` |
| Comments | JSON with replies, authors, timestamps | `--write-comments --write-info-json` |
| Live streams | direct m3u8 or fragment-based | `--live-from-start` |
| Live chat | json replay | `--sub-langs live_chat` |
| Images/galleries | jpg, png (Instagram carousels, Reddit galleries) | automatic |
| Chapters | embedded markers or split files | `--embed-chapters` or `--split-chapters` |

Note what is NOT supported: DRM (Netflix, Disney+, Spotify DRM), private encrypted content.

Commit: `docs: SKILL.md Section 4 — media types`

### SKILL-06: Section 5 — Format Selection
Write `## 5. Format Selection` covering:
- The `-f` / `--format` selector syntax
- Quality selector shortcuts:
  ```
  bv*+ba/b          best video + best audio (default recommended)
  bestvideo+bestaudio  same as above
  bv[height<=1080]+ba  cap at 1080p
  bv[ext=mp4]+ba[ext=m4a]  prefer mp4/m4a codecs
  ba/b[acodec!=none]  audio only
  137+140           specific format IDs (from yt-dlp -F)
  ```
- Sort selector `-S`:
  ```
  -S "res:1080,fps,vcodec:h265"   prefer 1080p H.265
  -S "filesize~50M"               prefer closest to 50 MB
  -S "codec:h264"                 prefer H.264
  ```
- Merge output: `--merge-output-format mp4`
- Filter syntax: `bv[height>=720][ext=mp4]`
- Common recipes:
  ```bash
  # Best possible quality (may be large)
  yt-dlp -f "bv*+ba/b" -S "res,fps,vcodec:h265" "URL"
  
  # 1080p H.264 MP4 (most compatible)
  yt-dlp -f "bv[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]" --merge-output-format mp4 "URL"
  
  # Smallest file for a given resolution
  yt-dlp -f "bv[height<=720]+ba/b" -S "+size" "URL"
  
  # Audio only, highest quality
  yt-dlp -f "ba" -x --audio-format flac "URL"
  ```

Commit: `docs: SKILL.md Section 5 — format selection`

### SKILL-07: Section 6 — Output Templates
Write `## 6. Output Templates` covering `-o` syntax:
- Common fields table:
  | Field | Description | Example |
  |---|---|---|
  | `%(title)s` | Video title | "My Video" |
  | `%(id)s` | Video ID | "dQw4w9WgXcQ" |
  | `%(ext)s` | File extension | "mp4" |
  | `%(uploader)s` | Channel/username | "RickAstley" |
  | `%(upload_date)s` | Upload date YYYYMMDD | "20091025" |
  | `%(duration)s` | Duration in seconds | "212" |
  | `%(view_count)s` | View count | "1234567890" |
  | `%(playlist)s` | Playlist name | "My Playlist" |
  | `%(playlist_index)s` | Track number in playlist | "003" |
  | `%(playlist_count)s` | Total tracks | "42" |
  | `%(chapter)s` | Chapter title | "Introduction" |
  | `%(channel)s` | Channel name | "Vevo" |
  | `%(resolution)s` | Video resolution | "1920x1080" |
  | `%(fps)s` | Frame rate | "60" |

- Example templates:
  ```bash
  # Standard
  "%(title)s.%(ext)s"
  
  # Organized by uploader
  "%(uploader)s/%(title)s.%(ext)s"
  
  # Date prefix
  "%(upload_date>%Y-%m-%d)s - %(title)s.%(ext)s"
  
  # Playlist with numbering
  "%(playlist)s/%(playlist_index)03d - %(title)s.%(ext)s"
  
  # Separate subtitle output dir
  -o "%(title)s.%(ext)s" -o "subtitle:subtitles/%(title)s.%(ext)s"
  ```

Commit: `docs: SKILL.md Section 6 — output templates`

### SKILL-08: Section 7 — All CLI Options (grouped)
Write `## 7. Full CLI Reference` — one subsection per option group:

### 7.1 General Options
### 7.2 Network & Proxy
### 7.3 Geo-restriction
### 7.4 Video Selection / Filtering
### 7.5 Download Options
### 7.6 Filesystem Options
### 7.7 Thumbnail Options
### 7.8 Internet Shortcut Options
### 7.9 Video Format Options
### 7.10 Subtitle Options
### 7.11 Authentication Options
### 7.12 Post-Processing Options
### 7.13 SponsorBlock Options
### 7.14 Extractor Options

For each option group:
- Key flags as a table (flag | type | description)
- At least one example command
- Note if it requires ffmpeg or other dependency

Read the actual flags from `d:\Projects\yt-ig-dowloader\yt-dlp\README.md` for accuracy.

Commit: `docs: SKILL.md Section 7 — complete CLI reference by option group`

### SKILL-09: Section 8 — Common Recipes
Write `## 8. Common Recipes` — practical, copy-pasteable:

```bash
# YouTube: Download entire channel (latest 50 videos)
yt-dlp "https://youtube.com/@ChannelName/videos" -I 1:50

# YouTube: Download playlist, skip already downloaded
yt-dlp --download-archive done.txt -o "%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s" "PLAYLIST_URL"

# Instagram: Download reels (requires login)
yt-dlp --cookies-from-browser chrome "https://instagram.com/reel/XXXXX/"

# Instagram: Download all posts from a profile
yt-dlp --cookies-from-browser chrome -o "%(uploader)s/%(title)s.%(ext)s" "https://instagram.com/username/"

# TikTok: Download video without watermark
yt-dlp "https://tiktok.com/@user/video/123456"

# Twitter/X: Download video from tweet
yt-dlp "https://twitter.com/user/status/123456789"

# YouTube Music: Audio only FLAC
yt-dlp -x --audio-format flac -o "%(artist)s/%(album)s/%(track_number)02d - %(title)s.%(ext)s" "MUSIC_URL"

# Twitch: Download VOD
yt-dlp "https://twitch.tv/videos/1234567890"

# Twitch: Download live stream from beginning
yt-dlp --live-from-start "https://twitch.tv/channel"

# Download with SponsorBlock (remove ads/intros/outros)
yt-dlp --sponsorblock-remove sponsor,intro,outro "YOUTUBE_URL"

# Embed everything (subs, thumbnail, metadata, chapters)
yt-dlp --embed-subs --embed-thumbnail --embed-metadata --embed-chapters --write-auto-subs --sub-langs "en.*" "URL"

# Download behind a paywall (with browser cookies)
yt-dlp --cookies-from-browser chrome "PAYWALL_URL"

# Download only audio from a YouTube playlist as MP3
yt-dlp -x --audio-format mp3 --embed-thumbnail --add-metadata -o "%(playlist_index)s - %(title)s.%(ext)s" "PLAYLIST_URL"

# High-quality audio rip from YouTube
yt-dlp -f "bestaudio[ext=m4a]" --embed-thumbnail --embed-metadata "URL"

# Download only the 10 most recent videos from a channel
yt-dlp -I 1:10 "https://youtube.com/@channel/videos"

# Simulate download (check what would be downloaded)
yt-dlp -s "URL"

# Get video info as JSON
yt-dlp -j "URL" | python -m json.tool
```

Commit: `docs: SKILL.md Section 8 — common recipes`

### SKILL-10: Section 9 — Post-Processing Pipeline
Write `## 9. Post-Processing Pipeline`:
- Explain the processing order (download → merge → postprocessors)
- FFmpeg-based postprocessors:
  - ExtractAudio (`-x`)
  - VideoRemuxer (`--remux-video`)
  - VideoConvertor (`--recode-video`)
  - EmbedSubtitle, EmbedThumbnail, Metadata, SplitChapters, ModifyChapters
- SponsorBlock integration
- Custom exec hooks: `--exec "ffmpeg -i {} -vf scale=720:-2 {}_small.mp4"`
- `--postprocessor-args` (pass custom args to FFmpeg)

Commit: `docs: SKILL.md Section 9 — post-processing pipeline`

### SKILL-11: Section 10 — Troubleshooting
Write `## 10. Troubleshooting`:
| Error | Cause | Fix |
|---|---|---|
| `ffmpeg not found` | FFmpeg not installed/in PATH | Install ffmpeg, or use yt-dlp-gui (bundles it) |
| `Sign in to confirm age` | Age-restricted content | `--cookies-from-browser chrome` |
| `Private video` | Authentication needed | `--cookies-from-browser chrome` |
| `HTTP Error 429` | Rate limited | Wait, use `--sleep-interval 3`, or use a proxy |
| `Video unavailable` | Removed or region-blocked | Use `--geo-verification-proxy` or VPN |
| `Unable to extract player response` | yt-dlp outdated | `yt-dlp -U` to update |
| `No video formats found` | Extractor issue | Try `--ignore-no-formats-error` or update yt-dlp |
| `ERROR: Unsupported URL` | Site not supported | Check `yt-dlp --list-extractors` |
| Slow download | Server throttling | `--concurrent-fragments 8` or use aria2c: `--downloader aria2c` |
| `[download] Resuming` loops | Corrupted .part file | Delete `.part` file and retry |

Commit: `docs: SKILL.md Section 10 — troubleshooting table`

### SKILL-12: Section 11 — MCP Server Integration (optional)
Write `## 11. Using with ytdeck-mcp (Optional)`:
- Explain: "If `ytdeck-mcp` is installed, use its tools instead of constructing CLI commands"
- Detection: check if `ytdeck` MCP server is in `tools/list` response
- Tool usage examples for each of the 12 MCP tools
- Graceful degradation: "If MCP is not available, fall back to constructing CLI commands per Section 7 and 8"
- HTTP transport: "If running as HTTP server at port 7531, use POST http://localhost:7531/message"

Commit: `docs: SKILL.md Section 11 — optional MCP server integration`

### SKILL-13: install-skill.ps1
Create `skill/install-skill.ps1`:
```powershell
# Detects installed AI tools by checking known config paths
# For each found tool, copies SKILL.md to its skills directory

$toolPaths = @{
    "Claude Desktop" = "$env:APPDATA\Claude\skills\yt-dlp-gui"
    "Antigravity" = "$env:USERPROFILE\.gemini\config\skills\yt-dlp-gui"
    "Cursor" = "$env:APPDATA\Cursor\skills\yt-dlp-gui"
    "Windsurf" = "$env:APPDATA\Windsurf\skills\yt-dlp-gui"
    "Continue.dev" = "$env:USERPROFILE\.continue\skills\yt-dlp-gui"
    "VS Code Continue" = "$env:APPDATA\Code\User\skills\yt-dlp-gui"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillFile = Join-Path $scriptDir "SKILL.md"

foreach ($tool in $toolPaths.GetEnumerator()) {
    # Check if parent dir exists (indicates tool is installed)
    $parentDir = Split-Path -Parent $tool.Value
    if (Test-Path $parentDir) {
        Write-Host "Installing skill for $($tool.Key)..."
        New-Item -ItemType Directory -Force -Path $tool.Value | Out-Null
        Copy-Item $skillFile "$($tool.Value)\SKILL.md" -Force
        Write-Host "  ✓ Installed to $($tool.Value)"
    } else {
        Write-Host "  ⊘ $($tool.Key) not detected (skipping)"
    }
}
Write-Host "Done. Run this script again after installing new AI tools."
```
Commit: `feat: create install-skill.ps1 for AI agent skill installation`

### SKILL-14: Validate SKILL.md
- Check that every CLI option group from `yt-dlp --help` is covered in Section 7
- Check that all code examples in Sections 8-9 are syntactically correct yt-dlp commands
- Verify MCP tool names in Section 11 match Subagent E's tool list
- Run `install-skill.ps1` locally, verify SKILL.md is copied to Antigravity config dir

Commit: `docs: validate and finalize SKILL.md`

## Definition of Done
- [ ] `skill/SKILL.md` complete with all 11 sections
- [ ] Frontmatter (name, description, version, repo)
- [ ] Quick reference table (Section 2)
- [ ] Supported sources table (Section 3)
- [ ] Media types table (Section 4)
- [ ] Format selection with all selector syntax (Section 5)
- [ ] Output template reference (Section 6)
- [ ] All 14 CLI option groups covered (Section 7)
- [ ] 15+ copy-pasteable recipe examples (Section 8)
- [ ] Post-processing pipeline explained (Section 9)
- [ ] Troubleshooting table 10+ entries (Section 10)
- [ ] MCP integration with graceful degradation (Section 11)
- [ ] `skill/install-skill.ps1` works on local machine
- [ ] All commits pushed to `main`
