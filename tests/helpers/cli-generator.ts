import { YtdlpOptions } from './contracts';

/**
 * Builds CLI argument list from YtdlpOptions across all 14 panels.
 * Single source of truth adhering strictly to AGENTS.md, C-panels-agent.md, and ytdlp_help.txt.
 */
export function buildYtdlpArgs(options: Partial<YtdlpOptions>): string[] {
  const args: string[] = [];

  // 1. Output & Directory Options
  if (options.outputDir) {
    args.push('-P', options.outputDir);
  }
  if (options.outputTemplate) {
    args.push('-o', options.outputTemplate);
  }
  if (options.playlistItems) {
    args.push('-I', options.playlistItems);
  }
  if (options.concurrentFragments && options.concurrentFragments > 1) {
    args.push('-N', String(options.concurrentFragments));
  }
  if (options.downloadArchive) {
    args.push('--download-archive', options.downloadArchive);
  }

  // 2. Format & Quality Options
  if (options.formatSelection) {
    args.push('-f', options.formatSelection);
  }
  if (options.formatSort) {
    args.push('-S', options.formatSort);
  }
  if (options.mergeOutputFormat) {
    args.push('--merge-output-format', options.mergeOutputFormat);
  }
  if (options.checkFormats) {
    args.push('--check-formats');
  }
  if (options.audioMultistreams) {
    args.push('--audio-multistreams');
  }
  if (options.videoMultistreams) {
    args.push('--video-multistreams');
  }

  // 3. Subtitles
  if (options.writeSubs) {
    args.push('--write-subs');
  }
  if (options.writeAutoSubs) {
    args.push('--write-auto-subs');
  }
  if (options.subLangs && options.subLangs.length > 0) {
    args.push('--sub-langs', options.subLangs.join(','));
  }
  if (options.subFormat) {
    args.push('--sub-format', options.subFormat);
  }
  if (options.convertSubs) {
    args.push('--convert-subs', options.convertSubs);
  }
  if (options.embedSubs) {
    args.push('--embed-subs');
  }

  // 4. Thumbnails
  if (options.writeThumbnail) {
    args.push('--write-thumbnail');
  }
  if (options.writeAllThumbnails) {
    args.push('--write-all-thumbnails');
  }
  if (options.convertThumbnails) {
    args.push('--convert-thumbnails', options.convertThumbnails);
  }
  if (options.embedThumbnail) {
    args.push('--embed-thumbnail');
  }

  // 5. Metadata & Files
  if (options.writeInfoJson) {
    args.push('--write-info-json');
  }
  if (options.writeDescription) {
    args.push('--write-description');
  }
  if (options.writeComments) {
    args.push('--write-comments');
  }
  if (options.embedMetadata) {
    args.push('--embed-metadata');
  }
  if (options.embedChapters) {
    args.push('--embed-chapters');
  }
  if (options.splitChapters) {
    args.push('--split-chapters');
  }
  if (options.replaceInMetadata && options.replaceInMetadata.length > 0) {
    for (const rim of options.replaceInMetadata) {
      args.push('--replace-in-metadata', rim.field, rim.regex, rim.replace);
    }
  }

  // 6. Post-Processing
  if (options.extractAudio) {
    args.push('-x');
    if (options.audioFormat) {
      args.push('--audio-format', options.audioFormat);
    }
    if (options.audioQuality !== undefined && options.audioQuality !== '') {
      args.push('--audio-quality', String(options.audioQuality));
    }
  }
  if (options.remuxVideo) {
    args.push('--remux-video', options.remuxVideo);
  }
  if (options.recodeVideo) {
    args.push('--recode-video', options.recodeVideo);
  }
  if (options.keepVideo) {
    args.push('-k');
  }
  if (options.execCommand) {
    args.push('--exec', options.execCommand);
  }

  // 7. SponsorBlock
  if (options.sponsorblockRemove && options.sponsorblockRemove.length > 0) {
    args.push('--sponsorblock-remove', options.sponsorblockRemove.join(','));
  }
  if (options.sponsorblockMark && options.sponsorblockMark.length > 0) {
    args.push('--sponsorblock-mark', options.sponsorblockMark.join(','));
  }
  if (options.sponsorblockApi) {
    args.push('--sponsorblock-api', options.sponsorblockApi);
  }
  if (options.sponsorblockChapterTitle) {
    args.push('--sponsorblock-chapter-title', options.sponsorblockChapterTitle);
  }

  // 8. Network & Proxy
  if (options.proxy) {
    args.push('--proxy', options.proxy);
  }
  if (options.rateLimit) {
    args.push('-r', options.rateLimit);
  }
  if (options.retries !== undefined) {
    args.push('-R', String(options.retries));
  }
  if (options.socketTimeout !== undefined) {
    args.push('--socket-timeout', String(options.socketTimeout));
  }
  if (options.impersonate) {
    args.push('--impersonate', options.impersonate);
  }
  if (options.addHeaders) {
    for (const [k, v] of Object.entries(options.addHeaders)) {
      args.push('--add-header', `${k}:${v}`);
    }
  }

  // 9. Authentication
  if (options.username) {
    args.push('-u', options.username);
  }
  if (options.password) {
    args.push('-p', options.password);
  }
  if (options.twoFactor) {
    args.push('--twofactor', options.twoFactor);
  }
  if (options.videoPassword) {
    args.push('--video-password', options.videoPassword);
  }
  if (options.cookies) {
    args.push('--cookies', options.cookies);
  }
  if (options.cookiesFromBrowser) {
    args.push('--cookies-from-browser', options.cookiesFromBrowser);
  }
  if (options.netrc) {
    args.push('--netrc');
  }
  if (options.apMso) {
    args.push('--ap-mso', options.apMso);
  }
  if (options.apUsername) {
    args.push('--ap-username', options.apUsername);
  }
  if (options.apPassword) {
    args.push('--ap-password', options.apPassword);
  }

  // 10. Video Selection & Filters
  if (options.minFilesize) {
    args.push('--min-filesize', options.minFilesize);
  }
  if (options.maxFilesize) {
    args.push('--max-filesize', options.maxFilesize);
  }
  if (options.date) {
    args.push('--date', options.date);
  }
  if (options.dateBefore) {
    args.push('--datebefore', options.dateBefore);
  }
  if (options.dateAfter) {
    args.push('--dateafter', options.dateAfter);
  }
  if (options.matchFilters && options.matchFilters.length > 0) {
    for (const mf of options.matchFilters) {
      args.push('--match-filter', mf);
    }
  }
  if (options.noPlaylist) {
    args.push('--no-playlist');
  }
  if (options.ageLimit !== undefined) {
    args.push('--age-limit', String(options.ageLimit));
  }
  if (options.maxDownloads !== undefined) {
    args.push('--max-downloads', String(options.maxDownloads));
  }

  // 11. Filesystem
  if (options.windowsFilenames) {
    args.push('--windows-filenames');
  }
  if (options.restrictFilenames) {
    args.push('--restrict-filenames');
  }
  if (options.trimFilenames) {
    args.push('--trim-filenames', String(options.trimFilenames));
  }
  if (options.noOverwrites) {
    args.push('-w');
  }
  if (options.forceOverwrites) {
    args.push('--force-overwrites');
  }
  if (options.continueDownload) {
    args.push('-c');
  }
  if (options.partFile) {
    args.push('--part');
  }
  if (options.cacheDir) {
    args.push('--cache-dir', options.cacheDir);
  }

  // 12. Extractor Options
  if (options.extractorArgs) {
    for (const [ext, kv] of Object.entries(options.extractorArgs)) {
      args.push('--extractor-args', `${ext}:${kv}`);
    }
  }
  if (options.useExtractors && options.useExtractors.length > 0) {
    args.push('--use-extractors', options.useExtractors.join(','));
  }
  if (options.flatPlaylist) {
    args.push('--flat-playlist');
  }
  if (options.jsRuntimes && options.jsRuntimes.length > 0) {
    args.push('--js-runtimes', options.jsRuntimes.join(','));
  }

  // 13. External Downloader
  if (options.downloader) {
    args.push('--downloader', options.downloader);
  }
  if (options.downloaderArgs && options.downloaderArgs.length > 0) {
    args.push('--downloader-args', options.downloaderArgs.join(' '));
  }
  if (options.hlsPreferNative) {
    args.push('--hls-prefer-native');
  }
  if (options.hlsPreferFfmpeg) {
    args.push('--hls-prefer-ffmpeg');
  }

  // 14. Verbosity & Simulation
  if (options.simulate) {
    args.push('-s');
  }
  if (options.skipDownload) {
    args.push('--skip-download');
  }
  if (options.dumpJson) {
    args.push('-j');
  }
  if (options.verbose) {
    args.push('-v');
  }
  if (options.ignoreErrors) {
    args.push('-i');
  }
  if (options.noWarnings) {
    args.push('--no-warnings');
  }
  if (options.printTraffic) {
    args.push('--print-traffic');
  }

  // URLs (appended at the end)
  if (options.urls && options.urls.length > 0) {
    args.push(...options.urls);
  }

  return args;
}

/**
 * Redacts credentials in argument list with '***'.
 * Sensitive flags: -u, -p, --username, --password, --video-password, --ap-password
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
  ]);

  const masked: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    masked.push(current);

    if (sensitiveFlags.has(current) && i + 1 < args.length) {
      masked.push('***');
      i++; // skip original sensitive value
    }
  }

  return masked;
}

/**
 * Constructs a displayable CLI command string with credentials masked.
 */
export function buildMaskedCommandString(options: Partial<YtdlpOptions>): string {
  const rawArgs = buildYtdlpArgs(options);
  const maskedArgs = maskSensitiveArgs(rawArgs);
  return `yt-dlp ${maskedArgs.map(arg => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`;
}
