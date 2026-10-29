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

# yt-dlp AI Agent Skill Reference Manual

## 1. What is yt-dlp

`yt-dlp` is a command-line media extraction and download tool branched from `youtube-dl`. It is widely recognized as the industry standard for programmatic media extraction, with support for **1,754+ extractors** spanning global video hubs, social media networks, streaming platforms, educational sites, podcasts, and news archives.

The `yt-dlp-gui` project extends yt-dlp into a modern, complete desktop application ecosystem:
- **Desktop GUI (`yt-dlp-gui`)**: A lightweight Tauri 2 + React 19 desktop client with drag-and-drop, format inspection, batch queues, presets, OBS-style updater, and history management.
- **Standalone MCP Server (`ytdeck-mcp`)**: A high-performance Model Context Protocol (MCP) server running over standard I/O (stdio) and HTTP SSE (port 7531), enabling AI assistants (such as Claude Desktop, Antigravity, Cursor, Windsurf, and Continue) to query media metadata, inspect formats, and execute downloads programmatically.
- **AI Agent Skill (`SKILL.md`)**: This comprehensive reference manual designed for AI agents to reason about, construct, and validate yt-dlp operations across both CLI and MCP workflows.

### Installation Locations
- **Bundled with GUI**: `%LOCALAPPDATA%\Programs\yt-dlp-gui\bin\yt-dlp.exe`
- **System PATH**: `yt-dlp` or `yt-dlp.exe`
- **Standalone Binary**: Placed anywhere or configured via `YTDECK_YTDLP_PATH` environment variable.

---

## 2. Quick Reference

| Goal | Command |
|---|---|
| Download best quality video + audio | `yt-dlp "URL"` |
| Extract audio as MP3 | `yt-dlp -x --audio-format mp3 "URL"` |
| Extract audio as FLAC (lossless) | `yt-dlp -x --audio-format flac "URL"` |
| Download specific format ID | `yt-dlp -f 137+140 "URL"` |
| List available formats table | `yt-dlp -F "URL"` |
| Download with embedded subtitles | `yt-dlp --write-subs --embed-subs "URL"` |
| Download thumbnail as JPEG | `yt-dlp --write-thumbnail --convert-thumbnails jpg "URL"` |
| Download full playlist | `yt-dlp --yes-playlist "URL"` |
| Download with browser cookies | `yt-dlp --cookies-from-browser chrome "URL"` |
| Download Instagram reel / post | `yt-dlp --cookies-from-browser chrome "https://instagram.com/reel/..."` |
| Download Twitter/X video | `yt-dlp "https://twitter.com/user/status/..."` |
| Search YouTube and download top result | `yt-dlp "ytsearch1:lo-fi hip hop chill beats"` |
| Search YouTube Music | `yt-dlp "ytmsearch1:artist name song title"` |
| Resume interrupted download | `yt-dlp -c "URL"` |
| Limit download speed | `yt-dlp -r 2M "URL"` |
| Batch download from text file | `yt-dlp -a urls.txt` |
| Skip downloaded items via archive | `yt-dlp --download-archive archive.txt "URL"` |
| Remove sponsor segments via SponsorBlock | `yt-dlp --sponsorblock-remove sponsor,intro,outro "URL"` |
| Simulate download without saving files | `yt-dlp -s "URL"` |

---

## 3. Supported Sources

yt-dlp supports over **1,754 distinct website extractors**. In addition to specific site extractors, a generic extractor dynamically parses direct HTML5 video tags, embedded players, and m3u8/mpd streams across unlisted websites.

### Top Platform Feature Matrix

| Platform | Videos | Playlists | Live Streams | Reels / Shorts | Audio Only | Carousels / Images |
|---|---|---|---|---|---|---|
| **YouTube** | ✅ | ✅ | ✅ | ✅ Shorts | ✅ (Music) | ❌ |
| **Instagram** | ✅ | ✅ (Profiles) | ❌ | ✅ Reels | ❌ | ✅ Carousels |
| **Twitter / X** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ Images |
| **TikTok** | ✅ (No watermark) | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Facebook** | ✅ | ❌ | ✅ | ✅ Reels | ❌ | ❌ |
| **Reddit** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ Galleries |
| **Twitch** | ✅ (VODs) | ✅ | ✅ (Live) | ❌ | ❌ | ❌ |
| **SoundCloud** | ❌ | ✅ (Sets) | ❌ | ❌ | ✅ | ❌ |
| **Vimeo** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bilibili** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Dailymotion** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pinterest** | ✅ | ✅ (Boards) | ❌ | ❌ | ❌ | ✅ Pins |

