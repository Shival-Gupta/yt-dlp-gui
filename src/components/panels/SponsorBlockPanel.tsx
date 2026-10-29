import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface SponsorBlockPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

const CATEGORIES = [
  { id: 'sponsor', label: 'Sponsor (Paid promotion)' },
  { id: 'intro', label: 'Intermission / Intro animation' },
  { id: 'outro', label: 'Outro / Credits' },
  { id: 'selfpromo', label: 'Self-promotion / Merch' },
  { id: 'preview', label: 'Preview / Recap' },
  { id: 'filler', label: 'Filler / Tangent' },
  { id: 'music_offtopic', label: 'Music: Non-music section' },
  { id: 'poi_highlight', label: 'Point of interest / Highlight' },
]

export const SponsorBlockPanel: React.FC<SponsorBlockPanelProps> = ({ options, onChange }) => {
  const removeCats = options.sponsorblockRemove || []
  const markCats = options.sponsorblockMark || []

  const toggleRemove = (cat: string) => {
    let next: string[]
    if (removeCats.includes(cat)) {
      next = removeCats.filter((c) => c !== cat)
    } else {
      next = [...removeCats, cat]
    }
    onChange({ sponsorblockRemove: next.length > 0 ? next : undefined })
  }

  const toggleMark = (cat: string) => {
    let next: string[]
    if (markCats.includes(cat)) {
      next = markCats.filter((c) => c !== cat)
    } else {
      next = [...markCats, cat]
    }
    onChange({ sponsorblockMark: next.length > 0 ? next : undefined })
  }

  return (
    <CollapsibleSection
      title="SponsorBlock Integration"
      icon={<ShieldAlert className="w-4 h-4" />}
      description="Automatically remove or mark sponsored segments using community crowd-sourced timestamps (YouTube)"
    >
      <div className="p-2 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-[11px] text-indigo-300">
        Requires SponsorBlock crowd-sourced community data. Available for YouTube videos.
      </div>

      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
          <span>Categories to Cut / Remove (--sponsorblock-remove)</span>
          {removeCats.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ sponsorblockRemove: undefined })}
              className="text-[10px] text-neutral-500 hover:text-rose-400"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                removeCats.includes(cat.id)
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:bg-neutral-850'
              }`}
            >
              <input
                type="checkbox"
                checked={removeCats.includes(cat.id)}
                onChange={() => toggleRemove(cat.id)}
                className="w-3.5 h-3.5 rounded bg-neutral-950 border-neutral-700 text-rose-600 focus:ring-0"
              />
              <span className="truncate">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-neutral-800/80">
        <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
          <span>Categories to Mark as Chapters (--sponsorblock-mark)</span>
          {markCats.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ sponsorblockMark: undefined })}
              className="text-[10px] text-neutral-500 hover:text-amber-400"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                markCats.includes(cat.id)
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:bg-neutral-850'
              }`}
            >
              <input
                type="checkbox"
                checked={markCats.includes(cat.id)}
                onChange={() => toggleMark(cat.id)}
                className="w-3.5 h-3.5 rounded bg-neutral-950 border-neutral-700 text-amber-600 focus:ring-0"
              />
              <span className="truncate">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <OptionRow
        label="SponsorBlock Chapter Title Format"
        description="Template used when creating chapter markers for sponsor segments"
        tooltip="CLI flag: --sponsorblock-chapter-title TEMPLATE"
        cliFlag="--sponsorblock-chapter-title"
        isModified={Boolean(options.sponsorblockChapterTitle)}
        onReset={() => onChange({ sponsorblockChapterTitle: undefined })}
        htmlFor="sponsorblock-chapter-title"
      >
        <input
          id="sponsorblock-chapter-title"
          type="text"
          value={options.sponsorblockChapterTitle || ''}
          onChange={(e) => onChange({ sponsorblockChapterTitle: e.target.value || undefined })}
          placeholder="[SponsorBlock]: %(category)s"
          className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Custom SponsorBlock API Server"
          description="Override default community SponsorBlock API endpoint"
          tooltip="CLI flag: --sponsorblock-api URL"
          cliFlag="--sponsorblock-api"
          isModified={Boolean(options.sponsorblockApi)}
          onReset={() => onChange({ sponsorblockApi: undefined })}
          htmlFor="sponsorblock-api"
        >
          <input
            id="sponsorblock-api"
            type="text"
            value={options.sponsorblockApi || ''}
            onChange={(e) => onChange({ sponsorblockApi: e.target.value || undefined })}
            placeholder="https://sponsor.ajay.app"
            className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
