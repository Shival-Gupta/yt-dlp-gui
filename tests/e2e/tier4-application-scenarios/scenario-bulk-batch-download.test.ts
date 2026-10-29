import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildYtdlpArgs } from '../../helpers/cli-generator';
import { HistoryStore } from '../../helpers/history-store';
import { MockTauriIpc } from '../../helpers/mock-ipc';

describe('Tier 4: Real-World Scenario 3 — Bulk Batch Download of 50 URLs', () => {
  const batchFixturePath = path.resolve(__dirname, '../../fixtures/sample_batch_urls.txt');
  const rawFile = fs.readFileSync(batchFixturePath, 'utf-8');

  it('should parse 50 valid URLs from file, filtering empty lines and comments', () => {
    const urls = rawFile
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));

    expect(urls).toHaveLength(50);
    expect(urls.every(u => u.startsWith('http://') || u.startsWith('https://'))).toBe(true);
  });

  it('should configure bulk batch job with rate limiting, retries, and proxy', async () => {
    const urls = rawFile
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));

    const options = {
      urls,
      rateLimit: '5M',
      retries: 5,
      proxy: 'http://proxy.local:8080',
      outputDir: 'D:\\BatchDownloads',
      formatSelection: 'bv*[height<=1080]+ba/b',
      noOverwrites: true,
      continueDownload: true,
    };

    const args = buildYtdlpArgs(options);

    expect(args).toContain('-r');
    expect(args[args.indexOf('-r') + 1]).toBe('5M');
    expect(args).toContain('-R');
    expect(args[args.indexOf('-R') + 1]).toBe('5');
    expect(args).toContain('--proxy');
    expect(args[args.indexOf('--proxy') + 1]).toBe('http://proxy.local:8080');
    expect(args).toContain('-w');
    expect(args).toContain('-c');

    // All 50 URLs appended at the end
    const last50Args = args.slice(-50);
    expect(last50Args).toEqual(urls);

    // Simulate batch execution into history
    const ipc = new MockTauriIpc();
    const history = new HistoryStore(500);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const { jobId } = await ipc.spawn_ytdlp(['-f', 'best', url]);
      ipc.emit('ytdlp-done', { jobId, exitCode: 0, success: true });
      history.addEntry({
        id: jobId,
        url,
        title: `Batch Item ${i + 1}`,
        outputPath: `D:\\BatchDownloads\\item_${i + 1}.mp4`,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
    }

    expect(history.count()).toBe(50);
    expect(history.getAll()[0].url).toBe(urls[0]);
    expect(history.getAll()[49].url).toBe(urls[49]);
  });
});
