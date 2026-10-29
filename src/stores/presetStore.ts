import { create } from 'zustand'
import { YtdlpOptions } from '../types/ytdlp'

export interface Preset {
  id: string
  name: string
  description?: string
  icon?: string
  options: Partial<YtdlpOptions>
  createdAt: number
  isBuiltIn: boolean
}

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'builtin-best-quality',
    name: 'Best Quality',
    description: 'Highest video and audio streams merged with metadata and chapters',
    icon: 'Sparkles',
    options: {
      formatSelector: 'bv*+ba/b',
      embedMetadata: true,
      embedChapters: true,
    },
    createdAt: 1700000000000,
    isBuiltIn: true,
  },
  {
    id: 'builtin-audio-mp3',
    name: 'Audio Only MP3',
    description: 'Extract audio into 192kbps MP3 with embedded thumbnail and metadata',
    icon: 'Music',
    options: {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '192K',
      embedThumbnail: true,
      embedMetadata: true,
    },
    createdAt: 1700000000000,
    isBuiltIn: true,
  },
  {
    id: 'builtin-instagram-reel',
    name: 'Instagram Reel',
    description: 'Extract Instagram reel using Chrome cookies and save thumbnail',
    icon: 'Film',
    options: {
      cookiesBrowser: 'chrome',
      formatSelector: 'bv*+ba/b',
      writeThumbnail: true,
    },
    createdAt: 1700000000000,
    isBuiltIn: true,
  },
  {
    id: 'builtin-youtube-playlist',
    name: 'YouTube Playlist',
    description: 'Download full playlist organized with index, title, info JSON, and description',
    icon: 'ListVideo',
    options: {
      playlist: true,
      outputTemplate: '%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s',
      writeInfoJson: true,
      writeDescription: true,
    },
    createdAt: 1700000000000,
    isBuiltIn: true,
  },
  {
    id: 'builtin-twitter-x',
    name: 'Twitter/X Video',
    description: 'Best quality video download for X/Twitter with thumbnail',
    icon: 'Share2',
    options: {
      formatSelector: 'bv*+ba/b',
      writeThumbnail: true,
    },
    createdAt: 1700000000000,
    isBuiltIn: true,
  },
]

const STORAGE_KEY = 'yt_dlp_gui_custom_presets'

function loadSavedCustomPresets(): Preset[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((p) => p && typeof p.id === 'string' && !p.isBuiltIn)
      }
    }
  } catch {
    // Ignore parse error
  }
  return []
}

function saveCustomPresets(presets: Preset[]) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const customOnly = presets.filter((p) => !p.isBuiltIn)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly))
  } catch {
    // Ignore storage error
  }
}

interface PresetStore {
  presets: Preset[]
  activePresetId: string | null
  applyPreset: (id: string) => Partial<YtdlpOptions> | undefined
  setActivePresetId: (id: string | null) => void
  saveCurrentAsPreset: (name: string, options: Partial<YtdlpOptions>, description?: string) => Preset
  deletePreset: (id: string) => boolean
  exportPresets: () => string
  importPresets: (jsonStr: string) => boolean
  getPreset: (id: string) => Preset | undefined
}

export const usePresetStore = create<PresetStore>((set, get) => {
  const initialCustom = loadSavedCustomPresets()
  const initialPresets = [...BUILTIN_PRESETS, ...initialCustom]

  return {
    presets: initialPresets,
    activePresetId: null,

    setActivePresetId: (id) => set({ activePresetId: id }),

    getPreset: (id) => get().presets.find((p) => p.id === id),

    applyPreset: (id) => {
      const preset = get().presets.find((p) => p.id === id)
      if (preset) {
        set({ activePresetId: id })
        return { ...preset.options }
      }
      return undefined
    },

    saveCurrentAsPreset: (name, options, description) => {
      const newPreset: Preset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        description: description?.trim(),
        options: { ...options },
        createdAt: Date.now(),
        isBuiltIn: false,
      }

      set((state) => {
        const updated = [...state.presets, newPreset]
        saveCustomPresets(updated)
        return { presets: updated, activePresetId: newPreset.id }
      })

      return newPreset
    },

    deletePreset: (id) => {
      const preset = get().presets.find((p) => p.id === id)
      if (!preset || preset.isBuiltIn) {
        return false // Built-in presets cannot be deleted
      }

      set((state) => {
        const updated = state.presets.filter((p) => p.id !== id)
        saveCustomPresets(updated)
        return {
          presets: updated,
          activePresetId: state.activePresetId === id ? null : state.activePresetId,
        }
      })
      return true
    },

    exportPresets: () => {
      const customOnly = get().presets.filter((p) => !p.isBuiltIn)
      return JSON.stringify(customOnly, null, 2)
    },

    importPresets: (jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr)
        if (!Array.isArray(parsed)) return false

        const validImports: Preset[] = parsed
          .filter((item) => item && typeof item.name === 'string' && item.options)
          .map((item) => ({
            id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: String(item.name).trim(),
            description: item.description ? String(item.description).trim() : undefined,
            options: { ...item.options },
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            isBuiltIn: false,
          }))

        if (validImports.length === 0) return false

        set((state) => {
          const currentCustom = state.presets.filter((p) => !p.isBuiltIn)
          const mergedCustom = [...currentCustom, ...validImports]
          saveCustomPresets(mergedCustom)
          return { presets: [...BUILTIN_PRESETS, ...mergedCustom] }
        })

        return true
      } catch {
        return false
      }
    },
  }
})
