import { create } from 'zustand'
import { DownloadJob } from '../types/ytdlp'

interface DownloadStore {
  jobs: Record<string, DownloadJob>
  addJob: (job: DownloadJob) => void
  updateJob: (id: string, updates: Partial<DownloadJob>) => void
  removeJob: (id: string) => void
  getJob: (id: string) => DownloadJob | undefined
  clearFinished: () => void
  activeCount: () => number
  queuedCount: () => number
  doneCount: () => number
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  jobs: {},

  addJob: (job) =>
    set((state) => ({
      jobs: {
        ...state.jobs,
        [job.id]: job,
      },
    })),

  updateJob: (id, updates) =>
    set((state) => {
      const current = state.jobs[id]
      if (!current) return state
      return {
        jobs: {
          ...state.jobs,
          [id]: {
            ...current,
            ...updates,
          },
        },
      }
    }),

  removeJob: (id) =>
    set((state) => {
      const next = { ...state.jobs }
      delete next[id]
      return { jobs: next }
    }),

  getJob: (id) => get().jobs[id],

  clearFinished: () =>
    set((state) => {
      const next: Record<string, DownloadJob> = {}
      for (const [id, job] of Object.entries(state.jobs)) {
        if (job.status !== 'done' && job.status !== 'error' && job.status !== 'cancelled') {
          next[id] = job
        }
      }
      return { jobs: next }
    }),

  activeCount: () => {
    return Object.values(get().jobs).filter(
      (j) => j.status === 'downloading' || j.status === 'processing'
    ).length
  },

  queuedCount: () => {
    return Object.values(get().jobs).filter((j) => j.status === 'queued').length
  },

  doneCount: () => {
    return Object.values(get().jobs).filter((j) => j.status === 'done').length
  },
}))
