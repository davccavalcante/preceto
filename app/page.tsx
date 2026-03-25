'use client'

// import { AdBanner } from '@/components/ad-banner'
import { Header } from '@/components/header'
import { OutputDisplay } from '@/components/output-display'
import { PromptInput } from '@/components/prompt-input'
import type { GenerationResponse, ModelTier, StyleMode } from '@/lib/types'
import { ShieldCheck, WarningCircle, X } from '@phosphor-icons/react'
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
  const [showKeyGate, setShowKeyGate] = useState(false)
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [userRateLimited, setUserRateLimited] = useState(false)

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

        if (response.status === 429 && data.code === 'quota_exceeded') {
          setShowKeyGate(true)
          setUserRateLimited(false)
          setError(null)
          return
        }

        if (response.status === 429 && data.code === 'user_rate_limited') {
          setUserRateLimited(true)
          setError(null)
          return
        }

        if (!response.ok) {
          throw new Error(data.error || 'Generation failed.')
        }

        setResult(data as GenerationResponse)
        setUserRateLimited(false)
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

  async function handleApiKeySubmit(apiKey: string) {
    setIsSavingKey(true)
    setKeyError(null)
    try {
      const response = await fetch('/api/user-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to store API key.')
      }
      setShowKeyGate(false)
      setUserRateLimited(false)
      if (lastInput) {
        generate(lastInput, lastModel, lastStyle, additionalContext)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      setKeyError(message)
    } finally {
      setIsSavingKey(false)
    }
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
        <AnimatePresence>
          {userRateLimited && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 w-full max-w-2xl rounded-xl border border-border/60 bg-preceto-surface px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2">
                  <span className="mt-0.5 text-foreground">
                    <WarningCircle size={14} weight="bold" />
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your API token limit has been reached. For more information
                    about the rate limit, visit{' '}
                    <a
                      href="https://aistudio.google.com/app/rate-limit"
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground hover:underline"
                    >
                      https://aistudio.google.com/app/rate-limit
                    </a>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowKeyGate(true)
                    setKeyError(null)
                  }}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-preceto-surface-hover transition-colors"
                >
                  Try another key
                </button>
              </div>
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
        <ApiKeyGate
          open={showKeyGate}
          isSaving={isSavingKey}
          error={keyError}
          onClose={() => setShowKeyGate(false)}
          onSubmit={handleApiKeySubmit}
        />

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
            {'v1.0.3 • m1.0.4'}
          </p>
        </motion.footer>
      </div>
    </main>
  )
}

interface ApiKeyGateProps {
  open: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSubmit: (apiKey: string) => void
}

function ApiKeyGate({
  open,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ApiKeyGateProps) {
  const [apiKey, setApiKey] = useState('')

  function handleSubmit() {
    const trimmed = apiKey.trim()
    if (!trimmed || isSaving) return
    onSubmit(trimmed)
  }

  function handleClose() {
    setApiKey('')
    onClose()
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto w-full max-w-lg -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Gemini API key required
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-preceto-surface-hover"
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
              <span className="mr-1 inline-flex align-middle text-foreground">
                <ShieldCheck size={14} weight="bold" />
              </span>
              To continue, visit{' '}
              <a
                href="https://aistudio.google.com/app/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:underline"
              >
                https://aistudio.google.com/app/api-keys
              </a>{' '}
              to generate your own API key and enter it below. Preceto protects your data through short retention periods for sensitive information, role-based access control (RBAC) for session logs, and an explicit policy of not using personal or customer data for the training or improvement of MAIC™, HIM™, or NHE™. All sensitive data handled by Preceto is protected using industry-standard secure encryption and cryptographic hashing.
            </p>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key"
              className="mb-2 w-full rounded-xl border border-border bg-preceto-surface px-4 py-3 text-sm text-foreground placeholder:text-preceto-text-dim focus:outline-none focus:border-muted-foreground/30"
              autoComplete="off"
            />

            <p className="mb-4 text-[10px] text-muted-foreground">
              Learn more about Gemini API keys:{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/api-key"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:underline"
              >
                https://ai.google.dev/gemini-api/docs/api-key
              </a>
            </p>

            {error && (
              <p className="mb-3 text-xs text-destructive">{error}</p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!apiKey.trim() || isSaving}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-foreground text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving…' : 'Save key'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
