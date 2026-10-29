import React, { useState, useMemo } from 'react'
import {
  ListOrdered,
  Pause,
  Play,
  Trash2,
  XCircle,
  Search,
  Filter,
  Inbox,
} from 'lucide-react'
import { useDownloadStore } from '../../stores/downloadStore'
import { useQueueStore } from '../../stores/queueStore'
import { ProgressCard } from '../download/ProgressCard'
import { DownloadJob } from '../../types/ytdlp'

type FilterTab = 'all' | 'active' | 'queued' | 'done' | 'errors'

export const QueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const jobsMap = useDownloadStore((s) => s.jobs)
  const clearFinished = useDownloadStore((s) => s.clearFinished)
  const updateJob = useDownloadStore((s) => s.updateJob)
  const queueItems = useQueueStore((s) => s.items)
  const removeQueueItem = useQueueStore((s) => s.removeItem)
  const clearQueue = useQueueStore((s) => s.clearQueue)

  const allJobs = Object.values(jobsMap)

  // Categorize jobs
  const activeJobs = useMemo(
    () => allJobs.filter((j) => j.status === 'downloading' || j.status === 'processing'),
    [allJobs]
  )
  const queuedJobs = useMemo(
    () => allJobs.filter((j) => j.status === 'queued' || j.status === 'paused'),
    [allJobs]
  )
  const doneJobs = useMemo(() => allJobs.filter((j) => j.status === 'done'), [allJobs])
  const errorJobs = useMemo(
    () => allJobs.filter((j) => j.status === 'error' || j.status === 'cancelled'),
    [allJobs]
  )

  // Filter jobs based on activeTab
  const filteredJobs = useMemo(() => {
    let list: DownloadJob[] = []
    switch (activeTab) {
      case 'active':
        list = activeJobs
        break
      case 'queued':
        list = queuedJobs
        break
      case 'done':
        list = doneJobs
        break
      case 'errors':
        list = errorJobs
        break
      case 'all':
      default:
        list = allJobs
        break
    }

    if (!searchQuery.trim()) return list

    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (j) =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        j.url.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q)
    )
  }, [activeTab, searchQuery, allJobs, activeJobs, queuedJobs, doneJobs, errorJobs])

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
    const paused = allJobs.filter((j) => j.status === 'paused')
    for (const job of paused) {
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
    <div className="max-w-5xl mx-auto space-y-5 text-xs select-text">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <ListOrdered className="w-5 h-5 text-indigo-400" />
            <span>Download Queue Dashboard</span>
          </h1>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            Monitor, prioritize, and manage live download jobs and pending URLs.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {activeJobs.length > 0 && (
            <button
              type="button"
              onClick={handlePauseAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause All</span>
            </button>
          )}

          {allJobs.some((j) => j.status === 'paused') && (
            <button
              type="button"
              onClick={handleResumeAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-200 font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400 fill-current" />
              <span>Resume All</span>
            </button>
          )}

          {(activeJobs.length > 0 || queuedJobs.length > 0) && (
            <button
              type="button"
              onClick={handleCancelAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 font-medium transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel All</span>
            </button>
          )}

          {(doneJobs.length > 0 || errorJobs.length > 0) && (
            <button
              type="button"
              onClick={clearFinished}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Finished</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] bg-neutral-700/60 text-neutral-300 px-1.5 rounded-full">
              {allJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Active</span>
            <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 rounded-full font-bold">
              {activeJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queued')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'queued'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Queued</span>
            <span className="text-[10px] bg-neutral-700/60 text-neutral-300 px-1.5 rounded-full">
              {queuedJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('done')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'done'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Done</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 rounded-full">
              {doneJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'errors'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Errors</span>
            <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 rounded-full">
              {errorJobs.length}
            </span>
          </button>
        </div>

        {/* Search filter input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, URL or ID..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>
      </div>

      {/* Main Jobs Listing */}
      {filteredJobs.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-2 bg-neutral-950/30">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-1">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="font-semibold text-neutral-300">No jobs in this view</div>
          <p className="text-neutral-500 text-[11px] max-w-sm">
            {searchQuery
              ? `No download matched "${searchQuery}". Clear your search query to see all items.`
              : `There are currently no items matching the "${activeTab}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <ProgressCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pending Raw Queue Items (from queueStore) if any */}
      {queueItems.length > 0 && (
        <div className="mt-8 pt-4 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-neutral-300 flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span>Pending URL Queue ({queueItems.length})</span>
            </div>
            <button
              type="button"
              onClick={clearQueue}
              className="text-neutral-500 hover:text-rose-400 transition-colors text-[11px]"
            >
              Clear Pending
            </button>
          </div>

          <div className="space-y-1.5">
            {queueItems.map((item, idx) => (
              <div
                key={item.id}
                className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="font-mono text-neutral-500 w-6">#{idx + 1}</span>
                  <span className="font-mono text-neutral-300 truncate">{item.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeQueueItem(item.id)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors"
                  title="Remove from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
