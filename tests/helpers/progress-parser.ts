import { ProgressEvent } from './contracts';

/**
 * Parses progress output lines emitted by yt-dlp.
 * Supports both structured JSON progress lines and fallback console lines.
 * Never throws on malformed input or unparsable lines.
 */
export function parseProgressLine(line: string): ProgressEvent | null {
  if (!line || typeof line !== 'string') return null;

  const trimmed = line.trim();
  if (trimmed.length === 0) return null;

  // 1. Try parsing JSON progress output (used with --progress-template)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      if (data && (data.status === 'downloading' || data.status === 'finished' || data.status === 'error')) {
        return {
          status: data.status,
          downloadedBytes: typeof data.downloaded_bytes === 'number' ? data.downloaded_bytes : undefined,
          totalBytes: typeof data.total_bytes === 'number' ? data.total_bytes : undefined,
          speed: typeof data.speed === 'number' ? data.speed : undefined,
          eta: typeof data.eta === 'number' ? data.eta : undefined,
          percentStr: data._percent_str || (data.status === 'finished' ? '100%' : undefined),
        };
      }
    } catch {
      // Ignore JSON parse errors and fallback to regex
    }
  }

  // 2. Fallback to standard yt-dlp stdout progress lines:
  // e.g. "[download]  45.2% of ~  35.40MiB at    1.85MiB/s ETA 00:18"
  // e.g. "[download] 100% of   35.40MiB in 00:11 at 3.12MiB/s"
  if (trimmed.startsWith('[download]')) {
    const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)%/);
    const speedMatch = trimmed.match(/at\s+([\d.]+\s*[KMGT]?i?B\/s)/i);
    const etaMatch = trimmed.match(/ETA\s+(\d+:\d+(?::\d+)?)/i);

    if (percentMatch) {
      const percentVal = parseFloat(percentMatch[1]);
      const isFinished = percentVal >= 100 && (trimmed.includes('100% of') || trimmed.includes('in 00:'));

      return {
        status: isFinished ? 'finished' : 'downloading',
        percentStr: `${percentMatch[1]}%`,
        speed: speedMatch ? parseSpeedToBytes(speedMatch[1]) : undefined,
        eta: etaMatch ? parseEtaToSeconds(etaMatch[1]) : undefined,
      };
    }
  }

  return null;
}

function parseSpeedToBytes(speedStr: string): number {
  const match = speedStr.match(/([\d.]+)\s*([KMGT]?i?B\/s)/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit.startsWith('K')) return num * 1024;
  if (unit.startsWith('M')) return num * 1024 * 1024;
  if (unit.startsWith('G')) return num * 1024 * 1024 * 1024;
  return num;
}

function parseEtaToSeconds(etaStr: string): number {
  const parts = etaStr.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}
