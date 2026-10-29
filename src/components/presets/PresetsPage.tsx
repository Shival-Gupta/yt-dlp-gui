import React, { useState, useRef } from 'react'
import {
  SlidersHorizontal,
  Bookmark,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Music,
  Film,
  ListVideo,
  Share2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { usePresetStore, Preset } from '../../stores/presetStore'

const BUILTIN_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-amber-400" />,
  Music: <Music className="w-5 h-5 text-emerald-400" />,
  Film: <Film className="w-5 h-5 text-blue-400" />,
  ListVideo: <ListVideo className="w-5 h-5 text-purple-400" />,
  Share2: <Share2 className="w-5 h-5 text-sky-400" />,
}

export const PresetsPage: React.FC = () => {
  const presets = usePresetStore((s) => s.presets)
  const activePresetId = usePresetStore((s) => s.activePresetId)
  const setActivePresetId = usePresetStore((s) => s.setActivePresetId)
  const deletePreset = usePresetStore((s) => s.deletePreset)
  const exportPresets = usePresetStore((s) => s.exportPresets)
  const importPresets = usePresetStore((s) => s.importPresets)

  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showFeedback = (text: string, isError = false) => {
    setMessage({ text, isError })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleExport = () => {
    try {
      const jsonStr = exportPresets()
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yt-dlp-presets-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showFeedback('Presets exported successfully!')
    } catch {
      showFeedback('Failed to export presets', true)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const success = importPresets(content)
        if (success) {
          showFeedback('Custom presets imported successfully!')
        } else {
          showFeedback('Invalid preset JSON format.', true)
        }
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleDelete = (preset: Preset) => {
    if (preset.isBuiltIn) return
    if (window.confirm(`Delete custom preset "${preset.name}"?`)) {
      deletePreset(preset.id)
      showFeedback(`Deleted preset "${preset.name}".`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs select-text">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <span>Preset Configuration & Management</span>
          </h1>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            Configure preset download recipes, export for backup, or share configs.
          </p>
        </div>

        {/* Global actions: Export, Import */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Custom JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-200 font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Presets</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Notification banner */}
      {message && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg text-xs ${
            message.isError
              ? 'bg-rose-950/60 text-rose-300 border border-rose-900'
              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900'
          }`}
        >
          {message.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid of Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id

          return (
            <div
              key={preset.id}
              className={`bg-neutral-900/60 border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
                isActive
                  ? 'border-indigo-500 ring-1 ring-indigo-500/50'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Preset Title & Badges */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                      {preset.icon && BUILTIN_ICONS[preset.icon] ? (
                        BUILTIN_ICONS[preset.icon]
                      ) : (
                        <Bookmark className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-200 text-sm">{preset.name}</div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          preset.isBuiltIn
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {preset.isBuiltIn ? 'Built-in' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full font-semibold">
                      Active
                    </span>
                  )}
                </div>

                {preset.description && (
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    {preset.description}
                  </p>
                )}
              </div>

              {/* Options Chips */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                {Object.entries(preset.options).map(([key, val]) => {
                  if (val === undefined || val === false) return null
                  const displayVal = typeof val === 'boolean' ? key : `${key}: ${val}`
                  return (
                    <span
                      key={key}
                      className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded"
                    >
                      {displayVal}
                    </span>
                  )
                })}
              </div>

              {/* Action Buttons footer */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setActivePresetId(preset.id)}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isActive ? 'Selected' : 'Set as Default'}
                </button>

                {!preset.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => handleDelete(preset)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 text-[11px] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
