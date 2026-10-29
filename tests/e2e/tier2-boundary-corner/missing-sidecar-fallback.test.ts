import { describe, it, expect } from 'vitest';
import { translateErrorMessage } from '../../helpers/error-translator';

describe('Tier 2: Boundary & Corner Cases — Missing Sidecars Fallback', () => {
  it('should intercept missing FFmpeg sidecar error and provide actionable guidance', () => {
    const rawFfmpegError = 'WARNING: ffmpeg not found. The requested format requires postprocessing.';
    const translated = translateErrorMessage(rawFfmpegError);

    expect(translated.category).toBe('ffmpeg_missing');
    expect(translated.userMessage).toContain('FFmpeg is not installed');
    expect(translated.suggestedAction).toContain('Settings > Tools');
  });

  it('should translate missing avconv / ffprobe errors', () => {
    const rawError = 'ERROR: ffprobe and ffmpeg not found in PATH. Please install ffmpeg or set path in settings.';
    const translated = translateErrorMessage(rawError);

    expect(translated.category).toBe('ffmpeg_missing');
    expect(translated.suggestedAction).toContain('Settings > Tools');
  });

  it('should handle invalid or unreadable path override errors gracefully', () => {
    const rawPathError = 'ERROR: [Errno 2] No such file or directory: "C:\\nonexistent\\yt-dlp.exe"';
    const translated = translateErrorMessage(rawPathError);

    expect(translated.userMessage).toBeTruthy();
    expect(translated.suggestedAction).toBeTruthy();
  });
});
