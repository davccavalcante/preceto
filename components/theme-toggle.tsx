'use client'

import { cn } from '@/lib/utils'
import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Desktop },
] as const

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const isMounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false
    )

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!isMounted) {
        return (
            <div className="flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-full">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </div>
        )
    }

    const currentOption = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2]
    const CurrentIcon = currentOption.icon

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    'flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-full transition-colors',
                    'text-muted-foreground hover:text-foreground hover:bg-preceto-surface-hover',
                    open && 'bg-preceto-surface-hover text-foreground'
                )}
                aria-label="Toggle theme"
                aria-expanded={open}
            >
                <CurrentIcon size={16} weight="bold" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 bottom-full mb-2 w-36 rounded-xl border border-border bg-popover p-1 shadow-xl z-50"
                    >
                        {THEME_OPTIONS.map((option) => {
                            const Icon = option.icon
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setTheme(option.value)
                                        setOpen(false)
                                    }}
                                    className={cn(
                                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                                        'hover:bg-preceto-surface-hover',
                                        theme === option.value
                                            ? 'bg-preceto-surface text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <Icon size={14} weight="bold" />
                                    <span className="text-xs font-medium">{option.label}</span>
                                </button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
