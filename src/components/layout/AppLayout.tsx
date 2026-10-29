import React, { useState, useEffect } from 'react'
import { Titlebar } from './Titlebar'
import { Nav, NavTab } from './Nav'
import { StatusBar } from './StatusBar'
import { LogPanel } from './LogPanel'
import { UpdateBanner } from '../updater/UpdateBanner'

interface AppLayoutProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
  onOpenShortcuts?: () => void
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  onOpenShortcuts,
  children,
}) => {
  const [isLogOpen, setIsLogOpen] = useState(false)

  // Global keyboard shortcut: Ctrl+L to toggle log panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setIsLogOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* Draggable Titlebar */}
      <Titlebar
        onToggleLogs={() => setIsLogOpen((prev) => !prev)}
        isLogOpen={isLogOpen}
        onOpenShortcuts={onOpenShortcuts}
      />

      {/* OBS-style non-blocking Update Banner */}
      <UpdateBanner />

      {/* Center Body: Nav + Main View */}
      <div className="flex flex-1 overflow-hidden">
        <Nav activeTab={activeTab} onSelectTab={onSelectTab} />

        <main className="flex-1 overflow-y-auto bg-neutral-900/30 p-4">
          {children}
        </main>
      </div>

      {/* Collapsible Log Console */}
      <LogPanel isOpen={isLogOpen} onToggle={() => setIsLogOpen(false)} />

      {/* Bottom Status Bar */}
      <StatusBar onToggleLogs={() => setIsLogOpen((prev) => !prev)} isLogOpen={isLogOpen} />
    </div>
  )
}
