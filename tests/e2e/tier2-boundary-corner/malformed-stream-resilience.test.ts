import { describe, it, expect } from 'vitest';
import { parseProgressLine } from '../../../src/lib/progress-parser';

describe('Tier 2: Boundary & Corner Cases — Malformed Stream Resilience', () => {
  it('should return null on empty strings, null, undefined, or whitespace', () => {
    expect(parseProgressLine('')).toBeNull();
    expect(parseProgressLine('   ')).toBeNull();
    expect(parseProgressLine(null as any)).toBeNull();
    expect(parseProgressLine(undefined as any)).toBeNull();
  });

  it('should ignore non-progress extractor messages and ffmpeg logs', () => {
    expect(parseProgressLine('[youtube] Extracting URL: https://youtube.com/watch?v=123')).toBeNull();
    expect(parseProgressLine('[info] Downloading 1 format(s): 137+140')).toBeNull();
    expect(parseProgressLine('[Merger] Merging formats into "output.mp4"')).toBeNull();
    expect(parseProgressLine('Deleting original file temp.f137.mp4')).toBeNull();
  });

  it('should handle corrupted or truncated JSON lines without throwing', () => {
    const truncated1 = '{"status":"downloading","downloaded_bytes":100';
    const truncated2 = '{"status":';
    const badJson = '{"status": invalid_value}';

    expect(() => parseProgressLine(truncated1)).not.toThrow();
    expect(() => parseProgressLine(truncated2)).not.toThrow();
    expect(() => parseProgressLine(badJson)).not.toThrow();

    expect(parseProgressLine(truncated1)).toBeNull();
    expect(parseProgressLine(badJson)).toBeNull();
  });

  it('should parse valid JSON progress lines with missing optional fields', () => {
    const minimalJson = '{"status":"downloading"}';
    const res = parseProgressLine(minimalJson);

    expect(res).not.toBeNull();
    expect(res?.status).toBe('downloading');
    expect(res?.speed).toBeUndefined();
    expect(res?.eta).toBeUndefined();
  });

  it('should parse console progress lines containing ANSI color escape codes or extra spaces', () => {
    const lineWithSpaces = '[download]    12.4%  of  ~  50.00MiB at   3.12MiB/s  ETA 00:15';
    const res = parseProgressLine(lineWithSpaces);

    expect(res).not.toBeNull();
    expect(res?.status).toBe('downloading');
    expect(res?.percentStr).toBe('12.4%');
    expect(res?.speed).toBeGreaterThan(3000000);
    expect(res?.eta).toBe(15);
  });
});
