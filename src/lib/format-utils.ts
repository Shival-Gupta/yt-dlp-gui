import { YtdlpFormat } from '../types/ytdlp'

/**
 * Formats a byte count into a human-readable string (e.g. "450.5 MB", "1.2 GB").
 */
export function formatFilesize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const idx = Math.min(i, units.length - 1)
  const val = bytes / Math.pow(k, idx)

  return `${val >= 100 || idx === 0 ? Math.round(val) : val.toFixed(1)} ${units[idx]}`
}

/**
 * Formats a speed in bytes per second into human-readable string (e.g. "2.4 MB/s").
 */
export function formatSpeed(bps?: number): string {
  if (bps === undefined || bps === null || isNaN(bps) || bps <= 0) {
    return '0 KB/s'
  }
  return `${formatFilesize(bps)}/s`
}

/**
 * Formats seconds into MM:SS or HH:MM:SS.
 */
export function formatEta(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return '--:--'
  }

  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }
  return `${pad(m)}:${pad(s)}`
}

/**
 * Formats duration in seconds into MM:SS or HH:MM:SS.
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return '0:00'
  }
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`
  }
  return `${m}:${pad(s)}`
}

/**
 * Determines whether a codec string represents video, audio, both, or unknown.
 */
export function getCodecBadge(codec?: string): 'video' | 'audio' | 'av' | 'unknown' {
  if (!codec || codec === 'none') return 'unknown'
  const c = codec.toLowerCase()

  const isAudio = c.includes('mp4a') || c.includes('aac') || c.includes('opus') || c.includes('mp3') || c.includes('vorbis') || c.includes('flac')
  const isVideo = c.includes('avc') || c.includes('h264') || c.includes('hev') || c.includes('h265') || c.includes('vp9') || c.includes('av01') || c.includes('vp8')

  if (isVideo && isAudio) return 'av'
  if (isVideo) return 'video'
  if (isAudio) return 'audio'
  return 'unknown'
}

/**
 * Generates a clean human-readable quality badge label from format metadata.
 */
export function qualityLabel(format: YtdlpFormat): string {
  const parts: string[] = []

  if (format.resolution) {
    parts.push(format.resolution)
  }

  if (format.fps && format.fps > 30) {
    parts.push(`${format.fps}fps`)
  }

  if (format.vcodec && format.vcodec !== 'none') {
    if (format.vcodec.toLowerCase().includes('av01')) parts.push('AV1')
    else if (format.vcodec.toLowerCase().includes('vp9')) parts.push('VP9')
    else if (format.vcodec.toLowerCase().includes('hev')) parts.push('HEVC')
  }

  if (parts.length === 0) {
    if (format.acodec && format.acodec !== 'none') {
      return `Audio (${format.ext})`
    }
    return format.formatId || 'Unknown'
  }

  return parts.join(' ')
}

/**
 * Parses raw table output from `yt-dlp -F <url>` into structured `YtdlpFormat` array.
 */
export function parseFFormats(rawText: string): YtdlpFormat[] {
  if (!rawText) return []
  const lines = rawText.split('\n')
  const formats: YtdlpFormat[] = []

  // Look for header line separator (e.g. "ID EXT RESOLUTION FPS CH │ FILESIZE TBR PROTO │ VCODEC VBR ACODEC ABR")
  let headerSeen = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('ID') && trimmed.includes('EXT')) {
      headerSeen = true
      continue
    }

    if (trimmed.startsWith('---') || trimmed.startsWith('───')) {
      headerSeen = true
      continue
    }

    if (!headerSeen) continue

    // Discard non-format lines (warnings, errors, download progress, logs, comments)
    if (
      trimmed.startsWith('WARNING:') ||
      trimmed.startsWith('ERROR:') ||
      trimmed.startsWith('[') ||
      trimmed.startsWith('Note:') ||
      trimmed.startsWith('Deleting')
    ) {
      continue
    }

    const tokens = trimmed.split(/\s+/)
    if (tokens.length < 2) continue

    const formatId = tokens[0]
    if (formatId.endsWith(':') || formatId.startsWith('[') || formatId.startsWith('(')) {
      continue
    }
    const ext = tokens[1]

    let resolution: string | undefined
    let fps: number | undefined
    let filesize: number | undefined
    let tbr: number | undefined
    let vcodec: string | undefined
    let acodec: string | undefined

    // Find resolution (e.g. 1920x1080 or "audio only")
    const resMatch = trimmed.match(/\b(\d+x\d+)\b/)
    if (resMatch) {
      resolution = resMatch[1]
    } else if (trimmed.includes('audio only')) {
      resolution = 'audio only'
    }

    // Find FPS (e.g. 30, 60)
    const fpsMatch = trimmed.match(/\b(\d{2})\s*(?:fps)?\b/)
    if (fpsMatch && resolution !== 'audio only') {
      fps = parseInt(fpsMatch[1], 10)
    }

    // Find filesize (e.g. ~ 45.2MiB or 12.5MiB)
    const sizeMatch = trimmed.match(/([~0-9.]+)\s*([kKmMgG]i?B)/)
    if (sizeMatch) {
      const val = parseFloat(sizeMatch[1].replace('~', ''))
      const unit = sizeMatch[2].toLowerCase()
      if (unit.startsWith('g')) filesize = Math.round(val * 1024 * 1024 * 1024)
      else if (unit.startsWith('m')) filesize = Math.round(val * 1024 * 1024)
      else if (unit.startsWith('k')) filesize = Math.round(val * 1024)
      else filesize = Math.round(val)
    }

    // Codecs
    if (trimmed.includes('video only')) {
      acodec = 'none'
      vcodec = 'video'
    } else if (trimmed.includes('audio only')) {
      vcodec = 'none'
      acodec = 'audio'
    }

    formats.push({
      formatId,
      ext,
      resolution,
      fps,
      filesize,
      tbr,
      vcodec,
      acodec,
      note: trimmed,
    })
  }

  return formats
}

