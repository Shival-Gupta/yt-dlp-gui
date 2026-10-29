import React, { useState } from 'react'
import { Globe, Plus, Trash2 } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { CollapsibleSection } from './CollapsibleSection'
import { AdvancedSection } from './AdvancedSection'
import { OptionRow } from './OptionRow'

export interface NetworkPanelProps {
  options: YtdlpOptions
  onChange: (patch: Partial<YtdlpOptions>) => void
}

export const NetworkPanel: React.FC<NetworkPanelProps> = ({ options, onChange }) => {
  const headers = options.addHeaders || options.headers || {}
  const [headerKey, setHeaderKey] = useState('')
  const [headerVal, setHeaderVal] = useState('')

  const addHeader = () => {
    if (!headerKey || !headerVal) return
    const updated = { ...headers, [headerKey]: headerVal }
    onChange({ addHeaders: updated, headers: updated })
    setHeaderKey('')
    setHeaderVal('')
  }

  const removeHeader = (keyToRemove: string) => {
    const updated = { ...headers }
    delete updated[keyToRemove]
    const hasKeys = Object.keys(updated).length > 0
    onChange({ addHeaders: hasKeys ? updated : undefined, headers: hasKeys ? updated : undefined })
  }

  return (
    <CollapsibleSection
      title="Network & Proxy Settings"
      icon={<Globe className="w-4 h-4" />}
      description="HTTP/SOCKS proxies, rate throttling, socket timeouts, TLS client impersonation, and request headers"
    >
      <OptionRow
        label="Proxy Server URL"
        description="Route requests via HTTP, HTTPS, or SOCKS proxy"
        tooltip="CLI flag: --proxy URL. Examples: socks5://127.0.0.1:9050 or http://user:pass@proxy:8080"
        cliFlag="--proxy"
        isModified={Boolean(options.proxy)}
        onReset={() => onChange({ proxy: undefined })}
        htmlFor="network-proxy"
      >
        <input
          id="network-proxy"
          type="text"
          value={options.proxy || ''}
          onChange={(e) => onChange({ proxy: e.target.value || undefined })}
          placeholder="socks5://127.0.0.1:9050"
          className="w-56 sm:w-64 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
        />
      </OptionRow>

      <OptionRow
        label="Download Rate Limit"
        description="Throttle download speed to prevent bandwidth saturation"
        tooltip="CLI flag: -r / --throttled-rate RATE. E.g. 500K, 2.5M, 10M"
        cliFlag="-r"
        isModified={Boolean(options.rateLimit)}
        onReset={() => onChange({ rateLimit: undefined })}
        htmlFor="network-rate-limit"
      >
        <input
          id="network-rate-limit"
          type="text"
          value={options.rateLimit || ''}
          onChange={(e) => onChange({ rateLimit: e.target.value || undefined })}
          placeholder="e.g. 2.5M or 500K"
          className="w-32 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Connection Retries"
        description="Number of retries for dropped or failed network requests"
        tooltip="CLI flag: -R / --retries N (default: 10)"
        cliFlag="-R"
        isModified={options.retries !== undefined && options.retries !== 10}
        onReset={() => onChange({ retries: undefined })}
        htmlFor="network-retries"
      >
        <input
          id="network-retries"
          type="number"
          min={0}
          max={100}
          value={options.retries !== undefined ? options.retries : 10}
          onChange={(e) =>
            onChange({ retries: e.target.value ? Number(e.target.value) : undefined })
          }
          className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <OptionRow
        label="Socket Timeout (Seconds)"
        description="Time to wait before giving up on a connection"
        tooltip="CLI flag: --socket-timeout SECONDS (default: 30)"
        cliFlag="--socket-timeout"
        isModified={Boolean(options.socketTimeout)}
        onReset={() => onChange({ socketTimeout: undefined })}
        htmlFor="network-timeout"
      >
        <input
          id="network-timeout"
          type="number"
          min={1}
          max={600}
          value={options.socketTimeout || 30}
          onChange={(e) =>
            onChange({ socketTimeout: e.target.value ? Number(e.target.value) : undefined })
          }
          className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-100 font-mono focus:outline-none focus:border-indigo-500 text-center"
        />
      </OptionRow>

      <AdvancedSection>
        <OptionRow
          label="Impersonate Browser (TLS/Fingerprint)"
          description="Impersonate browser TLS and HTTP signatures to bypass bot checks"
          tooltip="CLI flag: --impersonate CLIENT (chrome, edge, safari)"
          cliFlag="--impersonate"
          isModified={Boolean(options.impersonate)}
          onReset={() => onChange({ impersonate: undefined })}
          htmlFor="network-impersonate"
        >
          <select
            id="network-impersonate"
            value={options.impersonate || ''}
            onChange={(e) => onChange({ impersonate: e.target.value || undefined })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Default (native curl/urllib)</option>
            <option value="chrome">Google Chrome</option>
            <option value="edge">Microsoft Edge</option>
            <option value="safari">Apple Safari</option>
            <option value="firefox">Mozilla Firefox</option>
          </select>
        </OptionRow>

        <OptionRow
          label="Source Address (Bind IP)"
          description="Client IP address to bind to for outgoing connections"
          tooltip="CLI flag: --source-address IP"
          cliFlag="--source-address"
          isModified={Boolean(options.sourceAddress)}
          onReset={() => onChange({ sourceAddress: undefined })}
          htmlFor="network-source-address"
        >
          <input
            id="network-source-address"
            type="text"
            value={options.sourceAddress || ''}
            onChange={(e) => onChange({ sourceAddress: e.target.value || undefined })}
            placeholder="e.g. 192.168.1.100"
            className="w-40 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="X-Forwarded-For IP"
          description="Spoof client IP address via HTTP header"
          tooltip="CLI flag: --xff IP/RANGE"
          cliFlag="--xff"
          isModified={Boolean(options.xff)}
          onReset={() => onChange({ xff: undefined })}
          htmlFor="network-xff"
        >
          <input
            id="network-xff"
            type="text"
            value={options.xff || ''}
            onChange={(e) => onChange({ xff: e.target.value || undefined })}
            placeholder="e.g. 1.2.3.4"
            className="w-36 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
          />
        </OptionRow>

        <OptionRow
          label="Skip Unavailable Fragments"
          description="Do not abort when video fragments return 404 or drop"
          tooltip="CLI flag: --skip-unavailable-fragments"
          cliFlag="--skip-unavailable-fragments"
          isModified={Boolean(options.skipUnavailableFragments)}
          onReset={() => onChange({ skipUnavailableFragments: undefined })}
          htmlFor="network-skip-frag"
        >
          <input
            id="network-skip-frag"
            type="checkbox"
            checked={Boolean(options.skipUnavailableFragments)}
            onChange={(e) => onChange({ skipUnavailableFragments: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>

        <OptionRow
          label="Keep Fragment Files on Disk"
          description="Keep downloaded fragment parts after merging"
          tooltip="CLI flag: --keep-fragments"
          cliFlag="--keep-fragments"
          isModified={Boolean(options.keepFragments)}
          onReset={() => onChange({ keepFragments: undefined })}
          htmlFor="network-keep-frag"
        >
          <input
            id="network-keep-frag"
            type="checkbox"
            checked={Boolean(options.keepFragments)}
            onChange={(e) => onChange({ keepFragments: e.target.checked || undefined })}
            className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </OptionRow>

        {/* Custom HTTP Headers */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-300 text-xs">Custom HTTP Headers</span>
            <code className="text-[10px] text-neutral-500 font-mono">--add-header KEY:VALUE</code>
          </div>

          {Object.entries(headers).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(headers).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs font-mono"
                >
                  <span className="text-indigo-300">{k}:</span>
                  <span className="text-neutral-400 truncate max-w-xs">{v}</span>
                  <button
                    type="button"
                    onClick={() => removeHeader(k)}
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
              placeholder="Header Name"
              value={headerKey}
              onChange={(e) => setHeaderKey(e.target.value)}
              className="w-32 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
            />
            <input
              type="text"
              placeholder="Header Value"
              value={headerVal}
              onChange={(e) => setHeaderVal(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
            />
            <button
              type="button"
              onClick={addHeader}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center space-x-1 cursor-pointer"
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
