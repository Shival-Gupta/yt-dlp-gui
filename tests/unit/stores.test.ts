import { describe, it, expect, beforeEach } from 'vitest'
import { useDownloadStore } from '../../src/stores/downloadStore'
import { useQueueStore } from '../../src/stores/queueStore'
import { useSettingsStore } from '../../src/stores/settingsStore'

describe('Zustand Stores', () => {
  beforeEach(() => {
    useDownloadStore.setState({ jobs: {} })
    useQueueStore.setState({ items: [], isPaused: false })
  })

  describe('downloadStore', () => {
    it('adds and updates download jobs', () => {
      const store = useDownloadStore.getState()
      store.addJob({
        id: 'job-1',
        url: 'https://youtube.com/watch?v=1',
        title: 'Test Video 1',
        progress: 0,
        status: 'downloading',
        startedAt: Date.now(),
      })

      expect(useDownloadStore.getState().jobs['job-1']).toBeDefined()
      expect(useDownloadStore.getState().activeCount()).toBe(1)

      useDownloadStore.getState().updateJob('job-1', { progress: 75 })
      expect(useDownloadStore.getState().jobs['job-1'].progress).toBe(75)

      useDownloadStore.getState().updateJob('job-1', { status: 'done', progress: 100 })
      expect(useDownloadStore.getState().activeCount()).toBe(0)
      expect(useDownloadStore.getState().doneCount()).toBe(1)
    })

    it('clears finished jobs', () => {
      const store = useDownloadStore.getState()
      store.addJob({
        id: 'job-1',
        url: 'https://youtube.com/watch?v=1',
        progress: 100,
        status: 'done',
        startedAt: Date.now(),
      })
      store.addJob({
        id: 'job-2',
        url: 'https://youtube.com/watch?v=2',
        progress: 20,
        status: 'downloading',
        startedAt: Date.now(),
      })

      expect(Object.keys(useDownloadStore.getState().jobs).length).toBe(2)
      useDownloadStore.getState().clearFinished()
      expect(Object.keys(useDownloadStore.getState().jobs).length).toBe(1)
      expect(useDownloadStore.getState().jobs['job-2']).toBeDefined()
    })
  })

  describe('queueStore', () => {
    it('adds, removes, and manages URL queue', () => {
      const store = useQueueStore.getState()
      store.addUrls(['https://url1.com', 'https://url2.com', 'https://url1.com'])

      expect(useQueueStore.getState().items.length).toBe(2) // deduplicated
      expect(useQueueStore.getState().items[0].url).toBe('https://url1.com')

      store.removeUrl('https://url1.com')
      expect(useQueueStore.getState().items.length).toBe(1)
      expect(useQueueStore.getState().items[0].url).toBe('https://url2.com')

      store.clearQueue()
      expect(useQueueStore.getState().items.length).toBe(0)
    })
  })

  describe('settingsStore', () => {
    it('sets and updates settings values', () => {
      const store = useSettingsStore.getState()
      store.setTheme('dark')
      expect(useSettingsStore.getState().theme).toBe('dark')

      store.setTheme('light')
      expect(useSettingsStore.getState().theme).toBe('light')

      store.setMaxConcurrentDownloads(5)
      expect(useSettingsStore.getState().maxConcurrentDownloads).toBe(5)
    })
  })
})
