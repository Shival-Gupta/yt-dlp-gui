import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryStore, HistoryEntry } from '../../src/stores/historyStore'
import { HistoryStore as HelperHistoryStore } from '../helpers/history-store'

describe('Adversarial Stress: Circular History Store', () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory()
    useHistoryStore.getState().setMaxEntries(500)
  })

  describe('1. Capacity Enforcement and FIFO Eviction Under Rapid Load', () => {
    it('should strictly enforce 500 max limit when sequentially inserting 1,000 records', () => {
      const store = useHistoryStore.getState()

      for (let i = 1; i <= 1000; i++) {
        store.addEntry({
          id: `entry-${i}`,
          url: `https://youtube.com/watch?v=${i}`,
          title: `Video #${i}`,
          timestamp: new Date(2026, 0, 1, 0, 0, i).toISOString(),
          status: 'completed',
          filesize: i * 1000,
        })
      }

      const entries = useHistoryStore.getState().getAll()
      expect(entries).toHaveLength(500)
      // Strict FIFO eviction: first 500 (1..500) must have been dropped
      // Entry 501 must be the oldest retained entry at index 0
      expect(entries[0].id).toBe('entry-501')
      // Entry 1000 must be the newest entry at index 499
      expect(entries[499].id).toBe('entry-1000')
    })

    it('should strictly enforce capacity under rapid concurrent asynchronous insertions', async () => {
      const store = useHistoryStore.getState()

      // Spawn 50 asynchronous concurrent tasks inserting 20 entries each (total 1,000 entries)
      const tasks: Promise<void>[] = []
      for (let worker = 0; worker < 50; worker++) {
        tasks.push(
          (async () => {
            for (let j = 0; j < 20; j++) {
              const id = `concurrent-${worker}-${j}`
              useHistoryStore.getState().addEntry({
                id,
                url: `https://youtube.com/watch?v=${id}`,
                title: `Concurrent Video ${id}`,
                timestamp: new Date().toISOString(),
                status: 'completed',
              })
              // Tiny yield to simulate microtask interleaving
              if (j % 5 === 0) {
                await new Promise((r) => setTimeout(r, 0))
              }
            }
          })()
        )
      }

      await Promise.all(tasks)

      const finalCount = useHistoryStore.getState().count()
      console.log('Final count after concurrent insertions:', finalCount)
      expect(finalCount).toBe(500)
    })

    it('should handle boundary exact transitions: 499 -> 500 -> 501 entries', () => {
      const store = useHistoryStore.getState()
      for (let i = 1; i <= 499; i++) {
        store.addEntry({
          id: `b-${i}`,
          url: `https://example.com/${i}`,
          title: `Item ${i}`,
          timestamp: new Date().toISOString(),
          status: 'completed',
        })
      }
      expect(useHistoryStore.getState().count()).toBe(499)

      // Add 500th
      store.addEntry({
        id: 'b-500',
        url: 'https://example.com/500',
        title: 'Item 500',
        timestamp: new Date().toISOString(),
        status: 'completed',
      })
      expect(useHistoryStore.getState().count()).toBe(500)
      expect(useHistoryStore.getState().getAll()[0].id).toBe('b-1')

      // Add 501st
      store.addEntry({
        id: 'b-501',
        url: 'https://example.com/501',
        title: 'Item 501',
        timestamp: new Date().toISOString(),
        status: 'completed',
      })
      expect(useHistoryStore.getState().count()).toBe(500)
      expect(useHistoryStore.getState().getAll()[0].id).toBe('b-2')
      expect(useHistoryStore.getState().getAll()[499].id).toBe('b-501')
    })
  })

  describe('2. Dynamic Capacity Resizing', () => {
    it('should evict excess entries immediately when maxEntries is lowered', () => {
      const store = useHistoryStore.getState()
      for (let i = 1; i <= 100; i++) {
        store.addEntry({
          id: `item-${i}`,
          url: `https://example.com/${i}`,
          title: `Title ${i}`,
          timestamp: new Date().toISOString(),
          status: 'completed',
        })
      }
      expect(useHistoryStore.getState().count()).toBe(100)

      // Lower limit to 10
      store.setMaxEntries(10)
      expect(useHistoryStore.getState().count()).toBe(10)
      // Should retain the 10 newest (item-91 to item-100)
      const retained = useHistoryStore.getState().getAll()
      expect(retained[0].id).toBe('item-91')
      expect(retained[9].id).toBe('item-100')
    })

    it('should enforce minimum capacity of 1 when maxEntries is 0 or negative', () => {
      const store = useHistoryStore.getState()
      store.setMaxEntries(0)
      expect(useHistoryStore.getState().maxEntries).toBe(1)
      store.setMaxEntries(-50)
      expect(useHistoryStore.getState().maxEntries).toBe(1)
    })
  })

  describe('3. Adversarial Search Queries & Special Characters', () => {
    it('should safely handle regex metacharacters in search query without crashing', () => {
      const store = useHistoryStore.getState()
      store.addEntry({
        id: 'spec-1',
        url: 'https://youtube.com/watch?v=spec1',
        title: 'Video with [brackets] and (parentheses) + plus * star',
        uploader: 'Artist & Co.',
        timestamp: new Date().toISOString(),
        status: 'completed',
      })

      const dangerousQueries = [
        '[',
        '([a-z]+)',
        '\\',
        '*',
        '+',
        '.*',
        '?',
        '{1,5}',
        '^.*$',
      ]

      for (const q of dangerousQueries) {
        expect(() => store.search(q)).not.toThrow()
      }
      expect(store.search('[brackets]')).toHaveLength(1)
      expect(store.search('+ plus')).toHaveLength(1)
    })

    it('should handle extremely long search strings gracefully', () => {
      const store = useHistoryStore.getState()
      store.addEntry({
        id: '1',
        url: 'https://example.com',
        title: 'Normal Title',
        timestamp: new Date().toISOString(),
        status: 'completed',
      })

      const longQuery = 'A'.repeat(50000)
      expect(() => store.search(longQuery)).not.toThrow()
      expect(store.search(longQuery)).toHaveLength(0)
    })

    it('adversarial check: search when an entry has undefined title, url, or uploader', () => {
      const store = useHistoryStore.getState()
      // Malformed entry with missing or non-string fields
      store.addEntry({
        id: 'corrupt-1',
        url: undefined as any,
        title: undefined as any,
        uploader: undefined,
        timestamp: new Date().toISOString(),
        status: 'error',
      })

      expect(() => store.search('test')).not.toThrow()
    })

    it('adversarial check: helper history store throws on undefined title in search', () => {
      const helper = new HelperHistoryStore(500)
      helper.addEntry({
        id: 'c-1',
        url: 'https://example.com',
        title: undefined as any,
        timestamp: new Date().toISOString(),
        status: 'completed',
      })

      // In HelperHistoryStore line 44: e.title.toLowerCase().includes(q)
      // When title is undefined, e.title.toLowerCase() throws TypeError!
      expect(() => helper.search('test')).not.toThrow()
    })
  })

  describe('4. Adversarial Sorting Under Corrupted or Missing Fields', () => {
    it('should sort safely when timestamps are invalid date strings or missing', () => {
      const store = useHistoryStore.getState()
      store.addEntry({
        id: 'd-1',
        url: 'https://example.com/1',
        title: 'Item 1',
        timestamp: 'invalid-date-string',
        status: 'completed',
      })
      store.addEntry({
        id: 'd-2',
        url: 'https://example.com/2',
        title: 'Item 2',
        timestamp: '',
        status: 'completed',
      })
      store.addEntry({
        id: 'd-3',
        url: 'https://example.com/3',
        title: 'Item 3',
        timestamp: new Date(2026, 5, 1).toISOString(),
        status: 'completed',
      })

      expect(() => store.sortBy('date')).not.toThrow()
      const sorted = store.sortBy('date', true)
      expect(sorted).toHaveLength(3)
    })

    it('should sort safely when filesize or duration is NaN, negative, or undefined', () => {
      const store = useHistoryStore.getState()
      store.addEntry({
        id: 's-1',
        url: 'https://example.com/1',
        title: 'Item 1',
        filesize: NaN,
        duration: undefined,
        timestamp: new Date().toISOString(),
        status: 'completed',
      })
      store.addEntry({
        id: 's-2',
        url: 'https://example.com/2',
        title: 'Item 2',
        filesize: 1000,
        duration: 60,
        timestamp: new Date().toISOString(),
        status: 'completed',
      })

      expect(() => store.sortBy('size')).not.toThrow()
      expect(() => store.sortBy('duration')).not.toThrow()
      expect(store.sortBy('size')).toHaveLength(2)
    })
  })
})
