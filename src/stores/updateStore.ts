import { create } from 'zustand'

export interface AppUpdateInfo {
  version: string
  notes: string
  downloadUrl?: string
  pubDate?: string
}

export interface YtdlpUpdateInfo {
  currentVersion: string
  latestVersion: string
}

export interface UpdateStore {
  appUpdate: AppUpdateInfo | null
  ytdlpUpdate: YtdlpUpdateInfo | null
  isCheckingApp: boolean
  isCheckingYtdlp: boolean
  isDownloadingUpdate: boolean
  downloadProgress: number // 0-100
  updateReadyToRestart: boolean
  error: string | null

  setAppUpdate: (update: AppUpdateInfo | null) => void
  setYtdlpUpdate: (update: YtdlpUpdateInfo | null) => void
  setIsCheckingApp: (isChecking: boolean) => void
  setIsCheckingYtdlp: (isChecking: boolean) => void
  setIsDownloadingUpdate: (isDownloading: boolean) => void
  setDownloadProgress: (progress: number) => void
  setUpdateReadyToRestart: (ready: boolean) => void
  setError: (error: string | null) => void
  clearAppUpdate: () => void
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  appUpdate: null,
  ytdlpUpdate: null,
  isCheckingApp: false,
  isCheckingYtdlp: false,
  isDownloadingUpdate: false,
  downloadProgress: 0,
  updateReadyToRestart: false,
  error: null,

  setAppUpdate: (appUpdate) => set({ appUpdate }),
  setYtdlpUpdate: (ytdlpUpdate) => set({ ytdlpUpdate }),
  setIsCheckingApp: (isCheckingApp) => set({ isCheckingApp }),
  setIsCheckingYtdlp: (isCheckingYtdlp) => set({ isCheckingYtdlp }),
  setIsDownloadingUpdate: (isDownloadingUpdate) => set({ isDownloadingUpdate }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setUpdateReadyToRestart: (updateReadyToRestart) => set({ updateReadyToRestart }),
  setError: (error) => set({ error }),
  clearAppUpdate: () =>
    set({
      appUpdate: null,
      isDownloadingUpdate: false,
      downloadProgress: 0,
      updateReadyToRestart: false,
      error: null,
    }),
}))
