import { YtdlpOptions } from '../types/ytdlp'

/**
 * Single source of truth for translating YtdlpOptions into a CLI arguments array.
 * Translates typed options from all 14 panels into authentic yt-dlp CLI flags.
 */
export function buildArgs(opts: YtdlpOptions): string[] {
  const args = [
    ...buildDownloadArgs(opts),
    ...buildFormatArgs(opts),
    ...buildSubtitleArgs(opts),
    ...buildThumbnailArgs(opts),
    ...buildMetadataArgs(opts),
    ...buildPostProcessArgs(opts),
    ...buildSponsorBlockArgs(opts),
    ...buildNetworkArgs(opts),
    ...buildAuthArgs(opts),
    ...buildFilterArgs(opts),
    ...buildFilesystemArgs(opts),
    ...buildExtractorArgs(opts),
    ...buildExternalDownloaderArgs(opts),
    ...buildVerbosityArgs(opts),
    ...(opts._raw ?? []),
  ]

  // Append URLs at the end if provided and not already included
  if (opts.urls && opts.urls.length > 0) {
    for (const url of opts.urls) {
      if (!args.includes(url)) {
        args.push(url)
      }
    }
  }

  return args
}

// 1. Output & Directory Options (Panel 1)
export const buildDownloadArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.outputDir) {
    args.push('-P', opts.outputDir)
  }
  if (opts.outputTemplate) {
    args.push('-o', opts.outputTemplate)
  }
  if (opts.playlistItems) {
    args.push('-I', opts.playlistItems)
  }
  if (opts.concurrentFragments && opts.concurrentFragments > 1) {
    args.push('-N', String(opts.concurrentFragments))
  }
  const archive = opts.downloadArchive || opts.archiveFile
  if (archive) {
    args.push('--download-archive', archive)
  }
  return args
}

// 2. Format & Quality Options (Panel 2)
export const buildFormatArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  const format = opts.formatSelection || opts.formatSelector
  if (format) {
    args.push('-f', format)
  }
  if (opts.formatSort) {
    args.push('-S', opts.formatSort)
  }
  if (opts.mergeOutputFormat) {
    args.push('--merge-output-format', opts.mergeOutputFormat)
  }
  if (opts.checkFormats) {
    args.push('--check-formats')
  }
  if (opts.audioMultistreams) {
    args.push('--audio-multistreams')
  }
  if (opts.videoMultistreams) {
    args.push('--video-multistreams')
  }
  return args
}

// 3. Subtitle Options (Panel 3)
export const buildSubtitleArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.writeSubs) {
    args.push('--write-subs')
  }
  if (opts.writeAutoSubs) {
    args.push('--write-auto-subs')
  }
  if (opts.subLangs) {
    const langs = Array.isArray(opts.subLangs) ? opts.subLangs.join(',') : opts.subLangs
    if (langs.length > 0) {
      args.push('--sub-langs', langs)
    }
  }
  if (opts.subFormat) {
    args.push('--sub-format', opts.subFormat)
  }
  if (opts.convertSubs) {
    args.push('--convert-subs', opts.convertSubs)
  }
  if (opts.embedSubs) {
    args.push('--embed-subs')
  }
  return args
}

// 4. Thumbnail Options (Panel 4)
export const buildThumbnailArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.writeThumbnail) {
    args.push('--write-thumbnail')
  }
  if (opts.writeAllThumbnails || opts.allThumbnails) {
    args.push('--write-all-thumbnails')
  }
  const convert = opts.convertThumbnails || opts.convertThumbnail
  if (convert) {
    args.push('--convert-thumbnails', convert)
  }
  if (opts.embedThumbnail) {
    args.push('--embed-thumbnail')
  }
  return args
}

// 5. Metadata & Files Options (Panel 5)
export const buildMetadataArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.writeInfoJson) {
    args.push('--write-info-json')
  }
  if (opts.writeDescription) {
    args.push('--write-description')
  }
  if (opts.writeComments) {
    args.push('--write-comments')
  }
  if (opts.writePlaylistMetafiles) {
    args.push('--write-playlist-metafiles')
  }
  if (opts.cleanInfoJson) {
    args.push('--clean-info-json')
  }
  if (opts.embedMetadata) {
    args.push('--embed-metadata')
  }
  if (opts.embedChapters) {
    args.push('--embed-chapters')
  }
  if (opts.embedInfoJson) {
    args.push('--embed-info-json')
  }
  if (opts.splitChapters) {
    args.push('--split-chapters')
  }
  if (opts.writeUrlLink) {
    args.push('--write-url-link')
  }
  if (opts.writeWeBlocLink) {
    args.push('--write-webloc-link')
  }
  if (opts.writeDesktopLink) {
    args.push('--write-desktop-link')
  }
  if (opts.xattrs) {
    args.push('--xattrs')
  }
  if (opts.loadInfoJson) {
    args.push('--load-info-json', opts.loadInfoJson)
  }
  if (opts.parseMetadata) {
    if (Array.isArray(opts.parseMetadata)) {
      for (const pm of opts.parseMetadata) {
        if (pm) args.push('--parse-metadata', pm)
      }
    } else if (opts.parseMetadata) {
      args.push('--parse-metadata', opts.parseMetadata)
    }
  }
  if (opts.replaceInMetadata && opts.replaceInMetadata.length > 0) {
    for (const rim of opts.replaceInMetadata) {
      args.push('--replace-in-metadata', rim.field, rim.regex, rim.replace)
    }
  }
  return args
}

