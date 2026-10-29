import { useEffect, useCallback } from 'react'
import { useUpdateStore } from '../stores/updateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { UpdateCheckResult, UpdateAvailableEvent, UpdateProgressEvent } from '../types/ipc'

export function useUpdateCheck() {
  const checkUpdatesOnStartup = useSettingsStore((s) => s.checkUpdatesOnStartup)
  const checkYtdlpUpdatesWeekly = useSettingsStore((s) => s.checkYtdlpUpdatesWeekly)

  const {
    appUpdate,
    ytdlpUpdate,
    isCheckingApp,
    isCheckingYtdlp,
    isDownloadingUpdate,
    downloadProgress,
    updateReadyToRestart,
    setAppUpdate,
    setYtdlpUpdate,
    setIsCheckingApp,
    setIsCheckingYtdlp,
    setIsDownloadingUpdate,
    setDownloadProgress,
    setUpdateReadyToRestart,
    setError,
    clearAppUpdate,
  } = useUpdateStore()

  // Manual or automatic app update check
  const checkAppUpdate = useCallback(
    async (isManual = false) => {
      setIsCheckingApp(true)
      setError(null)
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<UpdateCheckResult>('check_update')

        if (result.available && result.latest_version) {
          setAppUpdate({
            version: result.latest_version,
            notes: result.release_notes || 'New release available',
            pubDate: result.pub_date,
          })
        } else if (isManual) {
          // If manual check and no update found
          setAppUpdate(null)
        }
      } catch (err: any) {
        if (isManual) {
          setError(err?.message || 'Failed to check for updates')
        }
      } finally {
        setIsCheckingApp(false)
      }
    },
    [setIsCheckingApp, setError, setAppUpdate]
  )

  // yt-dlp version check
  const checkYtdlpUpdate = useCallback(
    async (_isManual = false) => {
      setIsCheckingYtdlp(true)
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const current = await invoke<string>('get_ytdlp_version').catch(() => '2026.10.26')

        // Fetch latest release tag from GitHub API
        let latest = current
        try {
          const resp = await fetch('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest', {
            headers: { Accept: 'application/vnd.github.v3+json' },
          })
          if (resp.ok) {
            const data = await resp.json()
            if (data.tag_name) {
              latest = data.tag_name
            }
          }
        } catch {
          // Offline fallback
        }

        setYtdlpUpdate({
          currentVersion: current,
          latestVersion: latest,
        })
      } catch (err) {
        console.warn('Failed to check yt-dlp update:', err)
      } finally {
        setIsCheckingYtdlp(false)
      }
    },
    [setIsCheckingYtdlp, setYtdlpUpdate]
  )

  // Download app update
  const startUpdateDownload = useCallback(async () => {
    setIsDownloadingUpdate(true)
    setDownloadProgress(0)
    setError(null)

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('download_update')
      setDownloadProgress(100)
      setUpdateReadyToRestart(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to download update')
      setIsDownloadingUpdate(false)
    }
  }, [setIsDownloadingUpdate, setDownloadProgress, setUpdateReadyToRestart, setError])

  // Install app update & restart
  const restartToInstallUpdate = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('install_update')
    } catch (err: any) {
      setError(err?.message || 'Failed to install update')
    }
  }, [setError])

  // Setup event listeners for Tauri updater progress and notifications
  useEffect(() => {
    let unlistenAvailable: (() => void) | undefined
    let unlistenProgress: (() => void) | undefined

    const registerListeners = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')

        unlistenAvailable = await listen<UpdateAvailableEvent>('update-available', (event) => {
          setAppUpdate({
            version: event.payload.version,
            notes: event.payload.notes,
            pubDate: event.payload.pub_date,
          })
        })

        unlistenProgress = await listen<UpdateProgressEvent>('update-progress', (event) => {
          const { downloaded_bytes, total_bytes } = event.payload
          if (total_bytes > 0) {
            const pct = Math.min(100, Math.round((downloaded_bytes / total_bytes) * 100))
            setDownloadProgress(pct)
            if (pct >= 100) {
              setUpdateReadyToRestart(true)
            }
          }
        })
      } catch {
        // Outside Tauri runtime
      }
    }

    registerListeners()

    return () => {
      if (unlistenAvailable) unlistenAvailable()
      if (unlistenProgress) unlistenProgress()
    }
  }, [setAppUpdate, setDownloadProgress, setUpdateReadyToRestart])

  // Run silent check on startup if enabled
  useEffect(() => {
    if (checkUpdatesOnStartup) {
      checkAppUpdate(false)
    }
    if (checkYtdlpUpdatesWeekly) {
      checkYtdlpUpdate(false)
    }
  }, [checkUpdatesOnStartup, checkYtdlpUpdatesWeekly, checkAppUpdate, checkYtdlpUpdate])

  return {
    appUpdate,
    ytdlpUpdate,
    isCheckingApp,
    isCheckingYtdlp,
    isDownloadingUpdate,
    downloadProgress,
    updateReadyToRestart,
    checkAppUpdate,
    checkYtdlpUpdate,
    startUpdateDownload,
    restartToInstallUpdate,
    clearAppUpdate,
  }
}
