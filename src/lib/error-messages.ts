export interface TranslatedError {
  category: string
  userMessage: string
  suggestedAction: string
  actionId?: 'auth' | 'tools' | 'network' | 'update' | 'format' | 'generic'
}

export interface ErrorPattern {
  category: string
  regex: RegExp
  userMessage: string
  suggestedAction: string
  actionId?: 'auth' | 'tools' | 'network' | 'update' | 'format' | 'generic'
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    category: 'age_restriction',
    regex: /sign in to confirm your age/i,
    userMessage: 'This video is age-restricted and requires signing in.',
    suggestedAction: 'Open Auth Panel and provide account credentials or cookies',
    actionId: 'auth',
  },
  {
    category: 'rate_limited',
    regex: /HTTP Error 429|Too Many Requests/i,
    userMessage: 'Rate limited by the server due to excessive requests.',
    suggestedAction: 'Wait before retrying or configure a proxy in Network Panel',
    actionId: 'network',
  },
  {
    category: 'private_video',
    regex: /this video is private/i,
    userMessage: 'This video is marked private by the creator.',
    suggestedAction: 'Provide an authorized account or browser cookies in Auth Panel',
    actionId: 'auth',
  },
  {
    category: 'ffmpeg_missing',
    regex: /ffmpeg|avconv|ffprobe.*not found|not installed/i,
    userMessage: 'FFmpeg is not installed or not found on PATH.',
    suggestedAction: 'Install FFmpeg or check Settings > Tools configuration',
    actionId: 'tools',
  },
  {
    category: 'network_timeout',
    regex: /operation timed out|connection timed out|timed out after/i,
    userMessage: 'Connection to the media server timed out.',
    suggestedAction: 'Increase socket timeout in Network Panel or check network connection',
    actionId: 'network',
  },
  {
    category: 'video_unavailable',
    regex: /video unavailable|removed by the uploader/i,
    userMessage: 'This video is unavailable or has been deleted.',
    suggestedAction: 'Verify that the video URL is correct and still exists online',
    actionId: 'generic',
  },
  {
    category: 'bot_verification',
    regex: /confirm you['’]re not a bot|bot verification/i,
    userMessage: 'The platform requested bot verification.',
    suggestedAction: 'Export browser cookies from Chrome/Firefox in Auth Panel',
    actionId: 'auth',
  },
  {
    category: 'geo_restricted',
    regex: /not made this video available in your country|geo[- ]restricted/i,
    userMessage: 'This media is geo-restricted in your country.',
    suggestedAction: 'Configure a geo-proxy in Network Panel',
    actionId: 'network',
  },
  {
    category: 'no_formats',
    regex: /no video formats found|requested format is not available/i,
    userMessage: 'No downloadable media formats were found for this URL.',
    suggestedAction: 'Try selecting a different format or audio-only preset',
    actionId: 'format',
  },
  {
    category: 'outdated_extractor',
    regex: /unable to extract initial player response|signature extraction failed/i,
    userMessage: 'yt-dlp extractor could not parse the platform page response.',
    suggestedAction: 'Update yt-dlp to the latest version in Settings > Updates',
    actionId: 'update',
  },
]

/**
 * Translates raw yt-dlp stderr output into user-friendly message and suggested action.
 */
export function translateErrorMessage(rawStderr: string): TranslatedError {
  if (!rawStderr || rawStderr.trim().length === 0) {
    return {
      category: 'unknown',
      userMessage: 'Download failed with an unexpected error.',
      suggestedAction: 'Check the Log Panel for complete yt-dlp output details',
      actionId: 'generic',
    }
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.regex.test(rawStderr)) {
      return {
        category: pattern.category,
        userMessage: pattern.userMessage,
        suggestedAction: pattern.suggestedAction,
        actionId: pattern.actionId,
      }
    }
  }

  return {
    category: 'unknown',
    userMessage: 'Download failed with an unexpected error.',
    suggestedAction: 'Check the Log Panel for complete yt-dlp output details',
    actionId: 'generic',
  }
}