// 6. Post-Processing Options (Panel 6)
export const buildPostProcessArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.extractAudio || opts.audioOnly) {
    args.push('-x')
    if (opts.audioFormat) {
      args.push('--audio-format', opts.audioFormat)
    }
    if (opts.audioQuality !== undefined && opts.audioQuality !== '') {
      args.push('--audio-quality', String(opts.audioQuality))
    }
  }
  if (opts.remuxVideo) {
    args.push('--remux-video', opts.remuxVideo)
  }
  if (opts.recodeVideo) {
    args.push('--recode-video', opts.recodeVideo)
  }
  if (opts.keepVideo) {
    args.push('-k')
  }
  if (opts.postOverwrites) {
    args.push('--post-overwrites')
  }
  if (opts.fixup) {
    args.push('--fixup', opts.fixup)
  }
  if (opts.execCommand) {
    args.push('--exec', opts.execCommand)
  }
  if (opts.postprocessorArgs) {
    if (typeof opts.postprocessorArgs === 'object') {
      for (const [k, v] of Object.entries(opts.postprocessorArgs)) {
        args.push('--postprocessor-args', `${k}:${v}`)
      }
    } else {
      args.push('--postprocessor-args', opts.postprocessorArgs)
    }
  }
  return args
}

// 7. SponsorBlock Options (Panel 7)
export const buildSponsorBlockArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.sponsorblockRemove && opts.sponsorblockRemove.length > 0) {
    const cats = Array.isArray(opts.sponsorblockRemove)
      ? opts.sponsorblockRemove.join(',')
      : opts.sponsorblockRemove
    args.push('--sponsorblock-remove', cats)
  }
  if (opts.sponsorblockMark && opts.sponsorblockMark.length > 0) {
    const cats = Array.isArray(opts.sponsorblockMark)
      ? opts.sponsorblockMark.join(',')
      : opts.sponsorblockMark
    args.push('--sponsorblock-mark', cats)
  }
  if (opts.sponsorblockApi) {
    args.push('--sponsorblock-api', opts.sponsorblockApi)
  }
  if (opts.sponsorblockChapterTitle) {
    args.push('--sponsorblock-chapter-title', opts.sponsorblockChapterTitle)
  }
  return args
}

// 8. Network & Proxy Options (Panel 8)
export const buildNetworkArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.proxy) {
    args.push('--proxy', opts.proxy)
  }
  if (opts.rateLimit) {
    args.push('-r', opts.rateLimit)
  }
  if (opts.retries !== undefined) {
    args.push('-R', String(opts.retries))
  }
  if (opts.socketTimeout !== undefined) {
    args.push('--socket-timeout', String(opts.socketTimeout))
  }
  if (opts.sourceAddress) {
    args.push('--source-address', opts.sourceAddress)
  }
  if (opts.geoVerificationProxy) {
    args.push('--geo-verification-proxy', opts.geoVerificationProxy)
  }
  if (opts.xff) {
    args.push('--xff', opts.xff)
  }
  if (opts.fragmentRetries !== undefined) {
    args.push('--fragment-retries', String(opts.fragmentRetries))
  }
  if (opts.sleepInterval !== undefined) {
    args.push('--sleep-interval', String(opts.sleepInterval))
  }
  if (opts.maxSleepInterval !== undefined) {
    args.push('--max-sleep-interval', String(opts.maxSleepInterval))
  }
  if (opts.minSleepInterval !== undefined) {
    args.push('--min-sleep-interval', String(opts.minSleepInterval))
  }
  if (opts.sleepRequests !== undefined) {
    args.push('--sleep-requests', String(opts.sleepRequests))
  }
  if (opts.impersonate) {
    args.push('--impersonate', opts.impersonate)
  }
  const headersObj = opts.addHeaders || opts.headers
  if (headersObj) {
    for (const [k, v] of Object.entries(headersObj)) {
      args.push('--add-header', `${k}:${v}`)
    }
  }
  if (opts.enableFileUrls) {
    args.push('--enable-file-urls')
  }
  if (opts.skipUnavailableFragments) {
    args.push('--skip-unavailable-fragments')
  }
  if (opts.abortOnUnavailableFragment) {
    args.push('--abort-on-unavailable-fragment')
  }
  if (opts.bufferSize) {
    args.push('--buffer-size', opts.bufferSize)
  }
  if (opts.httpChunkSize) {
    args.push('--http-chunk-size', opts.httpChunkSize)
  }
  if (opts.keepFragments) {
    args.push('--keep-fragments')
  }
  if (opts.userAgent) {
    args.push('--user-agent', opts.userAgent)
  }
  if (opts.referer) {
    args.push('--referer', opts.referer)
  }
  return args
}

