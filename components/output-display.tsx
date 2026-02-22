'use client'

import type { ModelTier, StyleMode } from '@/lib/types'
import { MODEL_CONFIG, STYLE_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ArrowsClockwise,
  Brain,
  Check,
  Copy,
  Lightning,
  PlusCircle,
  Wrench,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { AdditionalContextModal } from './additional-context-modal'

interface OutputDisplayProps {
  output: string
  model: ModelTier
  style: StyleMode
  charCount: number
  isGenerating: boolean
  onRegenerate: () => void
  onAddContext: (context: string) => void
}

const MODEL_ICONS: Record<ModelTier, React.ReactNode> = {
  mini: <Lightning size={14} weight="bold" />,
  plus: <Brain size={14} weight="bold" />,
  engineer: <Wrench size={14} weight="bold" />,
}

function parseOutputBlocks(raw: string): { type: 'text' | 'code'; lang?: string; content: string }[] {
  const blocks: { type: 'text' | 'code'; lang?: string; content: string }[] = []
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = raw.slice(lastIndex, match.index).trim()
      if (textBefore) {
        blocks.push({ type: 'text', content: textBefore })
      }
    }
    blocks.push({
      type: 'code',
      lang: match[1] || undefined,
      content: match[2].trim(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < raw.length) {
    const remaining = raw.slice(lastIndex).trim()
    if (remaining) {
      blocks.push({ type: 'text', content: remaining })
    }
  }

  if (blocks.length === 0 && raw.trim()) {
    blocks.push({ type: 'text', content: raw.trim() })
  }

  return blocks
}

function CodeBlock({ lang, content }: { lang?: string; content: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="group relative rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-preceto-surface">
        <span className="text-[10px] font-mono text-preceto-text-dim uppercase tracking-wider">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} weight="bold" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} weight="bold" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="code-block text-foreground">{content}</code>
      </pre>
    </div>
  )
}

function TextBlock({ content }: { content: string }) {
  return (
    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  )
}

export function OutputDisplay({
  output,
  model,
  style,
  charCount,
  isGenerating,
  onRegenerate,
  onAddContext,
}: OutputDisplayProps) {
  const [contextOpen, setContextOpen] = useState(false)
  const [fullCopied, setFullCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  const blocks = parseOutputBlocks(output)

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(output)
      setFullCopied(true)
      setTimeout(() => setFullCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <>
      <motion.div
        ref={outputRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Meta bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              {MODEL_ICONS[model]}
              {MODEL_CONFIG[model].label}
            </span>
            <span className="text-preceto-text-dim">{'/'}</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {STYLE_CONFIG[style].label}
            </span>
          </div>
          <span className="text-[10px] font-mono text-preceto-text-dim tabular-nums">
            {charCount.toLocaleString()} chars
          </span>
        </div>

        {/* Output content */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4">
            {blocks.map((block, index) =>
              block.type === 'code' ? (
                <CodeBlock key={index} lang={block.lang} content={block.content} />
              ) : (
                <TextBlock key={index} content={block.content} />
              )
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isGenerating}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-preceto-surface-hover',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
              aria-label="Regenerate output"
            >
              <ArrowsClockwise
                size={14}
                weight="bold"
                className={cn(isGenerating && 'animate-spin')}
              />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={() => setContextOpen(true)}
              disabled={isGenerating}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-preceto-surface-hover',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
              aria-label="Add context"
            >
              <PlusCircle size={14} weight="bold" />
              <span>Add Info</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-preceto-surface-hover'
            )}
            aria-label="Copy full output"
          >
            {fullCopied ? (
              <>
                <Check size={14} weight="bold" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} weight="bold" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      <AdditionalContextModal
        open={contextOpen}
        onClose={() => setContextOpen(false)}
        onSubmit={onAddContext}
        isGenerating={isGenerating}
      />
    </>
  )
}
