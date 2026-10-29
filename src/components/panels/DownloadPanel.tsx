import React from 'react'
import { FolderDown } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface DownloadPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({ options, onChange }) => {
  return (
    <CollapsibleSection
      title="Download & Output Options"
      icon={<FolderDown className="w-4 h-4" />}
      description="Destination folder, filename templates, and concurrency settings"
    >
      <OptionRow
        label="Output Directory"
        description="Path where downloaded files will be saved"
        tooltip="CLI flag: -P PATH"
        cliFlag="-P"
        isModified={Boolean(options.outputDir)}
        onReset={() => onChange({ outputDir: undefined })}
        htmlFor="download-output-dir"
      >
        <input
          id="download-output-dir"
          type="text"
          value={options.outputDir || ''}
          onChange={(e) => onChange({ outputDir: e.target.value || undefined })}
          placeholder="Default (Downloads folder)"
          className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Filename Template"
        description="Format string for generated output filenames"
        tooltip="CLI flag: -o TEMPLATE. E.g. %(uploader)s/%(title)s.%(ext)s"
        cliFlag="-o"
        isModified={Boolean(options.outputTemplate)}
        onReset={() => onChange({ outputTemplate: undefined })}
        htmlFor="download-template"
      >
        <input
          id="download-template"
          type="text"
          value={options.outputTemplate || ''}
          onChange={(e) => onChange({ outputTemplate: e.target.value || undefined })}
          placeholder="%(title)s.%(ext)s"
          className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Playlist Items"
        description="Select specific playlist indices or ranges"
        tooltip="CLI flag: -I ITEMS. E.g. 1,3,5-10 or :10"
        cliFlag="-I"
        isModified={Boolean(options.playlistItems)}
        onReset={() => onChange({ playlistItems: undefined })}
        htmlFor="download-playlist-items"
      >
        <input
          id="download-playlist-items"
          type="text"
          value={options.playlistItems || ''}
          onChange={(e) => onChange({ playlistItems: e.target.value || undefined })}
          placeholder="e.g. 1-10, 15, 20-25"
          className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Concurrent Fragment Downloads"
        description="Number of fragments to download in parallel"
        tooltip="CLI flag: -N CONCURRENT_FRAGMENTS (dash/hls streams)"
        cliFlag="-N"
        isModified={Boolean(options.concurrentFragments && options.concurrentFragments > 1)}
        onReset={() => onChange({ concurrentFragments: undefined })}
        htmlFor="download-concurrent"
      >
        <input
          id="download-concurrent"
          type="number"
          min={1}
          max={32}
          value={options.concurrentFragments || 1}
          onChange={(e) =>
            onChange({ concurrentFragments: e.target.value ? Number(e.target.value) : undefined })
          }
          className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 font-mono text-center"
        />
      </OptionRow>

      <OptionRow
        label="Download Archive File"
        description="Skip downloading videos already listed in this archive file"
        tooltip="CLI flag: --download-archive FILE"
        cliFlag="--download-archive"
        isModified={Boolean(options.downloadArchive || options.archiveFile)}
        onReset={() => onChange({ downloadArchive: undefined, archiveFile: undefined })}
        htmlFor="download-archive"
      >
        <input
          id="download-archive"
          type="text"
          value={options.downloadArchive || options.archiveFile || ''}
          onChange={(e) => {
            const val = e.target.value || undefined
            onChange({ downloadArchive: val, archiveFile: val })
          }}
          placeholder="archive.txt"
          className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Max Downloads Limit"
          description="Abort download after reaching N successfully downloaded videos"
          tooltip="CLI flag: --max-downloads NUMBER"
          cliFlag="--max-downloads"
          isModified={Boolean(options.maxDownloads)}
          onReset={() => onChange({ maxDownloads: undefined })}
          htmlFor="download-max-downloads"
        >
          <input
            id="download-max-downloads"
            type="number"
            min={1}
            value={options.maxDownloads || ''}
            onChange={(e) =>
              onChange({ maxDownloads: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Unlimited"
            className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 font-mono text-center"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