To check if a specific website is supported:
```bash
yt-dlp --list-extractors | grep -i "sitename"
```

---

## 4. What Can Be Downloaded

| Media Type | Extensions / Formats | Essential Flags |
|---|---|---|
| **Video** | mp4, mkv, webm, avi, mov, flv, ts (up to 4K/8K HDR 60fps) | `-f "bv*+ba/b" --merge-output-format mp4` |
| **Audio** | mp3, m4a, flac, opus, wav, aac, vorbis, alac | `-x --audio-format mp3` (requires FFmpeg) |
| **Subtitles** | srt, vtt, ass, lrc, ttml, json3 | `--write-subs --sub-langs "en.*"` |
| **Auto-Captions** | srt, vtt (AI-generated subtitles) | `--write-auto-subs --sub-langs "en"` |
| **Thumbnails** | jpg, png, webp | `--write-thumbnail --convert-thumbnails jpg` |
| **JSON Metadata** | Structured JSON with title, tags, description, views | `--write-info-json --no-clean-info-json` |
| **Comments** | JSON tree with author, text, timestamp, upvotes | `--write-comments --write-info-json` |
| **Live Streams** | Real-time direct stream recording | `--live-from-start` |
| **Live Chat** | JSON replay stream of chat comments | `--sub-langs "live_chat"` |
| **Image Galleries** | High-resolution image files | Default handling on Instagram/Reddit |
| **Chapters** | Embedded chapter markers or split individual tracks | `--embed-chapters` or `--split-chapters` |

> ⚠️ **DRM & Encrypted Content Exclusion**: yt-dlp does **NOT** support downloading DRM-protected content (e.g. Netflix, Disney+, Spotify encrypted streams, Widevine L1/L3 encrypted video). Requests involving DRM protected platforms should be declined or redirected to authorized streaming platforms.

---

## 5. Format Selection

### Format Selector Syntax (`-f` or `--format`)
`yt-dlp` separates video and audio streams on modern streaming platforms (DASH and HLS). To obtain complete video with sound, video and audio streams must be merged:

| Selector | Meaning |
|---|---|
| `bv*+ba/b` | Best video stream + best audio stream; fallback to best single pre-merged file (**Default & Recommended**) |
| `bestvideo+bestaudio` | Same as `bv*+ba/b` |
| `bv[height<=1080]+ba/b[height<=1080]` | Best video up to 1080p + best audio |
| `bv[ext=mp4]+ba[ext=m4a]/b` | Prefer MP4 container streams for maximum device compatibility |
| `ba/b[acodec!=none]` | Best audio stream without video |
| `137+140` | Explicit format IDs determined from `yt-dlp -F URL` |

### Sorting & Preference Syntax (`-S` or `--format-sort`)
Control stream sorting without hardcoding format IDs:
- Prefer 1080p resolution and H.264 video codec: `-S "res:1080,codec:h264"`
- Prefer H.265 / HEVC: `-S "vcodec:h265"`
- Target file size close to 50MB: `-S "filesize~50M"`
- Prefer highest framerate: `-S "fps"`
- Prefer smallest file size: `-S "+size"`

### Output Container Merge (`--merge-output-format`)
When downloading separate video and audio streams, use FFmpeg to package them into your target container:
```bash
yt-dlp -f "bv*+ba/b" --merge-output-format mp4 "URL"
```

---

## 6. Output Templates

Configure output filenames and directory structures using the `-o` / `--output` flag.

### Common Template Fields

| Field | Description | Example Value |
|---|---|---|
| `%(title)s` | Media title | `Chill Lofi Beats` |
| `%(id)s` | Platform video identifier | `dQw4w9WgXcQ` |
| `%(ext)s` | Output container extension | `mp4`, `m4a`, `mp3` |
| `%(uploader)s` | Channel or account username | `LofiGirl` |
| `%(upload_date)s` | Upload date (YYYYMMDD) | `20240115` |
| `%(duration)s` | Duration in integer seconds | `3600` |
| `%(view_count)s` | View count | `1540200` |
| `%(playlist)s` | Playlist name | `Favorites 2024` |
| `%(playlist_index)03d` | Zero-padded index in playlist | `001`, `042` |
| `%(chapter)s` | Current chapter name | `01 Intro` |
| `%(resolution)s` | Video width and height | `1920x1080` |
| `%(fps)s` | Frame rate | `60` |

