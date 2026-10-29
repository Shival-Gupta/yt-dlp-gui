export interface ProgressEvent {
  status: 'downloading' | 'finished' | 'error'
  downloaded: number
  total: number
  speed?: number
  eta?: number
  filename: string
  percent: number // computed: (downloaded / total) * 100
  percentStr?: string
  downloadedBytes?: number
  totalBytes?: number
}

/**
 * Parses a line of yt-dlp output to detect progress.
 * Supports both JSON formatted output (from --progress-template)
 * and fallback parsing of standard yt-dlp `[download]` progress strings.
 * Handles ANSI color escape sequences, carriage returns, and extreme values.
 */
export function parseProgressLine(line: string): ProgressEvent | null {
  if (!line || typeof line !== 'string') return null

  // Strip ANSI escape sequences (colors, cursor positioning) and carriage returns
  const cleanLine = line.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '')
  const trimmed = cleanLine.trim()
  if (!trimmed) return null

  // 1. Try parsing JSON progress output
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed)
      if (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        (data.downloaded !== undefined ||
          data.downloaded_bytes !== undefined ||
          data.total !== undefined ||
          data.total_bytes !== undefined ||
          data.status)
      ) {
        const rawDownloaded = data.downloaded ?? data.downloaded_bytes
        const rawTotal = data.total ?? data.total_bytes
        const downloaded = rawDownloaded !== undefined ? Number(rawDownloaded) || 0 : 0
        const total = rawTotal !== undefined ? Number(rawTotal) || 0 : 0
        const speed = data.speed !== undefined ? Number(data.speed) : undefined
        const eta = data.eta !== undefined ? Number(data.eta) : undefined
        const filename = String(data.filename || '')
        const status =
          data.status === 'finished'
            ? 'finished'
            : data.status === 'error'
              ? 'error'
              : 'downloading'

        let percent = 0
        if (total > 0) {
          percent = Math.min(100, Math.max(0, (downloaded / total) * 100))
        } else if (data.percent !== undefined) {
          percent = Math.min(100, Math.max(0, Number(data.percent) || 0))
        } else if (data._percent_str) {
          percent = Math.min(100, Math.max(0, parseFloat(String(data._percent_str).replace('%', '')) || 0))
        }

        const percentStr =
          data._percent_str ||
          (data.status === 'finished' ? '100%' : `${Math.round(percent * 10) / 10}%`)

        return {
          status,
          downloaded,
          downloadedBytes: downloaded,
          total,
          totalBytes: total,
          speed,
          eta,
          filename,
          percent: Math.round(percent * 10) / 10,
          percentStr,
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
    if (trimmed.startsWith('[download] Destination:')) {
      return null
    }

    const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)%/)
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1])
      const percentStr = `${percentMatch[1]}%`

      // Parse speed
      let speed: number | undefined = undefined
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
      let eta: number | undefined = undefined
      const etaMatch = trimmed.match(/ETA\s+(\d+):(\d+)(?::(\d+))?/)
      if (etaMatch) {
        if (etaMatch[3] !== undefined) {
          eta =
            parseInt(etaMatch[1], 10) * 3600 +
            parseInt(etaMatch[2], 10) * 60 +
            parseInt(etaMatch[3], 10)
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
        downloadedBytes: Math.round(downloaded),
        total: Math.round(total),
        totalBytes: Math.round(total),
        speed: speed !== undefined ? Math.round(speed) : undefined,
        eta,
        filename: '',
        percent,
        percentStr,
      }
    }
  }

  return null
}
