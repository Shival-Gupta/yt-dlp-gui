import React, { useState } from 'react'
import { Filter, Plus, Trash2 } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface FilterPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ options, onChange }) => {
  const [newFilter, setNewFilter] = useState('')

  const matchFilterList: string[] = Array.isArray(options.matchFilters)
    ? options.matchFilters
    : options.matchFilter
    ? [options.matchFilter]
    : []

  const addFilter = () => {
    if (!newFilter.trim()) return
    const updated = [...matchFilterList, newFilter.trim()]
    onChange({ matchFilters: updated, matchFilter: updated[0] })
    setNewFilter('')
  }

  const removeFilter = (index: number) => {
    const updated = matchFilterList.filter((_, i) => i !== index)
    onChange({
      matchFilters: updated.length > 0 ? updated : undefined,
      matchFilter: updated.length > 0 ? updated[0] : undefined,
    })
  }

  return (
    <CollapsibleSection
      title="Video Selection & Filters"
      icon={<Filter className="w-4 h-4" />}
      description="Filter downloads by date range, minimum/maximum file size, view count, age limits, and playlist rules"
    >
      <OptionRow
        label="Exact Upload Date"
        description="Download only videos uploaded on exact date (YYYYMMDD)"
        tooltip="CLI flag: --date DATE (e.g. 20260101)"
        cliFlag="--date"
        isModified={Boolean(options.date)}
        onReset={() => onChange({ date: undefined })}
        htmlFor="filter-date"
      >
        <input
          id="filter-date"
          type="text"
          value={options.date || ''}
          onChange={(e) => onChange({ date: e.target.value || undefined })}
          placeholder="YYYYMMDD (e.g. 20260101)"
          className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Uploaded After Date"
        description="Download only videos uploaded after this date (exclusive)"
        tooltip="CLI flag: --dateafter DATE (e.g. 20250101 or now-6months)"
        cliFlag="--dateafter"
        isModified={Boolean(options.dateAfter)}
        onReset={() => onChange({ dateAfter: undefined })}
        htmlFor="filter-date-after"
      >
        <input
          id="filter-date-after"
          type="text"
          value={options.dateAfter || ''}
          onChange={(e) => onChange({ dateAfter: e.target.value || undefined })}
          placeholder="YYYYMMDD or now-6months"
          className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Uploaded Before Date"
        description="Download only videos uploaded before this date (exclusive)"
        tooltip="CLI flag: --datebefore DATE (e.g. 20260601)"
        cliFlag="--datebefore"
        isModified={Boolean(options.dateBefore)}
        onReset={() => onChange({ dateBefore: undefined })}
        htmlFor="filter-date-before"
      >
        <input
          id="filter-date-before"
          type="text"
          value={options.dateBefore || ''}
          onChange={(e) => onChange({ dateBefore: e.target.value || undefined })}
          placeholder="YYYYMMDD"
          className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Minimum File Size"
        description="Do not download any videos smaller than this size"
        tooltip="CLI flag: --min-filesize SIZE. E.g. 10M, 500K, 1G"
        cliFlag="--min-filesize"
        isModified={Boolean(options.minFilesize)}
        onReset={() => onChange({ minFilesize: undefined })}
        htmlFor="filter-min-size"
      >
        <input
          id="filter-min-size"
          type="text"
          value={options.minFilesize || ''}
          onChange={(e) => onChange({ minFilesize: e.target.value || undefined })}
          placeholder="e.g. 10M or 500K"
          className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Maximum File Size"
        description="Do not download any videos larger than this size"
        tooltip="CLI flag: --max-filesize SIZE. E.g. 500M, 2G"
        cliFlag="--max-filesize"
        isModified={Boolean(options.maxFilesize)}
        onReset={() => onChange({ maxFilesize: undefined })}
        htmlFor="filter-max-size"
      >
        <input
          id="filter-max-size"
          type="text"
          value={options.maxFilesize || ''}
          onChange={(e) => onChange({ maxFilesize: e.target.value || undefined })}
          placeholder="e.g. 500M or 2G"
          className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Age Limit (Years)"
        description="Download only videos suitable for the given age limit"
        tooltip="CLI flag: --age-limit YEARS"
        cliFlag="--age-limit"
        isModified={options.ageLimit !== undefined}
        onReset={() => onChange({ ageLimit: undefined })}
        htmlFor="filter-age-limit"
      >
        <input
          id="filter-age-limit"
          type="number"
          min={0}
          max={99}
          value={options.ageLimit !== undefined ? options.ageLimit : ''}
          onChange={(e) =>
            onChange({ ageLimit: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="Any"
          className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Single Video Only (No Playlist)"
        description="Download only the specific video if URL refers to video in playlist"
        tooltip="CLI flag: --no-playlist"
        cliFlag="--no-playlist"
        isModified={Boolean(options.noPlaylist || options.playlist === false)}
        onReset={() => onChange({ noPlaylist: undefined, playlist: undefined })}
        htmlFor="filter-no-playlist"
      >
        <input
          id="filter-no-playlist"
          type="checkbox"
          checked={Boolean(options.noPlaylist || options.playlist === false)}
          onChange={(e) => {
            const val = e.target.checked || undefined
            onChange({ noPlaylist: val, playlist: val ? false : undefined })
          }}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        {/* Custom Match Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-300 text-xs">Match Filters Expression</span>
              <p className="text-[11px] text-neutral-500">
                Generic filter expression. Examples: &quot;view_count &gt; 1000&quot;, &quot;duration &lt; 600&quot;
              </p>
            </div>
            <code className="text-[10px] text-neutral-500 font-mono">--match-filter</code>
          </div>

          {matchFilterList.length > 0 && (
            <div className="space-y-1.5">
              {matchFilterList.map((filterStr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs font-mono"
                >
                  <span className="text-neutral-200">{filterStr}</span>
                  <button
                    type="button"
                    onClick={() => removeFilter(idx)}
                    className="p-1 text-neutral-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-1.5 pt-1">
            <input
              type="text"
              placeholder="e.g. view_count > 1000 & like_count > 50"
              value={newFilter}
              onChange={(e) => setNewFilter(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 font-mono"
            />
            <button
              type="button"
              onClick={addFilter}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <OptionRow
          label="Skip Playlist After N Errors"
          description="Number of allowed failures before abandoning remainder of playlist"
          tooltip="CLI flag: --skip-playlist-after-errors N"
          cliFlag="--skip-playlist-after-errors"
          isModified={options.skipPlaylistAfterErrors !== undefined}
          onReset={() => onChange({ skipPlaylistAfterErrors: undefined })}
          htmlFor="filter-skip-errors"
        >
          <input
            id="filter-skip-errors"
            type="number"
            min={1}
            value={options.skipPlaylistAfterErrors || ''}
            onChange={(e) =>
              onChange({ skipPlaylistAfterErrors: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="No limit"
            className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
          />
        </OptionRow>

        <OptionRow
          label="Break on Existing File"
          description="Stop downloading when encountering a file that already exists"
          tooltip="CLI flag: --break-on-existing"
          cliFlag="--break-on-existing"
          isModified={Boolean(options.breakOnExisting)}
          onReset={() => onChange({ breakOnExisting: undefined })}
          htmlFor="filter-break-existing"
        >
          <input
            id="filter-break-existing"
            type="checkbox"
            checked={Boolean(options.breakOnExisting)}
            onChange={(e) => onChange({ breakOnExisting: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
