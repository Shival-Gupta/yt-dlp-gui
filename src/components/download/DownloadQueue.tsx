import React from 'react'
import {
  Inbox,
  Trash2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Layers,
} from 'lucide-react'
import { JobStatus } from '../../types/ytdlp'
import { useDownloadStore } from '../../stores/downloadStore'
import { ProgressCard } from './ProgressCard'

function getStatusPriority(status: JobStatus): number {
  switch (status) {
    case 'downloading':
    case 'processing':
      return 1
    case 'paused':
      return 2
    case 'queued':
      return 3
    case 'error':
      return 4
    case 'done':
      return 5
    case 'cancelled':
      return 6
    default:
      return 7
  }
}

export const DownloadQueue: React.FC = () => {
  const jobsMap = useDownloadStore((s) => s.jobs)
  const clearFinished = useDownloadStore((s) => s.clearFinished)
  const updateJob = useDownloadStore((s) => s.updateJob)

  const allJobs = Object.values(jobsMap)

  // Sort: active first, then queued/paused, then completed/errors, newest first
  const sortedJobs = [...allJobs].sort((a, b) => {
    const pA = getStatusPriority(a.status)
    const pB = getStatusPriority(b.status)
    if (pA !== pB) return pA - pB
    return (b.startedAt || 0) - (a.startedAt || 0)
  })

  const activeJobs = allJobs.filter(
    (j) => j.status === 'downloading' || j.status === 'processing'
  )
  const pausedJobs = allJobs.filter((j) => j.status === 'paused')
  const finishedJobs = allJobs.filter(
    (j) => j.status === 'done' || j.status === 'error' || j.status === 'cancelled'
  )

  const handlePauseAll = async () => {
    for (const job of activeJobs) {
      updateJob(job.id, { status: 'paused' })
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('pause_download', { jobId: job.id })
      } catch {
        // Ignore
      }
    }
  }

  const handleResumeAll = async () => {
    for (const job of pausedJobs) {
      updateJob(job.id, { status: 'downloading' })
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('resume_download', { jobId: job.id })
      } catch {
        // Ignore
      }
    }
  }

  const handleCancelAll = async () => {
    const cancellable = allJobs.filter(
      (j) =>
        j.status === 'downloading' ||
        j.status === 'processing' ||
        j.status === 'paused' ||
        j.status === 'queued'
    )
    for (const job of cancellable) {
      updateJob(job.id, { status: 'cancelled' })
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('cancel_download', { jobId: job.id })
      } catch {
        // Ignore
      }
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Queue control bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Downloads & Queue ({allJobs.length})
          </h2>
          {activeJobs.length > 0 && (
            <span className="bg-indigo-950/80 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-800/60 font-medium">
              {activeJobs.length} active
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {activeJobs.length > 0 && (
            <button
              type="button"
              onClick={handlePauseAll}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Pause all active downloads"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause All</span>
            </button>
          )}

          {pausedJobs.length > 0 && (
            <button
              type="button"
              onClick={handleResumeAll}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-800/40 transition-colors"
              title="Resume all paused downloads"
            >
              <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Resume All</span>
            </button>
          )}

          {activeJobs.length > 0 && (
            <button
              type="button"
              onClick={handleCancelAll}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors"
              title="Cancel all active downloads"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel All</span>
            </button>
          )}

          {finishedJobs.length > 0 && (
            <button
              type="button"
              onClick={clearFinished}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              title="Clear completed and stopped downloads"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* List of jobs or empty state */}
      {sortedJobs.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-2 bg-neutral-950/30">
          <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-1">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="text-xs font-medium text-neutral-400">
            No active downloads in queue
          </div>
          <p className="text-[11px] text-neutral-600 max-w-sm">
            Enter a URL above or drop a link into the window to start downloading videos.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedJobs.map((job) => (
            <ProgressCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
