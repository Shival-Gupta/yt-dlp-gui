import React, { useState } from 'react'
import { HelpCircle, RotateCcw } from 'lucide-react'

export interface OptionRowProps {
  label: string
  description?: string
  tooltip?: string
  cliFlag?: string
  onReset?: () => void
  isModified?: boolean
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

export const OptionRow: React.FC<OptionRowProps> = ({
  label,
  description,
  tooltip,
  cliFlag,
  onReset,
  isModified,
  children,
  className = '',
  htmlFor,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1.5 text-xs ${className}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center space-x-1.5">
          <label htmlFor={htmlFor} className="font-medium text-neutral-200 truncate cursor-pointer">
            {label}
          </label>

          {cliFlag && (
            <code className="text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
              {cliFlag}
            </code>
          )}

          {tooltip && (
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip((p) => !p)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5 rounded cursor-pointer"
                aria-label={`Help: ${label}`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 z-50 w-56 p-2 text-[11px] leading-relaxed text-neutral-200 bg-neutral-900 border border-neutral-700 rounded-md shadow-xl backdrop-blur-sm pointer-events-none">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>

        {description && (
          <p className="text-[11px] text-neutral-400 mt-0.5 leading-tight">{description}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
        <div className="flex items-center">{children}</div>

        {onReset && isModified && (
          <button
            type="button"
            onClick={onReset}
            className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
