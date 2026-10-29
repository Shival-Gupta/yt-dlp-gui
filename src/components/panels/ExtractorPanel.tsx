import React, { useState } from 'react'
import { Cpu, Plus, Trash2 } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface ExtractorPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const ExtractorPanel: React.FC<ExtractorPanelProps> = ({ options, onChange }) => {
  const [extKey, setExtKey] = useState('')
  const [extArgsVal, setExtArgsVal] = useState('')

  const extractorArgsMap: Record<string, string> =
    typeof options.extractorArgs === 'object' && options.extractorArgs !== null
      ? (options.extractorArgs as Record<string, string>)
      : {}

  const addExtractorArg = () => {
    if (!extKey.trim() || !extArgsVal.trim()) return
    const updated = { ...extractorArgsMap, [extKey.trim()]: extArgsVal.trim() }
    onChange({ extractorArgs: updated })
    setExtKey('')
    setExtArgsVal('')
  }

  const removeExtractorArg = (key: string) => {
    const updated = { ...extractorArgsMap }
    delete updated[key]
    const hasKeys = Object.keys(updated).length > 0
    onChange({ extractorArgs: hasKeys ? updated : undefined })
  }

  const useExtractorsVal = Array.isArray(options.useExtractors)
    ? options.useExtractors.join(',')
    : options.useExtractors || ''

  const jsRuntimesVal = Array.isArray(options.jsRuntimes)
    ? options.jsRuntimes.join(',')
    : options.jsRuntimes || options.jsEngine || ''

  return (
    <CollapsibleSection
      title="Extractor & Platform Specifics"
      icon={<Cpu className="w-4 h-4" />}
      description="Platform extractor arguments, flat playlist extraction, JS engines, scheduled stream waiting, and search prefixes"
    >
      <OptionRow
        label="Flat Playlist Extraction"
        description="Extract playlist items quickly without resolving individual video info"
        tooltip="CLI flag: --flat-playlist"
        cliFlag="--flat-playlist"
        isModified={Boolean(options.flatPlaylist)}
        onReset={() => onChange({ flatPlaylist: undefined })}
        htmlFor="ext-flat-playlist"
      >
        <input
          id="ext-flat-playlist"
          type="checkbox"
          checked={Boolean(options.flatPlaylist)}
          onChange={(e) => onChange({ flatPlaylist: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Download Live Stream from Beginning"
        description="Download live streams from start rather than current live position"
        tooltip="CLI flag: --live-from-start"
        cliFlag="--live-from-start"
        isModified={Boolean(options.liveFromStart)}
        onReset={() => onChange({ liveFromStart: undefined })}
        htmlFor="ext-live-from-start"
      >
        <input
          id="ext-live-from-start"
          type="checkbox"
          checked={Boolean(options.liveFromStart)}
          onChange={(e) => onChange({ liveFromStart: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="JavaScript Runtime Engine"
        description="Runtime engine used for decrypting n-sig and signature deciphering"
        tooltip="CLI flag: --js-runtimes RUNTIME[:PATH]"
        cliFlag="--js-runtimes"
        isModified={Boolean(jsRuntimesVal)}
        onReset={() => onChange({ jsRuntimes: undefined, jsEngine: undefined })}
        htmlFor="ext-js-runtimes"
      >
        <select
          id="ext-js-runtimes"
          value={jsRuntimesVal}
          onChange={(e) => {
            const val = e.target.value || undefined
            onChange({ jsRuntimes: val, jsEngine: val })
          }}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">Default (Auto-detect Deno/Node)</option>
          <option value="node">Node.js (node)</option>
          <option value="deno">Deno (deno)</option>
          <option value="bun">Bun (bun)</option>
          <option value="quickjs">QuickJS (qjs)</option>
        </select>
      </OptionRow>

      <OptionRow
        label="Wait for Scheduled Premiere / Stream"
        description="Wait N seconds before scheduled stream start (or range MIN-MAX)"
        tooltip="CLI flag: --wait-for-video MIN[-MAX]"
        cliFlag="--wait-for-video"
        isModified={options.waitForVideo !== undefined}
        onReset={() => onChange({ waitForVideo: undefined })}
        htmlFor="ext-wait-for-video"
      >
        <input
          id="ext-wait-for-video"
          type="text"
          value={options.waitForVideo !== undefined ? String(options.waitForVideo) : ''}
          onChange={(e) => onChange({ waitForVideo: e.target.value || undefined })}
          placeholder="Seconds or MIN-MAX"
          className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Mark Video as Watched"
        description="Mark downloaded video as watched on YouTube / platform history"
        tooltip="CLI flag: --mark-watched"
        cliFlag="--mark-watched"
        isModified={Boolean(options.markWatched)}
        onReset={() => onChange({ markWatched: undefined })}
        htmlFor="ext-mark-watched"
      >
        <input
          id="ext-mark-watched"
          type="checkbox"
          checked={Boolean(options.markWatched)}
          onChange={(e) => onChange({ markWatched: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      {/* Extractor Arguments */}
      <div className="pt-2 border-t border-neutral-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-neutral-300 text-xs">Platform Extractor Arguments</span>
            <p className="text-[11px] text-neutral-500">
              Pass specific parameters into platform extractors (e.g. youtube:player_client=android)
            </p>
          </div>
          <code className="text-[10px] text-neutral-500 font-mono">--extractor-args</code>
        </div>

        {Object.entries(extractorArgsMap).length > 0 && (
          <div className="space-y-1.5">
            {Object.entries(extractorArgsMap).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs font-mono"
              >
                <span className="text-indigo-300">{k}:</span>
                <span className="text-neutral-400">{v}</span>
                <button
                  type="button"
                  onClick={() => removeExtractorArg(k)}
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
            placeholder="Extractor (e.g. youtube)"
            value={extKey}
            onChange={(e) => setExtKey(e.target.value)}
            className="w-36 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 font-mono"
          />
          <input
            type="text"
            placeholder="Argument (e.g. player_client=android)"
            value={extArgsVal}
            onChange={(e) => setExtArgsVal(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 font-mono"
          />
          <button
            type="button"
            onClick={addExtractorArg}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      <AdvancedSection>
        <OptionRow
          label="Allowed Extractors Filter"
          description="Only use the specified comma-separated extractors"
          tooltip="CLI flag: --use-extractors NAMES"
          cliFlag="--use-extractors"
          isModified={Boolean(useExtractorsVal)}
          onReset={() => onChange({ useExtractors: undefined })}
          htmlFor="ext-use-extractors"
        >
          <input
            id="ext-use-extractors"
            type="text"
            value={useExtractorsVal}
            onChange={(e) => onChange({ useExtractors: e.target.value || undefined })}
            placeholder="e.g. youtube,soundcloud"
            className="w-48 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="Default Search Prefix"
          description="Prefix used when raw search query without URL is entered"
          tooltip="CLI flag: --default-search PREFIX. E.g. ytsearch, ytmsearch, gvsearch"
          cliFlag="--default-search"
          isModified={Boolean(options.defaultSearch)}
          onReset={() => onChange({ defaultSearch: undefined })}
          htmlFor="ext-default-search"
        >
          <input
            id="ext-default-search"
            type="text"
            value={options.defaultSearch || ''}
            onChange={(e) => onChange({ defaultSearch: e.target.value || undefined })}
            placeholder="ytsearch"
            className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="Custom Config File Path"
          description="Path to alternate yt-dlp configuration file"
          tooltip="CLI flag: --config-locations PATH"
          cliFlag="--config-locations"
          isModified={Boolean(options.configLocations)}
          onReset={() => onChange({ configLocations: undefined })}
          htmlFor="ext-config-loc"
        >
          <input
            id="ext-config-loc"
            type="text"
            value={options.configLocations || ''}
            onChange={(e) => onChange({ configLocations: e.target.value || undefined })}
            placeholder="path/to/yt-dlp.conf"
            className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
