import { create } from 'zustand'

export interface HistoryEntry {
  id: string
  url: string
  title: string
  uploader?: string
  duration?: number
  thumbnail?: string
  outputPath?: string
  outputFilename?: string
  format?: string
  format_id?: string
  preset?: string
  filesize?: number
  downloadedAt?: number
  timestamp: string // ISO date string
  status: 'completed' | 'done' | 'error'
  error?: string
  options?: Record<string, any>
}

interface HistoryState {
  entries: HistoryEntry[]
  maxEntries: number
  addEntry: (entry: HistoryEntry) => void
  removeEntry: (id: string) => void
  clearHistory: () => void
  setMaxEntries: (max: number) => void
  search: (query: string) => HistoryEntry[]
  sortBy: (field: 'date' | 'title' | 'size' | 'duration', ascending?: boolean) => HistoryEntry[]
  getAll: () => HistoryEntry[]
  count: () => number
}

const STORAGE_KEY = 'yt_dlp_gui_history'
const DEFAULT_MAX_ENTRIES = 500

function loadStoredEntries(): HistoryEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Failed to load history from localStorage:', err)
  }
  return []
}

function persistEntries(entries: HistoryEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (err) {
    console.warn('Failed to persist history to localStorage:', err)
  }
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: loadStoredEntries(),
  maxEntries: DEFAULT_MAX_ENTRIES,

  addEntry: (entry) =>
    set((state) => {
      // FIFO eviction: if at or over maxEntries, drop oldest from beginning
      const next = [...state.entries]
      while (next.length >= state.maxEntries) {
        next.shift()
      }
      next.push(entry)
      persistEntries(next)
      return { entries: next }
    }),

  removeEntry: (id) =>
    set((state) => {
      const next = state.entries.filter((e) => e.id !== id)
      persistEntries(next)
      return { entries: next }
    }),

  clearHistory: () =>
    set(() => {
      persistEntries([])
      return { entries: [] }
    }),

  setMaxEntries: (max) =>
    set((state) => {
      const validMax = Math.max(1, max)
      let next = [...state.entries]
      if (next.length > validMax) {
        next = next.slice(next.length - validMax)
        persistEntries(next)
      }
      return { maxEntries: validMax, entries: next }
    }),

  getAll: () => get().entries,

  count: () => get().entries.length,

  search: (query) => {
    const all = get().entries
    if (!query || query.trim().length === 0) return all
    const q = query.toLowerCase().trim()
    return all.filter((e) => {
      const titleMatch = e.title && e.title.toLowerCase().includes(q)
      const urlMatch = e.url && e.url.toLowerCase().includes(q)
      const uploaderMatch = e.uploader && e.uploader.toLowerCase().includes(q)
      return Boolean(titleMatch || urlMatch || uploaderMatch)
    })
  },

  sortBy: (field, ascending = false) => {
    const sorted = [...get().entries]
    sorted.sort((a, b) => {
      let cmp = 0
      if (field === 'date') {
        const timeA = new Date(a.timestamp || a.downloadedAt || 0).getTime()
        const timeB = new Date(b.timestamp || b.downloadedAt || 0).getTime()
        cmp = timeA - timeB
      } else if (field === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '')
      } else if (field === 'size') {
        cmp = (a.filesize || 0) - (b.filesize || 0)
      } else if (field === 'duration') {
        cmp = (a.duration || 0) - (b.duration || 0)
      }
      return ascending ? cmp : -cmp
    })
    return sorted
  },
}))

/**
 * Standalone HistoryStore with a circular FIFO buffer capped at maxEntries (default 500).
 * Provides programmatic history tracking for components, tests, and headless contexts.
 */
export class HistoryStore {
  private entries: HistoryEntry[] = []
  private maxEntries: number

  constructor(maxEntries = DEFAULT_MAX_ENTRIES, initialEntries: HistoryEntry[] = []) {
    this.maxEntries = Math.max(1, maxEntries)
    if (initialEntries && initialEntries.length > 0) {
      for (const entry of initialEntries) {
        this.addEntry(entry)
      }
    }
  }

  public addEntry(entry: HistoryEntry): void {
    if (this.entries.length >= this.maxEntries) {
      this.entries.shift()
    }
    this.entries.push(entry)
  }

  public getAll(): HistoryEntry[] {
    return [...this.entries]
  }

  public count(): number {
    return this.entries.length
  }

  public clear(): void {
    this.entries = []
  }

  public setMaxEntries(max: number): void {
    this.maxEntries = Math.max(1, max)
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(this.entries.length - this.maxEntries)
    }
  }

  public search(query: string): HistoryEntry[] {
    if (!query || query.trim().length === 0) return this.getAll()
    const q = query.toLowerCase().trim()
    return this.entries.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.url && e.url.toLowerCase().includes(q))
    )
  }

  public sortBy(
    field: 'date' | 'title' | 'size' | 'duration',
    ascending = false
  ): HistoryEntry[] {
    const sorted = [...this.entries]
    sorted.sort((a, b) => {
      let cmp = 0
      if (field === 'date') {
        const timeA = new Date(a.timestamp || a.downloadedAt || 0).getTime()
        const timeB = new Date(b.timestamp || b.downloadedAt || 0).getTime()
        cmp = timeA - timeB
      } else if (field === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '')
      } else if (field === 'size') {
        cmp = (a.filesize || 0) - (b.filesize || 0)
      } else if (field === 'duration') {
        cmp = (a.duration || 0) - (b.duration || 0)
      }
      return ascending ? cmp : -cmp
    })
    return sorted
  }
}