### Standard Path Recipes
```bash
# Clean flat filename in current directory:
yt-dlp -o "%(title)s.%(ext)s" "URL"

# Organized by Channel / Year:
yt-dlp -o "%(uploader)s/%(upload_date>%Y)s/%(title)s.%(ext)s" "URL"

# Numbered playlist files:
yt-dlp -o "%(playlist)s/%(playlist_index)03d - %(title)s.%(ext)s" "PLAYLIST_URL"

# Split subtitles into dedicated directory:
yt-dlp -o "%(title)s.%(ext)s" -o "subtitle:subtitles/%(title)s.%(ext)s" "URL"
```

---

## 7. Full CLI Reference (By Option Group)

### 7.1 General Options
- `-U, --update`: Update yt-dlp to latest version.
- `-i, --ignore-errors`: Continue on download errors (vital for playlists).
- `--abort-on-error`: Abort downloading of further videos if an error occurs.
- `--dump-user-agent`: Display current network User-Agent.
- `--list-extractors`: List all supported extractors.
- `--extractor-descriptions`: Output descriptions of extractors.

*Example:*
```bash
yt-dlp --ignore-errors --no-warnings "PLAYLIST_URL"
```

### 7.2 Network & Proxy
- `--proxy URL`: Use HTTP/HTTPS/SOCKS proxy (e.g. `socks5://127.0.0.1:9050`).
- `--socket-timeout SECONDS`: Network timeout (default: 20 seconds).
- `--source-address IP`: Client IP address to bind to.
- `-4, --force-ipv4`: Force IPv4 connections.
- `-6, --force-ipv6`: Force IPv6 connections.
- `--retries NUMBER`: Number of retries on download errors (default: 10, or `infinite`).

*Example:*
```bash
yt-dlp --proxy "socks5://127.0.0.1:1080" --retries 5 "URL"
```

### 7.3 Geo-restriction
- `--geo-verification-proxy URL`: Use proxy strictly for IP address verification.
- `--geo-bypass`: Bypass geographic restriction via fake X-Forwarded-For headers.
- `--no-geo-bypass`: Do not bypass geographic restriction.
- `--geo-bypass-country CODE`: Force country code in two-letter ISO 3166-2 format (e.g. `US`, `GB`, `JP`).

*Example:*
```bash
yt-dlp --geo-bypass-country US "URL"
```

### 7.4 Video Selection / Filtering
- `--playlist-items ITEM_SPEC`: Select specific playlist indices (e.g. `1,2,5-8` or `1:10`).
- `--date DATE`: Videos uploaded on this date (YYYYMMDD).
- `--datebefore DATE`: Videos uploaded on or before this date.
- `--dateafter DATE`: Videos uploaded on or after this date.
- `--min-filesize SIZE`: Do not download videos smaller than SIZE (e.g. `50k`, `10M`).
- `--max-filesize SIZE`: Do not download videos larger than SIZE.
- `--match-filters FILTER`: Dynamic filter expression (e.g. `duration > 60 & view_count > 1000`).
- `--age-limit YEARS`: Download only videos suitable for the given age.

*Example:*
```bash
yt-dlp --playlist-items 1:10 --match-filters "duration < 600" "PLAYLIST_URL"
```

### 7.5 Download Options
- `-r, --limit-rate RATE`: Maximum download rate (e.g. `50K` or `4.2M`).
- `-c, --continue`: Resume partially downloaded files (default: enabled).
- `--no-continue`: Restart download from beginning.
- `--part`: Use `.part` files while downloading (default: enabled).
- `--no-part`: Write directly to destination file without temporary extension.
- `--concurrent-fragments N`: Number of fragments of a dash/hls stream to download concurrently (e.g. `5`).

*Example:*
```bash
yt-dlp --limit-rate 3M --concurrent-fragments 4 "URL"
```

