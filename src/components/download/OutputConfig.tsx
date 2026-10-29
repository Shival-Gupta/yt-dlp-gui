import React, { useState } from 'react'
import {
  Folder,
  FolderOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'

interface OutputConfigProps {
  outputDir: string
  outputTemplate: string
  options: Partial<YtdlpOptions>
  onChangeOutputDir: (dir: string) => void
  onChangeOutputTemplate: (template: string) => void
  onOptionsChange: (updates: Partial<YtdlpOptions>) => void
}

const TEMPLATE_EXAMPLES = [
  { label: 'Basic Title', template: '%(title)s.%(ext)s', desc: 'Standard filename with title' },
  {
    label: 'By Uploader',
    template: '%(uploader)s/%(title)s.%(ext)s',
    desc: 'Folder per creator / channel',
  },
  {
    label: 'Date Prefix',
    template: '%(upload_date)s - %(title)s.%(ext)s',
    desc: 'Organized chronologically (YYYYMMDD)',
  },
  {
    label: 'Playlist Index',
    template: '%(playlist)s/%(playlist_index)02d - %(title)s.%(ext)s',
    desc: 'Track-numbered series in playlist folder',
  },
  {
    label: 'Resolution Tag',
    template: '%(title)s [%(resolution)s].%(ext)s',
    desc: 'Includes resolution in filename',
  },
]

export const OutputConfig: React.FC<OutputConfigProps> = ({
  outputDir,
  outputTemplate,
  options,
  onChangeOutputDir,
  onChangeOutputTemplate,
  onOptionsChange,
}) => {
  const [showHelp, setShowHelp] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleBrowseFolder = async () => {
    try {
      // Attempt Tauri plugin-dialog dynamically via runtime import
      const importDynamic = new Function('m', 'return import(m)')
      const dialog = await importDynamic('@tauri-apps/plugin-dialog')
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: 'Select Destination Folder',
      })
      if (selected && typeof selected === 'string') {
        onChangeOutputDir(selected)
        return
      }
    } catch {
      // Fallback for non-tauri or missing dialog plugin
      const fallback = window.prompt('Enter destination directory path:', outputDir || '')
      if (fallback !== null) {
        onChangeOutputDir(fallback.trim())
      }
    }
  }

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 shadow-sm space-y-4 text-xs select-text">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-neutral-200">Output Location & Filename</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className="flex items-center space-x-1 text-neutral-400 hover:text-indigo-400 transition-colors"
          title="Output template syntax help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-[11px]">Template Guide</span>
        </button>
      </div>

      {/* Syntax Guide Popover */}
      {showHelp && (
        <div className="p-3 bg-neutral-950/90 border border-neutral-800 rounded-lg space-y-2.5 text-neutral-300">
          <div className="font-semibold text-neutral-200 text-xs">Filename Template Tokens</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div><code className="text-indigo-400">%(title)s</code>: Video title</div>
            <div><code className="text-indigo-400">%(id)s</code>: Video ID</div>
            <div><code className="text-indigo-400">%(ext)s</code>: File extension</div>
            <div><code className="text-indigo-400">%(uploader)s</code>: Channel/Creator</div>
            <div><code className="text-indigo-400">%(upload_date)s</code>: Upload date</div>
            <div><code className="text-indigo-400">%(resolution)s</code>: Resolution</div>
            <div><code className="text-indigo-400">%(playlist)s</code>: Playlist title</div>
            <div><code className="text-indigo-400">%(playlist_index)s</code>: Track #</div>
          </div>
          <div className="pt-2 border-t border-neutral-800/80">
            <span className="text-[11px] text-neutral-400 font-semibold">Quick Templates:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {TEMPLATE_EXAMPLES.map((ex) => (
                <button
                  key={ex.template}
                  type="button"
                  onClick={() => onChangeOutputTemplate(ex.template)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono transition-colors"
                  title={ex.desc}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Output Directory Picker */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-neutral-400">Destination Folder (-P):</label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Folder className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={outputDir}
              onChange={(e) => onChangeOutputDir(e.target.value)}
              placeholder="Default system Downloads folder..."
              className="w-full bg-neutral-950 font-mono text-xs text-neutral-200 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={handleBrowseFolder}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Browse...</span>
          </button>
        </div>
      </div>

      {/* Output Template Input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-neutral-400">Filename Template (-o):</label>
        <input
          type="text"
          value={outputTemplate}
          onChange={(e) => onChangeOutputTemplate(e.target.value)}
          placeholder="%(title)s.%(ext)s"
          className="w-full bg-neutral-950 font-mono text-xs text-neutral-200 border border-neutral-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Advanced Path & Safety Options Expander */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex items-center space-x-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <Settings2 className="w-3 h-3 text-neutral-500" />
          <span>Advanced Filesystem & Safety Options</span>
          {showAdvanced ? (
            <ChevronUp className="w-3 h-3 text-neutral-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-300">Windows-Safe Filenames</div>
                <div className="text-[10px] text-neutral-500">
                  Strip characters reserved by Windows NTFS (:*?"&lt;&gt;|)
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(options.windowsFilenames)}
                onChange={(e) => onOptionsChange({ windowsFilenames: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded bg-neutral-900 border-neutral-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-300">Restrict Filenames (ASCII only)</div>
                <div className="text-[10px] text-neutral-500">
                  Convert spaces and unicode characters to safe ASCII
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(options.restrictFilenames)}
                onChange={(e) => onOptionsChange({ restrictFilenames: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded bg-neutral-900 border-neutral-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-300">No Overwrites</div>
                <div className="text-[10px] text-neutral-500">
                  Do not overwrite existing destination files
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(options.noOverwrites)}
                onChange={(e) => onOptionsChange({ noOverwrites: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded bg-neutral-900 border-neutral-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-300">Use Part Files (.part)</div>
                <div className="text-[10px] text-neutral-500">
                  Write to .part file until download finishes completely
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(options.partFiles)}
                onChange={(e) => onOptionsChange({ partFiles: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded bg-neutral-900 border-neutral-700"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