export interface ParsedFormatRow {
  format_id: string
  ext: string
  resolution: string
  fps?: number | null
  tbr?: number | null
  vcodec?: string
  acodec?: string
  filesize?: number | null
  note?: string
  isVideoOnly?: boolean
  isAudioOnly?: boolean
  isCombined?: boolean
}

/**
 * Parses raw stdout table of yt-dlp -F <url> with column analysis and type categorization.
 */
export function parseFormatTable(rawOutput: string): ParsedFormatRow[] {
  const formats: ParsedFormatRow[] = []
  const lines = rawOutput.split(/\r?\n/)

  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('ID') && line.includes('EXT') && line.includes('RESOLUTION')) {
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    return formats
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i]
    if (!rawLine || rawLine.trim().length === 0) continue
    const trimmed = rawLine.trim()
    if (trimmed.startsWith('─') || trimmed.startsWith('-')) continue

    // Filter out trailing warnings, errors, download status, or info lines
    if (
      trimmed.startsWith('WARNING:') ||
      trimmed.startsWith('ERROR:') ||
      trimmed.startsWith('[') ||
      trimmed.startsWith('Note:') ||
      trimmed.startsWith('Deleting')
    ) {
      continue
    }

    const cleanLine = rawLine.replace(/│/g, ' ').replace(/\|/g, ' ')
    const parts = cleanLine.trim().split(/\s+/)
    if (parts.length < 3) continue

    const formatId = parts[0]
    if (formatId.endsWith(':') || formatId.startsWith('[') || formatId.startsWith('(')) {
      continue
    }
    const ext = parts[1]

    let resolution = parts[2]
    let fps: number | null = null
    let index = 3

    if (resolution === 'audio' && parts[3] === 'only') {
      resolution = 'audio only'
      index = 4
    }

    if (index < parts.length && /^\d+$/.test(parts[index]) && resolution !== 'audio only') {
      fps = parseInt(parts[index], 10)
      index++
    }

    const remaining = parts.slice(index).join(' ')
    const isAudioOnly = resolution === 'audio only' || remaining.includes('audio only')
    const isVideoOnly = remaining.includes('video only') && !isAudioOnly
    const isCombined = !isAudioOnly && !isVideoOnly && !remaining.includes('storyboard')

    const tbrMatch = remaining.match(/(\d+)[kK]/)
    const tbr = tbrMatch ? parseInt(tbrMatch[1], 10) : null

    let vcodec: string | undefined = undefined
    let acodec: string | undefined = undefined

    if (isAudioOnly) {
      vcodec = 'none'
      if (remaining.includes('opus')) acodec = 'opus'
      else if (remaining.includes('mp4a') || remaining.includes('m4a')) acodec = 'mp4a'
    } else if (isVideoOnly) {
      acodec = 'none'
      if (remaining.includes('avc1')) vcodec = 'avc1'
      else if (remaining.includes('vp9')) vcodec = 'vp9'
      else if (remaining.includes('av01')) vcodec = 'av01'
    } else if (isCombined) {
      if (remaining.includes('avc1')) vcodec = 'avc1'
      if (remaining.includes('mp4a')) acodec = 'mp4a'
    }

    formats.push({
      format_id: formatId,
      ext,
      resolution,
      fps,
      tbr,
      vcodec,
      acodec,
      note: remaining,
      isVideoOnly,
      isAudioOnly,
      isCombined,
    })
  }

  return formats
}
