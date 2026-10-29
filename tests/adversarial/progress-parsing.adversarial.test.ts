import { describe, it, expect } from 'vitest'
import { parseProgressLine } from '../../src/lib/progress-parser'
import { parseProgressLine as parseHelperProgressLine } from '../helpers/progress-parser'

describe('Adversarial Stress: Progress Stream Parsing', () => {
  describe('1. Corrupted and Truncated JSON Streams', () => {
    it('should safely return null on truncated JSON lines without throwing', () => {
      const truncatedSamples = [
        '{"status": "downloading", "downloaded": 10',
        '{"status": "down',
        '{"total": 50000000,',
        '{ "status": ',
        '{',
      ]

      for (const sample of truncatedSamples) {
        expect(() => parseProgressLine(sample)).not.toThrow()
        expect(parseProgressLine(sample)).toBeNull()
      }
    })

    it('should safely return null on corrupted JSON syntax without throwing', () => {
      const corruptSyntax = [
        '{"status": "downloading",, "total": 100}',
        '{"status": "downloading" "total": 100}',
        '{"status": undefined}',
        '{downloaded: 100}', // unquoted keys
      ]

      for (const sample of corruptSyntax) {
        expect(() => parseProgressLine(sample)).not.toThrow()
        expect(parseProgressLine(sample)).toBeNull()
      }
    })

    it('should handle non-object JSON values safely', () => {
      const nonObjects = [
        '["downloading", 100, 200]',
        '"just a status string"',
        '12345678',
        'true',
        'null',
      ]

      for (const sample of nonObjects) {
        expect(() => parseProgressLine(sample)).not.toThrow()
        expect(parseProgressLine(sample)).toBeNull()
      }
    })

    it('should handle empty JSON object or JSON missing all progress keys', () => {
      expect(parseProgressLine('{}')).toBeNull()
      expect(parseProgressLine('{"other_key": "some_value"}')).toBeNull()
    })
  })

  describe('2. ANSI Escape Codes and Terminal Formatting', () => {
    it('adversarial check: progress line wrapped in ANSI color codes', () => {
      // Terminal emulators and CLI tools often output colored text: \u001b[32m ... \u001b[0m
      const coloredLine = '\u001b[32m[download]  50.0% of ~  20.00MiB at  2.00MiB/s ETA 00:05\u001b[0m'
      const parsed = parseProgressLine(coloredLine)
      console.log('ANSI colored line parsed result:', parsed)

      // Does the parser strip ANSI codes and parse progress successfully?
      // If it requires trimmed.startsWith('[download]'), ANSI code \u001b[32m causes startsWith to fail!
      expect(parsed).not.toBeNull()
      expect(parsed?.percent).toBe(50.0)
    })

    it('adversarial check: JSON line wrapped in ANSI color codes', () => {
      const coloredJson = '\u001b[36m{"status": "downloading", "downloaded": 500, "total": 1000, "speed": 100, "eta": 5}\u001b[0m'
      const parsed = parseProgressLine(coloredJson)
      console.log('ANSI colored JSON parsed result:', parsed)
      expect(parsed).not.toBeNull()
      expect(parsed?.percent).toBe(50.0)
    })

    it('should handle carriage return prefix from yt-dlp in-place console updates', () => {
      const crLine = '\r[download]  45.0% of 10.00MiB at 1.00MiB/s ETA 00:05'
      const parsed = parseProgressLine(crLine)
      expect(parsed).not.toBeNull()
      expect(parsed?.percent).toBe(45.0)
    })
  })

  describe('3. Mathematical Boundary and Extreme Values in Progress', () => {
    it('should handle total = 0 without producing NaN or Infinity in percent', () => {
      const zeroTotalJson = '{"status": "downloading", "downloaded": 100, "total": 0}'
      const parsed = parseProgressLine(zeroTotalJson)
      expect(parsed).not.toBeNull()
      expect(Number.isFinite(parsed!.percent)).toBe(true)
      expect(isNaN(parsed!.percent)).toBe(false)
    })

    it('should handle downloaded > total without exceeding 100%', () => {
      const overflowJson = '{"status": "downloading", "downloaded": 200, "total": 100}'
      const parsed = parseProgressLine(overflowJson)
      expect(parsed).not.toBeNull()
      expect(parsed!.percent).toBeLessThanOrEqual(100)
    })

    it('should parse 3-part ETA (HH:MM:SS) in standard download line', () => {
      const longEta = '[download]  10.0% of 10.00GiB at 1.00MiB/s ETA 01:23:45'
      const parsed = parseProgressLine(longEta)
      expect(parsed).not.toBeNull()
      // 1h 23m 45s = 3600 + 1380 + 45 = 5025 seconds
      expect(parsed!.eta).toBe(5025)
    })

    it('should safely ignore non-progress logs and error messages', () => {
      const logs = [
        '[youtube] Extracting URL: https://youtube.com/watch?v=123',
        '[info] Downloading 1 format(s)...',
        '[download] Destination: video.mp4',
        '[ffmpeg] Merging formats into "video.mp4"',
        'ERROR: [youtube] Video unavailable',
        'WARNING: [youtube] Subtitles not found',
      ]

      for (const log of logs) {
        expect(parseProgressLine(log)).toBeNull()
      }
    })
  })
})
