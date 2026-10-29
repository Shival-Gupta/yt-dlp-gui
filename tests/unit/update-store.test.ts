import { describe, it, expect, beforeEach } from 'vitest'
import { useUpdateStore } from '../../src/stores/updateStore'

describe('Unit: useUpdateStore', () => {
  beforeEach(() => {
    useUpdateStore.getState().clearAppUpdate()
  })

  it('should initialize with no active update', () => {
    const state = useUpdateStore.getState()
    expect(state.appUpdate).toBeNull()
    expect(state.isDownloadingUpdate).toBe(false)
    expect(state.updateReadyToRestart).toBe(false)
  })

  it('should set and clear app update info', () => {
    const store = useUpdateStore.getState()
    store.setAppUpdate({
      version: '1.2.0',
      notes: 'Added dark mode improvements and faster ffmpeg probe',
    })

    expect(useUpdateStore.getState().appUpdate?.version).toBe('1.2.0')

    store.clearAppUpdate()
    expect(useUpdateStore.getState().appUpdate).toBeNull()
  })

  it('should track download progress and ready to restart transition', () => {
    const store = useUpdateStore.getState()
    store.setIsDownloadingUpdate(true)
    store.setDownloadProgress(45)

    expect(useUpdateStore.getState().isDownloadingUpdate).toBe(true)
    expect(useUpdateStore.getState().downloadProgress).toBe(45)

    store.setDownloadProgress(100)
    store.setUpdateReadyToRestart(true)

    expect(useUpdateStore.getState().updateReadyToRestart).toBe(true)
  })

  it('should record yt-dlp version info', () => {
    const store = useUpdateStore.getState()
    store.setYtdlpUpdate({
      currentVersion: '2026.10.01',
      latestVersion: '2026.10.26',
    })

    expect(useUpdateStore.getState().ytdlpUpdate?.latestVersion).toBe('2026.10.26')
  })
})
