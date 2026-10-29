import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseFormatTable } from '../../../src/lib/format-utils';

describe('Tier 1: Feature Coverage — Format Parsing', () => {
  const fixturePath = path.resolve(__dirname, '../../fixtures/raw_formats_output.txt');
  const rawTable = fs.readFileSync(fixturePath, 'utf-8');

  it('should parse raw table into non-empty format objects list', () => {
    const formats = parseFormatTable(rawTable);
    expect(formats.length).toBeGreaterThan(15);
  });

  it('should correctly identify audio-only formats', () => {
    const formats = parseFormatTable(rawTable);
    const audioFormats = formats.filter(f => f.isAudioOnly);
    expect(audioFormats.length).toBeGreaterThanOrEqual(4);

    const f140 = audioFormats.find(f => f.format_id === '140');
    expect(f140).toBeDefined();
    expect(f140?.ext).toBe('m4a');
    expect(f140?.resolution).toBe('audio only');
    expect(f140?.vcodec).toBe('none');
    expect(f140?.acodec).toBe('mp4a');

    const f251 = audioFormats.find(f => f.format_id === '251');
    expect(f251).toBeDefined();
    expect(f251?.ext).toBe('webm');
    expect(f251?.acodec).toBe('opus');
  });

  it('should correctly identify video-only formats and parse resolutions/fps', () => {
    const formats = parseFormatTable(rawTable);
    const videoFormats = formats.filter(f => f.isVideoOnly);
    expect(videoFormats.length).toBeGreaterThanOrEqual(10);

    const f137 = videoFormats.find(f => f.format_id === '137');
    expect(f137).toBeDefined();
    expect(f137?.resolution).toBe('1920x1080');
    expect(f137?.fps).toBe(30);
    expect(f137?.acodec).toBe('none');
    expect(f137?.vcodec).toBe('avc1');

    const f313 = videoFormats.find(f => f.format_id === '313');
    expect(f313).toBeDefined();
    expect(f313?.resolution).toBe('3840x2160');
    expect(f313?.fps).toBe(60);
    expect(f313?.vcodec).toBe('vp9');
  });

  it('should correctly identify combined formats (video + audio)', () => {
    const formats = parseFormatTable(rawTable);
    const combinedFormats = formats.filter(f => f.isCombined);
    expect(combinedFormats.length).toBeGreaterThanOrEqual(2);

    const f18 = combinedFormats.find(f => f.format_id === '18');
    expect(f18).toBeDefined();
    expect(f18?.resolution).toBe('640x360');
    expect(f18?.isAudioOnly).toBe(false);
    expect(f18?.isVideoOnly).toBe(false);

    const f22 = combinedFormats.find(f => f.format_id === '22');
    expect(f22).toBeDefined();
    expect(f22?.resolution).toBe('1280x720');
  });

  it('should parse bitrates and container extensions accurately', () => {
    const formats = parseFormatTable(rawTable);
    for (const f of formats) {
      expect(f.format_id).toBeTruthy();
      expect(f.ext).toMatch(/^(mp4|webm|m4a|mhtml)$/);
      if (f.tbr) {
        expect(typeof f.tbr).toBe('number');
        expect(f.tbr).toBeGreaterThan(0);
      }
    }
  });
});
