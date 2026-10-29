import { YtdlpOptions } from '../../types/ytdlp'

export const SENSITIVE_FLAGS = new Set([
  '-u',
  '-p',
  '--username',
  '--password',
  '--video-password',
  '--ap-password',
  '--twofactor',
])

/**
 * Builds CLI argument list from YtdlpOptions.
 */
export function buildCliArgs(options: Partial<YtdlpOptions>): string[] {
  const args: string[] = []

  // Download & Output
  if (options.outputDir) {
    args.push('-P', options.outputDir)
  }
  if (options.outputTemplate) {
    args.push('-o', options.outputTemplate)
  }
  if (options.playlist) {
    args.push('--yes-playlist')
  }
  if (options.playlistItems) {
    args.push('-I', options.playlistItems)
  }
  if (options.concurrentFragments && options.concurrentFragments > 1) {
    args.push('-N', String(options.concurrentFragments))
  }
  if (options.archiveFile) {
    args.push('--download-archive', options.archiveFile)
  }
  if (options.maxDownloads) {
    args.push('--max-downloads', String(options.maxDownloads))
  }

  // Format
  if (options.formatSelector) {
    args.push('-f', options.formatSelector)
  }
  if (options.mergeOutputFormat) {
    args.push('--merge-output-format', options.mergeOutputFormat)
  }
  if (options.extractAudio) {
    args.push('-x')
    if (options.audioFormat) {
      args.push('--audio-format', options.audioFormat)
    }
    if (options.audioQuality) {
      args.push('--audio-quality', options.audioQuality)
    }
  }

  // Subtitles
  if (options.writeSubs) {
    args.push('--write-subs')
  }
  if (options.writeAutoSubs) {
    args.push('--write-auto-subs')
  }
  if (options.subLangs) {
    args.push('--sub-langs', options.subLangs)
  }
  if (options.embedSubs) {
    args.push('--embed-subs')
  }
  if (options.subFormat) {
    args.push('--sub-format', options.subFormat)
  }

  // Thumbnails
  if (options.writeThumbnail) {
    args.push('--write-thumbnail')
  }
  if (options.embedThumbnail) {
    args.push('--embed-thumbnail')
  }

  // Metadata
  if (options.writeInfoJson) {
    args.push('--write-info-json')
  }
  if (options.writeDescription) {
    args.push('--write-description')
  }
  if (options.embedMetadata) {
    args.push('--embed-metadata')
  }
  if (options.embedChapters) {
    args.push('--embed-chapters')
  }

  // Network & Proxy
  if (options.proxy) {
    args.push('--proxy', options.proxy)
  }
  if (options.rateLimit) {
    args.push('-r', options.rateLimit)
  }
  if (options.retries !== undefined) {
    args.push('-R', String(options.retries))
  }
  if (options.socketTimeout !== undefined) {
    args.push('--socket-timeout', String(options.socketTimeout))
  }

  // Authentication
  if (options.username) {
    args.push('-u', options.username)
  }
  if (options.password) {
    args.push('-p', options.password)
  }
  if (options.twoFactor) {
    args.push('--twofactor', options.twoFactor)
  }
  if (options.videoPassword) {
    args.push('--video-password', options.videoPassword)
  }
  if (options.cookiesBrowser) {
    args.push('--cookies-from-browser', options.cookiesBrowser)
  }
  if (options.cookiesFile) {
    args.push('--cookies', options.cookiesFile)
  }
  if (options.netrc) {
    args.push('--netrc')
  }

  // Filesystem
  if (options.windowsFilenames) {
    args.push('--windows-filenames')
  }
  if (options.restrictFilenames) {
    args.push('--restrict-filenames')
  }
  if (options.noOverwrites) {
    args.push('-w')
  }
  if (options.partFiles) {
    args.push('--part')
  }

  // Raw extras
  if (options._raw && Array.isArray(options._raw)) {
    args.push(...options._raw)
  }

  // URLs (appended at the end)
  if (options.urls && options.urls.length > 0) {
    for (const url of options.urls) {
      if (typeof url === 'string') {
        const trimmed = url.trim()
        if (trimmed) {
          args.push(trimmed)
        }
      }
    }
  }

  return args
}

/**
 * Redacts credentials in argument list with '***'.
 */
export function maskSensitiveCliArgs(args: string[]): string[] {
  const masked: string[] = []
  for (let i = 0; i < args.length; i++) {
    const current = args[i]
    masked.push(current)

    if (SENSITIVE_FLAGS.has(current) && i + 1 < args.length) {
      masked.push('***')
      i++ // Skip original sensitive value
    }
  }
  return masked
}

/**
 * Constructs a full masked command string: `yt-dlp <args...>`
 */
export function buildMaskedCommand(options: Partial<YtdlpOptions>): string {
  const rawArgs = buildCliArgs(options)
  const maskedArgs = maskSensitiveCliArgs(rawArgs)
  const escaped = maskedArgs.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))
  return `yt-dlp ${escaped.join(' ')}`.trim()
}