### 7.6 Filesystem Options
- `-P, --paths [TYPES:]PATH`: Target directory for output files (e.g. `-P "C:\Downloads"`).
- `--windows-filenames`: Force filenames to be strictly Windows-compatible.
- `--restrict-filenames`: Restrict filenames to ASCII characters and avoid spaces/ampersands.
- `--no-overwrites`: Do not overwrite existing files.
- `-w, --no-continue`: Overwrite existing files.
- `--download-archive FILE`: Record video IDs in a file; skip items already recorded.

*Example:*
```bash
yt-dlp -P "D:\Media" --download-archive archive.txt --windows-filenames "URL"
```

### 7.7 Thumbnail Options
- `--write-thumbnail`: Write thumbnail image to disk.
- `--write-all-thumbnails`: Write all available thumbnail formats.
- `--convert-thumbnails FORMAT`: Convert thumbnail to `jpg`, `png`, or `webp` (requires FFmpeg).

*Example:*
```bash
yt-dlp --write-thumbnail --convert-thumbnails jpg "URL"
```

### 7.8 Internet Shortcut Options
- `--write-link`: Write an Internet shortcut (`.url` on Windows).
- `--write-url-link`: Write `.url` file.
- `--write-webloc-link`: Write `.webloc` file (macOS).
- `--write-desktop-link`: Write `.desktop` file (Linux).

*Example:*
```bash
yt-dlp --write-link "URL"
```

### 7.9 Video Format Options
- `-f, --format FORMAT`: Video format specification.
- `-S, --format-sort SORTORDER`: Sort formats before selection.
- `--check-formats`: Validate that formats are downloadable.
- `--prefer-free-formats`: Prefer free video formats (e.g. VP9, Opus) over proprietary ones.
- `--merge-output-format FORMAT`: Target container (`mp4`, `mkv`, `webm`).

*Example:*
```bash
yt-dlp -f "bv*[height<=1080]+ba/b" --merge-output-format mp4 "URL"
```

### 7.10 Subtitle Options
- `--write-subs`: Write subtitle file to disk.
- `--write-auto-subs`: Write automatically generated subtitle file.
- `--sub-langs REGEX`: Subtitle languages to download (e.g. `"en.*,es"`).
- `--sub-format FORMAT`: Subtitle format (`srt`, `vtt`, `ass`).
- `--embed-subs`: Embed subtitles into the video container (requires FFmpeg).

*Example:*
```bash
yt-dlp --write-subs --write-auto-subs --sub-langs "en.*" --embed-subs "URL"
```

### 7.11 Authentication Options
- `-u, --username USER`: Login username.
- `-p, --password PASS`: Login password.
- `-2, --twofactor CODE`: Two-factor authentication code.
- `--video-password PASS`: Video access password.
- `--netrc`: Use `.netrc` authentication file.
- `--cookies FILE`: Read netscape-formatted cookies file.
- `--cookies-from-browser BROWSER[+KEYRING][:PROFILE][::CONTAINER]`: Extract cookies directly from browser profile (`chrome`, `firefox`, `edge`, `brave`, `vivaldi`, `safari`).

*Example:*
```bash
yt-dlp --cookies-from-browser chrome "https://www.instagram.com/reel/C12345678/"
```

### 7.12 Post-Processing Options
- `-x, --extract-audio`: Convert video file to audio-only (requires FFmpeg).
- `--audio-format FORMAT`: Specify audio format (`mp3`, `m4a`, `flac`, `wav`, `opus`, `aac`, `vorbis`).
- `--audio-quality QUALITY`: Audio quality: 0 (best) to 9 (worst) for VBR, or specific bitrate like `320K`.
- `--remux-video FORMAT`: Remux video into another container without re-encoding.
- `--recode-video FORMAT`: Re-encode video to target format.
- `--embed-metadata`: Embed title, artist, date into container tags.
- `--embed-thumbnail`: Embed thumbnail into audio or video container.
- `--embed-chapters`: Embed chapter markers into video file.
- `--split-chapters`: Split video into multiple files based on internal chapters.

*Example:*
```bash
yt-dlp -x --audio-format mp3 --audio-quality 320K --embed-metadata --embed-thumbnail "URL"
```

### 7.13 SponsorBlock Options
- `--sponsorblock-mark CATS`: Mark sponsor segments in chapters (e.g. `sponsor,intro,outro`).
- `--sponsorblock-remove CATS`: Cut out and remove specified segments using FFmpeg.
- `--sponsorblock-api URL`: SponsorBlock API instance URL (default: `https://sponsor.ajay.app`).

