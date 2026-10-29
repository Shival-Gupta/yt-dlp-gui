import React, { useState, useMemo } from 'react'
import {
  Clipboard,
  Play,
  Trash2,
  AlertCircle,
  CheckCircle2,
  User,
  Film,
  Layers,
  Sliders,
  FolderOpen,
  ListPlus,
  Loader2,
  X,
} from 'lucide-react'
import { useDownloadStore } from '../../stores/downloadStore'
import { useQueueStore } from '../../stores/queueStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { buildArgs } from '../../lib/ytdlp-args'
import { useVideoInfo, formatDuration, isValidUrl } from '../../hooks/useVideoInfo'
import { PresetSelector } from './PresetSelector'
import { FormatSelector } from './FormatSelector'
import { OutputConfig } from './OutputConfig'
import { CommandPreview } from './CommandPreview'
import { BatchInput } from './BatchInput'
import { YtdlpOptions } from '../../types/ytdlp'

export const UrlInput: React.FC = () => {
  const [urlsText, setUrlsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  // Sub-panel toggles
  const [showFormats, setShowFormats] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)

  // Download options state
  const defaultOutputDir = useSettingsStore((s) => s.defaultOutputDir)
  const [options, setOptions] = useState<Partial<YtdlpOptions>>({
    outputDir: defaultOutputDir || undefined,
    outputTemplate: '%(title)s.%(ext)s',
    formatSelector: 'bv*+ba/b',
  })

  const addJob = useDownloadStore((s) => s.addJob)
  const addQueueUrls = useQueueStore((s) => s.addUrls)

  // Split lines
  const lines = useMemo(() => {
    return urlsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  }, [urlsText])

  const singleUrl = lines.length === 1 && isValidUrl(lines[0]) ? lines[0] : ''

  // Debounced auto-preview hook
  const { info, isLoading: isProbing } = useVideoInfo(singleUrl, 800)

  // Validation badge logic
  const validationStatus = useMemo(() => {
    if (lines.length === 0) return null

    const invalid = lines.filter((url) => !isValidUrl(url))
    if (invalid.length > 0) {
      return {
        isValid: false,
        message: `Invalid URL format: "${invalid[0]}"`,
      }
    }

    if (lines.length === 1) {
      try {
        const hostname = new URL(lines[0]).hostname.replace(/^www\./, '')
        return {
          isValid: true,
          message: `Valid source: ${hostname}`,
        }
      } catch {
        return { isValid: true, message: 'Valid URL format' }
      }
    }

    return {
      isValid: true,
      message: `${lines.length} valid URLs entered`,
    }
  }, [lines])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrlsText((prev) => (prev ? `${prev.trim()}\n${text.trim()}` : text.trim()))
        setError(null)
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e)
    }
  }

  const handleClear = () => {
    setUrlsText('')
    setError(null)
  }

  const handleApplyPreset = (presetOptions: Partial<YtdlpOptions>) => {
    setOptions((prev) => ({
      ...prev,
      ...presetOptions,
    }))
  }

  const handleStartDownload = async () => {
    if (lines.length === 0) {
      setError('Please enter at least one URL.')
      return
    }

    if (validationStatus && !validationStatus.isValid) {
      setError(validationStatus.message)
      return
    }

    setError(null)
    setIsStarting(true)

    try {
      addQueueUrls(lines)

      for (const url of lines) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

        // Add to active jobs store with metadata if available
        addJob({
          id: jobId,
          url,
          title: (singleUrl === url && info?.title) ? info.title : url,
          progress: 0,
          status: 'downloading',
          startedAt: Date.now(),
        })

        // Build args and spawn
        const args = buildArgs({
          ...options,
          urls: [url],
        })

        try {
          const { invoke } = await import('@tauri-apps/api/core')
          await invoke('spawn_ytdlp', {
            jobId,
            args,
          })
        } catch (spawnErr) {
          console.warn('Tauri invoke error:', spawnErr)
        }
      }

      setUrlsText('')
    } finally {
      setIsStarting(false)
    }
  }

  const handleAddToQueueOnly = () => {
    if (lines.length === 0) {
      setError('Please enter at least one URL to add to queue.')
      return
    }

    if (validationStatus && !validationStatus.isValid) {
      setError(validationStatus.message)
      return
    }

    addQueueUrls(lines)
    setUrlsText('')
    setError(null)
  }

  return (
    <div className="w-full bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 shadow-sm space-y-4 text-xs select-text">
      {/* Top action row: Preset Selector & Utilities */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
        <PresetSelector currentOptions={options} onApplyPreset={handleApplyPreset} />

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Batch Mode</span>
          </button>

          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          {urlsText && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* URL Textarea Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="url-input" className="text-xs font-semibold text-neutral-300">
            Enter Video or Playlist URLs (one per line)
          </label>

          {/* Validation Badge */}
          {validationStatus && (
            <div
              className={`flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded ${
                validationStatus.isValid
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
              }`}
            >
              {validationStatus.isValid ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-rose-400" />
              )}
              <span>{validationStatus.message}</span>
            </div>
          )}
        </div>

        <textarea
          id="url-input"
          rows={lines.length > 2 ? 4 : 2}
          value={urlsText}
          onChange={(e) => {
            setUrlsText(e.target.value)
            if (error) setError(null)
          }}
          placeholder="https://www.youtube.com/watch?v=...&#10;https://www.instagram.com/reel/...&#10;https://x.com/.../status/..."
          className="w-full bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 font-mono text-xs p-3 rounded-lg border border-neutral-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[58px]"
        />
      </div>

      {/* Metadata Auto-Preview Card */}
      {singleUrl && (
        <div>
          {isProbing && (
            <div className="flex items-center space-x-2 p-2.5 bg-neutral-950/60 border border-neutral-800 rounded-lg text-neutral-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Fetching video metadata preview...</span>
            </div>
          )}

          {info && !isProbing && (
            <div className="flex items-center space-x-3.5 p-3 bg-neutral-950/90 border border-neutral-800 rounded-xl shadow-inner">
              {/* Thumbnail */}
              <div className="w-24 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                {info.thumbnail ? (
                  <img
                    src={info.thumbnail}
                    alt={info.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Film className="w-6 h-6 text-neutral-600" />
                )}
                {info.duration !== undefined && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                    {formatDuration(info.duration)}
                  </span>
                )}
              </div>

              {/* Info Details */}
              <div className="space-y-1 overflow-hidden flex-1 min-w-0">
                <div className="font-semibold text-neutral-200 text-xs truncate" title={info.title}>
                  {info.title}
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
                  {info.uploader && (
                    <span className="flex items-center space-x-1 truncate">
                      <User className="w-3 h-3 text-neutral-500" />
                      <span className="truncate">{info.uploader}</span>
                    </span>
                  )}
                  {info.formats && info.formats.length > 0 && (
                    <span className="bg-neutral-800 px-1.5 py-0.2 rounded text-[10px] text-neutral-300 shrink-0">
                      {info.formats.length} formats
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Collapsible Format & Output Config Triggers */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowFormats((prev) => !prev)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showFormats
              ? 'bg-neutral-800 text-white'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Format & Quality</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOutput((prev) => !prev)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showOutput
              ? 'bg-neutral-800 text-white'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Output & Filename</span>
        </button>
      </div>

      {/* Format Selector Expanded View */}
      {showFormats && (
        <FormatSelector
          url={singleUrl || (lines.length > 0 ? lines[0] : '')}
          currentFormat={options.formatSelector || ''}
          onSelectFormat={(formatStr, extraOpts) => {
            setOptions((prev) => ({
              ...prev,
              ...extraOpts,
              formatSelector: formatStr,
            }))
          }}
        />
      )}

      {/* Output Config Expanded View */}
      {showOutput && (
        <OutputConfig
          outputDir={options.outputDir || ''}
          outputTemplate={options.outputTemplate || '%(title)s.%(ext)s'}
          options={options}
          onChangeOutputDir={(dir) => setOptions((prev) => ({ ...prev, outputDir: dir }))}
          onChangeOutputTemplate={(tmpl) =>
            setOptions((prev) => ({ ...prev, outputTemplate: tmpl }))
          }
          onOptionsChange={(updates) => setOptions((prev) => ({ ...prev, ...updates }))}
        />
      )}

      {/* Live Command Preview */}
      <CommandPreview options={options} urls={lines} />

      {/* Action Buttons: Add to Queue & Start Download */}
      <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-neutral-800/80">
        <button
          type="button"
          onClick={handleAddToQueueOnly}
          disabled={lines.length === 0}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs disabled:opacity-50 transition-colors"
        >
          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add to Queue</span>
        </button>

        <button
          type="button"
          onClick={handleStartDownload}
          disabled={isStarting || lines.length === 0}
          className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isStarting ? 'Starting...' : 'Start Download'}</span>
        </button>
      </div>

      {/* Batch Input Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-800 bg-neutral-950">
              <span className="font-semibold text-neutral-200 text-sm">Batch URL Downloader</span>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <BatchInput
                currentOptions={options}
                onClose={() => setShowBatchModal(false)}
                onSuccess={() => setShowBatchModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
