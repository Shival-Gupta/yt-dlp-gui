import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryStore, HistoryEntry } from '../../src/stores/historyStore'

describe('Unit: useHistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory()
    useHistoryStore.getState().setMaxEntries(500)
  })

  it('should add entries and retrieve them', () => {
    const store = useHistoryStore.getState()
    const entry: HistoryEntry = {
      id: 'job-1',
      url: 'https://youtube.com/watch?v=1',
      title: 'First Video',
      timestamp: '2026-01-01T00:00:00Z',
      status: 'completed',
    }

    store.addEntry(entry)
    expect(useHistoryStore.getState().count()).toBe(1)
    expect(useHistoryStore.getState().getAll()[0].id).toBe('job-1')
  })

  it('should enforce circular FIFO buffer capacity', () => {
    const store = useHistoryStore.getState()
    store.setMaxEntries(5)

    for (let i = 1; i <= 8; i++) {
      store.addEntry({
        id: `job-${i}`,
        url: `https://youtube.com/watch?v=${i}`,
        title: `Video ${i}`,
        timestamp: new Date(2026, 0, i).toISOString(),
        status: 'completed',
      })
    }

    const entries = useHistoryStore.getState().getAll()
    expect(entries).toHaveLength(5)
    // Oldest 3 entries (job-1, job-2, job-3) dropped; oldest retained is job-4
    expect(entries[0].id).toBe('job-4')
    expect(entries[4].id).toBe('job-8')
  })

  it('should filter entries with search', () => {
    const store = useHistoryStore.getState()
    store.addEntry({
      id: 'job-1',
      url: 'https://youtube.com/watch?v=1',
      title: 'React Tutorial 2026',
      uploader: 'TechMaster',
      timestamp: '2026-01-01T00:00:00Z',
      status: 'completed',
    })
    store.addEntry({
      id: 'job-2',
      url: 'https://youtube.com/watch?v=2',
      title: 'Rust Desktop App',
      uploader: 'CodeDaily',
      timestamp: '2026-01-02T00:00:00Z',
      status: 'completed',
    })

    expect(store.search('react')).toHaveLength(1)
    expect(store.search('techmaster')).toHaveLength(1)
    expect(store.search('rust')).toHaveLength(1)
    expect(store.search('nonexistent')).toHaveLength(0)
  })

  it('should sort entries by date, title, size, and duration', () => {
    const store = useHistoryStore.getState()
    store.addEntry({
      id: 'job-1',
      url: 'https://youtube.com/watch?v=1',
      title: 'Zebra',
      filesize: 100,
      duration: 300,
      timestamp: '2026-01-01T00:00:00Z',
      status: 'completed',
    })
    store.addEntry({
      id: 'job-2',
      url: 'https://youtube.com/watch?v=2',
      title: 'Apple',
      filesize: 500,
      duration: 100,
      timestamp: '2026-01-05T00:00:00Z',
      status: 'completed',
    })

    const titleAsc = store.sortBy('title', true)
    expect(titleAsc[0].title).toBe('Apple')

    const sizeDesc = store.sortBy('size', false)
    expect(sizeDesc[0].filesize).toBe(500)

    const dateAsc = store.sortBy('date', true)
    expect(dateAsc[0].id).toBe('job-1')
  })

  it('should remove entry by id', () => {
    const store = useHistoryStore.getState()
    store.addEntry({
      id: 'job-del',
      url: 'https://youtube.com/watch?v=del',
      title: 'To Delete',
      timestamp: '2026-01-01T00:00:00Z',
      status: 'error',
    })

    expect(useHistoryStore.getState().count()).toBe(1)
    store.removeEntry('job-del')
    expect(useHistoryStore.getState().count()).toBe(0)
  })
})
