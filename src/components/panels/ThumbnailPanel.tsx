import React from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface ThumbnailPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const ThumbnailPanel: React.FC<ThumbnailPanelProps> = ({ options, onChange }) => {
  const convertVal = options.convertThumbnails || options.convertThumbnail || ''

  return (
    <CollapsibleSection
      title="Thumbnails & Artwork"
      icon={<ImageIcon className="w-4 h-4" />}
      description="Save video thumbnails to disk, embed cover art into audio/video, and convert image types"
    >
      <OptionRow
        label="Download Thumbnail"
        description="Save highest resolution thumbnail to image file"
        tooltip="CLI flag: --write-thumbnail"
        cliFlag="--write-thumbnail"
        isModified={Boolean(options.writeThumbnail)}
        onReset={() => onChange({ writeThumbnail: undefined })}
        htmlFor="write-thumbnail"
      >
        <input
          id="write-thumbnail"
          type="checkbox"
          checked={Boolean(options.writeThumbnail)}
          onChange={(e) => onChange({ writeThumbnail: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Download All Thumbnails"
        description="Write all available thumbnail sizes and variants to disk"
        tooltip="CLI flag: --write-all-thumbnails"
        cliFlag="--write-all-thumbnails"
        isModified={Boolean(options.writeAllThumbnails || options.allThumbnails)}
        onReset={() => onChange({ writeAllThumbnails: undefined, allThumbnails: undefined })}
        htmlFor="write-all-thumbnails"
      >
        <input
          id="write-all-thumbnails"
          type="checkbox"
          checked={Boolean(options.writeAllThumbnails || options.allThumbnails)}
          onChange={(e) => {
            const val = e.target.checked || undefined
            onChange({ writeAllThumbnails: val, allThumbnails: val })
          }}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Embed Thumbnail as Cover Art"
        description="Embed thumbnail directly into audio (ID3/FLAC) or MP4/MKV video container"
        tooltip="CLI flag: --embed-thumbnail"
        cliFlag="--embed-thumbnail"
        isModified={Boolean(options.embedThumbnail)}
        onReset={() => onChange({ embedThumbnail: undefined })}
        htmlFor="embed-thumbnail"
      >
        <input
          id="embed-thumbnail"
          type="checkbox"
          checked={Boolean(options.embedThumbnail)}
          onChange={(e) => onChange({ embedThumbnail: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Convert Thumbnail Format"
          description="Convert downloaded thumbnails to standard raster format via ffmpeg"
          tooltip="CLI flag: --convert-thumbnails FORMAT (jpg, png, webp)"
          cliFlag="--convert-thumbnails"
          isModified={Boolean(convertVal)}
          onReset={() => onChange({ convertThumbnails: undefined, convertThumbnail: undefined })}
          htmlFor="convert-thumbnails"
        >
          <select
            id="convert-thumbnails"
            value={convertVal}
            onChange={(e) => {
              const val = e.target.value || undefined
              onChange({ convertThumbnails: val, convertThumbnail: val })
            }}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Default (keep original format)</option>
            <option value="jpg">Convert to JPEG (.jpg)</option>
            <option value="png">Convert to PNG (.png)</option>
            <option value="webp">Convert to WebP (.webp)</option>
          </select>
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
