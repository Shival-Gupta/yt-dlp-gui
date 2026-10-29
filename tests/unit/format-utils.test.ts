import { describe, it, expect } from 'vitest'
import {
  formatFilesize,
  formatSpeed,
  formatEta,
  getCodecBadge,
  qualityLabel,
  parseFFormats,
} from '../../src/lib/format-utils'

describe('format-utils', () => {
  it('formats filesizes appropriately', () => {
    expect(formatFilesize(0)).toBe('0 B')
    expect(formatFilesize(500)).toBe('500 B')
    expect(formatFilesize(1024)).toBe('1.0 KB')
    expect(formatFilesize(1048576)).toBe('1.0 MB')
    expect(formatFilesize(1073741824)).toBe('1.0 GB')
    expect(formatFilesize(524288000)).toBe('500 MB')
  })

  it('formats download speeds', () => {
    expect(formatSpeed(0)).toBe('0 KB/s')
    expect(formatSpeed(2621440)).toBe('2.5 MB/s')
  })

  it('formats ETAs into mm:ss and hh:mm:ss', () => {
    expect(formatEta(undefined)).toBe('--:--')
    expect(formatEta(-1)).toBe('--:--')
    expect(formatEta(65)).toBe('01:05')
    expect(formatEta(3665)).toBe('01:01:05')
  })

  it('detects codec badge types correctly', () => {
    expect(getCodecBadge('avc1.640028')).toBe('video')
    expect(getCodecBadge('mp4a.40.2')).toBe('audio')
    expect(getCodecBadge('opus')).toBe('audio')
    expect(getCodecBadge('none')).toBe('unknown')
  })

  it('formats quality labels', () => {
    expect(
      qualityLabel({
        formatId: '137',
        ext: 'mp4',
        resolution: '1920x1080',
        fps: 60,
      })
    ).toBe('1920x1080 60fps')

    expect(
      qualityLabel({
        formatId: '251',
        ext: 'webm',
        acodec: 'opus',
      })
    ).toBe('Audio (webm)')
  })

  it('parses raw yt-dlp -F table output', () => {
    const rawTable = `
[info] Available formats for video:
ID  EXT   RESOLUTION FPS CH │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC      ABR
────────────────────────────────────────────────────────────────────────────────────────
139 m4a   audio only      2 │    1.25MiB   48k https │ audio only        mp4a.40.5   48k
249 webm  audio only      2 │    1.35MiB   52k https │ audio only        opus        52k
137 mp4   1920x1080   30   │  120.50MiB 4500k https │ avc1.640028 4500k video only
`
    const formats = parseFFormats(rawTable)
    expect(formats.length).toBe(3)
    expect(formats[0].formatId).toBe('139')
    expect(formats[0].ext).toBe('m4a')
    expect(formats[0].resolution).toBe('audio only')

    expect(formats[2].formatId).toBe('137')
    expect(formats[2].ext).toBe('mp4')
    expect(formats[2].resolution).toBe('1920x1080')
    expect(formats[2].fps).toBe(30)
    expect(formats[2].filesize).toBeGreaterThan(120000000)
  })
})