// 9. Authentication Options (Panel 9)
export const buildAuthArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.username) {
    args.push('-u', opts.username)
  }
  if (opts.password) {
    args.push('-p', opts.password)
  }
  if (opts.twoFactor) {
    args.push('--twofactor', opts.twoFactor)
  }
  if (opts.videoPassword) {
    args.push('--video-password', opts.videoPassword)
  }
  const cookies = opts.cookies || opts.cookiesFile
  if (cookies) {
    args.push('--cookies', cookies)
  }
  const browser = opts.cookiesFromBrowser || opts.cookiesBrowser
  if (browser) {
    args.push('--cookies-from-browser', browser)
  }
  if (opts.netrc) {
    args.push('--netrc')
  }
  if (opts.netrcLocation) {
    args.push('--netrc-location', opts.netrcLocation)
  }
  if (opts.netrcCmd) {
    args.push('--netrc-cmd', opts.netrcCmd)
  }
  if (opts.apMso) {
    args.push('--ap-mso', opts.apMso)
  }
  if (opts.apUsername) {
    args.push('--ap-username', opts.apUsername)
  }
  if (opts.apPassword) {
    args.push('--ap-password', opts.apPassword)
  }
  return args
}

// 10. Video Selection & Filters (Panel 10)
export const buildFilterArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.minFilesize) {
    args.push('--min-filesize', opts.minFilesize)
  }
  if (opts.maxFilesize) {
    args.push('--max-filesize', opts.maxFilesize)
  }
  if (opts.date) {
    args.push('--date', opts.date)
  }
  if (opts.dateBefore) {
    args.push('--datebefore', opts.dateBefore)
  }
  if (opts.dateAfter) {
    args.push('--dateafter', opts.dateAfter)
  }
  const mf = opts.matchFilters || opts.matchFilter
  if (mf) {
    if (Array.isArray(mf)) {
      for (const f of mf) {
        args.push('--match-filter', f)
      }
    } else {
      args.push('--match-filter', mf)
    }
  }
  const bmf = opts.breakMatchFilters || opts.breakMatchFilter
  if (bmf) {
    if (Array.isArray(bmf)) {
      for (const f of bmf) {
        args.push('--break-match-filters', f)
      }
    } else {
      args.push('--break-match-filters', bmf)
    }
  }
  if (opts.noPlaylist || opts.playlist === false) {
    args.push('--no-playlist')
  }
  if (opts.ageLimit !== undefined) {
    args.push('--age-limit', String(opts.ageLimit))
  }
  if (opts.maxDownloads !== undefined) {
    args.push('--max-downloads', String(opts.maxDownloads))
  }
  if (opts.skipPlaylistAfterErrors !== undefined) {
    args.push('--skip-playlist-after-errors', String(opts.skipPlaylistAfterErrors))
  }
  if (opts.breakOnExisting) {
    args.push('--break-on-existing')
  }
  if (opts.breakPerInput) {
    args.push('--break-per-input')
  }
  return args
}

// 11. Filesystem Options (Panel 11)
export const buildFilesystemArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.windowsFilenames) {
    args.push('--windows-filenames')
  }
  if (opts.restrictFilenames) {
    args.push('--restrict-filenames')
  }
  if (opts.trimFilenames !== undefined) {
    args.push('--trim-filenames', String(opts.trimFilenames))
  }
  if (opts.noOverwrites) {
    args.push('-w')
  }
  if (opts.forceOverwrites) {
    args.push('--force-overwrites')
  }
  if (opts.continueDownload) {
    args.push('-c')
  }
  if (opts.partFile || opts.partFiles) {
    args.push('--part')
  }
  if (opts.mtime) {
    args.push('--mtime')
  }
  if (opts.cacheDir) {
    args.push('--cache-dir', opts.cacheDir)
  }
  if (opts.noCacheDir) {
    args.push('--no-cache-dir')
  }
  if (opts.subpaths) {
    for (const [type, dir] of Object.entries(opts.subpaths)) {
      args.push('-P', `${type}:${dir}`)
    }
  }
  if (opts.forceWriteArchive) {
    args.push('--force-write-archive')
  }
  return args
}

