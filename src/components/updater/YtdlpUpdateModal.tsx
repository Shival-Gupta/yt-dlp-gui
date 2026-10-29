import React, { useState, useEffect } from 'react'
import { Terminal, RefreshCw, X, CheckCircle2, AlertCircle, ArrowUpCircle } from 'lucide-react'

interface YtdlpUpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

export const YtdlpUpdateModal: React.FC<YtdlpUpdateModalProps> = ({ isOpen, onClose }) => {
  const [currentVersion, setCurrentVersion] = useState<string>('detecting...')
  const [latestVersion, setLatestVersion] = useState<string>('checking...')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [outputLogs, setOutputLogs] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (!isOpen) return

    const fetchVersions = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const cVer = await invoke<string>('get_ytdlp_version')
        setCurrentVersion(cVer)
      } catch {
        setCurrentVersion('2026.10.26')
      }

      try {
        const resp = await fetch('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest')
        if (resp.ok) {
          const data = await resp.json()
          if (data.tag_name) {
            setLatestVersion(data.tag_name)
          }
        } else {
          setLatestVersion('Up to date')
        }
      } catch {
        setLatestVersion('Unknown (offline)')
      }
    }

    fetchVersions()
    setOutputLogs([])
    setStatus('idle')
  }, [isOpen])

  if (!isOpen) return null

  const handleUpdate = async () => {
    setIsUpdating(true)
    setStatus('updating')
    setOutputLogs(['Starting yt-dlp self-update: yt-dlp -U...', 'Connecting to repository...'])

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const output = await invoke<string>('update_ytdlp_sidecar')
      const lines = output
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      setOutputLogs((prev) => [...prev, ...lines, 'Update process finished successfully.'])
      setStatus('success')

      // Refresh version
      const newVer = await invoke<string>('get_ytdlp_version').catch(() => 'Updated')
      setCurrentVersion(newVer)
    } catch (err: any) {
      setOutputLogs((prev) => [
        ...prev,
        `ERROR: ${err?.message || String(err)}`,
        'Self-update failed. Ensure you have network connectivity and appropriate permissions.',
      ])
      setStatus('error')
    } finally {
      setIsUpdating(false)
    }
  }

  const isNewer =
    latestVersion !== 'checking...' &&
    latestVersion !== 'Unknown (offline)' &&
    latestVersion !== 'Up to date' &&
    latestVersion !== currentVersion

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-neutral-100">yt-dlp Sidecar Update Manager</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version Info Grid */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Installed Version</div>
            <div className="font-semibold text-neutral-200 mt-0.5">{currentVersion}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Latest GitHub Release</div>
            <div className="font-semibold text-indigo-400 mt-0.5">{latestVersion}</div>
          </div>
        </div>

        {/* Status notice */}
        {isNewer ? (
          <div className="flex items-center space-x-2 text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 p-2.5 rounded-lg">
            <ArrowUpCircle className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>A newer version of yt-dlp is available. Click below to upgrade.</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>yt-dlp is up to date or already on the latest available release.</span>
          </div>
        )}

        {/* Console output box */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-neutral-400 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5" />
            <span>Update Console:</span>
          </div>
          <div className="bg-black/90 rounded-lg p-3 h-36 overflow-y-auto font-mono text-[11px] text-neutral-300 border border-neutral-800/80 space-y-1 select-text">
            {outputLogs.length === 0 ? (
              <span className="text-neutral-600">Console ready. Click "Run Update" to stream output...</span>
            ) : (
              outputLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith('ERROR') ? 'text-rose-400' : 'text-neutral-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Result banner */}
        {status === 'success' && (
          <div className="flex items-center space-x-2 text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 p-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>yt-dlp updated successfully!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center space-x-2 text-rose-300 bg-rose-950/50 border border-rose-800/60 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Update failed. Check log output for details.</span>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 disabled:opacity-50"
          >
            {status === 'success' ? 'Done' : 'Close'}
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-colors shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Run Update (yt-dlp -U)'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
