import React from 'react'
import { FolderGit2 } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface FilesystemPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const FilesystemPanel: React.FC<FilesystemPanelProps> = ({ options, onChange }) => {
  const isPartFile = Boolean(options.partFile ?? options.partFiles)

  return (
    <CollapsibleSection
      title="Filesystem & File Handling"
      icon={<FolderGit2 className="w-4 h-4" />}
      description="Filename safety rules, overwrite controls, resume partial transfers, cache directory, and file timestamps"
    >
      <OptionRow
        label="Windows-Safe Filenames"
        description="Strip characters prohibited on Windows filesystems (: * ? \ / < > |)"
        tooltip="CLI flag: --windows-filenames"
        cliFlag="--windows-filenames"
        isModified={Boolean(options.windowsFilenames)}
        onReset={() => onChange({ windowsFilenames: undefined })}
        htmlFor="fs-windows-filenames"
      >
        <input
          id="fs-windows-filenames"
          type="checkbox"
          checked={Boolean(options.windowsFilenames)}
          onChange={(e) => onChange({ windowsFilenames: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Restrict Filenames to ASCII"
        description="Restrict characters in filenames to only ASCII alphanumeric, avoiding unicode"
        tooltip="CLI flag: --restrict-filenames"
        cliFlag="--restrict-filenames"
        isModified={Boolean(options.restrictFilenames)}
        onReset={() => onChange({ restrictFilenames: undefined })}
        htmlFor="fs-restrict-filenames"
      >
        <input
          id="fs-restrict-filenames"
          type="checkbox"
          checked={Boolean(options.restrictFilenames)}
          onChange={(e) => onChange({ restrictFilenames: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Trim Filename Length"
        description="Limit maximum characters in output filename (excluding extension)"
        tooltip="CLI flag: --trim-filenames LENGTH"
        cliFlag="--trim-filenames"
        isModified={options.trimFilenames !== undefined}
        onReset={() => onChange({ trimFilenames: undefined })}
        htmlFor="fs-trim-filenames"
      >
        <input
          id="fs-trim-filenames"
          type="number"
          min={10}
          max={255}
          value={options.trimFilenames || ''}
          onChange={(e) =>
            onChange({ trimFilenames: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="e.g. 100"
          className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Do Not Overwrite Existing Files (-w)"
        description="Skip downloading if the target file already exists"
        tooltip="CLI flag: -w / --no-overwrites"
        cliFlag="-w"
        isModified={Boolean(options.noOverwrites)}
        onReset={() => onChange({ noOverwrites: undefined })}
        htmlFor="fs-no-overwrites"
      >
        <input
          id="fs-no-overwrites"
          type="checkbox"
          checked={Boolean(options.noOverwrites)}
          onChange={(e) => onChange({ noOverwrites: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Force Overwrite Files"
        description="Overwrite existing files without prompting"
        tooltip="CLI flag: --force-overwrites"
        cliFlag="--force-overwrites"
        isModified={Boolean(options.forceOverwrites)}
        onReset={() => onChange({ forceOverwrites: undefined })}
        htmlFor="fs-force-overwrites"
      >
        <input
          id="fs-force-overwrites"
          type="checkbox"
          checked={Boolean(options.forceOverwrites)}
          onChange={(e) => onChange({ forceOverwrites: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Resume Partial Downloads (-c)"
        description="Resume interrupted or incomplete download chunks"
        tooltip="CLI flag: -c / --continue"
        cliFlag="-c"
        isModified={Boolean(options.continueDownload)}
        onReset={() => onChange({ continueDownload: undefined })}
        htmlFor="fs-continue"
      >
        <input
          id="fs-continue"
          type="checkbox"
          checked={Boolean(options.continueDownload)}
          onChange={(e) => onChange({ continueDownload: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Use .part Temporary Files"
        description="Write downloads to .part files until completely finished"
        tooltip="CLI flag: --part"
        cliFlag="--part"
        isModified={isPartFile}
        onReset={() => onChange({ partFile: undefined, partFiles: undefined })}
        htmlFor="fs-part"
      >
        <input
          id="fs-part"
          type="checkbox"
          checked={isPartFile}
          onChange={(e) => {
            const val = e.target.checked || undefined
            onChange({ partFile: val, partFiles: val })
          }}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Cache Directory"
        description="Location for yt-dlp temporary network cache"
        tooltip="CLI flag: --cache-dir DIR"
        cliFlag="--cache-dir"
        isModified={Boolean(options.cacheDir)}
        onReset={() => onChange({ cacheDir: undefined })}
        htmlFor="fs-cache-dir"
      >
        <input
          id="fs-cache-dir"
          type="text"
          value={options.cacheDir || ''}
          onChange={(e) => onChange({ cacheDir: e.target.value || undefined })}
          placeholder="Default (~/.cache/yt-dlp)"
          className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Disable Disk Cache"
          description="Do not store any temporary metadata cache files"
          tooltip="CLI flag: --no-cache-dir"
          cliFlag="--no-cache-dir"
          isModified={Boolean(options.noCacheDir)}
          onReset={() => onChange({ noCacheDir: undefined })}
          htmlFor="fs-no-cache"
        >
          <input
            id="fs-no-cache"
            type="checkbox"
            checked={Boolean(options.noCacheDir)}
            onChange={(e) => onChange({ noCacheDir: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Set File Modification Time (mtime)"
          description="Set the file mtime to Last-Modified HTTP header"
          tooltip="CLI flag: --mtime"
          cliFlag="--mtime"
          isModified={Boolean(options.mtime)}
          onReset={() => onChange({ mtime: undefined })}
          htmlFor="fs-mtime"
        >
          <input
            id="fs-mtime"
            type="checkbox"
            checked={Boolean(options.mtime)}
            onChange={(e) => onChange({ mtime: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Force Write Archive"
          description="Always write video ID to download archive, even on simulation"
          tooltip="CLI flag: --force-write-archive"
          cliFlag="--force-write-archive"
          isModified={Boolean(options.forceWriteArchive)}
          onReset={() => onChange({ forceWriteArchive: undefined })}
          htmlFor="fs-force-archive"
        >
          <input
            id="fs-force-archive"
            type="checkbox"
            checked={Boolean(options.forceWriteArchive)}
            onChange={(e) => onChange({ forceWriteArchive: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
