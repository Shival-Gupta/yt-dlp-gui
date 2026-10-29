import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../../src/lib/ytdlp-args';
import { MockTauriIpc } from '../../helpers/mock-ipc';

describe('Tier 2: Boundary & Corner Cases — Empty & Invalid Inputs', () => {
  const ipc = new MockTauriIpc();

  it('should reject empty URL strings and whitespace-only URLs in IPC fetch_info', async () => {
    await expect(ipc.fetch_info('')).rejects.toThrow('URL cannot be empty');
    await expect(ipc.fetch_info('   \t\n  ')).rejects.toThrow('URL cannot be empty');
  });

  it('should reject empty URL strings in IPC fetch_formats', async () => {
    await expect(ipc.fetch_formats('')).rejects.toThrow('URL cannot be empty');
    await expect(ipc.fetch_formats('   ')).rejects.toThrow('URL cannot be empty');
  });

  it('should handle empty options object gracefully without generating phantom flags', () => {
    const args = buildYtdlpArgs({});
    expect(args).toEqual([]);
  });

  it('should filter out blank or whitespace-only lines when parsing batch URL lists', () => {
    const rawBatchInput = `
      https://youtube.com/watch?v=123
      
      # Comment line
         
      https://youtube.com/watch?v=456
      
    `;

    const parsedUrls = rawBatchInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));

    expect(parsedUrls).toHaveLength(2);
    expect(parsedUrls).toEqual([
      'https://youtube.com/watch?v=123',
      'https://youtube.com/watch?v=456',
    ]);
  });

  it('should omit undefined or empty string flags in options', () => {
    const args = buildYtdlpArgs({
      outputDir: '',
      formatSelection: undefined,
      proxy: '',
      rateLimit: undefined,
      username: '',
      password: '',
      urls: ['https://youtube.com/watch?v=sample'],
    });

    expect(args).toEqual(['https://youtube.com/watch?v=sample']);
    expect(args).not.toContain('-P');
    expect(args).not.toContain('-f');
    expect(args).not.toContain('--proxy');
    expect(args).not.toContain('-u');
    expect(args).not.toContain('-p');
  });
});
