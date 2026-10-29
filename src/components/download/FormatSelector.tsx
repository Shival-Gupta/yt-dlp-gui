import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Music,
  Video,
  Layers,
  Search,
  ArrowUpDown,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
} from 'lucide-react'
import { YtdlpFormat, YtdlpOptions } from '../../types/ytdlp'
import { parseFFormats, formatFilesize } from '../../lib/format-utils'

interface FormatSelectorProps {
  url?: string
  currentFormat?: string
  onSelectFormat: (formatString: string, optionsPartial?: Partial<YtdlpOptions>) => void
}

type SortField = 'formatId' | 'resolution' | 'fps' | 'filesize' | 'ext'
type SortOrder = 'asc' | 'desc'
type TypeFilter = 'all' | 'video' | 'audio' | 'combined'

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  url,
  currentFormat = '',
  onSelectFormat,
}) => {
  const [formats, setFormats] = useState<YtdlpFormat[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState<boolean>(false)

  const [customFormat, setCustomFormat] = useState<string>(currentFormat)
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortField, setSortField] = useState<SortField>('resolution')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Fetch formats via Tauri IPC
  const fetchFormats = async () => {
    const targetUrl = url?.trim()
    if (!targetUrl) {
      setError('Please enter a valid URL first.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let rawResult: any
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        rawResult = await invoke('fetch_formats', { url: targetUrl })
      } catch (ipcErr: any) {
        throw new Error(ipcErr?.message || String(ipcErr) || 'Failed to fetch formats')
      }

      let parsedFormats: YtdlpFormat[] = []
      if (typeof rawResult === 'string') {
        parsedFormats = parseFFormats(rawResult)
      } else if (Array.isArray(rawResult)) {
        parsedFormats = rawResult.map((f: any) => ({
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
      }

      setFormats(parsedFormats)
      setHasFetched(true)
    } catch (err: any) {
      setError(err?.message || 'Error fetching format list')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick preset button handlers
  const handleQuickBest = () => {
    const val = 'bv*+ba/b'
    setCustomFormat(val)
    onSelectFormat(val, {
      formatSelector: val,
      extractAudio: false,
    })
  }

  const handleQuickAudioOnly = () => {
    const val = 'ba/b[acodec!=none]'
    setCustomFormat(val)
    onSelectFormat(val, {
      formatSelector: val,
      extractAudio: true,
      audioFormat: 'mp3',
    })
  }

  const handleCustomApply = () => {
    if (customFormat.trim()) {
      onSelectFormat(customFormat.trim(), {
        formatSelector: customFormat.trim(),
      })
    }
  }

  // Row selection handler
  const handleSelectRow = (fmt: YtdlpFormat) => {
    let selector = fmt.formatId
    const isAudioOnly = fmt.resolution === 'audio only' || fmt.vcodec === 'none'
    if (isAudioOnly) {
      setCustomFormat(selector)
      onSelectFormat(selector, {
        formatSelector: selector,
        extractAudio: true,
      })
    } else {
      // If it's video only, combine with best audio
      if (fmt.acodec === 'none') {
        selector = `${fmt.formatId}+ba/b`
      }
      setCustomFormat(selector)
      onSelectFormat(selector, {
        formatSelector: selector,
        extractAudio: false,
      })
    }
  }

  // Classify format stream type
  const getFormatType = (fmt: YtdlpFormat): 'video' | 'audio' | 'combined' => {
    const isAudioOnly =
      fmt.resolution === 'audio only' ||
      fmt.vcodec === 'none' ||
      (fmt.note && fmt.note.includes('audio only'))
    if (isAudioOnly) return 'audio'

    const isVideoOnly =
      fmt.acodec === 'none' ||
      (fmt.note && fmt.note.includes('video only'))
    if (isVideoOnly) return 'video'

    return 'combined'
  }

  // Quality badge renderer
  const renderQualityBadge = (fmt: YtdlpFormat) => {
    const res = fmt.resolution || ''
    if (res.includes('3840') || res.includes('2160') || res.toLowerCase().includes('4k')) {
      return (
        <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60">
          4K
        </span>
      )
    }
    if (res.includes('1920') || res.includes('1080') || res.toLowerCase().includes('1080p')) {
      return (
        <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60">
          1080p
        </span>
      )
    }
    if (res.includes('1280') || res.includes('720') || res.toLowerCase().includes('720p')) {
      return (
        <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-yellow-950/80 text-yellow-300 border border-yellow-800/60">
          720p
        </span>
      )
    }
    if (res.includes('854') || res.includes('480') || res.toLowerCase().includes('480p')) {
      return (
        <span className="px-1.5 py-0.2 rounded font-medium text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700">
          480p
        </span>
      )
    }
    if (res === 'audio only' || fmt.vcodec === 'none') {
      return (
        <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
          Audio
        </span>
      )
    }
    return null
  }

  // Filter & sort formats
  const displayFormats = useMemo(() => {
    let result = [...formats]

    if (typeFilter !== 'all') {
      result = result.filter((fmt) => getFormatType(fmt) === typeFilter)
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim()
      result = result.filter(
        (fmt) =>
          fmt.formatId.toLowerCase().includes(q) ||
          fmt.ext.toLowerCase().includes(q) ||
          (fmt.resolution && fmt.resolution.toLowerCase().includes(q)) ||
          (fmt.vcodec && fmt.vcodec.toLowerCase().includes(q)) ||
          (fmt.acodec && fmt.acodec.toLowerCase().includes(q)) ||
          (fmt.note && fmt.note.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      let valA: any
      let valB: any

      switch (sortField) {
        case 'formatId':
          valA = a.formatId
          valB = b.formatId
          break
        case 'ext':
          valA = a.ext
          valB = b.ext
          break
        case 'fps':
          valA = a.fps || 0
          valB = b.fps || 0
          break
        case 'filesize':
          valA = a.filesize || 0
          valB = b.filesize || 0
          break
        case 'resolution':
        default:
          valA = a.resolution || ''
          valB = b.resolution || ''
          break
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [formats, typeFilter, searchFilter, sortField, sortOrder])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 shadow-sm space-y-4 text-xs select-text">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-neutral-200">Format & Quality Selector</h3>
          </div>
          <p className="text-[11px] text-neutral-500">
            Probe available streams or choose quick presets.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleQuickBest}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              customFormat === 'bv*+ba/b'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Best Video + Audio</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAudioOnly}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              customFormat.includes('ba/b')
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio Only</span>
          </button>

          <button
            type="button"
            onClick={fetchFormats}
            disabled={isLoading || !url?.trim()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isLoading ? 'Probing...' : 'Fetch Formats'}</span>
          </button>
        </div>
      </div>

      {/* Manual format selector input */}
      <div className="flex items-center space-x-2">
        <label className="text-[11px] font-medium text-neutral-400 shrink-0">
          Format String (-f):
        </label>
        <input
          type="text"
          value={customFormat}
          onChange={(e) => setCustomFormat(e.target.value)}
          placeholder="e.g. bv*+ba/b, 137+140, or ba/b"
          className="flex-1 bg-neutral-950 font-mono text-xs text-neutral-200 border border-neutral-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={handleCustomApply}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2 py-4 animate-pulse">
          <div className="h-6 bg-neutral-800/60 rounded w-full" />
          <div className="h-8 bg-neutral-800/40 rounded w-full" />
          <div className="h-8 bg-neutral-800/40 rounded w-full" />
          <div className="h-8 bg-neutral-800/40 rounded w-full" />
          <div className="h-8 bg-neutral-800/40 rounded w-full" />
        </div>
      )}

      {/* Format Table & Filtering */}
      {hasFetched && !isLoading && formats.length > 0 && (
        <div className="space-y-3 pt-1">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 w-fit">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                All ({formats.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('video')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                  typeFilter === 'video' ? 'bg-neutral-800 text-blue-300' : 'text-neutral-400'
                }`}
              >
                <Video className="w-3 h-3 text-blue-400" />
                <span>Video Only</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('audio')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                  typeFilter === 'audio' ? 'bg-neutral-800 text-emerald-300' : 'text-neutral-400'
                }`}
              >
                <Music className="w-3 h-3 text-emerald-400" />
                <span>Audio Only</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('combined')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                  typeFilter === 'combined' ? 'bg-neutral-800 text-purple-300' : 'text-neutral-400'
                }`}
              >
                <Layers className="w-3 h-3 text-purple-400" />
                <span>Combined</span>
              </button>
            </div>

            {/* Table Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search codecs, res..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="max-h-64 overflow-y-auto border border-neutral-800 rounded-lg scrollbar-thin">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] sticky top-0 border-b border-neutral-800 z-10">
                <tr>
                  <th
                    className="p-2 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('formatId')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('ext')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ext</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('resolution')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Resolution</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('fps')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>FPS</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="p-2">Codec</th>
                  <th
                    className="p-2 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('filesize')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Size</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="p-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {displayFormats.map((fmt) => {
                  const type = getFormatType(fmt)
                  const isSelected =
                    customFormat === fmt.formatId ||
                    customFormat.startsWith(`${fmt.formatId}+`)

                  // Row background styling: video-only (blue tint), audio-only (green tint), combined (purple tint)
                  let rowBg = 'hover:bg-neutral-800/50'
                  if (type === 'video') rowBg = 'bg-blue-950/20 hover:bg-blue-950/40 text-blue-100'
                  else if (type === 'audio')
                    rowBg = 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-100'
                  else if (type === 'combined')
                    rowBg = 'bg-purple-950/20 hover:bg-purple-950/40 text-purple-100'

                  return (
                    <tr
                      key={fmt.formatId}
                      onClick={() => handleSelectRow(fmt)}
                      className={`cursor-pointer transition-colors ${rowBg} ${
                        isSelected ? 'ring-1 ring-indigo-500 bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="p-2 font-bold text-neutral-200">
                        <div className="flex items-center space-x-1.5">
                          {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                          <span>{fmt.formatId}</span>
                        </div>
                      </td>
                      <td className="p-2 text-neutral-300">{fmt.ext}</td>
                      <td className="p-2">
                        <div className="flex items-center space-x-1.5">
                          <span>{fmt.resolution || '--'}</span>
                          {renderQualityBadge(fmt)}
                        </div>
                      </td>
                      <td className="p-2 text-neutral-400">{fmt.fps || '--'}</td>
                      <td className="p-2 text-[11px] text-neutral-400">
                        {fmt.vcodec !== 'none' && fmt.vcodec
                          ? fmt.vcodec
                          : fmt.acodec !== 'none' && fmt.acodec
                          ? fmt.acodec
                          : '--'}
                      </td>
                      <td className="p-2 text-neutral-300">
                        {fmt.filesize ? formatFilesize(fmt.filesize) : '--'}
                      </td>
                      <td className="p-2 text-[10px] text-neutral-500 truncate max-w-[150px]">
                        {fmt.note || '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
