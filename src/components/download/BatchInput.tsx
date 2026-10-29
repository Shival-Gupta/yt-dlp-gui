import React, { useState, useRef, useMemo } from 'react'
import {
  FileText,
  Upload,
  Clipboard,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  ListPlus,
} from 'lucide-react'
import { useQueueStore } from '../../stores/queueStore'
import { useDownloadStore } from '../../stores/downloadStore'
import { YtdlpOptions } from '../../types/ytdlp'
import { buildArgs } from '../../lib/ytdlp-args'

interface BatchInputProps {
  currentOptions?: Partial<YtdlpOptions>
  onClose?: () => void
  onSuccess?: () => void
}

type BatchTab = 'paste' | 'file'

export const BatchInput: React.FC<BatchInputProps> = ({
  currentOptions = {},
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<BatchTab>('paste')
  const [urlsText, setUrlsText] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addQueueUrls = useQueueStore((s) => s.addUrls)
  const addJob = useDownloadStore((s) => s.addJob)

  // Parse lines
  const parsedLines = useMemo(() => {
    return urlsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
  }, [urlsText])

  const { validUrls, invalidLines } = useMemo(() => {
    const valid: string[] = []
    const invalid: string[] = []

    for (const line of parsedLines) {
      if (
        line.startsWith('http://') ||
        line.startsWith('https://') ||
        line.startsWith('ytsearch:')
      ) {
        valid.push(line)
      } else {
        invalid.push(line)
      }
    }

    return { validUrls: valid, invalidLines: invalid }
  }, [parsedLines])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrlsText((prev) => (prev ? `${prev.trim()}\n${text.trim()}` : text.trim()))
      }
    } catch (err) {
      console.warn('Clipboard read error:', err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoadedFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setUrlsText(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (file) {
      setLoadedFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          setUrlsText(content)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleAddToQueue = () => {
    if (validUrls.length === 0) return
    addQueueUrls(validUrls)
    setUrlsText('')
    setLoadedFileName(null)
    if (onSuccess) onSuccess()
  }

  const handleStartAll = async () => {
    if (validUrls.length === 0) return
    setIsStarting(true)

    try {
      addQueueUrls(validUrls)

      for (const url of validUrls) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

        addJob({
          id: jobId,
          url,
          title: url,
          progress: 0,
          status: 'downloading',
          startedAt: Date.now(),
        })

        const args = buildArgs({
          ...currentOptions,
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
      setLoadedFileName(null)
      if (onSuccess) onSuccess()
      if (onClose) onClose()
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-sm space-y-4 text-xs select-text">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center space-x-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'paste'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste URLs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load .txt File</span>
          </button>
        </div>

        {urlsText && (
          <button
            type="button"
            onClick={() => {
              setUrlsText('')
              setLoadedFileName(null)
            }}
            className="flex items-center space-x-1 text-neutral-400 hover:text-rose-400 transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Tab: Paste URLs */}
      {activeTab === 'paste' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-neutral-400">
              Bulk URLs (one per line, comments starting with # ignored):
            </label>
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition-colors"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste Clipboard</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=...&#10;https://www.instagram.com/reel/...&#10;https://x.com/.../status/..."
            className="w-full bg-neutral-950 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 p-3 rounded-lg border border-neutral-800 focus:outline-none focus:border-indigo-500 resize-y min-h-[100px]"
          />
        </div>
      )}

      {/* Tab: Load File */}
      {activeTab === 'file' && (
        <div className="space-y-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-800 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/40 text-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-neutral-200">
                {loadedFileName ? loadedFileName : 'Click to select or drag & drop a .txt file'}
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Plain text file with one URL per line
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Validation status / stats */}
      {parsedLines.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 font-mono text-[11px]">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{validUrls.length} valid URLs</span>
            </span>
            {invalidLines.length > 0 && (
              <span className="flex items-center space-x-1 text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{invalidLines.length} invalid line(s) skipped</span>
              </span>
            )}
          </div>

          <span className="text-neutral-500">Total lines: {parsedLines.length}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-neutral-800">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleAddToQueue}
          disabled={validUrls.length === 0}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs disabled:opacity-50 transition-colors"
        >
          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add to Queue ({validUrls.length})</span>
        </button>

        <button
          type="button"
          onClick={handleStartAll}
          disabled={isStarting || validUrls.length === 0}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs disabled:opacity-50 transition-all shadow-md shadow-indigo-900/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isStarting ? 'Starting...' : `Start All (${validUrls.length})`}</span>
        </button>
      </div>
    </div>
  )
}
