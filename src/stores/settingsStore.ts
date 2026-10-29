import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontScale = 'small' | 'medium' | 'large'
export type UpdateChannel = 'stable' | 'nightly'

export interface SettingsStore {
  // Appearance
  theme: ThemeMode
  fontScale: FontScale
  windowOpacity: number
  highContrast: boolean

  // Downloads
  defaultOutputDir: string
  defaultOutputTemplate: string
  maxConcurrentDownloads: number
  globalRateLimit: string

  // Tools
  ytdlpPathOverride?: string
  ffmpegPathOverride?: string
  ffprobePathOverride?: string
  externalDownloader?: string

  // Updates
  checkUpdatesOnStartup: boolean
  checkYtdlpUpdatesWeekly: boolean
  updateChannel: UpdateChannel

  // Notifications
  notifyOnComplete: boolean
  notifyOnError: boolean
  notificationSound: boolean

  // Advanced & System
  historyMaxEntries: number
  socketTimeout: number
  proxyUrl: string
  cacheDir: string
  debugLogging: boolean
  minimizeToTray: boolean

  // Setters
  setTheme: (theme: ThemeMode) => void
  setFontScale: (scale: FontScale) => void
  setWindowOpacity: (opacity: number) => void
  setHighContrast: (contrast: boolean) => void

  setDefaultOutputDir: (dir: string) => void
  setDefaultOutputTemplate: (template: string) => void
  setMaxConcurrentDownloads: (max: number) => void
  setGlobalRateLimit: (limit: string) => void

  setYtdlpPathOverride: (path?: string) => void
  setFfmpegPathOverride: (path?: string) => void
  setFfprobePathOverride: (path?: string) => void
  setExternalDownloader: (downloader?: string) => void

  setCheckUpdatesOnStartup: (check: boolean) => void
  setCheckYtdlpUpdatesWeekly: (check: boolean) => void
  setUpdateChannel: (channel: UpdateChannel) => void

  setNotifyOnComplete: (notify: boolean) => void
  setNotifyOnError: (notify: boolean) => void
  setNotificationSound: (sound: boolean) => void

  setHistoryMaxEntries: (max: number) => void
  setSocketTimeout: (timeout: number) => void
  setProxyUrl: (url: string) => void
  setCacheDir: (dir: string) => void
  setDebugLogging: (enabled: boolean) => void
  setMinimizeToTray: (minimize: boolean) => void

  resetSettings: () => void
}

const STORAGE_KEY = 'yt_dlp_gui_settings'

const DEFAULT_SETTINGS = {
  theme: 'dark' as ThemeMode,
  fontScale: 'medium' as FontScale,
  windowOpacity: 100,
  highContrast: false,

  defaultOutputDir: '',
  defaultOutputTemplate: '%(title)s [%(id)s].%(ext)s',
  maxConcurrentDownloads: 3,
  globalRateLimit: '',

  ytdlpPathOverride: '',
  ffmpegPathOverride: '',
  ffprobePathOverride: '',
  externalDownloader: 'none',

  checkUpdatesOnStartup: true,
  checkYtdlpUpdatesWeekly: true,
  updateChannel: 'stable' as UpdateChannel,

  notifyOnComplete: true,
  notifyOnError: true,
  notificationSound: false,

  historyMaxEntries: 500,
  socketTimeout: 30,
  proxyUrl: '',
  cacheDir: '',
  debugLogging: false,
  minimizeToTray: true,
}

function loadSavedSettings(): Partial<typeof DEFAULT_SETTINGS> {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback to defaults
  }
  return {}
}

