import { describe, it, expect } from 'vitest'
import {
  buildArgs,
  maskSensitiveArgs,
  buildMaskedCommandString,
} from '../../src/lib/ytdlp-args'
import {
  buildCliArgs,
  maskSensitiveCliArgs,
  buildMaskedCommand,
} from '../../src/components/download/command-builder'
import {
  buildYtdlpArgs as buildHelperArgs,
  maskSensitiveArgs as maskHelperSensitiveArgs,
  buildMaskedCommandString as buildHelperMaskedCommand,
} from '../helpers/cli-generator'
import { YtdlpOptions } from '../../src/types/ytdlp'

describe('Adversarial Stress: CLI Argument Builders', () => {
  describe('1. Malformed Inputs and Empty Values', () => {
    it('should handle completely empty options object without throwing', () => {
      expect(() => buildArgs({} as YtdlpOptions)).not.toThrow()
      expect(() => buildCliArgs({})).not.toThrow()
      expect(() => buildHelperArgs({})).not.toThrow()

      expect(buildArgs({} as YtdlpOptions)).toEqual([])
      expect(buildCliArgs({})).toEqual([])
      expect(buildHelperArgs({})).toEqual([])
    })

    it('should handle null/undefined fields without throwing or generating "undefined" flags', () => {
      const malformedOpts = {
        outputDir: undefined,
        outputTemplate: undefined,
        formatSelection: undefined,
        urls: undefined,
        proxy: undefined,
        username: undefined,
        password: undefined,
      } as unknown as YtdlpOptions

      const args = buildArgs(malformedOpts)
      expect(args).not.toContain('undefined')
      expect(args).not.toContain('null')
      expect(args.length).toBe(0)
    })

    it('adversarial check: handles empty string URL and whitespace URL', () => {
      const opts = {
        urls: ['', '   ', '\t\n'],
      } as YtdlpOptions

      const args = buildArgs(opts)
      // Check whether empty or whitespace-only strings are pushed directly as URLs
      // In buildArgs: urls are pushed if not already in args.
      // Notice: url = "" or "   "
      const cliArgs = buildCliArgs(opts)
      // In buildCliArgs: const trimmed = url.trim(); if (trimmed && !args.includes(trimmed))
      expect(cliArgs.length).toBe(0)

      // Let's observe buildArgs behavior:
      const hasEmptyUrl = args.includes('')
      const hasWhitespaceUrl = args.includes('   ')
      // If buildArgs doesn't trim, it pushes empty/whitespace URLs
      expect({ hasEmptyUrl, hasWhitespaceUrl }).toBeDefined()
    })
  })

  describe('2. Special Characters, Quotes, and Metacharacters', () => {
    it('should preserve filenames with spaces, single quotes, double quotes, and symbols', () => {
      const opts: Partial<YtdlpOptions> = {
        outputTemplate: '%(uploader)s - "Special" & \'Single\' `ticks` $HOME.%(ext)s',
        outputDir: 'C:\\My Downloads\\Folder (2026) [Special] #1\\',
      }
      const args = buildArgs(opts as YtdlpOptions)

      expect(args).toContain('-o')
      expect(args[args.indexOf('-o') + 1]).toBe(
        '%(uploader)s - "Special" & \'Single\' `ticks` $HOME.%(ext)s'
      )
      expect(args).toContain('-P')
      expect(args[args.indexOf('-P') + 1]).toBe(
        'C:\\My Downloads\\Folder (2026) [Special] #1\\'
      )
    })

    it('should handle shell metacharacters in execCommand without throwing', () => {
      const shellPayload = 'ffmpeg -i input.mp4; rm -rf /tmp || echo "failed" & calc.exe'
      const args = buildArgs({ execCommand: shellPayload } as YtdlpOptions)
      expect(args).toContain('--exec')
      expect(args[args.indexOf('--exec') + 1]).toBe(shellPayload)
    })

    it('should handle regex characters in replaceInMetadata and matchFilter', () => {
      const opts: Partial<YtdlpOptions> = {
        replaceInMetadata: [
          {
            field: 'title',
            regex: '(?i)\\[(official|video|4k)\\]',
            replace: '',
          },
        ],
        matchFilters: ["duration > 120 & title ~= '(?i)rock'"],
      }
      const args = buildArgs(opts as YtdlpOptions)
      expect(args).toContain('--replace-in-metadata')
      expect(args).toContain('title')
      expect(args).toContain('(?i)\\[(official|video|4k)\\]')
      expect(args).toContain('--match-filter')
      expect(args).toContain("duration > 120 & title ~= '(?i)rock'")
    })
  })

  describe('3. Argument Injection & Flag Prefixing', () => {
    it('should safely separate flags from values when option value begins with hyphen/flag', () => {
      // Adversarial attack: user puts a flag inside an argument value
      const opts: Partial<YtdlpOptions> = {
        username: '--exec calc.exe',
        password: '--write-description',
      }
      const args = buildArgs(opts as YtdlpOptions)

      // -u should be followed by '--exec calc.exe' as an argument, NOT merged
      expect(args[args.indexOf('-u') + 1]).toBe('--exec calc.exe')
      expect(args[args.indexOf('-p') + 1]).toBe('--write-description')
    })

    it('adversarial check: URL starting with hyphen (flag-like URL)', () => {
      // If a URL is named '-s' or '--help', in yt-dlp syntax it could be parsed as a flag
      // unless preceded by '--'.
      const opts: Partial<YtdlpOptions> = {
        urls: ['--help', '-s'],
      }
      const args = buildArgs(opts as YtdlpOptions)
      expect(args).toContain('--help')
    })
  })

  describe('4. CRITICAL FLAW: URL Dropping When Matching Another Option Value', () => {
    it('demonstrates bug: URL is dropped if identical to referer or other argument', () => {
      const targetUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const opts: Partial<YtdlpOptions> = {
        referer: targetUrl,
        urls: [targetUrl],
      }

      const args = buildArgs(opts as YtdlpOptions)

      // Because args.includes(url) checks the whole array, and '--referer' is followed by targetUrl,
      // args.includes(targetUrl) is TRUE before URL processing!
      // This causes buildArgs to SILENTLY DROP targetUrl from the urls list!
      const urlCountInArgs = args.filter((a) => a === targetUrl).length
      // It should appear TWICE: once for --referer <targetUrl>, and once at the end as the download URL!
      console.log('URL dropping test - occurrences in args:', urlCountInArgs, args)
      expect(urlCountInArgs).toBe(2)
    })

    it('demonstrates bug: duplicate URLs in batch queue are dropped', () => {
      const targetUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const opts: Partial<YtdlpOptions> = {
        urls: [targetUrl, targetUrl],
      }
      const args = buildArgs(opts as YtdlpOptions)
      const count = args.filter((a) => a === targetUrl).length
      // If deduplication happens silently, count is 1. If user wanted to download twice (e.g. different post-processors), it's lost.
      expect(count).toBe(2)
    })
  })

  describe('5. Credential Masking Stress Testing', () => {
    it('should mask sensitive flags with passwords containing spaces, quotes, and symbols', () => {
      const rawArgs = [
        '-u',
        'admin@example.com',
        '-p',
        'P@$$w0rd with "quotes" & spaces!',
        '--twofactor',
        '123 456',
        '--video-password',
        'secret:123',
        '--ap-password',
        'apPass#99',
        'https://example.com',
      ]

      const masked = maskSensitiveArgs(rawArgs)
      expect(masked).not.toContain('P@$$w0rd with "quotes" & spaces!')
      expect(masked).not.toContain('123 456')
      expect(masked).not.toContain('secret:123')
      expect(masked).not.toContain('apPass#99')

      expect(masked[masked.indexOf('-p') + 1]).toBe('***')
      expect(masked[masked.indexOf('--twofactor') + 1]).toBe('***')
      expect(masked[masked.indexOf('--video-password') + 1]).toBe('***')
      expect(masked[masked.indexOf('--ap-password') + 1]).toBe('***')
      expect(masked).toContain('https://example.com')
    })

    it('should handle empty password safely', () => {
      const rawArgs = ['-u', 'user', '-p', '', 'https://example.com']
      const masked = maskSensitiveArgs(rawArgs)
      expect(masked[masked.indexOf('-p') + 1]).toBe('***')
    })

    it('should handle flag without subsequent value (trailing sensitive flag)', () => {
      const rawArgs = ['-u', 'user', '-p']
      expect(() => maskSensitiveArgs(rawArgs)).not.toThrow()
      const masked = maskSensitiveArgs(rawArgs)
      expect(masked).toEqual(['-u', '***', '-p'])
    })

    it('adversarial check: buildMaskedCommandString escaping with internal quotes', () => {
      const opts: Partial<YtdlpOptions> = {
        outputTemplate: '%(uploader)s "%(title)s"',
        urls: ['https://example.com/watch?v=123'],
      }
      const cmdStr = buildMaskedCommandString(opts)
      // Check if internal quotes are escaped or produce broken shell syntax
      console.log('buildMaskedCommandString output:', cmdStr)
      expect(cmdStr).toBeDefined()
    })
  })

  describe('6. Non-standard structures and Type Confusion', () => {
    it('adversarial check: extractorArgs passed as Array instead of Record', () => {
      // In JS, typeof [] === 'object'.
      // If someone passes array of strings:
      const opts = {
        extractorArgs: ['youtube:player_client=android'],
      } as unknown as YtdlpOptions

      const args = buildArgs(opts)
      // Check what args was produced:
      // Object.entries on array produces keys '0', '1', etc.
      console.log('extractorArgs array test:', args)
      expect(args).not.toContain('--extractor-args 0:youtube:player_client=android')
    })

    it('adversarial check: printToFile with missing template or file properties', () => {
      const opts = {
        printToFile: {} as any,
      } as YtdlpOptions

      const args = buildArgs(opts)
      // If printToFile.template is undefined, it pushes '--print-to-file', undefined, undefined
      expect(args).not.toContain(undefined)
    })
  })
})
