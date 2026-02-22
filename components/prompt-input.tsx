'use client'

import type { ModelTier, StyleMode } from '@/lib/types'
import { MAX_INPUT_CHARS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CircleNotch, PaperPlaneRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ModelSelector } from './model-selector'
import { StyleSelector } from './style-selector'
import { ThemeToggle } from './theme-toggle'

interface PromptInputProps {
  onSubmit: (input: string, model: ModelTier, style: StyleMode) => void
  isGenerating: boolean
  initialInput?: string
}

export function PromptInput({
  onSubmit,
  isGenerating,
  initialInput = '',
}: PromptInputProps) {
  const [input, setInput] = useState(() => initialInput)
  const [model, setModel] = useState<ModelTier>('mini')
  const [style, setStyle] = useState<StyleMode>('simple')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 200
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) return
    onSubmit(trimmed, model, style)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const charCount = input.length
  const isOverLimit = charCount > MAX_INPUT_CHARS
  const isEmpty = input.trim().length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className={cn(
          'relative rounded-2xl border transition-colors',
          'bg-preceto-surface border-preceto-border-subtle',
          'focus-within:border-muted-foreground/30'
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your instruction prompt or paste text to optimize with Preceto..."
          disabled={isGenerating}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-foreground',
            'placeholder:text-preceto-text-dim focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'leading-relaxed'
          )}
          aria-label="LLM prompt optimization input"
          maxLength={MAX_INPUT_CHARS + 50}
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <ModelSelector
              value={model}
              onChange={setModel}
              disabled={isGenerating}
            />
            <StyleSelector
              value={style}
              onChange={setStyle}
              disabled={isGenerating}
            />
            <div className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-[10px] font-mono tabular-nums transition-colors',
                isOverLimit ? 'text-destructive' : 'text-preceto-text-dim'
              )}
            >
              {charCount}/{MAX_INPUT_CHARS}
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isEmpty || isOverLimit || isGenerating}
              className={cn(
                'flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-full transition-all',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                isEmpty || isOverLimit
                  ? 'text-preceto-text-dim'
                  : 'bg-foreground text-background hover:opacity-90'
              )}
              aria-label="Send prompt for optimization"
            >
              {isGenerating ? (
                <CircleNotch size={16} weight="bold" className="animate-spin" />
              ) : (
                <PaperPlaneRight size={16} weight="bold" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
