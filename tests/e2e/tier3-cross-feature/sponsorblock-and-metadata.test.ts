import { describe, it, expect } from 'vitest';
import { buildYtdlpArgs } from '../../../src/lib/ytdlp-args';

describe('Tier 3: Cross-Feature Combinations — SponsorBlock + Metadata & Chapters', () => {
  it('should simultaneously combine SponsorBlock category removal with metadata embedding', () => {
    const options = {
      sponsorblockRemove: ['sponsor', 'intro', 'outro', 'selfpromo'],
      sponsorblockApi: 'https://sponsor.ajay.app',
      embedMetadata: true,
      embedChapters: true,
      writeInfoJson: true,
      writeDescription: true,
      splitChapters: false,
      urls: ['https://youtube.com/watch?v=sample123'],
    };

    const args = buildYtdlpArgs(options);

    // SponsorBlock flags
    expect(args).toContain('--sponsorblock-remove');
    expect(args[args.indexOf('--sponsorblock-remove') + 1]).toBe('sponsor,intro,outro,selfpromo');
    expect(args).toContain('--sponsorblock-api');
    expect(args[args.indexOf('--sponsorblock-api') + 1]).toBe('https://sponsor.ajay.app');

    // Metadata flags
    expect(args).toContain('--embed-metadata');
    expect(args).toContain('--embed-chapters');
    expect(args).toContain('--write-info-json');
    expect(args).toContain('--write-description');

    // URL correctly placed
    expect(args[args.length - 1]).toBe('https://youtube.com/watch?v=sample123');
  });

  it('should support chapter splitting alongside SponsorBlock marking', () => {
    const options = {
      sponsorblockMark: ['all'],
      splitChapters: true,
      urls: ['https://youtube.com/watch?v=sample123'],
    };

    const args = buildYtdlpArgs(options);
    expect(args).toContain('--sponsorblock-mark');
    expect(args[args.indexOf('--sponsorblock-mark') + 1]).toBe('all');
    expect(args).toContain('--split-chapters');
  });
});
