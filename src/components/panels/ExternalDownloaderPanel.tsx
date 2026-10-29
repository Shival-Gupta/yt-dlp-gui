import React from 'react'
import { DownloadCloud } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface ExternalDownloaderPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const ExternalDownloaderPanel: React.FC<ExternalDownloaderPanelProps> = ({
  options,
  onChange,
}) => {
  const downloaderArgsVal = Array.isArray(options.downloaderArgs)
    ? options.downloaderArgs.join(' ')
    : options.downloaderArgs || ''

  return (
    <CollapsibleSection
      title="External Downloaders & HLS Streams"
      icon={<DownloadCloud className="w-4 h-4" />}
      description="Accelerate downloads with multi-connection engines (aria2c, curl, wget) and configure HLS/DASH segment handling"
    >
      <OptionRow
        label="External Downloader Engine"
        description="Delegate stream downloading to a specialized multi-connection tool"
        tooltip="CLI flag: --downloader NAME (aria2c, curl, wget, axel, httpie)"
        cliFlag="--downloader"
        isModified={Boolean(options.downloader)}
        onReset={() => onChange({ downloader: undefined })}
        htmlFor="downloader-engine"
      >
        <select
          id="downloader-engine"
          value={options.downloader || ''}
          onChange={(e) => onChange({ downloader: e.target.value || undefined })}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Default (Built-in yt-dlp downloader)</option>
          <option value="aria2c">aria2c (Ultra-fast multi-connection)</option>
          <option value="curl">curl</option>
          <option value="wget">wget</option>
          <option value="axel">axel</option>
          <option value="httpie">httpie</option>
        </select>
      </OptionRow>

      <OptionRow
        label="Downloader Arguments"
        description="CLI flags passed directly to the external downloader binary"
        tooltip="CLI flag: --downloader-args 'NAME:ARGS'. E.g. -x 16 -s 16 -k 1M"
        cliFlag="--downloader-args"
        isModified={Boolean(downloaderArgsVal)}
        onReset={() => onChange({ downloaderArgs: undefined })}
        htmlFor="downloader-args"
      >
        <input
          id="downloader-args"
          type="text"
          value={downloaderArgsVal}
          onChange={(e) => onChange({ downloaderArgs: e.target.value || undefined })}
          placeholder="e.g. -x 16 -s 16"
          className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="HLS Prefer Native Downloader"
        description="Use yt-dlp's internal native downloader instead of ffmpeg for HLS"
        tooltip="CLI flag: --hls-prefer-native"
        cliFlag="--hls-prefer-native"
        isModified={Boolean(options.hlsPreferNative)}
        onReset={() => onChange({ hlsPreferNative: undefined })}
        htmlFor="hls-prefer-native"
      >
        <input
          id="hls-prefer-native"
          type="checkbox"
          checked={Boolean(options.hlsPreferNative)}
          onChange={(e) => {
            onChange({
              hlsPreferNative: e.target.checked || undefined,
              hlsPreferFfmpeg: e.target.checked ? undefined : options.hlsPreferFfmpeg,
            })
          }}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="HLS Prefer FFmpeg Downloader"
        description="Use FFmpeg downloader for HLS video streams"
        tooltip="CLI flag: --hls-prefer-ffmpeg"
        cliFlag="--hls-prefer-ffmpeg"
        isModified={Boolean(options.hlsPreferFfmpeg)}
        onReset={() => onChange({ hlsPreferFfmpeg: undefined })}
        htmlFor="hls-prefer-ffmpeg"
      >
        <input
          id="hls-prefer-ffmpeg"
          type="checkbox"
          checked={Boolean(options.hlsPreferFfmpeg)}
          onChange={(e) => {
            onChange({
              hlsPreferFfmpeg: e.target.checked || undefined,
              hlsPreferNative: e.target.checked ? undefined : options.hlsPreferNative,
            })
          }}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Use MPEG-TS Container for HLS"
        description="Use the MPEG-TS container for HLS videos, allowing live seeking"
        tooltip="CLI flag: --hls-use-mpegts"
        cliFlag="--hls-use-mpegts"
        isModified={Boolean(options.hlsUseMpegts)}
        onReset={() => onChange({ hlsUseMpegts: undefined })}
        htmlFor="hls-use-mpegts"
      >
        <input
          id="hls-use-mpegts"
          type="checkbox"
          checked={Boolean(options.hlsUseMpegts)}
          onChange={(e) => onChange({ hlsUseMpegts: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="HLS Split on Discontinuity"
          description="Split HLS video into multiple files when stream discontinuities occur"
          tooltip="CLI flag: --hls-split-discontinuity"
          cliFlag="--hls-split-discontinuity"
          isModified={Boolean(options.hlsSplitDiscontinuity)}
          onReset={() => onChange({ hlsSplitDiscontinuity: undefined })}
          htmlFor="hls-split-discont"
        >
          <input
            id="hls-split-discont"
            type="checkbox"
            checked={Boolean(options.hlsSplitDiscontinuity)}
            onChange={(e) => onChange({ hlsSplitDiscontinuity: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
