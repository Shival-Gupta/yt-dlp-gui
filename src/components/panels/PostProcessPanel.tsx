import React from 'react'
import { Sparkles } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface PostProcessPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const PostProcessPanel: React.FC<PostProcessPanelProps> = ({ options, onChange }) => {
  const isExtractAudio = Boolean(options.extractAudio || options.audioOnly)

  return (
    <CollapsibleSection
      title="Post-Processing & Audio Conversion"
      icon={<Sparkles className="w-4 h-4" />}
      description="Extract audio tracks, convert codecs, remux containers, and run shell hooks"
    >
      <OptionRow
        label="Extract Audio Track Only"
        description="Convert video to standalone audio file via ffmpeg"
        tooltip="CLI flag: -x / --extract-audio"
        cliFlag="-x"
        isModified={isExtractAudio}
        onReset={() => onChange({ extractAudio: undefined, audioOnly: undefined })}
        htmlFor="extract-audio"
      >
        <input
          id="extract-audio"
          type="checkbox"
          checked={isExtractAudio}
          onChange={(e) => {
            const val = e.target.checked || undefined
            onChange({ extractAudio: val, audioOnly: val })
          }}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      {isExtractAudio && (
        <>
          <OptionRow
            label="Audio Target Format"
            description="Target audio codec/container format"
            tooltip="CLI flag: --audio-format FORMAT"
            cliFlag="--audio-format"
            isModified={Boolean(options.audioFormat)}
            onReset={() => onChange({ audioFormat: undefined })}
            htmlFor="audio-format"
          >
            <select
              id="audio-format"
              value={options.audioFormat || 'best'}
              onChange={(e) => onChange({ audioFormat: e.target.value || undefined })}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="best">Best available quality</option>
              <option value="mp3">MP3 (MPEG Audio Layer III)</option>
              <option value="aac">AAC (Advanced Audio Coding)</option>
              <option value="m4a">M4A (Apple Audio)</option>
              <option value="opus">Opus (high efficiency)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="wav">WAV (Uncompressed PCM)</option>
              <option value="vorbis">Ogg Vorbis</option>
              <option value="alac">ALAC (Apple Lossless)</option>
            </select>
          </OptionRow>

          <OptionRow
            label="Audio Quality / Bitrate"
            description="VBR quality (0 best - 9 lowest) or CBR bitrate (e.g. 320K, 192K)"
            tooltip="CLI flag: --audio-quality QUALITY. 0 is best VBR; 128K, 192K, 320K for CBR"
            cliFlag="--audio-quality"
            isModified={Boolean(options.audioQuality)}
            onReset={() => onChange({ audioQuality: undefined })}
            htmlFor="audio-quality"
          >
            <input
              id="audio-quality"
              type="text"
              value={options.audioQuality || ''}
              onChange={(e) => onChange({ audioQuality: e.target.value || undefined })}
              placeholder="e.g. 0 (VBR best) or 320K"
              className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
            />
          </OptionRow>
        </>
      )}

      <OptionRow
        label="Remux Video Container"
        description="Change container without re-encoding video streams"
        tooltip="CLI flag: --remux-video FORMAT"
        cliFlag="--remux-video"
        isModified={Boolean(options.remuxVideo)}
        onReset={() => onChange({ remuxVideo: undefined })}
        htmlFor="remux-video"
      >
        <select
          id="remux-video"
          value={options.remuxVideo || ''}
          onChange={(e) => onChange({ remuxVideo: e.target.value || undefined })}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">No remuxing</option>
          <option value="mp4">Remux to MP4</option>
          <option value="mkv">Remux to MKV</option>
          <option value="webm">Remux to WebM</option>
          <option value="mov">Remux to MOV</option>
          <option value="avi">Remux to AVI</option>
        </select>
      </OptionRow>

      <OptionRow
        label="Re-encode Video"
        description="Re-encode video into a different format (slower, lossy)"
        tooltip="CLI flag: --recode-video FORMAT"
        cliFlag="--recode-video"
        isModified={Boolean(options.recodeVideo)}
        onReset={() => onChange({ recodeVideo: undefined })}
        htmlFor="recode-video"
      >
        <select
          id="recode-video"
          value={options.recodeVideo || ''}
          onChange={(e) => onChange({ recodeVideo: e.target.value || undefined })}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">No re-encoding</option>
          <option value="mp4">Re-encode to MP4</option>
          <option value="mkv">Re-encode to MKV</option>
          <option value="webm">Re-encode to WebM</option>
          <option value="h264">Re-encode to H.264</option>
          <option value="h265">Re-encode to H.265 / HEVC</option>
        </select>
      </OptionRow>

      <OptionRow
        label="Keep Intermediate Video Files"
        description="Do not delete intermediate video file when extracting audio"
        tooltip="CLI flag: -k / --keep-video"
        cliFlag="-k"
        isModified={Boolean(options.keepVideo)}
        onReset={() => onChange({ keepVideo: undefined })}
        htmlFor="keep-video"
      >
        <input
          id="keep-video"
          type="checkbox"
          checked={Boolean(options.keepVideo)}
          onChange={(e) => onChange({ keepVideo: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Post Overwrites"
          description="Overwrite post-processed files if they already exist"
          tooltip="CLI flag: --post-overwrites"
          cliFlag="--post-overwrites"
          isModified={Boolean(options.postOverwrites)}
          onReset={() => onChange({ postOverwrites: undefined })}
          htmlFor="post-overwrites"
        >
          <input
            id="post-overwrites"
            type="checkbox"
            checked={Boolean(options.postOverwrites)}
            onChange={(e) => onChange({ postOverwrites: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Fixup Policy"
          description="Policy for fixing known stream inconsistencies"
          tooltip="CLI flag: --fixup POLICY (never, warn, detect_or_warn, force)"
          cliFlag="--fixup"
          isModified={Boolean(options.fixup)}
          onReset={() => onChange({ fixup: undefined })}
          htmlFor="fixup"
        >
          <select
            id="fixup"
            value={options.fixup || ''}
            onChange={(e) => onChange({ fixup: e.target.value || undefined })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Default (detect_or_warn)</option>
            <option value="never">Never fixup</option>
            <option value="warn">Warn only</option>
            <option value="detect_or_warn">Detect or warn</option>
            <option value="force">Force fixup</option>
          </select>
        </OptionRow>

        <OptionRow
          label="Execute Shell Command Post-Download"
          description="Command to execute after successful download ({} replaced by filepath)"
          tooltip="CLI flag: --exec CMD. E.g. echo Downloaded {}"
          cliFlag="--exec"
          isModified={Boolean(options.execCommand)}
          onReset={() => onChange({ execCommand: undefined })}
          htmlFor="exec-command"
        >
          <input
            id="exec-command"
            type="text"
            value={options.execCommand || ''}
            onChange={(e) => onChange({ execCommand: e.target.value || undefined })}
            placeholder='e.g. echo "Finished {}"'
            className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
