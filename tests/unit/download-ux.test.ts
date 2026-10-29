import { describe, it, expect, beforeEach } from 'vitest'
import { usePresetStore, BUILTIN_PRESETS } from '../../src/stores/presetStore'
import { isValidUrl, formatDuration, normalizeVideoInfo } from '../../src/hooks/useVideoInfo'
import {
  buildCliArgs,
  maskSensitiveCliArgs,
  buildMaskedCommand,
  SENSITIVE_FLAGS,
} from '../../src/components/download/command-builder'
import { parseFFormats, formatFilesize, formatEta } from '../../src/lib/format-utils'

describe('Milestone 2: Download UX & Format Selection Tests', () => {
  describe('Preset System (usePresetStore)', () => {
    beforeEach(() => {
      // Reset preset store to initial built-ins
      usePresetStore.setState({
        presets: [...BUILTIN_PRESETS],
        activePresetId: null,
      })
    })

    it('contains all 5 immutable built-in presets', () => {
      const presets = usePresetStore.getState().presets
      const builtinIds = presets.filter((p) => p.isBuiltIn).map((p) => p.id)

      expect(builtinIds).toContain('builtin-best-quality')
      expect(builtinIds).toContain('builtin-audio-mp3')
      expect(builtinIds).toContain('builtin-instagram-reel')
      expect(builtinIds).toContain('builtin-youtube-playlist')
      expect(builtinIds).toContain('builtin-twitter-x')

      // Ensure built-ins cannot be deleted
      const deleteResult = usePresetStore.getState().deletePreset('builtin-best-quality')
      expect(deleteResult).toBe(false)
      expect(usePresetStore.getState().presets.find((p) => p.id === 'builtin-best-quality')).toBeDefined()
    })

    it('creates, applies, and deletes custom user presets', () => {
      const store = usePresetStore.getState()
      const newPreset = store.saveCurrentAsPreset(
        'My 4K Preset',
        { formatSelector: '313+ba/b', writeThumbnail: true },
        'Custom 4K settings'
      )

      expect(newPreset.id).toBeDefined()
      expect(newPreset.name).toBe('My 4K Preset')
      expect(newPreset.isBuiltIn).toBe(false)
      expect(usePresetStore.getState().presets.length).toBe(BUILTIN_PRESETS.length + 1)

      // Apply preset
      const appliedOptions = usePresetStore.getState().applyPreset(newPreset.id)
      expect(appliedOptions?.formatSelector).toBe('313+ba/b')
      expect(usePresetStore.getState().activePresetId).toBe(newPreset.id)

      // Delete custom preset
      const deleted = usePresetStore.getState().deletePreset(newPreset.id)
      expect(deleted).toBe(true)
      expect(usePresetStore.getState().presets.find((p) => p.id === newPreset.id)).toBeUndefined()
    })

    it('exports and imports custom presets JSON', () => {
      const store = usePresetStore.getState()
      store.saveCurrentAsPreset('Custom 1', { audioFormat: 'flac', extractAudio: true })

      const exportedJson = store.exportPresets()
      expect(exportedJson).toContain('Custom 1')
      expect(exportedJson).toContain('flac')

      // Import into clean store
      usePresetStore.setState({ presets: [...BUILTIN_PRESETS], activePresetId: null })
      const importSuccess = usePresetStore.getState().importPresets(exportedJson)
      expect(importSuccess).toBe(true)
      expect(usePresetStore.getState().presets.some((p) => p.name === 'Custom 1')).toBe(true)
    })
  })

  describe('Video Metadata & Helper Functions', () => {
    it('validates URL formats correctly', () => {
      expect(isValidUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isValidUrl('http://instagram.com/reel/123')).toBe(true)
      expect(isValidUrl('ytsearch:cyberpunk trailer')).toBe(true)
      expect(isValidUrl('ftp://example.com/video.mp4')).toBe(false)
      expect(isValidUrl('not a url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })

    it('formats durations into MM:SS and HH:MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00')
      expect(formatDuration(65)).toBe('01:05')
      expect(formatDuration(213)).toBe('03:33')
      expect(formatDuration(3665)).toBe('1:01:05')
      expect(formatDuration(undefined)).toBe('--:--')
    })

    it('normalizes raw yt-dlp metadata correctly', () => {
      const raw = {
        id: 'test_123',
        title: 'Sample Video Title',
        uploader: 'Test Channel',
        duration: 180,
        thumbnail: 'https://example.com/thumb.jpg',
        formats: [
          {
            format_id: '140',
            ext: 'm4a',
            resolution: 'audio only',
            vcodec: 'none',
            acodec: 'mp4a.40.2',
            filesize: 5000000,
          },
        ],
      }

      const normalized = normalizeVideoInfo(raw)
      expect(normalized.id).toBe('test_123')
      expect(normalized.title).toBe('Sample Video Title')
      expect(normalized.uploader).toBe('Test Channel')
      expect(normalized.duration).toBe(180)
      expect(normalized.formats.length).toBe(1)
      expect(normalized.formats[0].formatId).toBe('140')
      expect(normalized.formats[0].ext).toBe('m4a')
    })
  })

  describe('Command Preview & Credential Redaction', () => {
    it('masks sensitive authentication parameters with ***', () => {
      const args = [
        '-u', 'secret_user',
        '-p', 'super_secret_pw',
        '--twofactor', '123456',
        '--video-password', 'vpass',
        'https://example.com/video'
      ]

      const masked = maskSensitiveCliArgs(args)
      expect(masked).toEqual([
        '-u', '***',
        '-p', '***',
        '--twofactor', '***',
        '--video-password', '***',
        'https://example.com/video',
      ])
      expect(masked).not.toContain('secret_user')
      expect(masked).not.toContain('super_secret_pw')
      expect(masked).not.toContain('123456')
      expect(masked).not.toContain('vpass')
    })

    it('constructs complete CLI commands with options and credential masking', () => {
      const cmd = buildMaskedCommand({
        username: 'admin',
        password: 'mypassword',
        formatSelector: 'bv*+ba/b',
        outputDir: 'C:/Downloads',
        outputTemplate: '%(title)s.%(ext)s',
        urls: ['https://youtube.com/watch?v=xyz'],
      })

      expect(cmd.startsWith('yt-dlp')).toBe(true)
      expect(cmd).toContain('-u ***')
      expect(cmd).toContain('-p ***')
      expect(cmd).toContain('-f bv*+ba/b')
      expect(cmd).toContain('-P C:/Downloads')
      expect(cmd).toContain('https://youtube.com/watch?v=xyz')
      expect(cmd).not.toContain('admin')
      expect(cmd).not.toContain('mypassword')
    })
  })

  describe('Format Utilities & Parsers', () => {
    it('formats filesizes and ETAs properly', () => {
      expect(formatFilesize(1024)).toBe('1.0 KB')
      expect(formatFilesize(1024 * 1024 * 15)).toBe('15.0 MB')
      expect(formatFilesize(0)).toBe('0 B')
      expect(formatEta(45)).toBe('00:45')
      expect(formatEta(3600)).toBe('01:00:00')
    })

    it('parses raw yt-dlp -F format table text', () => {
      const rawSample = `
[info] Available formats for dQw4w9WgXcQ:
ID  EXT   RESOLUTION FPS CH │   FILESIZE   TBR PROTO │ VCODEC        VBR ACODEC      ABR
──────────────────────────────────────────────────────────────────────────────────────────
140 m4a   audio only      2 │    3.45MiB  129k https │ audio only        mp4a.40.2  129k
251 webm  audio only      2 │    3.31MiB  124k https │ audio only        opus       124k
137 mp4   1920x1080   30   │   35.40MiB 1327k https │ avc1.640028 1327k video only
313 webm  3840x2160   60   │  180.50MiB 6768k https │ vp9         6768k video only
`
      const parsed = parseFFormats(rawSample)
      expect(parsed.length).toBeGreaterThanOrEqual(4)
      const f140 = parsed.find((f) => f.formatId === '140')
      expect(f140).toBeDefined()
      expect(f140?.ext).toBe('m4a')
      expect(f140?.resolution).toBe('audio only')

      const f313 = parsed.find((f) => f.formatId === '313')
      expect(f313).toBeDefined()
      expect(f313?.resolution).toBe('3840x2160')
      expect(f313?.fps).toBe(60)
    })
  })
})
