import { create } from 'zustand'

export interface QueueItem {
  id: string
  url: string
  addedAt: number
}

interface QueueStore {
  items: QueueItem[]
  isPaused: boolean
  addUrls: (urls: string[]) => void
  removeItem: (id: string) => void
  removeUrl: (url: string) => void
  clearQueue: () => void
  reorder: (startIndex: number, endIndex: number) => void
  pauseAll: () => void
  resumeAll: () => void
}

export const useQueueStore = create<QueueStore>((set) => ({
  items: [],
  isPaused: false,

  addUrls: (urls) =>
    set((state) => {
      const newItems: QueueItem[] = []
      const existingUrls = new Set(state.items.map((i) => i.url))

      for (const raw of urls) {
        const trimmed = raw.trim()
        if (trimmed && !existingUrls.has(trimmed)) {
          newItems.push({
            id: Math.random().toString(36).substring(2, 11),
            url: trimmed,
            addedAt: Date.now(),
          })
          existingUrls.add(trimmed)
        }
      }

      return { items: [...state.items, ...newItems] }
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  removeUrl: (url) =>
    set((state) => ({
      items: state.items.filter((item) => item.url !== url),
    })),

  clearQueue: () => set({ items: [] }),

  reorder: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.items)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return { items: result }
    }),

  pauseAll: () => set({ isPaused: true }),
  resumeAll: () => set({ isPaused: false }),
}))
