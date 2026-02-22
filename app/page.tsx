'use client'

// import { AdBanner } from '@/components/ad-banner'
import { Header } from '@/components/header'
import { OutputDisplay } from '@/components/output-display'
import { PromptInput } from '@/components/prompt-input'
import type { GenerationResponse, ModelTier, StyleMode } from '@/lib/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastInput, setLastInput] = useState('')
  const [lastModel, setLastModel] = useState<ModelTier>('mini')
  const [lastStyle, setLastStyle] = useState<StyleMode>('simple')
  const [additionalContext, setAdditionalContext] = useState<string | undefined>(
    undefined
  )

  const generate = useCallback(
    async (
      input: string,
      model: ModelTier,
      style: StyleMode,
      extraContext?: string
    ) => {
      setIsGenerating(true)
      setError(null)

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input,
            model,
            style,
            additionalContext: extraContext,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Generation failed.')
        }

        setResult(data as GenerationResponse)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.'
        setError(message)
      } finally {
        setIsGenerating(false)
      }
    },
    []
  )

  function handleSubmit(input: string, model: ModelTier, style: StyleMode) {
    setLastInput(input)
    setLastModel(model)
    setLastStyle(style)
    setAdditionalContext(undefined)
    generate(input, model, style)
  }

  function handleRegenerate() {
    if (!lastInput) return
    generate(lastInput, lastModel, lastStyle, additionalContext)
  }

  function handleAddContext(context: string) {
    setAdditionalContext(context)
    generate(lastInput, lastModel, lastStyle, context)
  }

  const hasOutput = result !== null
  const showEmptyState = !hasOutput && !isGenerating && !error

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />
      {/* <AdBanner /> */}

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait">
          {showEmptyState && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8 text-center"
            >
              <h2 className="pb-8 text-6xl font-semibold tracking-tight text-foreground max-w-5xl mx-auto text-balance">
                Artificial Intelligence prompt optimization, engineered for precision
              </h2>
              <p className="mt-2 text-base text-foreground max-w-xl mx-auto leading-relaxed">
                Paste your raw prompt or describe your goal. Select a model
                tier and style, then let Preceto refine, restructure, and
                optimize it for LLM performance.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 w-full max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              <p className="text-xs text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {hasOutput && (
          <div className="mb-6 w-full">
            <OutputDisplay
              output={result.output}
              model={result.model}
              style={result.style}
              charCount={result.charCount}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
              onAddContext={handleAddContext}
            />
          </div>
        )}

        {isGenerating && !hasOutput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Optimizing with Preceto...
            </span>
          </motion.div>
        )}

        <PromptInput onSubmit={handleSubmit} isGenerating={isGenerating} />

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="mb-1 text-xs text-preceto-text-dim">
            {'Structured with '}
            <a
              href="https://linkedin.com/in/hellodav"
              target="_self"
              rel="noopener noreferrer"
              className="text-foreground hover:underline hover:text-muted-foreground transition-colors"
            >
              HIM™ (Hybrid Entity Intelligence Model)
            </a>
            {' for advanced AI engineering'}
          </p>
          <p className="text-xs text-preceto-text-dim">
            {'v1.0.1 • m1.0.4'}
          </p>
        </motion.footer>
      </div>
    </main>
  )
}
