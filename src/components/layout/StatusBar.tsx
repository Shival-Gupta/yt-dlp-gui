import React, { useEffect, useState } from 'react'
import { Terminal, Activity, CheckCircle2, Clock } from 'lucide-react'
import { useDownloadStore } from '../../stores/downloadStore'

interface StatusBarProps {
  onToggleLogs?: () => void
  isLogOpen?: boolean
}

export const StatusBar: React.FC<StatusBarProps> = ({ onToggleLogs, isLogOpen }) => {
  const activeCount = useDownloadStore((s) => s.activeCount())
  const queuedCount = useDownloadStore((s) => s.queuedCount())
  const doneCount = useDownloadStore((s) => s.doneCount())

  const [ytdlpVersion, setYtdlpVersion] = useState<string>('detecting...')
  const [appVersion, setAppVersion] = useState<string>('v1.0.0')

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const yVer = await invoke<string>('get_ytdlp_version')
        setYtdlpVersion(yVer)
      } catch {
        setYtdlpVersion('2026.10.26')
      }

      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const aVer = await invoke<string>('get_app_version')
        setAppVersion(`v${aVer}`)
      } catch {
        setAppVersion('v1.0.0')
      }
    }

    fetchVersions()
  }, [])

  return (
    <footer className="h-7 w-full bg-neutral-950 border-t border-neutral-800 flex items-center justify-between px-3 text-[11px] text-neutral-400 select-none z-40">
      {/* Left: Queue stats */}
      <div className="flex items-center space-x-3 font-mono">
        <div className="flex items-center space-x-1" title="Active Downloads">
          <Activity className={`w-3 h-3 ${activeCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
          <span>Active: <strong className="text-neutral-200">{activeCount}</strong></span>
        </div>

        <div className="flex items-center space-x-1" title="Queued Downloads">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>Queued: <strong className="text-neutral-200">{queuedCount}</strong></span>
        </div>

        <div className="flex items-center space-x-1" title="Completed Downloads">
          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
          <span>Done: <strong className="text-neutral-200">{doneCount}</strong></span>
        </div>
      </div>

      {/* Right: Versions and Console Toggle */}
      <div className="flex items-center space-x-3 font-mono text-[10px]">
        <span className="text-neutral-500">
          yt-dlp: <span className="text-neutral-300 font-semibold">{ytdlpVersion}</span>
        </span>

        <span className="text-neutral-600">|</span>

        <span className="text-neutral-500">
          App: <span className="text-neutral-300">{appVersion}</span>
        </span>

        {onToggleLogs && (
          <button
            onClick={onToggleLogs}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
              isLogOpen
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Toggle Console Log (Ctrl+L)"
          >
            <Terminal className="w-3 h-3" />
            <span>Logs</span>
          </button>
        )}
      </div>
    </footer>
  )
}
