import { useState, useEffect, useRef, useCallback } from 'react'
import { YtdlpInfo, YtdlpFormat } from '../types/ytdlp'

export interface UseVideoInfoResult {
  info: YtdlpInfo | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Normalizes raw yt-dlp json structure (snake_case) to frontend YtdlpInfo / YtdlpFormat
 */
export function normalizeVideoInfo(raw: any): YtdlpInfo {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid metadata object')
  }

  const rawFormats: any[] = Array.isArray(raw.formats) ? raw.formats : []
  const formats: YtdlpFormat[] = rawFormats.map((f: any) => ({
    formatId: String(f.format_id || f.formatId || ''),
    ext: String(f.ext || ''),
    resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : undefined),
    fps: typeof f.fps === 'number' ? f.fps : undefined,
    filesize: typeof f.filesize === 'number' ? f.filesize : f.filesize_approx,
    tbr: typeof f.tbr === 'number' ? f.tbr : undefined,
    vcodec: f.vcodec || undefined,
    acodec: f.acodec || undefined,
    note: f.format_note || f.note || undefined,
  }))

  return {
    id: String(raw.id || ''),
    title: String(raw.title || 'Untitled Video'),
    uploader: raw.uploader || raw.channel || undefined,
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
    thumbnail: raw.thumbnail || (Array.isArray(raw.thumbnails) && raw.thumbnails.length > 0 ? raw.thumbnails[raw.thumbnails.length - 1]?.url : undefined),
    formats,
    subtitles: raw.subtitles || undefined,
    automaticCaptions: raw.automatic_captions || raw.automaticCaptions || undefined,
  }
}

/**
 * Formats duration in seconds to "MM:SS" or "HH:MM:SS"
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return '--:--'
  }
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`
  }
  return `${pad(m)}:${pad(s)}`
}

/**
 * Validates whether string is a plausible video URL or search query
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('ytsearch:')
  )
}

/**
 * Debounced metadata probe hook that fetches video info via `fetch_info` IPC command.
 */
export function useVideoInfo(url: string, debounceMs: number = 800): UseVideoInfoResult {
  const [info, setInfo] = useState<YtdlpInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const activeUrlRef = useRef<string>(url)
  activeUrlRef.current = url

  const fetchInfo = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim()
    if (!trimmed || !isValidUrl(trimmed)) {
      setInfo(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let rawResult: any
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        rawResult = await invoke('fetch_info', { url: trimmed })
      } catch (ipcErr: any) {
        // Handle running outside Tauri or IPC failure
        throw new Error(ipcErr?.message || String(ipcErr) || 'Failed to fetch video information')
      }

      if (activeUrlRef.current !== targetUrl) return

      let parsed: any = rawResult
      if (typeof rawResult === 'string') {
        try {
          parsed = JSON.parse(rawResult)
        } catch {
          throw new Error('Invalid JSON response received from yt-dlp')
        }
      }

      const normalized = normalizeVideoInfo(parsed)
      setInfo(normalized)
      setError(null)
    } catch (err: any) {
      if (activeUrlRef.current === targetUrl) {
        setInfo(null)
        setError(err?.message || 'Error probing video information')
      }
    } finally {
      if (activeUrlRef.current === targetUrl) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const trimmed = url.trim()
    if (!trimmed || !isValidUrl(trimmed)) {
      setInfo(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const timer = setTimeout(() => {
      fetchInfo(trimmed)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [url, debounceMs, fetchInfo])

  const refetch = useCallback(() => {
    if (url.trim()) {
      fetchInfo(url.trim())
    }
  }, [url, fetchInfo])

  return { info, isLoading, error, refetch }
}
