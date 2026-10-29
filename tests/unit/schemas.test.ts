import { describe, it, expect } from 'vitest'
import {
  downloadSchema,
  formatSchema,
  subtitleSchema,
  thumbnailSchema,
  metadataSchema,
  postProcessSchema,
  sponsorBlockSchema,
  networkSchema,
  authSchema,
  filterSchema,
  filesystemSchema,
  extractorSchema,
  externalDownloaderSchema,
  verbositySchema,
  ytdlpOptionsSchema,
} from '../../src/lib/schemas'

describe('Zod Validation Schemas for Option Panels', () => {
  it('validates downloadSchema', () => {
    const valid = downloadSchema.parse({
      urls: ['https://example.com'],
      outputDir: '/downloads',
      concurrentFragments: 4,
    })
    expect(valid.outputDir).toBe('/downloads')
    expect(valid.concurrentFragments).toBe(4)
  })

  it('validates formatSchema', () => {
    const valid = formatSchema.parse({
      formatSelection: 'bestvideo+bestaudio',
      mergeOutputFormat: 'mp4',
      checkFormats: true,
    })
    expect(valid.formatSelection).toBe('bestvideo+bestaudio')
    expect(valid.checkFormats).toBe(true)
  })

  it('validates subtitleSchema with string or array subLangs', () => {
    const strLangs = subtitleSchema.parse({
      writeSubs: true,
      subLangs: 'en,es',
      subFormat: 'srt',
    })
    expect(strLangs.writeSubs).toBe(true)
    expect(strLangs.subLangs).toBe('en,es')

    const arrLangs = subtitleSchema.parse({
      subLangs: ['en', 'fr'],
      embedSubs: true,
    })
    expect(arrLangs.subLangs).toEqual(['en', 'fr'])
    expect(arrLangs.embedSubs).toBe(true)
  })

  it('validates thumbnailSchema', () => {
    const valid = thumbnailSchema.parse({
      writeThumbnail: true,
      convertThumbnails: 'png',
      embedThumbnail: true,
    })
    expect(valid.writeThumbnail).toBe(true)
    expect(valid.convertThumbnails).toBe('png')
  })

  it('validates metadataSchema and replaceInMetadata rules', () => {
    const valid = metadataSchema.parse({
      writeInfoJson: true,
      embedChapters: true,
      replaceInMetadata: [{ field: 'title', regex: '\\[.*\\]', replace: '' }],
    })
    expect(valid.writeInfoJson).toBe(true)
    expect(valid.replaceInMetadata).toHaveLength(1)
  })

  it('validates postProcessSchema', () => {
    const valid = postProcessSchema.parse({
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '0',
      remuxVideo: 'mkv',
      fixup: 'force',
    })
    expect(valid.extractAudio).toBe(true)
    expect(valid.audioFormat).toBe('mp3')
    expect(valid.fixup).toBe('force')
  })

  it('validates sponsorBlockSchema', () => {
    const valid = sponsorBlockSchema.parse({
      sponsorblockRemove: ['sponsor', 'intro'],
      sponsorblockMark: ['outro'],
      sponsorblockApi: 'https://sponsor.example.com',
    })
    expect(valid.sponsorblockRemove).toEqual(['sponsor', 'intro'])
  })

  it('validates networkSchema', () => {
    const valid = networkSchema.parse({
      proxy: 'socks5://127.0.0.1:9050',
      rateLimit: '2.5M',
      retries: 5,
      socketTimeout: 45,
      addHeaders: { Authorization: 'Bearer test' },
    })
    expect(valid.rateLimit).toBe('2.5M')
    expect(valid.retries).toBe(5)
  })

  it('validates authSchema', () => {
    const valid = authSchema.parse({
      username: 'user1',
      password: 'password123',
      cookiesFromBrowser: 'firefox',
      netrc: true,
    })
    expect(valid.username).toBe('user1')
    expect(valid.netrc).toBe(true)
  })

  it('validates filterSchema', () => {
    const valid = filterSchema.parse({
      date: '20260101',
      minFilesize: '10M',
      maxFilesize: '500M',
      ageLimit: 18,
      noPlaylist: true,
    })
    expect(valid.date).toBe('20260101')
    expect(valid.ageLimit).toBe(18)
  })

  it('validates filesystemSchema', () => {
    const valid = filesystemSchema.parse({
      windowsFilenames: true,
      restrictFilenames: true,
      trimFilenames: 100,
      noOverwrites: true,
      continueDownload: true,
      partFile: true,
    })
    expect(valid.windowsFilenames).toBe(true)
    expect(valid.trimFilenames).toBe(100)
  })

  it('validates extractorSchema', () => {
    const valid = extractorSchema.parse({
      extractorArgs: { youtube: 'player_client=android' },
      flatPlaylist: true,
      jsRuntimes: 'node,deno',
    })
    expect(valid.flatPlaylist).toBe(true)
  })

  it('validates externalDownloaderSchema', () => {
    const valid = externalDownloaderSchema.parse({
      downloader: 'aria2c',
      downloaderArgs: ['-x', '16'],
      hlsPreferNative: true,
    })
    expect(valid.downloader).toBe('aria2c')
    expect(valid.hlsPreferNative).toBe(true)
  })

  it('validates verbositySchema', () => {
    const valid = verbositySchema.parse({
      simulate: true,
      skipDownload: true,
      dumpJson: true,
      verbose: true,
      ignoreErrors: true,
    })
    expect(valid.simulate).toBe(true)
    expect(valid.verbose).toBe(true)
  })

  it('validates composite ytdlpOptionsSchema', () => {
    const composite = ytdlpOptionsSchema.parse({
      urls: ['https://www.youtube.com/watch?v=123'],
      formatSelection: 'best',
      writeSubs: true,
      writeThumbnail: true,
      embedMetadata: true,
      extractAudio: true,
      audioFormat: 'mp3',
      sponsorblockRemove: ['sponsor'],
      proxy: 'http://localhost:8080',
      username: 'alice',
      minFilesize: '5M',
      windowsFilenames: true,
      flatPlaylist: true,
      downloader: 'aria2c',
      simulate: true,
      _raw: ['--geo-bypass'],
    })

    expect(composite.urls).toEqual(['https://www.youtube.com/watch?v=123'])
    expect(composite.formatSelection).toBe('best')
    expect(composite.downloader).toBe('aria2c')
    expect(composite._raw).toEqual(['--geo-bypass'])
  })
})
