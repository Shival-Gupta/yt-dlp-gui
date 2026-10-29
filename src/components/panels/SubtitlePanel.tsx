import React from 'react'
import { MessageSquareText } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface SubtitlePanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({ options, onChange }) => {
  const currentLangs = typeof options.subLangs === 'string' ? options.subLangs : ''

  const setLanguagePreset = (preset: string) => {
    onChange({ subLangs: preset })
  }

  return (
    <CollapsibleSection
      title="Subtitles & Captions"
      icon={<MessageSquareText className="w-4 h-4" />}
      description="Download author subtitles, automatic captions, embed in video, or convert formats"
    >
      <OptionRow
        label="Download Subtitles"
        description="Download author-provided subtitle tracks"
        tooltip="CLI flag: --write-subs"
        cliFlag="--write-subs"
        isModified={Boolean(options.writeSubs)}
        onReset={() => onChange({ writeSubs: undefined })}
        htmlFor="write-subs"
      >
        <input
          id="write-subs"
          type="checkbox"
          checked={Boolean(options.writeSubs)}
          onChange={(e) => onChange({ writeSubs: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Download Auto-Generated Captions"
        description="Download automatic speech-recognition captions"
        tooltip="CLI flag: --write-auto-subs"
        cliFlag="--write-auto-subs"
        isModified={Boolean(options.writeAutoSubs)}
        onReset={() => onChange({ writeAutoSubs: undefined })}
        htmlFor="write-auto-subs"
      >
        <input
          id="write-auto-subs"
          type="checkbox"
          checked={Boolean(options.writeAutoSubs)}
          onChange={(e) => onChange({ writeAutoSubs: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Embed Subtitles into Video"
        description="Mux subtitles into the container (requires mp4/mkv/webm)"
        tooltip="CLI flag: --embed-subs"
        cliFlag="--embed-subs"
        isModified={Boolean(options.embedSubs)}
        onReset={() => onChange({ embedSubs: undefined })}
        htmlFor="embed-subs"
      >
        <input
          id="embed-subs"
          type="checkbox"
          checked={Boolean(options.embedSubs)}
          onChange={(e) => onChange({ embedSubs: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Subtitle Languages"
        description="Comma-separated language codes or regex filter"
        tooltip="CLI flag: --sub-langs LANGS. E.g. en,es,fr or en.* or all"
        cliFlag="--sub-langs"
        isModified={Boolean(currentLangs)}
        onReset={() => onChange({ subLangs: undefined })}
        htmlFor="sub-langs"
      >
        <div className="flex flex-col items-end space-y-1.5">
          <input
            id="sub-langs"
            type="text"
            value={currentLangs}
            onChange={(e) => onChange({ subLangs: e.target.value || undefined })}
            placeholder="e.g. en,es,fr or all"
            className="w-48 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center space-x-1 text-[10px]">
            <span className="text-neutral-500">Presets:</span>
            <button
              type="button"
              onClick={() => setLanguagePreset('en')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
            >
              en
            </button>
            <button
              type="button"
              onClick={() => setLanguagePreset('en.*')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
            >
              en.*
            </button>
            <button
              type="button"
              onClick={() => setLanguagePreset('all')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white"
            >
              all
            </button>
          </div>
        </div>
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Subtitle Format"
          description="Preferred download format before conversion"
          tooltip="CLI flag: --sub-format FORMAT"
          cliFlag="--sub-format"
          isModified={Boolean(options.subFormat)}
          onReset={() => onChange({ subFormat: undefined })}
          htmlFor="sub-format"
        >
          <select
            id="sub-format"
            value={options.subFormat || ''}
            onChange={(e) => onChange({ subFormat: e.target.value || undefined })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Default (best available)</option>
            <option value="srt">SRT (SubRip)</option>
            <option value="vtt">VTT (WebVTT)</option>
            <option value="ass">ASS (Advanced SubStation)</option>
            <option value="lrc">LRC (Lyrics)</option>
            <option value="json3">JSON3</option>
            <option value="ttml">TTML</option>
          </select>
        </OptionRow>

        <OptionRow
          label="Convert Subtitles Format"
          description="Post-process subtitles into standard target format"
          tooltip="CLI flag: --convert-subs FORMAT"
          cliFlag="--convert-subs"
          isModified={Boolean(options.convertSubs)}
          onReset={() => onChange({ convertSubs: undefined })}
          htmlFor="convert-subs"
        >
          <select
            id="convert-subs"
            value={options.convertSubs || ''}
            onChange={(e) => onChange({ convertSubs: e.target.value || undefined })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">No conversion</option>
            <option value="srt">Convert to SRT</option>
            <option value="vtt">Convert to VTT</option>
            <option value="ass">Convert to ASS</option>
            <option value="lrc">Convert to LRC</option>
          </select>
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
