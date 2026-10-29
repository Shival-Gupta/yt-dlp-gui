import { HistoryEntry } from './contracts';

/**
 * Manages download history with a circular FIFO buffer.
 * Max entries strictly capped at 500 (or configured limit).
 */
export class HistoryStore {
  private entries: HistoryEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 500, initialEntries: HistoryEntry[] = []) {
    this.maxEntries = maxEntries;
    if (initialEntries && initialEntries.length > 0) {
      for (const entry of initialEntries) {
        this.addEntry(entry);
      }
    }
  }

  public addEntry(entry: HistoryEntry): void {
    // If buffer is full, remove oldest entry (FIFO: shift from beginning)
    if (this.entries.length >= this.maxEntries) {
      this.entries.shift();
    }
    this.entries.push(entry);
  }

  public getAll(): HistoryEntry[] {
    return [...this.entries];
  }

  public count(): number {
    return this.entries.length;
  }

  public clear(): void {
    this.entries = [];
  }

  public search(query: string): HistoryEntry[] {
    if (!query || query.trim().length === 0) return this.getAll();
    const q = query.toLowerCase().trim();
    return this.entries.filter(
      e => e.title.toLowerCase().includes(q) || e.url.toLowerCase().includes(q)
    );
  }

  public sortBy(field: 'date' | 'title' | 'size', ascending = false): HistoryEntry[] {
    const sorted = [...this.entries];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (field === 'date') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (field === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (field === 'size') {
        cmp = (a.filesize || 0) - (b.filesize || 0);
      }
      return ascending ? cmp : -cmp;
    });
    return sorted;
  }
}
