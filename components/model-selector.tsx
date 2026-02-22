'use client'

import type { ModelTier } from '@/lib/types'
import { MODEL_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Brain,
  Lightning,
  Wrench,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface ModelSelectorProps {
  value: ModelTier
  onChange: (model: ModelTier) => void
  disabled?: boolean
}

const MODEL_ICONS: Record<ModelTier, React.ReactNode> = {
  mini: <Lightning size={16} weight="bold" />,
  plus: <Brain size={16} weight="bold" />,
  engineer: <Wrench size={16} weight="bold" />,
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-preceto-surface-hover',
          'disabled:opacity-40 disabled:pointer-events-none',
          open && 'bg-preceto-surface-hover text-foreground'
        )}
        aria-label="Select model"
        aria-expanded={open}
      >
        {MODEL_ICONS[value]}
        <span>{MODEL_CONFIG[value].label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border bg-popover p-1 shadow-xl z-50"
          >
            {(Object.keys(MODEL_CONFIG) as ModelTier[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                  'hover:bg-preceto-surface-hover',
                  value === key
                    ? 'bg-preceto-surface text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <span className="flex h-7 w-7 shrink-0 aspect-square items-center justify-center rounded-full bg-preceto-surface overflow-hidden">
                  {MODEL_ICONS[key]}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {MODEL_CONFIG[key].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {MODEL_CONFIG[key].description}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
