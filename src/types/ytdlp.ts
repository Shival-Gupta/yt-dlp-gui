export type JobStatus =
  | 'queued'
  | 'downloading'
  | 'processing'
  | 'paused'
  | 'done'
  | 'error'
  | 'cancelled'

export interface DownloadJob {
  id: string
  url: string
  title?: string
  progress: number // 0-100
  speed?: string
  eta?: string
  status: JobStatus
  error?: string
  outputPath?: string
  startedAt: number
  finishedAt?: number
  formatId?: string
  filesize?: number
  uploader?: string
  duration?: number
  thumbnail?: string
  options?: Partial<YtdlpOptions>
}

export interface YtdlpFormat {
  formatId: string
  ext: string
  resolution?: string
  fps?: number
  filesize?: number
  tbr?: number
  vcodec?: string
  acodec?: string
  note?: string
}

export interface YtdlpInfo {
  id: string
  title: string
  uploader?: string
  duration?: number
  thumbnail?: string
  formats: YtdlpFormat[]
  subtitles?: Record<string, unknown>
  automaticCaptions?: Record<string, unknown>
}

export interface ReplaceInMetadataRule {
  field: string
  regex: string
  replace: string
}

export interface YtdlpOptions {
  // Panel 1 - Download & Output
  urls?: string[]
  outputDir?: string
  outputTemplate?: string
  playlist?: boolean
  noPlaylist?: boolean
  playlistItems?: string
  concurrentFragments?: number
  downloadArchive?: string
  archiveFile?: string
  maxDownloads?: number

  // Panel 2 - Format & Quality
  formatSelection?: string
  formatSelector?: string
  formatSort?: string
  mergeOutputFormat?: string
  checkFormats?: boolean
  audioMultistreams?: boolean
  videoMultistreams?: boolean
  audioOnly?: boolean
  audioFormat?: 'mp3' | 'aac' | 'm4a' | 'opus' | 'vorbis' | 'flac' | 'alac' | 'wav' | string
  audioQuality?: string

  // Panel 3 - Subtitles
  writeSubs?: boolean
  writeAutoSubs?: boolean
  subLangs?: string
  subFormat?: 'best' | 'srt' | 'vtt' | 'ass' | 'lrc' | 'json3' | 'ttml' | string
  convertSubs?: 'srt' | 'vtt' | 'ass' | 'lrc' | string
  embedSubs?: boolean

  // Panel 4 - Thumbnails
  writeThumbnail?: boolean
  writeAllThumbnails?: boolean
  allThumbnails?: boolean
  convertThumbnails?: 'jpg' | 'png' | 'webp' | string
  convertThumbnail?: string
  embedThumbnail?: boolean

  // Panel 5 - Metadata & Files
  writeInfoJson?: boolean
  writeDescription?: boolean
  writeComments?: boolean
  writePlaylistMetafiles?: boolean
  cleanInfoJson?: boolean
  embedMetadata?: boolean
  embedChapters?: boolean
  embedInfoJson?: boolean
  splitChapters?: boolean
  writeUrlLink?: boolean
  writeWeBlocLink?: boolean
  writeDesktopLink?: boolean
  xattrs?: boolean
  loadInfoJson?: string
  parseMetadata?: string[] | string
  replaceInMetadata?: ReplaceInMetadataRule[]

  // Panel 6 - Post-Processing
  extractAudio?: boolean
  remuxVideo?: string
  recodeVideo?: string
  keepVideo?: boolean
  postOverwrites?: boolean
  fixup?: 'never' | 'warn' | 'detect_or_warn' | 'force' | string
  execCommand?: string
  postprocessorArgs?: Record<string, string> | string

  // Panel 7 - SponsorBlock
  sponsorblockRemove?: string[]
  sponsorblockMark?: string[]
  sponsorblockApi?: string
  sponsorblockChapterTitle?: string

  // Panel 8 - Network & Proxy
  proxy?: string
  rateLimit?: string
  retries?: number
  socketTimeout?: number
  sourceAddress?: string
  geoVerificationProxy?: string
  xff?: string
  fragmentRetries?: number
  sleepInterval?: number
  maxSleepInterval?: number
  minSleepInterval?: number
  sleepRequests?: number
  addHeaders?: Record<string, string>
  headers?: Record<string, string>
  impersonate?: string
  enableFileUrls?: boolean
  skipUnavailableFragments?: boolean
  abortOnUnavailableFragment?: boolean
  bufferSize?: string
  httpChunkSize?: string
  keepFragments?: boolean
  userAgent?: string
  referer?: string

  // Panel 9 - Authentication
  username?: string
  password?: string
  twoFactor?: string
  videoPassword?: string
  cookies?: string
  cookiesFile?: string
  cookiesFromBrowser?: string
  cookiesBrowser?: string
  netrc?: boolean
  netrcLocation?: string
  netrcCmd?: string
  apMso?: string
  apUsername?: string
  apPassword?: string

  // Panel 10 - Video Selection / Filters
  minFilesize?: string
  maxFilesize?: string
  date?: string
  dateBefore?: string
  dateAfter?: string
  matchFilter?: string
  matchFilters?: string[] | string
  breakMatchFilter?: string
  breakMatchFilters?: string[] | string
  ageLimit?: number
  skipPlaylistAfterErrors?: number
  breakOnExisting?: boolean
  breakPerInput?: boolean

  // Panel 11 - Filesystem
  windowsFilenames?: boolean
  restrictFilenames?: boolean
  trimFilenames?: number
  noOverwrites?: boolean
  forceOverwrites?: boolean
  continueDownload?: boolean
  partFile?: boolean
  partFiles?: boolean
  mtime?: boolean
  cacheDir?: string
  noCacheDir?: boolean
  subpaths?: Record<string, string>
  forceWriteArchive?: boolean

  // Panel 12 - Extractor Options
  extractorArgs?: Record<string, string> | string
  useExtractors?: string[] | string
  flatPlaylist?: boolean
  liveFromStart?: boolean
  waitForVideo?: string | number
  markWatched?: boolean
  jsRuntimes?: string[] | string
  jsEngine?: string
  remoteComponents?: string
  defaultSearch?: string
  configLocations?: string
  pluginDirs?: string[] | string

  // Panel 13 - External Downloader
  downloader?: string
  downloaderArgs?: string[] | string
  hlsPreferNative?: boolean
  hlsPreferFfmpeg?: boolean
  hlsUseMpegts?: boolean
  hlsSplitDiscontinuity?: boolean

  // Panel 14 - Verbosity & Simulation
  simulate?: boolean
  skipDownload?: boolean
  printTemplate?: string
  dumpJson?: boolean
  dumpSingleJson?: boolean
  verbose?: boolean
  printTraffic?: boolean
  noWarnings?: boolean
  printToFile?: { template: string; file: string }
  compatOptions?: string
  ignoreErrors?: boolean
  noAbortOnError?: boolean
  ignoreConfig?: boolean
  quiet?: boolean

  _raw?: string[]
}

