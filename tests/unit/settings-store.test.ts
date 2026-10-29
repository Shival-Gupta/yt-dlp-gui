import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../../src/stores/settingsStore'

describe('Unit: useSettingsStore (7-Section Configuration)', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings()
  })

  it('should update Appearance settings', () => {
    const store = useSettingsStore.getState()
    store.setTheme('light')
    expect(useSettingsStore.getState().theme).toBe('light')

    store.setFontScale('large')
    expect(useSettingsStore.getState().fontScale).toBe('large')

    store.setWindowOpacity(85)
    expect(useSettingsStore.getState().windowOpacity).toBe(85)

    store.setHighContrast(true)
    expect(useSettingsStore.getState().highContrast).toBe(true)
  })

  it('should update Download settings', () => {
    const store = useSettingsStore.getState()
    store.setDefaultOutputDir('D:\\MyMedia')
    expect(useSettingsStore.getState().defaultOutputDir).toBe('D:\\MyMedia')

    store.setDefaultOutputTemplate('%(uploader)s/%(title)s.%(ext)s')
    expect(useSettingsStore.getState().defaultOutputTemplate).toBe('%(uploader)s/%(title)s.%(ext)s')

    store.setMaxConcurrentDownloads(5)
    expect(useSettingsStore.getState().maxConcurrentDownloads).toBe(5)

    store.setGlobalRateLimit('10M')
    expect(useSettingsStore.getState().globalRateLimit).toBe('10M')
  })

  it('should update Tools settings', () => {
    const store = useSettingsStore.getState()
    store.setYtdlpPathOverride('C:\\tools\\yt-dlp.exe')
    expect(useSettingsStore.getState().ytdlpPathOverride).toBe('C:\\tools\\yt-dlp.exe')

    store.setFfmpegPathOverride('C:\\tools\\ffmpeg.exe')
    expect(useSettingsStore.getState().ffmpegPathOverride).toBe('C:\\tools\\ffmpeg.exe')

    store.setExternalDownloader('aria2c')
    expect(useSettingsStore.getState().externalDownloader).toBe('aria2c')
  })

  it('should update Notification and Update settings', () => {
    const store = useSettingsStore.getState()
    store.setNotifyOnComplete(false)
    expect(useSettingsStore.getState().notifyOnComplete).toBe(false)

    store.setNotifyOnError(false)
    expect(useSettingsStore.getState().notifyOnError).toBe(false)

    store.setUpdateChannel('nightly')
    expect(useSettingsStore.getState().updateChannel).toBe('nightly')
  })

  it('should update Advanced settings and reset to defaults', () => {
    const store = useSettingsStore.getState()
    store.setHistoryMaxEntries(1000)
    expect(useSettingsStore.getState().historyMaxEntries).toBe(1000)

    store.setSocketTimeout(60)
    expect(useSettingsStore.getState().socketTimeout).toBe(60)

    store.setProxyUrl('socks5://127.0.0.1:9050')
    expect(useSettingsStore.getState().proxyUrl).toBe('socks5://127.0.0.1:9050')

    // Reset
    store.resetSettings()
    const resetState = useSettingsStore.getState()
    expect(resetState.historyMaxEntries).toBe(500)
    expect(resetState.socketTimeout).toBe(30)
    expect(resetState.proxyUrl).toBe('')
    expect(resetState.theme).toBe('dark')
  })
})
