import React, { useState } from 'react'
import {
  SlidersHorizontal,
  Bookmark,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Sparkles,
  Music,
  Film,
  ListVideo,
  Share2,
} from 'lucide-react'
import { usePresetStore, Preset } from '../../stores/presetStore'
import { YtdlpOptions } from '../../types/ytdlp'

interface PresetSelectorProps {
  currentOptions: Partial<YtdlpOptions>
  onApplyPreset: (options: Partial<YtdlpOptions>) => void
}

const BUILTIN_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  Music: <Music className="w-3.5 h-3.5 text-emerald-400" />,
  Film: <Film className="w-3.5 h-3.5 text-blue-400" />,
  ListVideo: <ListVideo className="w-3.5 h-3.5 text-purple-400" />,
  Share2: <Share2 className="w-3.5 h-3.5 text-sky-400" />,
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentOptions,
  onApplyPreset,
}) => {
  const presets = usePresetStore((s) => s.presets)
  const activePresetId = usePresetStore((s) => s.activePresetId)
  const applyPreset = usePresetStore((s) => s.applyPreset)
  const saveCurrentAsPreset = usePresetStore((s) => s.saveCurrentAsPreset)
  const deletePreset = usePresetStore((s) => s.deletePreset)

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDesc, setNewPresetDesc] = useState('')

  const builtInList = presets.filter((p) => p.isBuiltIn)
  const customList = presets.filter((p) => !p.isBuiltIn)
  const activePreset = presets.find((p) => p.id === activePresetId)

  const handleSelectPreset = (preset: Preset) => {
    const opts = applyPreset(preset.id)
    if (opts) {
      onApplyPreset(opts)
    }
    setIsOpen(false)
  }

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPresetName.trim()) return

    const saved = saveCurrentAsPreset(newPresetName.trim(), currentOptions, newPresetDesc.trim())
    setNewPresetName('')
    setNewPresetDesc('')
    setIsSaving(false)
    onApplyPreset(saved.options)
  }

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this custom preset?')) {
      deletePreset(id)
    }
  }

  return (
    <div className="relative text-xs">
      <div className="flex items-center space-x-2">
        {/* Preset Selector Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">
            {activePreset ? activePreset.name : 'Select Preset...'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
        </button>

        {/* Save Current as Preset Button */}
        <button
          type="button"
          onClick={() => setIsSaving(true)}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          title="Save current options as a custom preset"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Preset</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1.5 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-30 p-2 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {/* Built-in Presets */}
            <div>
              <div className="text-[10px] font-semibold text-neutral-500 uppercase px-2 py-1 tracking-wider">
                Built-in Presets
              </div>
              <div className="space-y-0.5">
                {builtInList.map((preset) => {
                  const isSelected = activePresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-800/60'
                          : 'hover:bg-neutral-800/60 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 overflow-hidden flex-1">
                        <span className="shrink-0">
                          {preset.icon && BUILTIN_ICONS[preset.icon] ? (
                            BUILTIN_ICONS[preset.icon]
                          ) : (
                            <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                          )}
                        </span>
                        <div className="truncate">
                          <div className="font-medium truncate">{preset.name}</div>
                          {preset.description && (
                            <div className="text-[10px] text-neutral-500 truncate">
                              {preset.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Presets */}
            {customList.length > 0 && (
              <div className="pt-1 border-t border-neutral-800">
                <div className="text-[10px] font-semibold text-neutral-500 uppercase px-2 py-1 tracking-wider">
                  User Presets
                </div>
                <div className="space-y-0.5">
                  {customList.map((preset) => {
                    const isSelected = activePresetId === preset.id
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-800/60'
                            : 'hover:bg-neutral-800/60 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 overflow-hidden flex-1">
                          <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-medium truncate">{preset.name}</div>
                            {preset.description && (
                              <div className="text-[10px] text-neutral-500 truncate">
                                {preset.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustom(e, preset.id)}
                            className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-rose-400"
                            title="Delete custom preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Save Preset Dialog Modal */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSubmit}
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 shadow-2xl"
          >
            <div className="font-semibold text-neutral-100 text-sm">Save Current Options as Preset</div>
            <p className="text-[11px] text-neutral-400">
              Save your current format, quality, and output settings for quick reuse.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Preset Name:</label>
              <input
                type="text"
                required
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g. 1080p Music Videos"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-300">Description (optional):</label>
              <input
                type="text"
                value={newPresetDesc}
                onChange={(e) => setNewPresetDesc(e.target.value)}
                placeholder="Short note about these settings..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsSaving(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
              >
                Save Preset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
