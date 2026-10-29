import { describe, it, expect } from 'vitest'
import {
  buildArgs,
  buildDownloadArgs,
  buildFormatArgs,
  buildSubtitleArgs,
  buildThumbnailArgs,
  buildMetadataArgs,
  buildPostProcessArgs,
  buildSponsorBlockArgs,
  buildNetworkArgs,
  buildAuthArgs,
  buildFilterArgs,
  buildFilesystemArgs,
  buildExtractorArgs,
  buildExternalDownloaderArgs,
  buildVerbosityArgs,
  maskSensitiveArgs,
  buildMaskedCommandString,
} from '../../src/lib/ytdlp-args'

describe('ytdlp-args Unit Tests', () => {
  describe('buildArgs general', () => {
    it('builds CLI args containing provided URLs', () => {
      const urls = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']
      const args = buildArgs({ urls })
      expect(args).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })

    it('includes raw arguments passed in _raw escape hatch', () => {
      const args = buildArgs({
        urls: ['https://example.com/video'],
        _raw: ['--no-check-certificates', '--geo-bypass'],
      })
      expect(args).toContain('--no-check-certificates')
      expect(args).toContain('--geo-bypass')
      expect(args).toContain('https://example.com/video')
    })
  })

  describe('1. buildDownloadArgs', () => {
    it('handles outputDir and outputTemplate', () => {
      const args = buildDownloadArgs({ outputDir: '/downloads', outputTemplate: '%(title)s.%(ext)s' })
      expect(args).toEqual(['-P', '/downloads', '-o', '%(title)s.%(ext)s'])
    })

    it('handles playlistItems and concurrent fragments', () => {
      const args = buildDownloadArgs({ playlistItems: '1-5', concurrentFragments: 4 })
      expect(args).toEqual(['-I', '1-5', '-N', '4'])
    })

    it('handles download archive', () => {
      const args = buildDownloadArgs({ downloadArchive: 'archive.txt' })
      expect(args).toEqual(['--download-archive', 'archive.txt'])
    })
  })

  describe('2. buildFormatArgs', () => {
    it('handles formatSelector, formatSort, and mergeOutputFormat', () => {
      const args = buildFormatArgs({
        formatSelection: 'bestvideo+bestaudio',
        formatSort: 'res:1080',
        mergeOutputFormat: 'mp4',
      })
      expect(args).toEqual([
        '-f',
        'bestvideo+bestaudio',
        '-S',
        'res:1080',
        '--merge-output-format',
        'mp4',
      ])
    })

    it('handles checkFormats and multistreams', () => {
      const args = buildFormatArgs({
        checkFormats: true,
        audioMultistreams: true,
        videoMultistreams: true,
      })
      expect(args).toEqual([
        '--check-formats',
        '--audio-multistreams',
        '--video-multistreams',
      ])
    })
  })

  describe('3. buildSubtitleArgs', () => {
    it('handles writeSubs, writeAutoSubs, and embedSubs', () => {
      const args = buildSubtitleArgs({ writeSubs: true, writeAutoSubs: true, embedSubs: true })
      expect(args).toEqual(['--write-subs', '--write-auto-subs', '--embed-subs'])
    })

    it('handles array and string subLangs', () => {
      const argsArr = buildSubtitleArgs({ subLangs: ['en', 'es'] })
      expect(argsArr).toEqual(['--sub-langs', 'en,es'])
      const argsStr = buildSubtitleArgs({ subLangs: 'fr,de' })
      expect(argsStr).toEqual(['--sub-langs', 'fr,de'])
    })

    it('handles subFormat and convertSubs', () => {
      const args = buildSubtitleArgs({ subFormat: 'srt', convertSubs: 'vtt' })
      expect(args).toEqual(['--sub-format', 'srt', '--convert-subs', 'vtt'])
    })
  })

  describe('4. buildThumbnailArgs', () => {
    it('handles writeThumbnail and writeAllThumbnails', () => {
      const args = buildThumbnailArgs({ writeThumbnail: true, writeAllThumbnails: true })
      expect(args).toEqual(['--write-thumbnail', '--write-all-thumbnails'])
    })

    it('handles convertThumbnails and embedThumbnail', () => {
      const args = buildThumbnailArgs({ convertThumbnails: 'png', embedThumbnail: true })
      expect(args).toEqual(['--convert-thumbnails', 'png', '--embed-thumbnail'])
    })
  })

  describe('5. buildMetadataArgs', () => {
    it('handles boolean metadata flags', () => {
      const args = buildMetadataArgs({
        writeInfoJson: true,
        writeDescription: true,
        embedMetadata: true,
        embedChapters: true,
        splitChapters: true,
        xattrs: true,
      })
      expect(args).toEqual([
        '--write-info-json',
        '--write-description',
        '--embed-metadata',
        '--embed-chapters',
        '--split-chapters',
        '--xattrs',
      ])
    })

    it('handles loadInfoJson and parseMetadata', () => {
      const args = buildMetadataArgs({
        loadInfoJson: 'info.json',
        parseMetadata: ['%(title)s:%(artist)s', '%(album)s'],
      })
      expect(args).toEqual([
        '--load-info-json',
        'info.json',
        '--parse-metadata',
        '%(title)s:%(artist)s',
        '--parse-metadata',
        '%(album)s',
      ])
    })

    it('handles replaceInMetadata rules', () => {
      const args = buildMetadataArgs({
        replaceInMetadata: [{ field: 'title', regex: '\\[official\\]', replace: '' }],
      })
      expect(args).toEqual(['--replace-in-metadata', 'title', '\\[official\\]', ''])
    })
  })

  describe('6. buildPostProcessArgs', () => {
    it('handles extractAudio with format and quality', () => {
      const args = buildPostProcessArgs({
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '0',
      })
      expect(args).toEqual(['-x', '--audio-format', 'mp3', '--audio-quality', '0'])
    })

    it('handles remux, recode, keepVideo, and exec', () => {
      const args = buildPostProcessArgs({
        remuxVideo: 'mkv',
        recodeVideo: 'mp4',
        keepVideo: true,
        execCommand: 'echo done',
      })
      expect(args).toEqual([
        '--remux-video',
        'mkv',
        '--recode-video',
        'mp4',
        '-k',
        '--exec',
        'echo done',
      ])
    })

    it('handles fixup and postprocessorArgs', () => {
      const args = buildPostProcessArgs({
        fixup: 'force',
        postprocessorArgs: { ffmpeg: '-threads 4' },
      })
      expect(args).toEqual(['--fixup', 'force', '--postprocessor-args', 'ffmpeg:-threads 4'])
    })
  })

  describe('7. buildSponsorBlockArgs', () => {
    it('handles sponsorblockRemove and sponsorblockMark', () => {
      const args = buildSponsorBlockArgs({
        sponsorblockRemove: ['sponsor', 'intro'],
        sponsorblockMark: ['outro'],
      })
      expect(args).toEqual([
        '--sponsorblock-remove',
        'sponsor,intro',
        '--sponsorblock-mark',
        'outro',
      ])
    })

    it('handles sponsorblockApi and chapter title', () => {
      const args = buildSponsorBlockArgs({
        sponsorblockApi: 'https://sponsorblock.example.com',
        sponsorblockChapterTitle: '[SponsorBlock]: %(category)s',
      })
      expect(args).toEqual([
        '--sponsorblock-api',
        'https://sponsorblock.example.com',
        '--sponsorblock-chapter-title',
        '[SponsorBlock]: %(category)s',
      ])
    })
  })

  describe('8. buildNetworkArgs', () => {
    it('handles proxy, rateLimit, retries, socketTimeout', () => {
      const args = buildNetworkArgs({
        proxy: 'http://proxy:8080',
        rateLimit: '1M',
        retries: 5,
        socketTimeout: 30,
      })
      expect(args).toEqual([
        '--proxy',
        'http://proxy:8080',
        '-r',
        '1M',
        '-R',
        '5',
        '--socket-timeout',
        '30',
      ])
    })

    it('handles impersonate and addHeaders', () => {
      const args = buildNetworkArgs({
        impersonate: 'chrome',
        addHeaders: { Authorization: 'Bearer token', 'User-Agent': 'CustomUA' },
      })
      expect(args).toEqual([
        '--impersonate',
        'chrome',
        '--add-header',
        'Authorization:Bearer token',
        '--add-header',
        'User-Agent:CustomUA',
      ])
    })

    it('handles network flags like enableFileUrls, skipUnavailableFragments', () => {
      const args = buildNetworkArgs({
        enableFileUrls: true,
        skipUnavailableFragments: true,
        keepFragments: true,
      })
      expect(args).toEqual([
        '--enable-file-urls',
        '--skip-unavailable-fragments',
        '--keep-fragments',
      ])
    })
  })

  describe('9. buildAuthArgs', () => {
    it('handles credentials and 2FA', () => {
      const args = buildAuthArgs({
        username: 'user1',
        password: 'pass1',
        twoFactor: '123456',
        videoPassword: 'vpass',
      })
      expect(args).toEqual([
        '-u',
        'user1',
        '-p',
        'pass1',
        '--twofactor',
        '123456',
        '--video-password',
        'vpass',
      ])
    })

    it('handles cookies and netrc', () => {
      const args = buildAuthArgs({
        cookiesFile: 'cookies.txt',
        cookiesBrowser: 'firefox',
        netrc: true,
      })
      expect(args).toEqual([
        '--cookies',
        'cookies.txt',
        '--cookies-from-browser',
        'firefox',
        '--netrc',
      ])
    })

    it('handles TV Provider AP options', () => {
      const args = buildAuthArgs({
        apMso: 'Comcast',
        apUsername: 'apuser',
        apPassword: 'appassword',
      })
      expect(args).toEqual([
        '--ap-mso',
        'Comcast',
        '--ap-username',
        'apuser',
        '--ap-password',
        'appassword',
      ])
    })
  })

  describe('10. buildFilterArgs', () => {
    it('handles date ranges and filesize bounds', () => {
      const args = buildFilterArgs({
        minFilesize: '10M',
        maxFilesize: '100M',
        date: '20260101',
        dateBefore: '20260601',
        dateAfter: '20250101',
      })
      expect(args).toEqual([
        '--min-filesize',
        '10M',
        '--max-filesize',
        '100M',
        '--date',
        '20260101',
        '--datebefore',
        '20260601',
        '--dateafter',
        '20250101',
      ])
    })

    it('handles matchFilters, ageLimit, maxDownloads, noPlaylist', () => {
      const args = buildFilterArgs({
        matchFilters: ['duration > 60', 'view_count > 500'],
        noPlaylist: true,
        ageLimit: 18,
        maxDownloads: 10,
      })
      expect(args).toEqual([
        '--match-filter',
        'duration > 60',
        '--match-filter',
        'view_count > 500',
        '--no-playlist',
        '--age-limit',
        '18',
        '--max-downloads',
        '10',
      ])
    })
  })

  describe('11. buildFilesystemArgs', () => {
    it('handles filename flags and overwrite control', () => {
      const args = buildFilesystemArgs({
        windowsFilenames: true,
        restrictFilenames: true,
        trimFilenames: 50,
        noOverwrites: true,
        continueDownload: true,
      })
      expect(args).toEqual([
        '--windows-filenames',
        '--restrict-filenames',
        '--trim-filenames',
        '50',
        '-w',
        '-c',
      ])
    })

    it('handles part files, cache dir, and subpaths', () => {
      const args = buildFilesystemArgs({
        partFile: true,
        cacheDir: '/cache',
        subpaths: { subtitle: '/subs', thumbnail: '/thumbs' },
      })
      expect(args).toEqual([
        '--part',
        '--cache-dir',
        '/cache',
        '-P',
        'subtitle:/subs',
        '-P',
        'thumbnail:/thumbs',
      ])
    })
  })

  describe('12. buildExtractorArgs', () => {
    it('handles extractorArgs and useExtractors', () => {
      const args = buildExtractorArgs({
        extractorArgs: { youtube: 'player_client=android' },
        useExtractors: ['youtube', 'generic'],
      })
      expect(args).toEqual([
        '--extractor-args',
        'youtube:player_client=android',
        '--use-extractors',
        'youtube,generic',
      ])
    })

    it('handles flatPlaylist, jsRuntimes, and waitForVideo', () => {
      const args = buildExtractorArgs({
        flatPlaylist: true,
        jsRuntimes: ['node', 'deno'],
        waitForVideo: 10,
      })
      expect(args).toEqual([
        '--flat-playlist',
        '--wait-for-video',
        '10',
        '--js-runtimes',
        'node,deno',
      ])
    })
  })

  describe('13. buildExternalDownloaderArgs', () => {
    it('handles downloader and downloaderArgs', () => {
      const args = buildExternalDownloaderArgs({
        downloader: 'aria2c',
        downloaderArgs: ['-x', '16', '-s', '16'],
      })
      expect(args).toEqual([
        '--downloader',
        'aria2c',
        '--downloader-args',
        '-x 16 -s 16',
      ])
    })

    it('handles HLS options', () => {
      const args = buildExternalDownloaderArgs({
        hlsPreferNative: true,
        hlsUseMpegts: true,
        hlsSplitDiscontinuity: true,
      })
      expect(args).toEqual([
        '--hls-prefer-native',
        '--hls-use-mpegts',
        '--hls-split-discontinuity',
      ])
    })
  })

  describe('14. buildVerbosityArgs', () => {
    it('handles simulation and dumpJson flags', () => {
      const args = buildVerbosityArgs({
        simulate: true,
        skipDownload: true,
        dumpJson: true,
        dumpSingleJson: true,
      })
      expect(args).toEqual(['-s', '--skip-download', '-j', '-J'])
    })

    it('handles verbose, warnings, printTraffic, ignoreErrors', () => {
      const args = buildVerbosityArgs({
        verbose: true,
        noWarnings: true,
        printTraffic: true,
        ignoreErrors: true,
      })
      expect(args).toEqual(['-v', '--print-traffic', '--no-warnings', '-i'])
    })

    it('handles printToFile and printTemplate', () => {
      const args = buildVerbosityArgs({
        printTemplate: '%(id)s',
        printToFile: { template: '%(title)s', file: 'titles.txt' },
      })
      expect(args).toEqual(['-O', '%(id)s', '--print-to-file', '%(title)s', 'titles.txt'])
    })
  })

  describe('Credential Masking', () => {
    it('masks sensitive auth values correctly', () => {
      const masked = maskSensitiveArgs(['-u', 'secretUser', '-p', 'secretPass', 'https://example.com'])
      expect(masked).toEqual(['-u', '***', '-p', '***', 'https://example.com'])
    })

    it('buildMaskedCommandString masks passwords in generated command', () => {
      const cmd = buildMaskedCommandString({
        username: 'alice',
        password: 'mypassword',
        urls: ['https://example.com'],
      })
      expect(cmd).toContain('-u ***')
      expect(cmd).toContain('-p ***')
      expect(cmd).not.toContain('mypassword')
    })
  })
})
