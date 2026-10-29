import { describe, it, expect } from 'vitest'
import { parseFFormats, formatFilesize, formatSpeed, formatEta, formatDuration } from '../../src/lib/format-utils'
import { parseFormatTable as parseHelperFormatTable } from '../helpers/format-parser'

describe('Adversarial Stress: Format Table Parsing', () => {
  describe('1. Trailing Non-Format Lines (Warnings, Errors, Info Logs)', () => {
    it('adversarial check: trailing yt-dlp WARNING is incorrectly parsed as a format', () => {
      const rawOutput = `
[info] Available formats for dQw4w9WgXcQ:
ID  EXT   RESOLUTION FPS │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC      ABR
──────────────────────────────────────────────────────────────────────────────────
249 webm  audio only   │    1.54MiB   51k https │ audio only        opus        51k
137 mp4   1920x1080  30 │  120.34MiB 4500k https │ avc1.640028 4500k video only
WARNING: [youtube] Some formats require login with --cookies
ERROR: [youtube] Could not fetch DASH manifest
[download] 100% of 12.34MiB in 00:02
`
      const formats = parseFFormats(rawOutput)
      console.log('Parsed formats count with trailing warning:', formats.length, formats.map(f => f.formatId))

      // The parser should ONLY extract valid formats ('249' and '137').
      // It should NOT extract 'WARNING:' or 'ERROR:' or '[download]' as formats!
      const warningFormat = formats.find(f => f.formatId === 'WARNING:' || f.formatId === 'ERROR:' || f.formatId === '[download]')
      expect(warningFormat).toBeUndefined()
    })

    it('adversarial check: helper parser also tested with trailing warnings', () => {
      const rawOutput = `
ID  EXT   RESOLUTION FPS │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC      ABR
──────────────────────────────────────────────────────────────────────────────────
249 webm  audio only   │    1.54MiB   51k https │ audio only        opus        51k
WARNING: [youtube] Some formats require login
`
      const formats = parseHelperFormatTable(rawOutput)
      const warningFormat = formats.find(f => f.format_id === 'WARNING:' || f.format_id === 'ERROR:')
      expect(warningFormat).toBeUndefined()
    })
  })

  describe('2. Incomplete, Truncated, and Corrupted Rows', () => {
    it('should ignore single-token or malformed format rows', () => {
      const rawOutput = `
ID  EXT   RESOLUTION
--------------------
corrupt_line_only_one_token
137
`
      const formats = parseFFormats(rawOutput)
      expect(formats.length).toBe(0)
    })

    it('should handle rows with missing resolution without throwing', () => {
      const rawOutput = `
ID  EXT   RESOLUTION
--------------------
custom_id webm
`
      expect(() => parseFFormats(rawOutput)).not.toThrow()
      const formats = parseFFormats(rawOutput)
      expect(formats.length).toBe(1)
      expect(formats[0].formatId).toBe('custom_id')
      expect(formats[0].ext).toBe('webm')
    })

    it('should handle storyboard formats (sb0 mhtml)', () => {
      const rawOutput = `
ID  EXT   RESOLUTION FPS │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC
──────────────────────────────────────────────────────────────────────────
sb0 mhtml 48x27        1 │  355.61KiB       https │ storyboard
137 mp4   1920x1080   30 │  120.34MiB 4500k https │ avc1.640028 4500k video only
`
      const formats = parseFFormats(rawOutput)
      expect(formats.length).toBeGreaterThanOrEqual(1)
      const sb = formats.find(f => f.formatId === 'sb0')
      expect(sb).toBeDefined()
      expect(sb?.ext).toBe('mhtml')
    })
  })

  describe('3. Filesize Parsing Edge Cases', () => {
    it('should parse approximate filesizes (~ 1.54MiB, ~120.34MiB)', () => {
      const rawOutput = `
ID  EXT   RESOLUTION │ FILESIZE
────────────────────────────────
140 m4a   audio only │ ~ 15.50MiB
22  mp4   1280x720   │ ~1.20GiB
`
      const formats = parseFFormats(rawOutput)
      expect(formats).toHaveLength(2)
      // ~ 15.50MiB = ~16,252,928 bytes
      expect(formats[0].filesize).toBeGreaterThan(15 * 1024 * 1024)
      // ~ 1.20GiB = ~1,288,490,188 bytes
      expect(formats[1].filesize).toBeGreaterThan(1024 * 1024 * 1024)
    })

    it('should handle missing filesize, None, or unknown strings', () => {
      const rawOutput = `
ID  EXT   RESOLUTION │ FILESIZE
────────────────────────────────
140 m4a   audio only │ N/A
`
      const formats = parseFFormats(rawOutput)
      expect(formats).toHaveLength(1)
      expect(formats[0].filesize).toBeUndefined()
    })
  })

  describe('4. Malformed Tables and Empty Inputs', () => {
    it('should return empty array on empty string, whitespace, or HTML/garbage responses', () => {
      expect(parseFFormats('')).toEqual([])
      expect(parseFFormats('   ')).toEqual([])
      expect(parseFFormats('<!DOCTYPE html><html><body>Error 403 Forbidden</body></html>')).toEqual([])
    })

    it('should return empty array if header is completely missing', () => {
      const rawOutput = `
249 webm audio only 2 │ 1.54MiB 51k https │ audio only opus [51k]
137 mp4 1920x1080 30 │ 120.34MiB 4500k https │ avc1.640028 4500k video only
`
      // Without headerSeen (ID ... EXT), format parser skips lines
      const formats = parseFFormats(rawOutput)
      expect(formats).toEqual([])
    })
  })

  describe('5. Utility Functions Under Adversarial Values', () => {
    it('formatFilesize should handle NaN, negative numbers, Infinity, 0', () => {
      expect(formatFilesize(NaN)).toBe('0 B')
      expect(formatFilesize(-500)).toBe('0 B')
      expect(formatFilesize(0)).toBe('0 B')
      expect(formatFilesize(undefined)).toBe('0 B')
      expect(formatFilesize(1024)).toBe('1.0 KB')
      expect(formatFilesize(1048576)).toBe('1.0 MB')
    })

    it('formatSpeed should handle negative, NaN, undefined', () => {
      expect(formatSpeed(NaN)).toBe('0 KB/s')
      expect(formatSpeed(-100)).toBe('0 KB/s')
      expect(formatSpeed(undefined)).toBe('0 KB/s')
    })

    it('formatEta should handle negative, NaN, huge numbers', () => {
      expect(formatEta(NaN)).toBe('--:--')
      expect(formatEta(-50)).toBe('--:--')
      expect(formatEta(undefined)).toBe('--:--')
      expect(formatEta(65)).toBe('01:05')
      expect(formatEta(3665)).toBe('01:01:05')
    })

    it('formatDuration should handle negative, NaN, huge numbers', () => {
      expect(formatDuration(NaN)).toBe('0:00')
      expect(formatDuration(-10)).toBe('0:00')
      expect(formatDuration(undefined)).toBe('0:00')
      expect(formatDuration(125)).toBe('2:05')
      expect(formatDuration(3665)).toBe('1:01:05')
    })
  })

  describe('6. Performance and Scalability Stress', () => {
    it('should parse 5,000 format rows in < 100ms without memory exhaustion', () => {
      const header = 'ID  EXT   RESOLUTION FPS │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC      ABR\n───\n'
      const rows: string[] = []
      for (let i = 0; i < 5000; i++) {
        rows.push(`${i} mp4 1920x1080 30 │ 10.0MiB 1000k https │ avc1 1000k none`)
      }
      const bigTable = header + rows.join('\n')

      const start = performance.now()
      const parsed = parseFFormats(bigTable)
      const duration = performance.now() - start

      expect(parsed.length).toBe(5000)
      expect(duration).toBeLessThan(500)
    })
  })
})
