import { useEffect } from 'react'

export interface ShortcutHandlers {
  onNavigateTab?: (tab: 'download' | 'queue' | 'history' | 'presets' | 'settings' | 'about') => void
  onStartDownload?: () => void
  onClearUrl?: () => void
  onToggleLogs?: () => void
  onCheckYtdlpUpdate?: () => void
  onCloseDialog?: () => void
  onToggleShortcutsHelp?: () => void
}

export function useShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when user is typing inside text inputs,
      // except for Ctrl combinations or Escape
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      // Escape: Close any open dialog or modal
      if (e.key === 'Escape') {
        if (handlers.onCloseDialog) {
          handlers.onCloseDialog()
        }
        return
      }

      // '?' (Shift + /) without modifier: open shortcuts reference
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !isInput) {
        e.preventDefault()
        if (handlers.onToggleShortcutsHelp) {
          handlers.onToggleShortcutsHelp()
        }
        return
      }

      // F5: check for yt-dlp update
      if (e.key === 'F5') {
        e.preventDefault()
        if (handlers.onCheckYtdlpUpdate) {
          handlers.onCheckYtdlpUpdate()
        }
        return
      }

      // Ctrl combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()

        // Ctrl+Enter: Start download
        if (e.key === 'Enter') {
          e.preventDefault()
          if (handlers.onStartDownload) {
            handlers.onStartDownload()
          }
          return
        }

        // Ctrl+,: Open Settings
        if (e.key === ',') {
          e.preventDefault()
          if (handlers.onNavigateTab) {
            handlers.onNavigateTab('settings')
          }
          return
        }

        // Ctrl+H: Open History
        if (key === 'h') {
          e.preventDefault()
          if (handlers.onNavigateTab) {
            handlers.onNavigateTab('history')
          }
          return
        }

        // Ctrl+Q: Open Queue
        if (key === 'q') {
          e.preventDefault()
          if (handlers.onNavigateTab) {
            handlers.onNavigateTab('queue')
          }
          return
        }

        // Ctrl+L: Clear URL or Toggle Logs
        if (key === 'l') {
          e.preventDefault()
          if (handlers.onClearUrl) {
            handlers.onClearUrl()
          } else if (handlers.onToggleLogs) {
            handlers.onToggleLogs()
          }
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}
