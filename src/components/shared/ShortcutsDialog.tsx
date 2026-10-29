import React from 'react'
import { Keyboard, X } from 'lucide-react'

interface ShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'V'], description: 'Focus URL input and paste from clipboard', category: 'Download' },
  { keys: ['Ctrl', 'Enter'], description: 'Start download with current options', category: 'Download' },
  { keys: ['Ctrl', 'L'], description: 'Clear URL input / Toggle Console Logs', category: 'Download' },
  { keys: ['Ctrl', ','], description: 'Open Application Settings', category: 'Navigation' },
  { keys: ['Ctrl', 'H'], description: 'Open Download History', category: 'Navigation' },
  { keys: ['Ctrl', 'Q'], description: 'Open Download Queue', category: 'Navigation' },
  { keys: ['F5'], description: 'Check for yt-dlp sidecar update', category: 'Updates' },
  { keys: ['Escape'], description: 'Close any active dialog or popup', category: 'General' },
  { keys: ['?'], description: 'Toggle this keyboard shortcuts dialog', category: 'General' },
]

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-neutral-100">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="divide-y divide-neutral-800/60 max-h-80 overflow-y-auto pr-1">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-neutral-300">{item.description}</span>
              <div className="flex items-center space-x-1 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-200 bg-neutral-950 border border-neutral-700/80 rounded shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-[11px] text-neutral-500">
          <span>Press <kbd className="font-mono text-neutral-400 font-bold">Esc</kbd> anytime to dismiss</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
