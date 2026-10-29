import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../helpers/cli-generator';
import { MockTauriIpc } from '../../helpers/mock-ipc';
import { parseProgressLine } from '../../helpers/progress-parser';
import { HistoryStore } from '../../helpers/history-store';

describe('Tier 4: Real-World Scenario 1 — YouTube 4K Video Download with Subtitles & Chapters', () => {
  it('should execute end-to-end 4K workflow with subs, chapters, and metadata', async () => {
    const ipc = new MockTauriIpc();
    const historyStore = new HistoryStore(500);

    const scenarioOptions = {
      urls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      formatSelection: 'bv*[height<=2160]+ba/b',
      mergeOutputFormat: 'mp4',
      writeSubs: true,
      writeAutoSubs: true,
      subLangs: ['en', 'es'],
      embedSubs: true,
      embedChapters: true,
      embedMetadata: true,
      writeInfoJson: true,
      outputDir: 'D:\\Videos\\4K',
      outputTemplate: '%(uploader)s/%(title)s [%(id)s].%(ext)s',
      windowsFilenames: true,
    };

    // 1. Build CLI arguments
    const cliArgs = buildYtdlpArgs(scenarioOptions);

    expect(cliArgs).toContain('-f');
    expect(cliArgs[cliArgs.indexOf('-f') + 1]).toBe('bv*[height<=2160]+ba/b');
    expect(cliArgs).toContain('--merge-output-format');
    expect(cliArgs).toContain('--write-subs');
    expect(cliArgs).toContain('--write-auto-subs');
    expect(cliArgs).toContain('--sub-langs');
    expect(cliArgs[cliArgs.indexOf('--sub-langs') + 1]).toBe('en,es');
    expect(cliArgs).toContain('--embed-subs');
    expect(cliArgs).toContain('--embed-chapters');
    expect(cliArgs).toContain('--embed-metadata');
    expect(cliArgs).toContain('--write-info-json');
    expect(cliArgs).toContain('--windows-filenames');
    expect(cliArgs[cliArgs.length - 1]).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // 2. Spawn sidecar job via IPC
    const { jobId } = await ipc.spawn_ytdlp(cliArgs);
    expect(jobId).toBeTruthy();

    const trackedJob = ipc.getTrackedJob(jobId);
    expect(trackedJob?.status).toBe('pending');

    // 3. Simulate streaming output events
    const streamOutputs = [
      '[info] dQw4w9WgXcQ: Downloading 1 format(s): 313+140',
      '{"status":"downloading","downloaded_bytes":10000000,"total_bytes":190000000,"speed":5000000,"eta":36,"_percent_str":"5.2%"}',
      '{"status":"downloading","downloaded_bytes":95000000,"total_bytes":190000000,"speed":7500000,"eta":12,"_percent_str":"50.0%"}',
      '{"status":"downloading","downloaded_bytes":190000000,"total_bytes":190000000,"speed":8000000,"eta":0,"_percent_str":"100.0%"}',
      '[Merger] Merging formats into "D:\\Videos\\4K\\Rick Astley\\Never Gonna Give You Up [dQw4w9WgXcQ].mp4"',
    ];

    for (const line of streamOutputs) {
      ipc.emit('ytdlp-output', { jobId, line, stream: 'stdout' });
      const parsed = parseProgressLine(line);
      if (parsed) {
        expect(['downloading', 'finished']).toContain(parsed.status);
      }
    }

    // 4. Complete job
    ipc.emit('ytdlp-done', { jobId, exitCode: 0, success: true });

    // 5. Store in history
    historyStore.addEntry({
      id: jobId,
      url: scenarioOptions.urls[0],
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      duration: 213,
      filesize: 190000000,
      format_id: '313+140',
      preset: 'Custom 4K',
      outputPath: 'D:\\Videos\\4K\\Rick Astley\\Never Gonna Give You Up [dQw4w9WgXcQ].mp4',
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    expect(historyStore.count()).toBe(1);
    const recorded = historyStore.getAll()[0];
    expect(recorded.title).toContain('Never Gonna Give You Up');
    expect(recorded.format_id).toBe('313+140');
  });
});
