import { generateWithKeyRotation, getApiKeys } from '@/lib/gemini-key-rotation'
import { buildPrompt, wrapAsSingleMarkdownCodeBlock } from '@/lib/prompts'
import type { ModelTier, StyleMode } from '@/lib/types'
import { MAX_INPUT_CHARS, MAX_OUTPUT_CHARS } from '@/lib/types'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      input,
      model,
      style,
      additionalContext,
    }: {
      input: string
      model: ModelTier
      style: StyleMode
      additionalContext?: string
    } = body

    if (!input || typeof input !== 'string') {
      return Response.json(
        { error: 'Input is required and must be a string.' },
        { status: 400 }
      )
    }

    if (input.length > MAX_INPUT_CHARS) {
      return Response.json(
        { error: `Input exceeds maximum of ${MAX_INPUT_CHARS} characters.` },
        { status: 400 }
      )
    }

    const validModels: ModelTier[] = ['mini', 'plus', 'engineer']
    if (!validModels.includes(model)) {
      return Response.json(
        { error: 'Invalid model. Use: mini, plus, or engineer.' },
        { status: 400 }
      )
    }

    const validStyles: StyleMode[] = ['simple', 'concise', 'technical']
    if (!validStyles.includes(style)) {
      return Response.json(
        { error: 'Invalid style. Use: simple, concise, or technical.' },
        { status: 400 }
      )
    }

    let fullInput = input
    if (additionalContext && additionalContext.trim()) {
      fullInput = `${input}\n\nADDITIONAL CONTEXT:\n${additionalContext.trim()}`
    }

    if (fullInput.length > MAX_INPUT_CHARS + 500) {
      fullInput = fullInput.slice(0, MAX_INPUT_CHARS + 500)
    }

    const prompt = buildPrompt(fullInput, model, style)
    const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-pro'

    const keys = getApiKeys()
    const { text, keyIndex } = await generateWithKeyRotation(
      keys,
      prompt,
      modelId
    )

    const output = wrapAsSingleMarkdownCodeBlock(text, MAX_OUTPUT_CHARS)

    return Response.json({
      output,
      model,
      style,
      charCount: output.length,
      keyIndex,
      timestamp: Date.now(),
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    console.error('[Preceto] Generation error:', message)

    return Response.json({ error: message }, { status: 500 })
  }
}
