import React, { useState, useEffect, useRef } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { NavTab } from './components/layout/Nav'
import { UrlInput } from './components/download/UrlInput'
import { DownloadQueue } from './components/download/DownloadQueue'
import { QueuePage } from './components/queue/QueuePage'
import { PresetsPage } from './components/presets/PresetsPage'
import { HistoryPage } from './components/history/HistoryPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { AboutPage } from './pages/AboutPage'
import { ShortcutsDialog } from './components/shared/ShortcutsDialog'
import { YtdlpUpdateModal } from './components/updater/YtdlpUpdateModal'
import { useDownloadStore } from './stores/downloadStore'
import { useQueueStore } from './stores/queueStore'
import { useSettingsStore, applyTheme } from './stores/settingsStore'
import { useHistoryStore } from './stores/historyStore'
import { useUpdateCheck } from './hooks/useUpdateCheck'
import { useShortcuts } from './hooks/useShortcuts'
import { YtdlpDoneEvent } from './types/ipc'
import { isValidUrl } from './hooks/useVideoInfo'
import { UploadCloud, CheckCircle2 } from 'lucide-react'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('download')
  const [isDragging, setIsDragging] = useState(false)
  const [dropFeedback, setDropFeedback] = useState<string | null>(null)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isYtdlpModalOpen, setIsYtdlpModalOpen] = useState(false)
  const dragCounterRef = useRef(0)

  const theme = useSettingsStore((s) => s.theme)
  const notifyOnComplete = useSettingsStore((s) => s.notifyOnComplete)
  const notifyOnError = useSettingsStore((s) => s.notifyOnError)

  const updateJob = useDownloadStore((s) => s.updateJob)
  const getJob = useDownloadStore((s) => s.getJob)
  const jobs = useDownloadStore((s) => s.jobs)
  const addQueueUrls = useQueueStore((s) => s.addUrls)
  const addHistoryEntry = useHistoryStore((s) => s.addEntry)

  // Initialize OBS-style update check hook
  useUpdateCheck()

  // Apply theme on mount and when theme setting changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Global keyboard shortcuts
  useShortcuts({
    onNavigateTab: (tab) => setActiveTab(tab),
    onCloseDialog: () => {
      setIsShortcutsOpen(false)
      setIsYtdlpModalOpen(false)
    },
    onToggleShortcutsHelp: () => setIsShortcutsOpen((prev) => !prev),
    onCheckYtdlpUpdate: () => setIsYtdlpModalOpen(true),
  })

  // Global listener for `ytdlp-done` (handles state, history recording, and toast notifications)
  useEffect(() => {
    let unlisten: (() => void) | undefined

    const setupDoneListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen<YtdlpDoneEvent>('ytdlp-done', async (event) => {
          const { job_id, exit_code, success, error_message } = event.payload
          const existingJob = getJob(job_id)

          updateJob(job_id, {
            status: success ? 'done' : 'error',
            progress: success ? 100 : undefined,
            error: error_message || (success ? undefined : `Exited with code ${exit_code}`),
            finishedAt: Date.now(),
          })

          // Record in persistent history buffer
          addHistoryEntry({
            id: job_id,
            url: existingJob?.url || '',
            title: existingJob?.title || existingJob?.url || 'Download Job',
            uploader: existingJob?.uploader,
            duration: existingJob?.duration,
            thumbnail: existingJob?.thumbnail,
            outputPath: existingJob?.outputPath,
            filesize: existingJob?.filesize,
            timestamp: new Date().toISOString(),
            downloadedAt: Date.now(),
            status: success ? 'completed' : 'error',
            error: error_message || (success ? undefined : `Exited with code ${exit_code}`),
          })

          // Toast notifications via tauri-plugin-notification
          if (success && notifyOnComplete) {
            try {
              const { sendNotification } = await import('@tauri-apps/plugin-notification')
              sendNotification({
                title: 'Download Completed',
                body: `${existingJob?.title || existingJob?.url || 'Media download finished successfully.'}`,
              })
            } catch {
              // Notifications not supported or denied
            }
          } else if (!success && notifyOnError) {
            try {
              const { sendNotification } = await import('@tauri-apps/plugin-notification')
              sendNotification({
                title: 'Download Failed',
                body: `${existingJob?.title || existingJob?.url || 'Download error'}: ${error_message || 'Exited with error'}`,
              })
            } catch {
              // Notifications not supported or denied
            }
          }
        })
      } catch {
        // Outside Tauri runtime
      }
    }

    setupDoneListener()
    return () => {
      if (unlisten) unlisten()
    }
  }, [updateJob, getJob, addHistoryEntry, notifyOnComplete, notifyOnError])

  // System Tray 2-second dynamic update ticker and tray events
  useEffect(() => {
    let unlistenPause: (() => void) | undefined
    let unlistenResume: (() => void) | undefined

    const setupTrayListeners = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlistenPause = await listen('tray-pause-all', async () => {
          // Pause all active jobs
          for (const [id, job] of Object.entries(jobs)) {
            if (job.status === 'downloading') {
              updateJob(id, { status: 'paused' })
              try {
                const { invoke } = await import('@tauri-apps/api/core')
                await invoke('pause_download', { jobId: id })
              } catch {}
            }
          }
        })

        unlistenResume = await listen('tray-resume-all', async () => {
          // Resume all paused jobs
          for (const [id, job] of Object.entries(jobs)) {
            if (job.status === 'paused') {
              updateJob(id, { status: 'downloading' })
              try {
                const { invoke } = await import('@tauri-apps/api/core')
                await invoke('resume_download', { jobId: id })
              } catch {}
            }
          }
        })
      } catch {}
    }

    setupTrayListeners()

    const ticker = setInterval(async () => {
      try {
        const activeList = Object.values(jobs).filter(
          (j) => j.status === 'downloading' || j.status === 'processing'
        )
        const currentSpeed = activeList.find((j) => j.speed)?.speed || undefined
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('update_tray_status', {
          activeCount: activeList.length,
          speed: currentSpeed,
        })
      } catch {
        // Outside Tauri or update_tray_status unavailable
      }
    }, 2000)

    return () => {
      clearInterval(ticker)
      if (unlistenPause) unlistenPause()
      if (unlistenResume) unlistenResume()
    }
  }, [jobs, updateJob])

  // Window drag and drop listener for URLs and .txt files
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current += 1
      if (e.dataTransfer && e.dataTransfer.types.length > 0) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current -= 1
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)

      const extractedUrls: string[] = []

      // 1. Check for files (e.g. .txt files)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i]
          if (file.name.endsWith('.txt') || file.type === 'text/plain') {
            try {
              const text = await file.text()
              const lines = text
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l.length > 0 && !l.startsWith('#'))
              for (const line of lines) {
                if (isValidUrl(line)) {
                  extractedUrls.push(line)
                }
              }
            } catch (fileErr) {
              console.warn('Error reading dropped file:', fileErr)
            }
          }
        }
      }

      // 2. Check for text or url transfer data
      if (e.dataTransfer) {
        const textData =
          e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
        if (textData) {
          const lines = textData
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0 && !l.startsWith('#'))
          for (const line of lines) {
            if (isValidUrl(line)) {
              extractedUrls.push(line)
            }
          }
        }
      }

      if (extractedUrls.length > 0) {
        addQueueUrls(extractedUrls)
        setDropFeedback(`Added ${extractedUrls.length} URL(s) to download queue.`)
        setTimeout(() => setDropFeedback(null), 3500)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [addQueueUrls])

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenShortcuts={() => setIsShortcutsOpen(true)}
    >
      {/* Drop feedback banner */}
      {dropFeedback && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{dropFeedback}</span>
        </div>
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-8 pointer-events-none select-none">
          <div className="border-2 border-dashed border-indigo-500 bg-indigo-950/20 rounded-3xl p-12 max-w-lg w-full flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-900/60 border border-indigo-500/50 flex items-center justify-center text-indigo-400 animate-pulse">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Drop URLs or .txt file here</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                URLs will automatically be parsed and added to your download queue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'download' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <UrlInput />
          <DownloadQueue />
        </div>
      )}

      {activeTab === 'queue' && <QueuePage />}

      {activeTab === 'history' && (
        <HistoryPage onNavigateToDownload={() => setActiveTab('download')} />
      )}

      {activeTab === 'presets' && <PresetsPage />}

      {activeTab === 'settings' && <SettingsPage />}

      {activeTab === 'about' && <AboutPage />}

      {/* Shortcuts Reference Dialog */}
      <ShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* yt-dlp Update Modal */}
      <YtdlpUpdateModal
        isOpen={isYtdlpModalOpen}
        onClose={() => setIsYtdlpModalOpen(false)}
      />
    </AppLayout>
  )
}
