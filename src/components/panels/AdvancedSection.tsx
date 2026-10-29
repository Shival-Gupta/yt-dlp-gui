import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Sliders } from 'lucide-react'

export interface AdvancedSectionProps {
  title?: string
  defaultOpen?: boolean
  badge?: string | number
  children: React.ReactNode
  className?: string
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  title = 'Advanced Options',
  defaultOpen = false,
  badge,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      className={`border border-neutral-800/60 bg-neutral-950/40 rounded-lg overflow-hidden mt-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/40 hover:bg-neutral-900/80 transition-colors text-left select-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 text-neutral-400">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-neutral-300">{title}</span>
        </div>

        <div className="flex items-center space-x-2">
          {badge !== undefined && badge !== 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-neutral-800 text-neutral-300">
              {badge}
            </span>
          )}
          <span className="text-neutral-500">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-neutral-800/60 space-y-3 bg-neutral-950/30">
          {children}
        </div>
      )}
    </div>
  )
}
