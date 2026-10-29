import React, { useState, useMemo } from 'react'
import { Terminal, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { YtdlpOptions } from '../../types/ytdlp'
import { buildCliArgs, maskSensitiveCliArgs } from './command-builder'

interface CommandPreviewProps {
  options: Partial<YtdlpOptions>
  urls?: string[]
  defaultExpanded?: boolean
}

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  options,
  urls = [],
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded)
  const [copied, setCopied] = useState<boolean>(false)

  // Merge URLs with options
  const mergedOptions: Partial<YtdlpOptions> = useMemo(() => {
    const combinedUrls = [...(options.urls || []), ...urls].filter(Boolean)
    return {
      ...options,
      urls: Array.from(new Set(combinedUrls)),
    }
  }, [options, urls])

  const tokens = useMemo(() => {
    const rawArgs = buildCliArgs(mergedOptions)
    const masked = maskSensitiveCliArgs(rawArgs)
    return ['yt-dlp', ...masked]
  }, [mergedOptions])

  const rawCommandString = useMemo(() => {
    return tokens
      .map((token) => (token.includes(' ') ? `"${token}"` : token))
      .join(' ')
  }, [tokens])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCommandString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Failed to copy command:', err)
    }
  }

  const hasUrls = Boolean(mergedOptions.urls && mergedOptions.urls.length > 0)

  return (
    <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl overflow-hidden shadow-sm transition-all text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/60 border-b border-neutral-800 select-none">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center space-x-2 text-neutral-300 hover:text-white font-medium transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono">Live Command Preview</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          {!hasUrls && (
            <span className="flex items-center space-x-1 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              <AlertTriangle className="w-3 h-3" />
              <span>No URL entered</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 text-[11px] font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Copy command to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Command content view */}
      {isExpanded && (
        <div className="p-3 bg-neutral-950 font-mono text-[11px] leading-relaxed overflow-x-auto select-text whitespace-pre-wrap break-all max-h-48 scrollbar-thin">
          <div className="flex flex-wrap items-center gap-1.5">
            {tokens.map((token, idx) => {
              if (idx === 0) {
                // Command binary
                return (
                  <span key={idx} className="text-cyan-400 font-bold">
                    {token}
                  </span>
                )
              }

              if (token === '***') {
                return (
                  <span
                    key={idx}
                    className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800/50 px-1 py-0.2 rounded"
                    title="Credential masked for security"
                  >
                    ***
                  </span>
                )
              }

              if (token.startsWith('-')) {
                // CLI option flag
                return (
                  <span key={idx} className="text-indigo-400 font-medium">
                    {token}
                  </span>
                )
              }

              if (
                token.startsWith('http://') ||
                token.startsWith('https://') ||
                token.startsWith('ytsearch:')
              ) {
                // URL
                return (
                  <span key={idx} className="text-amber-300">
                    "{token}"
                  </span>
                )
              }

              // Value
              const displayVal = token.includes(' ') ? `"${token}"` : token
              return (
                <span key={idx} className="text-emerald-400">
                  {displayVal}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
