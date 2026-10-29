import React from 'react'
import {
  Play,
  Pause,
  X,
  RotateCcw,
  Folder,
  FileVideo,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react'
import { DownloadJob, JobStatus } from '../../types/ytdlp'
import { useDownloadStore } from '../../stores/downloadStore'
import { formatFilesize } from '../../lib/format-utils'
import { buildArgs } from '../../lib/ytdlp-args'
import { translateErrorMessage } from '../../lib/error-messages'

interface ProgressCardProps {
  job: DownloadJob
  onRemove?: (id: string) => void
  onRetry?: (job: DownloadJob) => void
}

/**
 * Extracts a concise domain or source label from a URL
 */
function getDomainFromUrl(url: string): string {
  if (!url) return 'Unknown'
  if (url.startsWith('ytsearch:')) return 'YouTube Search'
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 24)
  }
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ job, onRemove, onRetry }) => {
  const [showRawError, setShowRawError] = React.useState(false)
  const updateJob = useDownloadStore((s) => s.updateJob)
  const removeJob = useDownloadStore((s) => s.removeJob)
  const domain = getDomainFromUrl(job.url)

  const handlePause = async () => {
    updateJob(job.id, { status: 'paused' })
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('pause_download', { jobId: job.id })
    } catch (e) {
      console.warn('pause_download IPC failed:', e)
    }
  }

  const handleResume = async () => {
    updateJob(job.id, { status: 'downloading' })
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('resume_download', { jobId: job.id })
    } catch (e) {
      console.warn('resume_download IPC failed:', e)
    }
  }

  const handleCancel = async () => {
    updateJob(job.id, { status: 'cancelled' })
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('cancel_download', { jobId: job.id })
    } catch (e) {
      console.warn('cancel_download IPC failed:', e)
    }
  }

  const handleRetry = async () => {
    if (onRetry) {
      onRetry(job)
      return
    }

    updateJob(job.id, {
      status: 'downloading',
      progress: 0,
      error: undefined,
      speed: undefined,
      eta: undefined,
      startedAt: Date.now(),
      finishedAt: undefined,
    })

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const args = buildArgs({ urls: [job.url] })
      await invoke('spawn_ytdlp', {
        jobId: job.id,
        args,
      })
    } catch (e) {
      console.warn('spawn_ytdlp retry IPC failed:', e)
    }
  }

  const handleOpenFile = async () => {
    if (!job.outputPath) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_path', { path: job.outputPath })
    } catch (e) {
      console.warn('open_path file IPC failed:', e)
    }
  }

  const handleOpenFolder = async () => {
    if (!job.outputPath) return
    try {
      // Determine directory from output path
      const lastSlash = Math.max(job.outputPath.lastIndexOf('/'), job.outputPath.lastIndexOf('\\'))
      const folderPath = lastSlash !== -1 ? job.outputPath.substring(0, lastSlash) : job.outputPath
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_path', { path: folderPath })
    } catch (e) {
      console.warn('open_path folder IPC failed:', e)
    }
  }

  const handleDismiss = () => {
    if (onRemove) {
      onRemove(job.id)
    } else {
      removeJob(job.id)
    }
  }

  // Status badge styling
  const renderStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'downloading':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Downloading</span>
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        )
      case 'paused':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <Pause className="w-3 h-3" />
            <span>Paused</span>
          </span>
        )
      case 'done':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            <span>Done</span>
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            <AlertCircle className="w-3 h-3" />
            <span>Error</span>
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 line-through">
            <span>Cancelled</span>
          </span>
        )
      case 'queued':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
            <Clock className="w-3 h-3" />
            <span>Queued</span>
          </span>
        )
    }
  }

  const progressValue = Math.min(100, Math.max(0, job.progress || 0))

  return (
    <div className="w-full bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-3.5 shadow-sm space-y-3 transition-colors text-xs select-text">
      {/* Top row: Thumbnail/Icon, Title & Domain, Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
          {/* Thumbnail or Video Placeholder */}
          <div className="w-14 h-10 rounded-md bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative">
            <FileVideo className="w-5 h-5 text-neutral-600" />
          </div>

          {/* Title and Domain */}
          <div className="space-y-0.5 overflow-hidden flex-1 min-w-0">
            <div
              className="font-semibold text-neutral-200 truncate hover:text-white transition-colors"
              title={job.title || job.url}
            >
              {job.title || job.url}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
              <span className="bg-neutral-800/80 px-1.5 py-0.2 rounded text-neutral-300">
                {domain}
              </span>
              <span className="truncate max-w-xs text-neutral-500" title={job.url}>
                {job.url}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">{renderStatusBadge(job.status)}</div>
      </div>

      {/* Progress Bar (when downloading or processing or paused or done) */}
      <div className="space-y-1">
        <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              job.status === 'done'
                ? 'bg-emerald-500'
                : job.status === 'error'
                ? 'bg-rose-500'
                : job.status === 'paused'
                ? 'bg-amber-500'
                : job.status === 'cancelled'
                ? 'bg-neutral-600'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
            }`}
            style={{ width: `${progressValue}%` }}
          />
        </div>

        {/* Progress metrics row: percentage, speed, ETA, filesize */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-neutral-300">
              {progressValue.toFixed(1)}%
            </span>
            {job.speed && job.status === 'downloading' && (
              <span className="text-indigo-400">{job.speed}</span>
            )}
            {job.eta && job.status === 'downloading' && (
              <span className="text-neutral-500">ETA: {job.eta}</span>
            )}
            {job.filesize && (
              <span className="text-neutral-500">{formatFilesize(job.filesize)}</span>
            )}
          </div>

          {job.outputPath && job.status === 'done' && (
            <span
              className="text-[10px] text-neutral-500 truncate max-w-[200px]"
              title={job.outputPath}
            >
              {job.outputPath}
            </span>
          )}
        </div>
      </div>

      {/* Error Message banner with user-friendly translation & expandable details */}
      {job.error && job.status === 'error' && (() => {
        const translated = translateErrorMessage(job.error)
        return (
          <div className="space-y-1.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2 overflow-hidden">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 overflow-hidden">
                  <div className="font-semibold text-rose-200">{translated.userMessage}</div>
                  <div className="text-[11px] text-rose-300/80">{translated.suggestedAction}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRawError(!showRawError)}
                className="text-[10px] text-rose-400 hover:text-white underline shrink-0 font-mono"
              >
                {showRawError ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            {showRawError && (
              <div className="mt-1.5 p-2 bg-black/80 rounded border border-rose-950 font-mono text-[10px] text-neutral-300 select-text whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                {job.error}
              </div>
            )}
          </div>
        )
      })()}

      {/* Action Buttons row */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
        <div className="text-[10px] text-neutral-500 font-mono">
          ID: {job.id.slice(0, 14)}
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Pause / Resume */}
          {job.status === 'downloading' && (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Pause download"
            >
              <Pause className="w-3 h-3" />
              <span>Pause</span>
            </button>
          )}

          {job.status === 'paused' && (
            <button
              type="button"
              onClick={handleResume}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-300 hover:text-white transition-colors"
              title="Resume download"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {/* Cancel */}
          {(job.status === 'downloading' ||
            job.status === 'processing' ||
            job.status === 'paused' ||
            job.status === 'queued') && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors"
              title="Cancel download"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}

          {/* Retry */}
          {(job.status === 'error' || job.status === 'cancelled') && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-indigo-400 transition-colors"
              title="Retry download"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          {/* Open File / Folder (if done) */}
          {job.status === 'done' && job.outputPath && (
            <>
              <button
                type="button"
                onClick={handleOpenFile}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Open downloaded file"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open File</span>
              </button>
              <button
                type="button"
                onClick={handleOpenFolder}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Open destination folder"
              >
                <Folder className="w-3 h-3" />
                <span>Folder</span>
              </button>
            </>
          )}

          {/* Dismiss / Delete from list */}
          {(job.status === 'done' || job.status === 'error' || job.status === 'cancelled') && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-500 hover:text-rose-400 transition-colors"
              title="Dismiss job"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
