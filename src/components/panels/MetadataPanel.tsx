import React, { useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { YtdlpOptions, ReplaceInMetadataRule } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface MetadataPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ options, onChange }) => {
  const [newRule, setNewRule] = useState<ReplaceInMetadataRule>({ field: 'title', regex: '', replace: '' })

  const addReplaceRule = () => {
    if (!newRule.field || !newRule.regex) return
    const updated = [...(options.replaceInMetadata || []), { ...newRule }]
    onChange({ replaceInMetadata: updated })
    setNewRule({ field: 'title', regex: '', replace: '' })
  }

  const removeReplaceRule = (index: number) => {
    const updated = (options.replaceInMetadata || []).filter((_, i) => i !== index)
    onChange({ replaceInMetadata: updated.length > 0 ? updated : undefined })
  }

  return (
    <CollapsibleSection
      title="Metadata & Chapters"
      icon={<FileText className="w-4 h-4" />}
      description="Video tags, descriptions, chapter markers, JSON metadata sidecars, and title sanitization"
    >
      <OptionRow
        label="Embed Metadata into Media"
        description="Write title, artist, date, and description tags into media container"
        tooltip="CLI flag: --embed-metadata"
        cliFlag="--embed-metadata"
        isModified={Boolean(options.embedMetadata)}
        onReset={() => onChange({ embedMetadata: undefined })}
        htmlFor="embed-metadata"
      >
        <input
          id="embed-metadata"
          type="checkbox"
          checked={Boolean(options.embedMetadata)}
          onChange={(e) => onChange({ embedMetadata: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Embed Chapters"
        description="Embed chapter marks directly into video file"
        tooltip="CLI flag: --embed-chapters"
        cliFlag="--embed-chapters"
        isModified={Boolean(options.embedChapters)}
        onReset={() => onChange({ embedChapters: undefined })}
        htmlFor="embed-chapters"
      >
        <input
          id="embed-chapters"
          type="checkbox"
          checked={Boolean(options.embedChapters)}
          onChange={(e) => onChange({ embedChapters: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Split into Individual Chapters"
        description="Split video into individual chapter files based on timestamps"
        tooltip="CLI flag: --split-chapters"
        cliFlag="--split-chapters"
        isModified={Boolean(options.splitChapters)}
        onReset={() => onChange({ splitChapters: undefined })}
        htmlFor="split-chapters"
      >
        <input
          id="split-chapters"
          type="checkbox"
          checked={Boolean(options.splitChapters)}
          onChange={(e) => onChange({ splitChapters: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Write Description to .description File"
        description="Save video description text alongside the download"
        tooltip="CLI flag: --write-description"
        cliFlag="--write-description"
        isModified={Boolean(options.writeDescription)}
        onReset={() => onChange({ writeDescription: undefined })}
        htmlFor="write-description"
      >
        <input
          id="write-description"
          type="checkbox"
          checked={Boolean(options.writeDescription)}
          onChange={(e) => onChange({ writeDescription: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Write Info JSON Sidecar"
        description="Write complete video metadata JSON to .info.json"
        tooltip="CLI flag: --write-info-json"
        cliFlag="--write-info-json"
        isModified={Boolean(options.writeInfoJson)}
        onReset={() => onChange({ writeInfoJson: undefined })}
        htmlFor="write-info-json"
      >
        <input
          id="write-info-json"
          type="checkbox"
          checked={Boolean(options.writeInfoJson)}
          onChange={(e) => onChange({ writeInfoJson: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Write Comments to JSON"
        description="Extract and save top comments into info JSON"
        tooltip="CLI flag: --write-comments"
        cliFlag="--write-comments"
        isModified={Boolean(options.writeComments)}
        onReset={() => onChange({ writeComments: undefined })}
        htmlFor="write-comments"
      >
        <input
          id="write-comments"
          type="checkbox"
          checked={Boolean(options.writeComments)}
          onChange={(e) => onChange({ writeComments: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Clean Info JSON Sidecar"
          description="Omit internal raw fields and cookies from info JSON"
          tooltip="CLI flag: --clean-info-json"
          cliFlag="--clean-info-json"
          isModified={Boolean(options.cleanInfoJson)}
          onReset={() => onChange({ cleanInfoJson: undefined })}
          htmlFor="clean-info-json"
        >
          <input
            id="clean-info-json"
            type="checkbox"
            checked={Boolean(options.cleanInfoJson)}
            onChange={(e) => onChange({ cleanInfoJson: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Extended Attributes (xattrs)"
          description="Write metadata to filesystem extended attributes"
          tooltip="CLI flag: --xattrs"
          cliFlag="--xattrs"
          isModified={Boolean(options.xattrs)}
          onReset={() => onChange({ xattrs: undefined })}
          htmlFor="xattrs"
        >
          <input
            id="xattrs"
            type="checkbox"
            checked={Boolean(options.xattrs)}
            onChange={(e) => onChange({ xattrs: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Write Internet Shortcut (.url)"
          description="Save browser shortcut link to the original webpage"
          tooltip="CLI flag: --write-url-link"
          cliFlag="--write-url-link"
          isModified={Boolean(options.writeUrlLink)}
          onReset={() => onChange({ writeUrlLink: undefined })}
          htmlFor="write-url-link"
        >
          <input
            id="write-url-link"
            type="checkbox"
            checked={Boolean(options.writeUrlLink)}
            onChange={(e) => onChange({ writeUrlLink: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Load Info JSON File"
          description="Load metadata from existing .info.json instead of refetching"
          tooltip="CLI flag: --load-info-json FILE"
          cliFlag="--load-info-json"
          isModified={Boolean(options.loadInfoJson)}
          onReset={() => onChange({ loadInfoJson: undefined })}
          htmlFor="load-info-json"
        >
          <input
            id="load-info-json"
            type="text"
            value={options.loadInfoJson || ''}
            onChange={(e) => onChange({ loadInfoJson: e.target.value || undefined })}
            placeholder="path/to/video.info.json"
            className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        {/* Replace in Metadata Table */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-300 text-xs">Replace in Metadata Rules</span>
            <code className="text-[10px] text-neutral-500 font-mono">--replace-in-metadata</code>
          </div>

          {(options.replaceInMetadata || []).length > 0 && (
            <div className="space-y-1.5">
              {options.replaceInMetadata?.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs font-mono"
                >
                  <span className="text-indigo-300">{rule.field}</span>
                  <span className="text-neutral-400">/{rule.regex}/ → &quot;{rule.replace}&quot;</span>
                  <button
                    type="button"
                    onClick={() => removeReplaceRule(idx)}
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
              placeholder="Field (e.g. title)"
              value={newRule.field}
              onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
              className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
            />
            <input
              type="text"
              placeholder="Regex pattern"
              value={newRule.regex}
              onChange={(e) => setNewRule({ ...newRule, regex: e.target.value })}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
            />
            <input
              type="text"
              placeholder="Replacement"
              value={newRule.replace}
              onChange={(e) => setNewRule({ ...newRule, replace: e.target.value })}
              className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
            />
            <button
              type="button"
              onClick={addReplaceRule}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
