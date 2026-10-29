export interface TranslatedError {
  category: string;
  userMessage: string;
  suggestedAction: string;
}

const ERROR_PATTERNS: Array<{
  category: string;
  regex: RegExp;
  userMessage: string;
  suggestedAction: string;
}> = [
  {
    category: 'age_restriction',
    regex: /sign in to confirm your age/i,
    userMessage: 'This video is age-restricted and requires signing in.',
    suggestedAction: 'Open Auth Panel and provide account credentials or cookies',
  },
  {
    category: 'rate_limited',
    regex: /HTTP Error 429|Too Many Requests/i,
    userMessage: 'Rate limited by the server due to excessive requests.',
    suggestedAction: 'Wait before retrying or configure a proxy in Network Panel',
  },
  {
    category: 'private_video',
    regex: /this video is private/i,
    userMessage: 'This video is marked private by the creator.',
    suggestedAction: 'Provide an authorized account or browser cookies',
  },
  {
    category: 'ffmpeg_missing',
    regex: /ffmpeg|avconv|ffprobe.*not found|not installed/i,
    userMessage: 'FFmpeg is not installed or not found on PATH.',
    suggestedAction: 'Install FFmpeg or check Settings > Tools configuration',
  },
  {
    category: 'network_timeout',
    regex: /operation timed out|connection timed out|timed out after/i,
    userMessage: 'Connection to the media server timed out.',
    suggestedAction: 'Increase socket timeout in Network Panel or check network connection',
  },
  {
    category: 'video_unavailable',
    regex: /video unavailable|removed by the uploader/i,
    userMessage: 'This video is unavailable or has been deleted.',
    suggestedAction: 'Verify that the video URL is correct and still exists online',
  },
  {
    category: 'bot_verification',
    regex: /confirm you['’]re not a bot|bot verification/i,
    userMessage: 'The platform requested bot verification.',
    suggestedAction: 'Export browser cookies from Chrome/Firefox in Auth Panel',
  },
  {
    category: 'geo_restricted',
    regex: /not made this video available in your country|geo[- ]restricted/i,
    userMessage: 'This media is geo-restricted in your country.',
    suggestedAction: 'Configure a geo-proxy in Network Panel',
  },
];

/**
 * Translates raw yt-dlp stderr output into user-friendly message and action.
 */
export function translateErrorMessage(rawStderr: string): TranslatedError {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.regex.test(rawStderr)) {
      return {
        category: pattern.category,
        userMessage: pattern.userMessage,
        suggestedAction: pattern.suggestedAction,
      };
    }
  }

  return {
    category: 'unknown',
    userMessage: 'Download failed with an unexpected error.',
    suggestedAction: 'Check the Log Panel for complete yt-dlp output details',
  };
}
