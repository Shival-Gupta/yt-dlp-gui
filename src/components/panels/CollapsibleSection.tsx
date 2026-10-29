import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

export interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  description?: string
  defaultOpen?: boolean
  badge?: string | number
  children: React.ReactNode
  className?: string
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  description,
  defaultOpen = true,
  badge,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      className={`border border-neutral-800 bg-neutral-900/40 rounded-xl overflow-hidden transition-all duration-200 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/60 hover:bg-neutral-850/80 transition-colors text-left select-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2.5">
          {icon && <span className="text-indigo-400 shrink-0">{icon}</span>}
          <div>
            <span className="text-xs font-semibold text-neutral-200">{title}</span>
            {description && (
              <p className="text-[11px] text-neutral-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {badge !== undefined && badge !== 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
              {badge}
            </span>
          )}
          <span className="text-neutral-400 hover:text-neutral-200">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-neutral-800/80 space-y-3.5 bg-neutral-950/20">
          {children}
        </div>
      )}
    </div>
  )
}