// 12. Extractor Options (Panel 12)
export const buildExtractorArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.extractorArgs) {
    if (typeof opts.extractorArgs === 'object') {
      for (const [ext, kv] of Object.entries(opts.extractorArgs)) {
        args.push('--extractor-args', `${ext}:${kv}`)
      }
    } else {
      args.push('--extractor-args', opts.extractorArgs)
    }
  }
  if (opts.useExtractors) {
    const ue = Array.isArray(opts.useExtractors)
      ? opts.useExtractors.join(',')
      : opts.useExtractors
    args.push('--use-extractors', ue)
  }
  if (opts.flatPlaylist) {
    args.push('--flat-playlist')
  }
  if (opts.liveFromStart) {
    args.push('--live-from-start')
  }
  if (opts.waitForVideo !== undefined) {
    args.push('--wait-for-video', String(opts.waitForVideo))
  }
  if (opts.markWatched) {
    args.push('--mark-watched')
  }
  const js = opts.jsRuntimes || opts.jsEngine
  if (js) {
    const jsVal = Array.isArray(js) ? js.join(',') : js
    args.push('--js-runtimes', jsVal)
  }
  if (opts.remoteComponents) {
    args.push('--remote-components', opts.remoteComponents)
  }
  if (opts.defaultSearch) {
    args.push('--default-search', opts.defaultSearch)
  }
  if (opts.configLocations) {
    args.push('--config-locations', opts.configLocations)
  }
  if (opts.pluginDirs) {
    if (Array.isArray(opts.pluginDirs)) {
      for (const pd of opts.pluginDirs) {
        args.push('--plugin-dirs', pd)
      }
    } else {
      args.push('--plugin-dirs', opts.pluginDirs)
    }
  }
  return args
}

// 13. External Downloader Options (Panel 13)
export const buildExternalDownloaderArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.downloader) {
    args.push('--downloader', opts.downloader)
  }
  if (opts.downloaderArgs) {
    const dArgs = Array.isArray(opts.downloaderArgs)
      ? opts.downloaderArgs.join(' ')
      : opts.downloaderArgs
    args.push('--downloader-args', dArgs)
  }
  if (opts.hlsPreferNative) {
    args.push('--hls-prefer-native')
  }
  if (opts.hlsPreferFfmpeg) {
    args.push('--hls-prefer-ffmpeg')
  }
  if (opts.hlsUseMpegts) {
    args.push('--hls-use-mpegts')
  }
  if (opts.hlsSplitDiscontinuity) {
    args.push('--hls-split-discontinuity')
  }
  return args
}

// 14. Verbosity & Simulation Options (Panel 14)
export const buildVerbosityArgs = (opts: YtdlpOptions): string[] => {
  const args: string[] = []
  if (opts.simulate) {
    args.push('-s')
  }
  if (opts.skipDownload) {
    args.push('--skip-download')
  }
  if (opts.printTemplate) {
    args.push('-O', opts.printTemplate)
  }
  if (opts.dumpJson) {
    args.push('-j')
  }
  if (opts.dumpSingleJson) {
    args.push('-J')
  }
  if (opts.verbose) {
    args.push('-v')
  }
  if (opts.printTraffic) {
    args.push('--print-traffic')
  }
  if (opts.noWarnings) {
    args.push('--no-warnings')
  }
  if (opts.printToFile) {
    args.push('--print-to-file', opts.printToFile.template, opts.printToFile.file)
  }
  if (opts.compatOptions) {
    args.push('--compat-options', opts.compatOptions)
  }
  if (opts.ignoreErrors) {
    args.push('-i')
  }
  if (opts.noAbortOnError) {
    args.push('--no-abort-on-error')
  }
  if (opts.ignoreConfig) {
    args.push('--ignore-config')
  }
  if (opts.quiet) {
    args.push('-q')
  }
  return args
}

/**
 * Redacts credentials in argument list with '***'.
 * Sensitive flags: -u, -p, --username, --password, --video-password, --ap-password, --twofactor
 */
export function maskSensitiveArgs(args: string[]): string[] {
  const sensitiveFlags = new Set([
    '-u',
    '-p',
    '--username',
    '--password',
    '--video-password',
    '--ap-password',
    '--twofactor',
  ])

  const masked: string[] = []
  for (let i = 0; i < args.length; i++) {
    const current = args[i]
    masked.push(current)

    if (sensitiveFlags.has(current) && i + 1 < args.length) {
      masked.push('***')
      i++ // skip original sensitive value
    }
  }

  return masked
}

/**
 * Constructs a displayable CLI command string with credentials masked.
 */
export function buildMaskedCommandString(options: Partial<YtdlpOptions>): string {
  const rawArgs = buildArgs(options as YtdlpOptions)
  const maskedArgs = maskSensitiveArgs(rawArgs)
  return `yt-dlp ${maskedArgs.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`
}
