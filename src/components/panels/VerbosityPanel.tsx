import React from 'react'
import { Terminal } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface VerbosityPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const VerbosityPanel: React.FC<VerbosityPanelProps> = ({ options, onChange }) => {
  return (
    <CollapsibleSection
      title="Verbosity, Logging & Simulation"
      icon={<Terminal className="w-4 h-4" />}
      description="Dry-run simulation mode, JSON dump outputs, stderr/stdout verbosity, error resilience, and config overrides"
    >
      <OptionRow
        label="Simulate Only (Dry Run)"
        description="Do not download any media files; only simulate the extraction and write checks"
        tooltip="CLI flag: -s / --simulate"
        cliFlag="-s"
        isModified={Boolean(options.simulate)}
        onReset={() => onChange({ simulate: undefined })}
        htmlFor="verb-simulate"
      >
        <input
          id="verb-simulate"
          type="checkbox"
          checked={Boolean(options.simulate)}
          onChange={(e) => onChange({ simulate: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Skip Media Download"
        description="Do not download video streams, but write metadata, subtitles, and thumbnails"
        tooltip="CLI flag: --skip-download"
        cliFlag="--skip-download"
        isModified={Boolean(options.skipDownload)}
        onReset={() => onChange({ skipDownload: undefined })}
        htmlFor="verb-skip-download"
      >
        <input
          id="verb-skip-download"
          type="checkbox"
          checked={Boolean(options.skipDownload)}
          onChange={(e) => onChange({ skipDownload: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Dump Metadata JSON (-j)"
        description="Quietly print JSON information for each video to output stream"
        tooltip="CLI flag: -j / --dump-json"
        cliFlag="-j"
        isModified={Boolean(options.dumpJson)}
        onReset={() => onChange({ dumpJson: undefined })}
        htmlFor="verb-dump-json"
      >
        <input
          id="verb-dump-json"
          type="checkbox"
          checked={Boolean(options.dumpJson)}
          onChange={(e) => onChange({ dumpJson: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Verbose Output (-v)"
        description="Print detailed debugging information to the console stream"
        tooltip="CLI flag: -v / --verbose"
        cliFlag="-v"
        isModified={Boolean(options.verbose)}
        onReset={() => onChange({ verbose: undefined })}
        htmlFor="verb-verbose"
      >
        <input
          id="verb-verbose"
          type="checkbox"
          checked={Boolean(options.verbose)}
          onChange={(e) => onChange({ verbose: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Ignore Download Errors (-i)"
        description="Continue downloading on error (e.g. skip unavailable playlist videos)"
        tooltip="CLI flag: -i / --ignore-errors"
        cliFlag="-i"
        isModified={Boolean(options.ignoreErrors)}
        onReset={() => onChange({ ignoreErrors: undefined })}
        htmlFor="verb-ignore-errors"
      >
        <input
          id="verb-ignore-errors"
          type="checkbox"
          checked={Boolean(options.ignoreErrors)}
          onChange={(e) => onChange({ ignoreErrors: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Suppress Warning Messages"
        description="Suppress warning notices from standard output"
        tooltip="CLI flag: --no-warnings"
        cliFlag="--no-warnings"
        isModified={Boolean(options.noWarnings)}
        onReset={() => onChange({ noWarnings: undefined })}
        htmlFor="verb-no-warnings"
      >
        <input
          id="verb-no-warnings"
          type="checkbox"
          checked={Boolean(options.noWarnings)}
          onChange={(e) => onChange({ noWarnings: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <OptionRow
        label="Print HTTP Traffic"
        description="Display sent and received HTTP headers and bytes"
        tooltip="CLI flag: --print-traffic"
        cliFlag="--print-traffic"
        isModified={Boolean(options.printTraffic)}
        onReset={() => onChange({ printTraffic: undefined })}
        htmlFor="verb-print-traffic"
      >
        <input
          id="verb-print-traffic"
          type="checkbox"
          checked={Boolean(options.printTraffic)}
          onChange={(e) => onChange({ printTraffic: e.target.checked || undefined })}
          className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Print Template Output (-O)"
          description="Print formatted template output to console"
          tooltip="CLI flag: -O / --print TEMPLATE. E.g. %(title)s - %(uploader)s"
          cliFlag="-O"
          isModified={Boolean(options.printTemplate)}
          onReset={() => onChange({ printTemplate: undefined })}
          htmlFor="verb-print-template"
        >
          <input
            id="verb-print-template"
            type="text"
            value={options.printTemplate || ''}
            onChange={(e) => onChange({ printTemplate: e.target.value || undefined })}
            placeholder="e.g. %(id)s"
            className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="Dump Single JSON for Entire Playlist (-J)"
          description="Output a single composite JSON object for the entire playlist"
          tooltip="CLI flag: -J / --dump-single-json"
          cliFlag="-J"
          isModified={Boolean(options.dumpSingleJson)}
          onReset={() => onChange({ dumpSingleJson: undefined })}
          htmlFor="verb-dump-single"
        >
          <input
            id="verb-dump-single"
            type="checkbox"
            checked={Boolean(options.dumpSingleJson)}
            onChange={(e) => onChange({ dumpSingleJson: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Ignore Configuration Files"
          description="Do not read configuration from system, user, or custom config files"
          tooltip="CLI flag: --ignore-config"
          cliFlag="--ignore-config"
          isModified={Boolean(options.ignoreConfig)}
          onReset={() => onChange({ ignoreConfig: undefined })}
          htmlFor="verb-ignore-config"
        >
          <input
            id="verb-ignore-config"
            type="checkbox"
            checked={Boolean(options.ignoreConfig)}
            onChange={(e) => onChange({ ignoreConfig: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Compatibility Options"
          description="Comma-separated compatibility flags with old youtube-dl behavior"
          tooltip="CLI flag: --compat-options OPTS"
          cliFlag="--compat-options"
          isModified={Boolean(options.compatOptions)}
          onReset={() => onChange({ compatOptions: undefined })}
          htmlFor="verb-compat-options"
        >
          <input
            id="verb-compat-options"
            type="text"
            value={options.compatOptions || ''}
            onChange={(e) => onChange({ compatOptions: e.target.value || undefined })}
            placeholder="e.g. no-youtube-unavailable-videos"
            className="w-56 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>
      </AdvancedSection>
    </CollapsibleSection>
  )
}
