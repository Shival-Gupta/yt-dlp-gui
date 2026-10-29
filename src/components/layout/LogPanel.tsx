import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronDown,
  Trash2,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { YtdlpOutputEvent } from '../../types/ipc'

interface LogEntry {
  id: string
  jobId: string
  line: string
  isStderr: boolean
  stream: string
  timestamp: string
}

interface LogPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export const LogPanel: React.FC<LogPanelProps> = ({ isOpen, onToggle }) => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Listen to Tauri `ytdlp-output` event
  useEffect(() => {
    let unlisten: (() => void) | undefined

    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen<YtdlpOutputEvent>('ytdlp-output', (event) => {
          const payload = event.payload
          const now = new Date().toLocaleTimeString()
          setLogs((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              jobId: payload.job_id,
              line: payload.line,
              isStderr: payload.is_stderr,
              stream: payload.stream,
              timestamp: now,
            },
          ])
        })
      } catch {
        // Outside Tauri runtime (e.g. browser test)
      }
    }

    setupListener()
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll, isOpen])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30
    setAutoScroll(isAtBottom)
  }

  const handleCopyAll = async () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.line}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleClear = () => {
    setLogs([])
  }

  const filteredLogs = filterText
    ? logs.filter((l) => l.line.toLowerCase().includes(filterText.toLowerCase()))
    : logs

  const getLineColor = (line: string, isStderr: boolean) => {
    if (isStderr || line.includes('ERROR') || line.toLowerCase().includes('error:')) {
      return 'text-rose-400 bg-rose-950/20'
    }
    if (line.startsWith('[download]')) {
      return 'text-sky-300'
    }
    if (line.startsWith('[info]')) {
      return 'text-neutral-300'
    }
    if (line.startsWith('[warning]') || line.includes('WARNING')) {
      return 'text-amber-400'
    }
    if (line.startsWith('[ExtractAudio]') || line.startsWith('[Merger]')) {
      return 'text-emerald-400'
    }
    return 'text-neutral-300'
  }

  if (!isOpen) return null

  return (
    <div
      className={`w-full bg-neutral-950 border-t border-neutral-800 flex flex-col transition-all duration-200 z-30 select-text ${
        isExpanded ? 'h-80' : 'h-36'
      }`}
    >
      {/* Log Header Controls */}
      <div className="h-8 bg-neutral-900/90 border-b border-neutral-800 px-3 flex items-center justify-between select-none text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-neutral-300">Console Log</span>
          <span className="text-[10px] text-neutral-500 font-mono">({filteredLogs.length} lines)</span>
          {!autoScroll && (
            <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.2 rounded font-medium">
              Scroll Paused
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Search box */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 absolute left-1.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-neutral-800 text-[11px] text-neutral-200 pl-5 pr-2 py-0.5 rounded border border-neutral-700 focus:outline-none focus:border-indigo-500 w-28 placeholder:text-neutral-500"
            />
          </div>

          <button
            onClick={handleCopyAll}
            title="Copy all logs"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleClear}
            title="Clear logs"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse height' : 'Expand height'}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggle}
            title="Close log panel"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log lines container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-neutral-600 italic select-none py-2 text-center text-xs">
            No console output yet. Downloads and sidecar logs will appear here.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`leading-relaxed px-1 py-0.5 rounded flex items-start space-x-2 ${getLineColor(
                log.line,
                log.isStderr
              )}`}
            >
              <span className="text-[10px] text-neutral-600 select-none shrink-0">
                {log.timestamp}
              </span>
              <span className="break-all whitespace-pre-wrap">{log.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
