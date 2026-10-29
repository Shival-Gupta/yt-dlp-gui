import { YtdlpFormat } from './contracts';

/**
 * Parses the raw stdout table of `yt-dlp -F <url>` into structured format objects.
 * Strictly implements FORMAT-01/02 and format-utils contract.
 */
export function parseFormatTable(rawOutput: string): YtdlpFormat[] {
  const formats: YtdlpFormat[] = [];
  const lines = rawOutput.split(/\r?\n/);

  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('ID') && line.includes('EXT') && line.includes('RESOLUTION')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return formats;
  }

  // Parse rows following header and separator
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.trim().length === 0) continue;
    if (rawLine.startsWith('─') || rawLine.startsWith('-')) continue;

    // Split line into columns using standard yt-dlp columns
    // Columns typically: ID, EXT, RESOLUTION, FPS, CH | FILESIZE, TBR, PROTO | VCODEC, VBR, ACODEC, ABR, ASR, MORE INFO
    const cleanLine = rawLine.replace(/│/g, ' ').replace(/\|/g, ' ');
    const parts = cleanLine.trim().split(/\s+/);
    if (parts.length < 3) continue;

    const formatId = parts[0];
    const ext = parts[1];

    // Determine resolution & fps
    let resolution = parts[2];
    let fps: number | null = null;
    let index = 3;

    if (resolution === 'audio' && parts[3] === 'only') {
      resolution = 'audio only';
      index = 4;
    }

    // Check if next token is fps (number)
    if (index < parts.length && /^\d+$/.test(parts[index]) && resolution !== 'audio only') {
      fps = parseInt(parts[index], 10);
      index++;
    }

    const remaining = parts.slice(index).join(' ');

    const isAudioOnly = resolution === 'audio only' || remaining.includes('audio only');
    const isVideoOnly = remaining.includes('video only') && !isAudioOnly;
    const isCombined = !isAudioOnly && !isVideoOnly && !remaining.includes('storyboard');

    // Extract tbr or bitrate if present
    const tbrMatch = remaining.match(/(\d+)[kK]/);
    const tbr = tbrMatch ? parseInt(tbrMatch[1], 10) : null;

    // Extract codecs
    let vcodec: string | undefined = undefined;
    let acodec: string | undefined = undefined;

    if (isAudioOnly) {
      vcodec = 'none';
      if (remaining.includes('opus')) acodec = 'opus';
      else if (remaining.includes('mp4a') || remaining.includes('m4a')) acodec = 'mp4a';
    } else if (isVideoOnly) {
      acodec = 'none';
      if (remaining.includes('avc1')) vcodec = 'avc1';
      else if (remaining.includes('vp9')) vcodec = 'vp9';
      else if (remaining.includes('av01')) vcodec = 'av01';
    } else if (isCombined) {
      if (remaining.includes('avc1')) vcodec = 'avc1';
      if (remaining.includes('mp4a')) acodec = 'mp4a';
    }

    formats.push({
      format_id: formatId,
      ext,
      resolution,
      fps,
      tbr,
      vcodec,
      acodec,
      note: remaining,
      isVideoOnly,
      isAudioOnly,
      isCombined,
    });
  }

  return formats;
}
