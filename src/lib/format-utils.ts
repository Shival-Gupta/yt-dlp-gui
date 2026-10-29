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

    // Format lines start with ID (alphanumeric/hyphens)
    // E.g.: "249 webm audio only 2 │ 1.54MiB 51k https │ audio only opus [51k]"
    // or: "137 mp4 1920x1080 30 │ 120.34MiB 4500k https │ avc1.640028 4500k video only"
    const tokens = trimmed.split(/\s+/)
    if (tokens.length < 2) continue

    const formatId = tokens[0]
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