*Example:*
```bash
yt-dlp --sponsorblock-remove sponsor,selfpromo,interaction "URL"
```

### 7.14 Extractor Options
- `--extractor-args KEY:ARGS`: Pass custom arguments to specific extractors (e.g. `youtube:player_client=android`).
- `--flat-playlist`: Extract playlist items without resolving each individual video.
- `--no-flat-playlist`: Fully resolve each playlist video entry.

*Example:*
```bash
yt-dlp --flat-playlist -j "https://www.youtube.com/playlist?list=PL12345"
```

---

## 8. Common Recipes

### 1. YouTube: Best 1080p MP4 with Subtitles & Metadata
```bash
yt-dlp -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]" \
  --merge-output-format mp4 \
  --write-subs --sub-langs "en.*" --embed-subs \
  --embed-metadata --embed-thumbnail \
  -o "%(title)s.%(ext)s" "URL"
```

### 2. YouTube: Audio MP3 320kbps with Album Art & ID3 Tags
```bash
yt-dlp -x --audio-format mp3 --audio-quality 320K \
  --embed-metadata --embed-thumbnail \
  -o "%(artist,uploader)s - %(title)s.%(ext)s" "URL"
```

### 3. YouTube: High-Resolution Lossless FLAC Audio
```bash
yt-dlp -f "ba" -x --audio-format flac \
  --embed-metadata --embed-thumbnail \
  -o "%(uploader)s/%(title)s.%(ext)s" "URL"
```

### 4. YouTube: Download Full Playlist with Resume Archive
```bash
yt-dlp --yes-playlist --download-archive downloaded_archive.txt \
  -o "%(playlist)s/%(playlist_index)03d - %(title)s.%(ext)s" "PLAYLIST_URL"
```

### 5. YouTube: Download Latest 10 Videos from a Channel
```bash
yt-dlp -I 1:10 -o "%(uploader)s/%(upload_date>%Y-%m-%d)s - %(title)s.%(ext)s" \
  "https://www.youtube.com/@ChannelName/videos"
```

### 6. YouTube: Split Video by Chapters into Separate Files
```bash
yt-dlp --split-chapters -o "chapter:%(title)s - %(section_number)02d %(section_title)s.%(ext)s" "URL"
```

### 7. YouTube: Cut Out Ads & Sponsored Segments Automatically
```bash
yt-dlp --sponsorblock-remove sponsor,intro,outro,interaction "URL"
```

### 8. Instagram: Download Public Reel
```bash
yt-dlp --cookies-from-browser chrome -o "instagram/%(id)s.%(ext)s" "https://www.instagram.com/reel/Cxxxxxxxxx/"
```

### 9. Instagram: Download User Profile Posts & Carousels
```bash
yt-dlp --cookies-from-browser chrome -o "instagram/%(uploader)s/%(upload_date)s_%(id)s.%(ext)s" "https://www.instagram.com/username/"
```

### 10. TikTok: Download High-Quality Video Without Watermark
```bash
yt-dlp -o "tiktok/%(uploader)s_%(id)s.%(ext)s" "https://www.tiktok.com/@user/video/1234567890123456789"
```

### 11. Twitter / X: Download Video from Tweet
```bash
yt-dlp -o "twitter/%(uploader)s_%(id)s.%(ext)s" "https://twitter.com/user/status/1234567890123456789"
```

### 12. Twitch: Download Full VOD (Video on Demand)
```bash
yt-dlp -o "twitch/%(uploader)s_%(upload_date)s_%(title)s.%(ext)s" "https://www.twitch.tv/videos/1234567890"
```

### 13. Twitch: Capture Live Stream from the Beginning
```bash
yt-dlp --live-from-start -o "twitch_live/%(uploader)s_%(upload_date)s.%(ext)s" "https://www.twitch.tv/channel"
```

### 14. Reddit: Download Video with Audio Track Merged
```bash
yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "reddit/%(title)s.%(ext)s" "https://www.reddit.com/r/videos/comments/..."
```

### 15. SoundCloud: Download High-Quality Audio Track
```bash
yt-dlp -x --audio-format mp3 -o "soundcloud/%(uploader)s - %(title)s.%(ext)s" "https://soundcloud.com/artist/track"
```

### 16. Batch Download URLs from File
```bash
yt-dlp -a urls.txt --download-archive archive.txt -P "C:\Media\Batch"
```

