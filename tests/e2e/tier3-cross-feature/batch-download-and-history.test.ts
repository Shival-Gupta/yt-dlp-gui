import { describe, it, expect } from 'vitest';
import { HistoryStore } from '../../helpers/history-store';
import { MockTauriIpc } from '../../helpers/mock-ipc';
import { parseProgressLine } from '../../helpers/progress-parser';

describe('Tier 3: Cross-Feature Combinations — Batch Download & History Tracking', () => {
  it('should process a batch of URLs through IPC, parse progress, and record entries in history', async () => {
    const ipc = new MockTauriIpc();
    const historyStore = new HistoryStore(500);

    const urls = [
      'https://youtube.com/watch?v=batch1',
      'https://youtube.com/watch?v=batch2',
      'https://youtube.com/watch?v=batch3',
      'https://youtube.com/watch?v=batch4',
      'https://youtube.com/watch?v=batch5',
    ];

    const completedJobs: string[] = [];

    // Listen for completion events
    ipc.on('ytdlp-done', (payload: any) => {
      if (payload.success) {
        completedJobs.push(payload.jobId);
      }
    });

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const { jobId } = await ipc.spawn_ytdlp(['-f', 'best', url]);

      // Simulate output streaming
      const rawProgress = `{"status":"downloading","downloaded_bytes":1000,"total_bytes":2000,"speed":1000,"eta":1,"_percent_str":"50%"}`;
      const parsed = parseProgressLine(rawProgress);
      expect(parsed?.status).toBe('downloading');

      // Finish job
      ipc.emit('ytdlp-done', { jobId, exitCode: 0, success: true });

      // Record in history
      historyStore.addEntry({
        id: jobId,
        url,
        title: `Batch Video ${i + 1}`,
        duration: 120,
        filesize: 10485760,
        outputPath: `C:\\Downloads\\video_${i + 1}.mp4`,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
    }

    expect(completedJobs).toHaveLength(5);
    expect(historyStore.count()).toBe(5);

    // Verify all 5 batch items are retrieved from history
    const allHistory = historyStore.getAll();
    expect(allHistory.map(h => h.url)).toEqual(urls);
  });
});
