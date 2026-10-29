import React, { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  Trash2,
  Folder,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  HardDrive,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { useHistoryStore, HistoryEntry } from '../../stores/historyStore'
import { useDownloadStore } from '../../stores/downloadStore'
import { formatFilesize, formatDuration } from '../../lib/format-utils'
import { buildArgs } from '../../lib/ytdlp-args'

type SortField = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'size-desc' | 'duration-desc'

interface HistoryPageProps {
  onRedownload?: (entry: HistoryEntry) => void
  onNavigateToDownload?: () => void
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onRedownload,
  onNavigateToDownload,
}) => {
  const entries = useHistoryStore((s) => s.entries)
  const removeEntry = useHistoryStore((s) => s.removeEntry)
  const clearHistory = useHistoryStore((s) => s.clearHistory)
  const addJob = useDownloadStore((s) => s.addJob)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date-desc')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // 1. Filter by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase().trim()
    return entries.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.url && e.url.toLowerCase().includes(q)) ||
        (e.uploader && e.uploader.toLowerCase().includes(q))
    )
  }, [entries, searchQuery])

  // 2. Sort filtered entries
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries]
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.downloadedAt || 0).getTime()
      const timeB = new Date(b.timestamp || b.downloadedAt || 0).getTime()

      switch (sortField) {
        case 'date-desc':
          return timeB - timeA
        case 'date-asc':
          return timeA - timeB
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '')
        case 'size-desc':
          return (b.filesize || 0) - (a.filesize || 0)
        case 'duration-desc':
          return (b.duration || 0) - (a.duration || 0)
        default:
          return timeB - timeA
      }
    })
    return list
  }, [filteredEntries, sortField])

  // 3. Date grouping (Today, Yesterday, Earlier)
  const groupedEntries = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

    const groups: {
      today: HistoryEntry[]
      yesterday: HistoryEntry[]
      thisWeek: HistoryEntry[]
      earlier: HistoryEntry[]
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    }

    for (const item of sortedEntries) {
      const itemTime = new Date(item.timestamp || item.downloadedAt || 0).getTime()
      if (itemTime >= todayStart) {
        groups.today.push(item)
      } else if (itemTime >= yesterdayStart) {
        groups.yesterday.push(item)
      } else if (itemTime >= weekStart) {
        groups.thisWeek.push(item)
      } else {
        groups.earlier.push(item)
      }
    }

    return groups
  }, [sortedEntries])

  // Handlers
  const handleOpenFolder = async (outputPath?: string) => {
    if (!outputPath) return
    try {
      const lastSlash = Math.max(outputPath.lastIndexOf('/'), outputPath.lastIndexOf('\\'))
      const folderPath = lastSlash !== -1 ? outputPath.substring(0, lastSlash) : outputPath
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_path', { path: folderPath })
    } catch (e) {
      console.warn('Failed to open folder:', e)
    }
  }

  const handleReDownload = async (entry: HistoryEntry) => {
    if (onRedownload) {
      onRedownload(entry)
      return
    }

    // Default re-download flow
    const jobId = `job-${Date.now()}`
    const job = {
      id: jobId,
      url: entry.url,
      title: entry.title,
      status: 'downloading' as const,
      progress: 0,
      startedAt: Date.now(),
      cliArgs: [],
    }
    addJob(job)

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const args = buildArgs({ urls: [entry.url], ...(entry.options || {}) })
      await invoke('spawn_ytdlp', { jobId, args })
    } catch (e) {
      console.warn('spawn_ytdlp redownload failed:', e)
    }

    if (onNavigateToDownload) {
      onNavigateToDownload()
    }
  }

  const renderGroupSection = (title: string, items: HistoryEntry[]) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{title}</span>
          <span className="text-[10px] text-neutral-500 font-mono">({items.length})</span>
        </div>

        <div className="space-y-2">
          {items.map((entry) => {
            const isSuccess = entry.status === 'completed' || entry.status === 'done'
            const formattedDate = new Date(entry.timestamp || entry.downloadedAt || Date.now()).toLocaleTimeString(
              [],
              { hour: '2-digit', minute: '2-digit' }
            )

            return (
              <div
                key={entry.id}
                className="bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 text-xs transition-colors"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                  <div className="w-14 h-9 rounded-md bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <FileVideo className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden flex-1 min-w-0">
                    <div
                      className="font-semibold text-neutral-200 truncate hover:text-white transition-colors"
                      title={entry.title || entry.url}
                    >
                      {entry.title || entry.url}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
                      {entry.uploader && (
                        <span className="truncate max-w-[140px] text-neutral-300">
                          {entry.uploader}
                        </span>
                      )}
                      <span className="text-neutral-600">•</span>
                      <span>{formattedDate}</span>
                      {entry.filesize !== undefined && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span>{formatFilesize(entry.filesize)}</span>
                        </>
                      )}
                      {entry.duration !== undefined && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span>{formatDuration(entry.duration)}</span>
                        </>
                      )}
                      {entry.format_id && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span className="bg-neutral-800 px-1 py-0.2 rounded text-[10px]">
                            {entry.format_id}
                          </span>
                        </>
                      )}
                    </div>

                    {entry.error && (
                      <div className="text-[11px] text-rose-400 truncate max-w-md" title={entry.error}>
                        {entry.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status badge & Action buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  {/* Status badge */}
                  {isSuccess ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                      <AlertCircle className="w-3 h-3" />
                      <span>Error</span>
                    </span>
                  )}

                  {/* Actions */}
                  {entry.outputPath && isSuccess && (
                    <button
                      onClick={() => handleOpenFolder(entry.outputPath)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Open destination folder"
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleReDownload(entry)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-indigo-900/60 text-neutral-300 hover:text-indigo-300 transition-colors"
                    title="Re-download this video"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 transition-colors"
                    title="Delete from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-text text-neutral-200">
      {/* Top Header & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100">Download History</h1>
          <p className="text-xs text-neutral-500">
            {entries.length} recorded item{entries.length === 1 ? '' : 's'} (FIFO capped at 500)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, uploader, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="pl-3 pr-7 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 appearance-none font-mono cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="size-desc">Largest Size</option>
              <option value="duration-desc">Longest Duration</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear All button */}
          {entries.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-neutral-800 hover:border-rose-900/60 bg-neutral-900 hover:bg-rose-950/30 text-neutral-400 hover:text-rose-300 text-xs transition-colors"
              title="Clear all download history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {entries.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-2xl p-12 text-center space-y-3 bg-neutral-950/40">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-neutral-300">No download history yet</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Completed and failed download jobs will automatically be recorded here.
            </p>
          </div>
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-2xl p-8 text-center space-y-2 bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium">No results matching "{searchQuery}"</div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-indigo-400 hover:underline"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroupSection('Today', groupedEntries.today)}
          {renderGroupSection('Yesterday', groupedEntries.yesterday)}
          {renderGroupSection('This Week', groupedEntries.thisWeek)}
          {renderGroupSection('Earlier', groupedEntries.earlier)}
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Clear Download History?</h3>
                <p className="text-neutral-400 mt-1">
                  This will remove all {entries.length} items from your history log. Downloaded files on disk will not be deleted.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory()
                  setShowClearConfirm(false)
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