### 17. Inspect Metadata as Formatted JSON (Dry Run)
```bash
yt-dlp -j --no-playlist "URL"
```

### 18. Download Age-Restricted Content via Chrome Session
```bash
yt-dlp --cookies-from-browser chrome "AGE_RESTRICTED_URL"
```

---

## 9. Post-Processing Pipeline

yt-dlp processes media through an ordered multi-stage pipeline:

```
[Extractor Phase] -> [Download Streams Phase] -> [Post-Processor Chain] -> [Final Output]
```

### Pipeline Execution Order
1. **URL Resolution & Extractor**: Determines format availability and metadata.
2. **Stream Download**: Fetches video, audio, fragments, subtitles, thumbnails.
3. **Stream Merger**: If separate video and audio streams were fetched, FFmpeg merges them into a single container.
4. **Post-Processors**:
   - `ExtractAudio`: Converts video to target audio format (`-x`).
   - `RemuxVideo` / `RecodeVideo`: Repackages or transcodes video stream.
   - `SponsorBlock`: Queries SponsorBlock API and removes unwanted segments.
   - `EmbedSubtitle`: Muxes `.srt`/`.vtt` subtitles into container.
   - `EmbedThumbnail`: Adds cover art.
   - `Metadata`: Writes ID3 / MP4 tags (`--embed-metadata`).
   - `SplitChapters`: Splits media into individual files.
5. **Exec Hooks**: Runs custom post-download shell commands (`--exec CMD`).

### Custom Post-Processor Arguments
Pass raw options directly to underlying FFmpeg:
```bash
yt-dlp --postprocessor-args "ffmpeg:-af loudnorm" "URL"
```

---

## 10. Troubleshooting

| Error Message | Probable Cause | Recommended Resolution |
|---|---|---|
| `ffmpeg not found` | FFmpeg is not installed or not in system PATH | Install FFmpeg or point to executable using `--ffmpeg-location <path>` |
| `Sign in to confirm you’re not a bot` | Anti-bot challenge or age verification required | Use `--cookies-from-browser chrome` or `--cookies cookies.txt` |
| `HTTP Error 429: Too Many Requests` | IP rate limit imposed by server | Add `--sleep-interval 5` or route traffic via `--proxy <proxy_url>` |
| `Video unavailable` | Region locked or content removed | Check with `--geo-bypass-country US` or inspect URL in browser |
| `Unable to extract player response` | Video player structure changed | Update yt-dlp using `yt-dlp -U` |
| `No video formats found` | Live stream not ready or DRM protected | Verify URL; try `--ignore-no-formats-error` |
| `Requested format is not available` | Specified format ID does not exist | Run `yt-dlp -F URL` to inspect active format IDs |
| `ERROR: Unsupported URL` | Site is not in supported extractor registry | Run `yt-dlp --list-extractors \| grep -i <site>` |
| Slow download speed | Platform throttling single-stream downloads | Use `--concurrent-fragments 5` or external downloader `--downloader aria2c` |
| `[download] Resuming` infinite loop | Corrupted `.part` temporary file | Delete the `.part` file in target directory and re-run |

---

## 11. Using with ytdeck-mcp (Optional)

When the `ytdeck-mcp` server is running (either via stdio in an AI workspace or via HTTP SSE on `http://127.0.0.1:7531`), agents can use structured MCP tools instead of constructing raw shell commands:

### MCP Tools Roster
1. `download`: Spawn asynchronous background download job.
2. `get_job_status`: Poll real-time download percentage, speed, ETA, output path.
3. `cancel_job`: Terminate running process tree.
4. `list_jobs`: List active, completed, or failed downloads.
5. `fetch_info`: Retrieve JSON metadata object.
6. `fetch_formats`: Retrieve parsed formats and raw table.
7. `fetch_thumbnails`: Retrieve array of thumbnails.
8. `search`: Search YouTube/SoundCloud for media items.
9. `check_dependency`: Verify availability of `yt-dlp`, `ffmpeg`, `ffprobe`, etc.
10. `get_supported_sites`: Retrieve paginated list of supported extractors.
11. `build_command`: Dry-run CLI args builder.
12. `update_ytdlp`: Execute `yt-dlp -U`.

### Graceful Fallback
If the MCP server is not registered in your tool context, fall back to executing yt-dlp CLI commands directly using the options documented in **Sections 7 and 8**.
