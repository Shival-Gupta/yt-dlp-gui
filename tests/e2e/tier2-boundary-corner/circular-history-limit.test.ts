import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { HistoryStore, HistoryEntry } from '../../../src/stores/historyStore';

describe('Tier 2: Boundary & Corner Cases — Circular History Limit (500 entries)', () => {
  const seedPath = path.resolve(__dirname, '../../fixtures/history_seed.json');
  const seedEntries: HistoryEntry[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  it('should verify fixture contains 520 records', () => {
    expect(seedEntries).toHaveLength(520);
  });

  it('should strictly cap history at 500 entries when loading 520 records', () => {
    const store = new HistoryStore(500);

    for (const entry of seedEntries) {
      store.addEntry(entry);
    }

    expect(store.count()).toBe(500);
  });

  it('should drop oldest 20 entries in strict FIFO order', () => {
    const store = new HistoryStore(500);

    for (const entry of seedEntries) {
      store.addEntry(entry);
    }

    const currentEntries = store.getAll();
    expect(currentEntries).toHaveLength(500);

    // Oldest 20 entries (IDs job-seed-0001 to job-seed-0020) must be dropped
    for (let i = 1; i <= 20; i++) {
      const id = `job-seed-${String(i).padStart(4, '0')}`;
      const found = currentEntries.find(e => e.id === id);
      expect(found).toBeUndefined();
    }

    // 21st entry (job-seed-0021) should be the oldest retained entry (at index 0)
    expect(currentEntries[0].id).toBe('job-seed-0021');

    // 520th entry (job-seed-0520) should be the newest retained entry (at index 499)
    expect(currentEntries[499].id).toBe('job-seed-0520');
  });

  it('should support searching and sorting across circular history buffer', () => {
    const store = new HistoryStore(500, seedEntries);

    const searchResults = store.search('Test Video #100');
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults[0].title).toContain('Test Video #100');

    const sortedByDateAsc = store.sortBy('date', true);
    expect(sortedByDateAsc[0].id).toBe('job-seed-0021');

    const sortedByDateDesc = store.sortBy('date', false);
    expect(sortedByDateDesc[0].id).toBe('job-seed-0520');
  });
});
