export interface ProgressEvent {
  status: 'downloading' | 'finished' | 'error'
  downloaded: number
  total: number
  speed: number
  eta: number
  filename: string
  percent: number // computed: (downloaded / total) * 100
}

/**
 * Parses a line of yt-dlp output to detect progress.
 * Supports both JSON formatted output (from --progress-template)
 * and fallback parsing of standard yt-dlp `[download]` progress strings.
 */
export function parseProgressLine(line: string): ProgressEvent | null {
  if (!line || typeof line !== 'string') return null
  const trimmed = line.trim()
  if (!trimmed) return null

  // 1. Try parsing JSON progress output
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed)
      if (data && (data.downloaded !== undefined || data.total !== undefined || data.status)) {
        const downloaded = Number(data.downloaded) || 0
        const total = Number(data.total) || 0
        const speed = Number(data.speed) || 0
        const eta = Number(data.eta) || 0
        const filename = String(data.filename || '')
        const status = data.status === 'finished' ? 'finished' : (data.status === 'error' ? 'error' : 'downloading')
        const percent = total > 0 ? Math.min(100, Math.max(0, (downloaded / total) * 100)) : (Number(data.percent) || 0)

        return {
          status,
          downloaded,
          total,
          speed,
          eta,
          filename,
          percent: Math.round(percent * 10) / 10,
        }
      }
    } catch {
      // not valid JSON, proceed to regex fallback
    }
  }

  // 2. Standard [download] line fallback:
  // e.g.: [download]  45.2% of ~  50.00MiB at  2.50MiB/s ETA 00:11
  // or:   [download] 100% of 12.34MiB in 00:02
  if (trimmed.startsWith('[download]')) {
    const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)%/)
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1])

      // Parse speed
      let speed = 0
      const speedMatch = trimmed.match(/at\s+([~0-9.]+)\s*([kKmMgG]i?B\/s)/)
      if (speedMatch) {
        const val = parseFloat(speedMatch[1].replace('~', ''))
        const unit = speedMatch[2].toLowerCase()
        if (unit.startsWith('g')) speed = val * 1024 * 1024 * 1024
        else if (unit.startsWith('m')) speed = val * 1024 * 1024
        else if (unit.startsWith('k')) speed = val * 1024
        else speed = val
      }

      // Parse ETA
      let eta = 0
      const etaMatch = trimmed.match(/ETA\s+(\d+):(\d+)(?::(\d+))?/)
      if (etaMatch) {
        if (etaMatch[3] !== undefined) {
          eta = parseInt(etaMatch[1], 10) * 3600 + parseInt(etaMatch[2], 10) * 60 + parseInt(etaMatch[3], 10)
        } else {
          eta = parseInt(etaMatch[1], 10) * 60 + parseInt(etaMatch[2], 10)
        }
      }

      // Parse total size
      let total = 0
      const totalMatch = trimmed.match(/of\s+~?\s*([0-9.]+)\s*([kKmMgG]i?B)/)
      if (totalMatch) {
        const val = parseFloat(totalMatch[1])
        const unit = totalMatch[2].toLowerCase()
        if (unit.startsWith('g')) total = val * 1024 * 1024 * 1024
        else if (unit.startsWith('m')) total = val * 1024 * 1024
        else if (unit.startsWith('k')) total = val * 1024
        else total = val
      }

      const downloaded = total > 0 ? (percent / 100) * total : 0
      const status = percent >= 100 ? 'finished' : 'downloading'

      return {
        status,
        downloaded: Math.round(downloaded),
        total: Math.round(total),
        speed: Math.round(speed),
        eta,
        filename: '',
        percent,
      }
    }
  }

  return null
}
