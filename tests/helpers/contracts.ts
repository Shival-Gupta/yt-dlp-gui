/**
 * Shared Type Definitions and Contracts for E2E Tests
 * Derived strictly from AGENTS.md, PROJECT.md, and .agents/goals/A-H
 */

export type JobStatus = 'pending' | 'downloading' | 'completed' | 'error' | 'paused' | 'canceled';

export interface DownloadJob {
  id: string;
  url: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  progress: number;
  speed?: string;
  eta?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  status: JobStatus;
  error?: string;
  outputPath?: string;
  cliArgs: string[];
  createdAt: string;
}

export interface YtdlpFormat {
  format_id: string;
  ext: string;
  resolution: string;
  fps?: number | null;
  tbr?: number | null;
  vcodec?: string;
  acodec?: string;
  filesize?: number | null;
  note?: string;
  isVideoOnly?: boolean;
  isAudioOnly?: boolean;
  isCombined?: boolean;
}

export interface YtdlpThumbnail {
  url: string;
  width?: number;
  height?: number;
  id?: string;
}

export interface YtdlpChapter {
  start_time: number;
  end_time: number;
  title: string;
}

export interface YtdlpInfo {
  id: string;
  title: string;
  duration?: number;
  uploader?: string;
  uploader_id?: string;
  channel_id?: string;
  upload_date?: string;
  view_count?: number;
  thumbnail?: string;
  description?: string;
  webpage_url: string;
  extractor?: string;
  extractor_key?: string;
  formats: YtdlpFormat[];
  thumbnails?: YtdlpThumbnail[];
  subtitles?: Record<string, Array<{ ext: string; url: string }>>;
  automatic_captions?: Record<string, Array<{ ext: string; url: string }>>;
  chapters?: YtdlpChapter[];
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  duration?: number;
  filesize?: number;
  format_id?: string;
  preset?: string;
  outputPath: string;
  timestamp: string;
  status: 'completed' | 'error';
  error?: string;
}

export interface YtdlpOptions {
  // Download Options
  urls: string[];
  outputDir?: string;
  outputTemplate?: string;
  playlistItems?: string;
  concurrentFragments?: number;
  downloadArchive?: string;

  // Format & Quality
  formatSelection?: string;
  formatSort?: string;
  mergeOutputFormat?: string;
  checkFormats?: boolean;
  audioMultistreams?: boolean;
  videoMultistreams?: boolean;

  // Subtitles
  writeSubs?: boolean;
  writeAutoSubs?: boolean;
  subLangs?: string[];
  subFormat?: string;
  convertSubs?: string;
  embedSubs?: boolean;

  // Thumbnails
  writeThumbnail?: boolean;
  writeAllThumbnails?: boolean;
  convertThumbnails?: string;
  embedThumbnail?: boolean;

  // Metadata & Files
  writeInfoJson?: boolean;
  writeDescription?: boolean;
  writeComments?: boolean;
  embedMetadata?: boolean;
  embedChapters?: boolean;
  splitChapters?: boolean;
  replaceInMetadata?: Array<{ field: string; regex: string; replace: string }>;

  // Post-Processing
  extractAudio?: boolean;
  audioFormat?: 'mp3' | 'aac' | 'm4a' | 'opus' | 'vorbis' | 'flac' | 'wav';
  audioQuality?: string;
  remuxVideo?: string;
  recodeVideo?: string;
  keepVideo?: boolean;
  execCommand?: string;

  // SponsorBlock
  sponsorblockRemove?: string[];
  sponsorblockMark?: string[];
  sponsorblockApi?: string;
  sponsorblockChapterTitle?: string;

  // Network & Proxy
  proxy?: string;
  rateLimit?: string;
  retries?: number;
  socketTimeout?: number;
  impersonate?: string;
  addHeaders?: Record<string, string>;

  // Authentication
  username?: string;
  password?: string;
  twoFactor?: string;
  videoPassword?: string;
  cookies?: string;
  cookiesFromBrowser?: string;
  netrc?: boolean;
  apMso?: string;
  apUsername?: string;
  apPassword?: string;

  // Video Selection / Filters
  minFilesize?: string;
  maxFilesize?: string;
  date?: string;
  dateBefore?: string;
  dateAfter?: string;
  matchFilters?: string[];
  noPlaylist?: boolean;
  ageLimit?: number;
  maxDownloads?: number;

  // Filesystem
  windowsFilenames?: boolean;
  restrictFilenames?: boolean;
  trimFilenames?: number;
  noOverwrites?: boolean;
  forceOverwrites?: boolean;
  continueDownload?: boolean;
  partFile?: boolean;
  cacheDir?: string;

  // Extractor Options
  extractorArgs?: Record<string, string>;
  useExtractors?: string[];
  flatPlaylist?: boolean;
  jsRuntimes?: string[];

  // External Downloader
  downloader?: string;
  downloaderArgs?: string[];
  hlsPreferNative?: boolean;
  hlsPreferFfmpeg?: boolean;

  // Verbosity & Simulation
  simulate?: boolean;
  skipDownload?: boolean;
  dumpJson?: boolean;
  verbose?: boolean;
  ignoreErrors?: boolean;
  noWarnings?: boolean;
  printTraffic?: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  isBuiltin: boolean;
  options: Partial<YtdlpOptions>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultOutputDir: string;
  defaultOutputTemplate: string;
  maxConcurrentDownloads: number;
  historyMaxEntries: number;
  checkUpdatesOnStartup: boolean;
  minimizeToTray: boolean;
  showNotifications: boolean;
  ytdlpPathOverride?: string;
  ffmpegPathOverride?: string;
}

export interface ProgressEvent {
  status: 'downloading' | 'finished' | 'error';
  downloadedBytes?: number;
  totalBytes?: number;
  speed?: number;
  eta?: number;
  percentStr?: string;
}
