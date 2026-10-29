import React from 'react'
import {
  Download,
  ListOrdered,
  History,
  SlidersHorizontal,
  Settings,
  Info,
} from 'lucide-react'
import { useQueueStore } from '../../stores/queueStore'

export type NavTab = 'download' | 'queue' | 'history' | 'presets' | 'settings' | 'about'

interface NavProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
}

export const Nav: React.FC<NavProps> = ({ activeTab, onSelectTab }) => {
  const queueItems = useQueueStore((s) => s.items)

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'download', label: 'Download', icon: <Download className="w-4 h-4" /> },
    {
      id: 'queue',
      label: 'Queue',
      icon: <ListOrdered className="w-4 h-4" />,
      badge: queueItems.length > 0 ? queueItems.length : undefined,
    },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'presets', label: 'Presets', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ]

  return (
    <aside className="w-48 bg-neutral-950/60 border-r border-neutral-800 flex flex-col justify-between p-2 select-none">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isActive ? 'text-indigo-400' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-indigo-600/80 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t border-neutral-900/80 text-[10px] text-neutral-600 font-mono">
        yt-dlp GUI · Tauri 2
      </div>
    </aside>
  )
}
