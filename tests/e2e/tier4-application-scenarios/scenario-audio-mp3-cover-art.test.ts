import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../helpers/cli-generator';
import { MockTauriIpc } from '../../helpers/mock-ipc';
import { HistoryStore } from '../../helpers/history-store';

describe('Tier 4: Real-World Scenario 2 — Audio-Only MP3 Extraction with Cover Art Embedding', () => {
  it('should execute end-to-end MP3 extraction workflow with high-res cover art', async () => {
    const ipc = new MockTauriIpc();
    const historyStore = new HistoryStore(500);

    const scenarioOptions = {
      urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      formatSelection: 'bestaudio/ba',
      extractAudio: true,
      audioFormat: 'mp3' as const,
      audioQuality: '0', // 320k / V0
      writeThumbnail: true,
      convertThumbnails: 'png',
      embedThumbnail: true,
      embedMetadata: true,
      outputDir: 'D:\\Music\\HiRes',
      outputTemplate: '%(artist)s - %(title)s.%(ext)s',
    };

    // 1. Build CLI arguments
    const cliArgs = buildYtdlpArgs(scenarioOptions);

    expect(cliArgs).toContain('-x');
    expect(cliArgs).toContain('--audio-format');
    expect(cliArgs[cliArgs.indexOf('--audio-format') + 1]).toBe('mp3');
    expect(cliArgs).toContain('--audio-quality');
    expect(cliArgs[cliArgs.indexOf('--audio-quality') + 1]).toBe('0');
    expect(cliArgs).toContain('--write-thumbnail');
    expect(cliArgs).toContain('--convert-thumbnails');
    expect(cliArgs[cliArgs.indexOf('--convert-thumbnails') + 1]).toBe('png');
    expect(cliArgs).toContain('--embed-thumbnail');
    expect(cliArgs).toContain('--embed-metadata');

    // 2. Spawn job
    const { jobId } = await ipc.spawn_ytdlp(cliArgs);
    expect(jobId).toBeTruthy();

    // 3. Complete and store in history
    ipc.emit('ytdlp-done', { jobId, exitCode: 0, success: true });
    historyStore.addEntry({
      id: jobId,
      url: scenarioOptions.urls[0],
      title: 'Never Gonna Give You Up',
      duration: 213,
      filesize: 8500000,
      format_id: 'ba_mp3_320k',
      preset: 'Audio Only MP3',
      outputPath: 'D:\\Music\\HiRes\\Rick Astley - Never Gonna Give You Up.mp3',
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    expect(historyStore.count()).toBe(1);
    const entry = historyStore.getAll()[0];
    expect(entry.preset).toBe('Audio Only MP3');
    expect(entry.outputPath.endsWith('.mp3')).toBe(true);
  });
});
