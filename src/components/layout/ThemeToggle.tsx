import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useSettingsStore()

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light')
    else if (theme === 'light') setTheme('system')
    else setTheme('dark')
  }

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${theme} (click to change)`}
      aria-label="Toggle theme"
      className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-500"
    >
      {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
      {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
      {theme === 'system' && <Monitor className="w-4 h-4 text-emerald-400" />}
    </button>
  )
}
