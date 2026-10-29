import React from 'react'
import { Film } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface FormatPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const FormatPanel: React.FC<FormatPanelProps> = ({ options, onChange }) => {
  const formatValue = options.formatSelection || options.formatSelector || ''

  return (
    <CollapsibleSection
      title="Format & Video Quality"
      icon={<Film className="w-4 h-4" />}
      description="Video resolution, format selection strings, sort rules, and container format"
    >
      <OptionRow
        label="Format Selector String"
        description="yt-dlp format selection syntax"
        tooltip="CLI flag: -f FORMAT. Examples: bestvideo+bestaudio/best, bv*[height<=1080]+ba/b"
        cliFlag="-f"
        isModified={Boolean(formatValue)}
        onReset={() => onChange({ formatSelection: undefined, formatSelector: undefined })}
        htmlFor="format-selection"
      >
        <input
          id="format-selection"
          type="text"
          value={formatValue}
          onChange={(e) => {
            const val = e.target.value || undefined
            onChange({ formatSelection: val, formatSelector: val })
          }}
          placeholder="e.g. bv*[height<=1080]+ba/b"
          className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Format Sort Criteria"
        description="Comma-separated fields to sort format choices"
        tooltip="CLI flag: -S SORT_CRITERIA. Examples: res:1080,fps:60,codec:vp9"
        cliFlag="-S"
        isModified={Boolean(options.formatSort)}
        onReset={() => onChange({ formatSort: undefined })}
        htmlFor="format-sort"
      >
        <input
          id="format-sort"
          type="text"
          value={options.formatSort || ''}
          onChange={(e) => onChange({ formatSort: e.target.value || undefined })}
          placeholder="e.g. res:1080,fps:60"
          className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Merge Output Format"
        description="Target container for merged video and audio streams"
        tooltip="CLI flag: --merge-output-format FORMAT (mp4, mkv, webm, etc.)"
        cliFlag="--merge-output-format"
        isModified={Boolean(options.mergeOutputFormat)}
        onReset={() => onChange({ mergeOutputFormat: undefined })}
        htmlFor="merge-output-format"
      >
        <select
          id="merge-output-format"
          value={options.mergeOutputFormat || ''}
          onChange={(e) => onChange({ mergeOutputFormat: e.target.value || undefined })}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Default (best container)</option>
          <option value="mp4">MP4 (broad compatibility)</option>
          <option value="mkv">MKV (Matroska, all features)</option>
          <option value="webm">WebM (open web format)</option>
          <option value="mov">MOV (QuickTime)</option>
          <option value="avi">AVI</option>
          <option value="flv">FLV</option>
        </select>
      </OptionRow>

      <OptionRow
        label="Check Formats Validity"
        description="Verify stream availability before downloading"
        tooltip="CLI flag: --check-formats"
        cliFlag="--check-formats"
        isModified={Boolean(options.checkFormats)}
        onReset={() => onChange({ checkFormats: undefined })}
        htmlFor="check-formats"
      >
        <input
          id="check-formats"
          type="checkbox"
          checked={Boolean(options.checkFormats)}
          onChange={(e) => onChange({ checkFormats: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Audio Multi-Streams"
          description="Allow multiple audio streams to be downloaded"
          tooltip="CLI flag: --audio-multistreams"
          cliFlag="--audio-multistreams"
          isModified={Boolean(options.audioMultistreams)}
          onReset={() => onChange({ audioMultistreams: undefined })}
          htmlFor="audio-multistreams"
        >
          <input
            id="audio-multistreams"
            type="checkbox"
            checked={Boolean(options.audioMultistreams)}
            onChange={(e) => onChange({ audioMultistreams: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Video Multi-Streams"
          description="Allow multiple video streams to be downloaded"
          tooltip="CLI flag: --video-multistreams"
          cliFlag="--video-multistreams"
          isModified={Boolean(options.videoMultistreams)}
          onReset={() => onChange({ videoMultistreams: undefined })}
          htmlFor="video-multistreams"
        >
          <input
            id="video-multistreams"
            type="checkbox"
            checked={Boolean(options.videoMultistreams)}
            onChange={(e) => onChange({ videoMultistreams: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
