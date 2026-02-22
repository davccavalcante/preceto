'use client'

import type { StyleMode } from '@/lib/types'
import { STYLE_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Code,
  TextAa,
  TextAlignLeft,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface StyleSelectorProps {
  value: StyleMode
  onChange: (style: StyleMode) => void
  disabled?: boolean
}

const STYLE_ICONS: Record<StyleMode, React.ReactNode> = {
  simple: <TextAa size={16} weight="bold" />,
  concise: <TextAlignLeft size={16} weight="bold" />,
  technical: <Code size={16} weight="bold" />,
}

export function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
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
        aria-label="Select style"
        aria-expanded={open}
      >
        {STYLE_ICONS[value]}
        <span>{STYLE_CONFIG[value].label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-border bg-popover p-1 shadow-xl z-50"
          >
            {(Object.keys(STYLE_CONFIG) as StyleMode[]).map((key) => (
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
                  {STYLE_ICONS[key]}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {STYLE_CONFIG[key].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {STYLE_CONFIG[key].description}
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
