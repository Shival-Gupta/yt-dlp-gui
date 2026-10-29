import React, { useState, useEffect } from 'react'
import { Minus, Square, Copy, X, Terminal, HelpCircle } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useSettingsStore } from '../../stores/settingsStore'

interface TitlebarProps {
  onToggleLogs?: () => void
  isLogOpen?: boolean
  onOpenShortcuts?: () => void
}

export const Titlebar: React.FC<TitlebarProps> = ({ onToggleLogs, isLogOpen, onOpenShortcuts }) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const minimizeToTray = useSettingsStore((s) => s.minimizeToTray)

  useEffect(() => {
    let unlisten: (() => void) | undefined

    const checkMaximized = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        setIsMaximized(await win.isMaximized())
        unlisten = await win.onResized(async () => {
          setIsMaximized(await win.isMaximized())
        })
      } catch {
        // Running outside Tauri (e.g. in dev browser/vitest)
      }
    }

    checkMaximized()
    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      if (minimizeToTray) {
        await win.hide()
      } else {
        await win.minimize()
      }
    } catch {
      console.log('Minimize window')
    }
  }

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      await win.toggleMaximize()
      setIsMaximized(await win.isMaximized())
    } catch {
      setIsMaximized((prev) => !prev)
    }
  }

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().close()
    } catch {
      console.log('Close window')
    }
  }

  return (
    <div
      data-tauri-drag-region
      className="h-10 w-full bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between select-none z-50 text-xs px-3 backdrop-blur-sm"
    >
      {/* Left: App Logo & Title */}
      <div data-tauri-drag-region className="flex items-center space-x-2 pointer-events-none">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
          <span className="font-black text-white text-[10px]">YT</span>
        </div>
        <span className="font-semibold text-neutral-200 tracking-wide">yt-dlp GUI</span>
        <span className="text-[10px] text-neutral-500 bg-neutral-800/80 px-1.5 py-0.5 rounded font-mono">v1.0.0</span>
      </div>

      {/* Middle: Drag area */}
      <div data-tauri-drag-region className="flex-1 h-full" />

      {/* Right: Controls */}
      <div className="flex items-center space-x-1">
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {onToggleLogs && (
          <button
            onClick={onToggleLogs}
            title="Toggle Console Log (Ctrl+L)"
            className={`p-1.5 rounded-md transition-colors ${
              isLogOpen
                ? 'bg-neutral-800 text-indigo-400'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        )}

        <ThemeToggle />

        <div className="h-4 w-[1px] bg-neutral-800 mx-1" />

        <button
          onClick={handleMinimize}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleClose}
          className="p-1.5 rounded hover:bg-rose-600 text-neutral-400 hover:text-white transition-colors"
          title="Close"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