function saveSettings(settings: Record<string, any>) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const saved = loadSavedSettings()
const initialTheme: ThemeMode = (saved.theme as ThemeMode) || DEFAULT_SETTINGS.theme
if (typeof document !== 'undefined') {
  applyTheme(initialTheme)
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  theme: initialTheme,
  fontScale: (saved.fontScale as FontScale) || DEFAULT_SETTINGS.fontScale,
  windowOpacity: saved.windowOpacity !== undefined ? saved.windowOpacity : DEFAULT_SETTINGS.windowOpacity,
  highContrast: saved.highContrast !== undefined ? saved.highContrast : DEFAULT_SETTINGS.highContrast,

  defaultOutputDir: saved.defaultOutputDir !== undefined ? saved.defaultOutputDir : DEFAULT_SETTINGS.defaultOutputDir,
  defaultOutputTemplate: saved.defaultOutputTemplate !== undefined ? saved.defaultOutputTemplate : DEFAULT_SETTINGS.defaultOutputTemplate,
  maxConcurrentDownloads: saved.maxConcurrentDownloads || DEFAULT_SETTINGS.maxConcurrentDownloads,
  globalRateLimit: saved.globalRateLimit !== undefined ? saved.globalRateLimit : DEFAULT_SETTINGS.globalRateLimit,

  ytdlpPathOverride: saved.ytdlpPathOverride,
  ffmpegPathOverride: saved.ffmpegPathOverride,
  ffprobePathOverride: saved.ffprobePathOverride,
  externalDownloader: saved.externalDownloader || DEFAULT_SETTINGS.externalDownloader,

  checkUpdatesOnStartup: saved.checkUpdatesOnStartup !== undefined ? saved.checkUpdatesOnStartup : DEFAULT_SETTINGS.checkUpdatesOnStartup,
  checkYtdlpUpdatesWeekly: saved.checkYtdlpUpdatesWeekly !== undefined ? saved.checkYtdlpUpdatesWeekly : DEFAULT_SETTINGS.checkYtdlpUpdatesWeekly,
  updateChannel: (saved.updateChannel as UpdateChannel) || DEFAULT_SETTINGS.updateChannel,

  notifyOnComplete: saved.notifyOnComplete !== undefined ? saved.notifyOnComplete : DEFAULT_SETTINGS.notifyOnComplete,
  notifyOnError: saved.notifyOnError !== undefined ? saved.notifyOnError : DEFAULT_SETTINGS.notifyOnError,
  notificationSound: saved.notificationSound !== undefined ? saved.notificationSound : DEFAULT_SETTINGS.notificationSound,

  historyMaxEntries: saved.historyMaxEntries || DEFAULT_SETTINGS.historyMaxEntries,
  socketTimeout: saved.socketTimeout || DEFAULT_SETTINGS.socketTimeout,
  proxyUrl: saved.proxyUrl || DEFAULT_SETTINGS.proxyUrl,
  cacheDir: saved.cacheDir || DEFAULT_SETTINGS.cacheDir,
  debugLogging: saved.debugLogging !== undefined ? saved.debugLogging : DEFAULT_SETTINGS.debugLogging,
  minimizeToTray: saved.minimizeToTray !== undefined ? saved.minimizeToTray : DEFAULT_SETTINGS.minimizeToTray,

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
    saveSettings({ ...get(), theme })
  },
  setFontScale: (fontScale) => {
    set({ fontScale })
    saveSettings({ ...get(), fontScale })
  },
  setWindowOpacity: (windowOpacity) => {
    set({ windowOpacity })
    saveSettings({ ...get(), windowOpacity })
  },
  setHighContrast: (highContrast) => {
    set({ highContrast })
    saveSettings({ ...get(), highContrast })
  },

  setDefaultOutputDir: (defaultOutputDir) => {
    set({ defaultOutputDir })
    saveSettings({ ...get(), defaultOutputDir })
  },
  setDefaultOutputTemplate: (defaultOutputTemplate) => {
    set({ defaultOutputTemplate })
    saveSettings({ ...get(), defaultOutputTemplate })
  },
  setMaxConcurrentDownloads: (maxConcurrentDownloads) => {
    set({ maxConcurrentDownloads })
    saveSettings({ ...get(), maxConcurrentDownloads })
  },
  setGlobalRateLimit: (globalRateLimit) => {
    set({ globalRateLimit })
    saveSettings({ ...get(), globalRateLimit })
  },

  setYtdlpPathOverride: (ytdlpPathOverride) => {
    set({ ytdlpPathOverride })
    saveSettings({ ...get(), ytdlpPathOverride })
  },
  setFfmpegPathOverride: (ffmpegPathOverride) => {
    set({ ffmpegPathOverride })
    saveSettings({ ...get(), ffmpegPathOverride })
  },
  setFfprobePathOverride: (ffprobePathOverride) => {
    set({ ffprobePathOverride })
    saveSettings({ ...get(), ffprobePathOverride })
  },
  setExternalDownloader: (externalDownloader) => {
    set({ externalDownloader })
    saveSettings({ ...get(), externalDownloader })
  },

  setCheckUpdatesOnStartup: (checkUpdatesOnStartup) => {
    set({ checkUpdatesOnStartup })
    saveSettings({ ...get(), checkUpdatesOnStartup })
  },
  setCheckYtdlpUpdatesWeekly: (checkYtdlpUpdatesWeekly) => {
    set({ checkYtdlpUpdatesWeekly })
    saveSettings({ ...get(), checkYtdlpUpdatesWeekly })
  },
  setUpdateChannel: (updateChannel) => {
    set({ updateChannel })
    saveSettings({ ...get(), updateChannel })
  },

  setNotifyOnComplete: (notifyOnComplete) => {
    set({ notifyOnComplete })
    saveSettings({ ...get(), notifyOnComplete })
  },
  setNotifyOnError: (notifyOnError) => {
    set({ notifyOnError })
    saveSettings({ ...get(), notifyOnError })
  },
  setNotificationSound: (notificationSound) => {
    set({ notificationSound })
    saveSettings({ ...get(), notificationSound })
  },

  setHistoryMaxEntries: (historyMaxEntries) => {
    set({ historyMaxEntries })
    saveSettings({ ...get(), historyMaxEntries })
  },
  setSocketTimeout: (socketTimeout) => {
    set({ socketTimeout })
    saveSettings({ ...get(), socketTimeout })
  },
  setProxyUrl: (proxyUrl) => {
    set({ proxyUrl })
    saveSettings({ ...get(), proxyUrl })
  },
  setCacheDir: (cacheDir) => {
    set({ cacheDir })
    saveSettings({ ...get(), cacheDir })
  },
  setDebugLogging: (debugLogging) => {
    set({ debugLogging })
    saveSettings({ ...get(), debugLogging })
  },
  setMinimizeToTray: (minimizeToTray) => {
    set({ minimizeToTray })
    saveSettings({ ...get(), minimizeToTray })
  },

  resetSettings: () => {
    applyTheme(DEFAULT_SETTINGS.theme)
    set({ ...DEFAULT_SETTINGS })
    saveSettings({ ...DEFAULT_SETTINGS })
  },
}))
