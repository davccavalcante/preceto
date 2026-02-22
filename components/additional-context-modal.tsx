'use client'

import { cn } from '@/lib/utils'
import { PaperPlaneRight, X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface AdditionalContextModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (context: string) => void
  isGenerating: boolean
}

export function AdditionalContextModal({
  open,
  onClose,
  onSubmit,
  isGenerating,
}: AdditionalContextModalProps) {
  const [context, setContext] = useState('')

  function handleSubmit() {
    const trimmed = context.trim()
    if (!trimmed || isGenerating) return
    onSubmit(trimmed)
    setContext('')
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Additional Context
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-preceto-surface-hover"
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
              Add more details so the model can refine the output. This context
              will be appended to your original input.
            </p>

            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add details, constraints, examples, or corrections..."
              rows={4}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-preceto-surface px-4 py-3 text-sm text-foreground',
                'placeholder:text-preceto-text-dim focus:outline-none focus:border-muted-foreground/30',
                'leading-relaxed'
              )}
              maxLength={500}
              autoFocus
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-preceto-text-dim tabular-nums">
                {context.length}/500
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!context.trim() || isGenerating}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  'bg-foreground text-background',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  'hover:opacity-90'
                )}
              >
                <PaperPlaneRight size={12} weight="bold" />
                <span>Send</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
