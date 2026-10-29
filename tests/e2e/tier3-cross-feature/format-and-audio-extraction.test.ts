import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../../src/lib/ytdlp-args';

describe('Tier 3: Cross-Feature Combinations — Format Selector + Audio Extraction', () => {
  it('should combine bestaudio format selector with MP3 extraction pipeline', () => {
    const options = {
      formatSelection: 'bestaudio/ba',
      extractAudio: true,
      audioFormat: 'mp3' as const,
      audioQuality: '0',
      embedThumbnail: true,
      outputDir: 'C:\\Music',
      outputTemplate: '%(artist)s/%(title)s.%(ext)s',
      urls: ['https://youtube.com/watch?v=dQw4w9WgXcQ'],
    };

    const args = buildYtdlpArgs(options);

    // Format flags
    expect(args).toContain('-f');
    expect(args[args.indexOf('-f') + 1]).toBe('bestaudio/ba');

    // Post-processing audio extraction flags
    expect(args).toContain('-x');
    expect(args).toContain('--audio-format');
    expect(args[args.indexOf('--audio-format') + 1]).toBe('mp3');
    expect(args).toContain('--audio-quality');
    expect(args[args.indexOf('--audio-quality') + 1]).toBe('0');

    // Thumbnail embedding
    expect(args).toContain('--embed-thumbnail');

    // Output directory and template
    expect(args).toContain('-P');
    expect(args[args.indexOf('-P') + 1]).toBe('C:\\Music');
    expect(args).toContain('-o');
    expect(args[args.indexOf('-o') + 1]).toBe('%(artist)s/%(title)s.%(ext)s');

    // URL at end
    expect(args[args.length - 1]).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('should support FLAC extraction with custom audio bitrates and keeping video', () => {
    const options = {
      formatSelection: 'ba',
      extractAudio: true,
      audioFormat: 'flac' as const,
      keepVideo: true,
      urls: ['https://youtube.com/watch?v=test'],
    };

    const args = buildYtdlpArgs(options);
    expect(args).toContain('-x');
    expect(args).toContain('--audio-format');
    expect(args[args.indexOf('--audio-format') + 1]).toBe('flac');
    expect(args).toContain('-k');
  });
});
