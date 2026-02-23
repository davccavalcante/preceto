import { generateWithKeyRotation, generateWithSingleKey, getApiKeys } from '@/lib/gemini-key-rotation'
import { buildPrompt, wrapAsSingleMarkdownCodeBlock } from '@/lib/prompts'
import type { ModelTier, StyleMode } from '@/lib/types'
import { MAX_INPUT_CHARS, MAX_OUTPUT_CHARS } from '@/lib/types'
import {
  createPayload,
  encodePayload,
  getCookieName,
  getRequestLimit,
  getUserKey,
  getUserRecord,
  incrementRequestCount,
  parsePayloadCookie,
} from '@/lib/user-key-store'
import { NextRequest, NextResponse } from 'next/server'

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

    const cookieName = getCookieName()
    const incomingPayload = parsePayloadCookie(
      request.cookies.get(cookieName)?.value
    )
    const payload = incomingPayload ?? createPayload()
    const shouldSetCookie = !incomingPayload

    const record = await getUserRecord(payload.userId)
    const userKey = await getUserKey(payload.userId, payload.keyHash)
    const limit = getRequestLimit()

    if (!userKey && record.requestCount >= limit) {
      const response = NextResponse.json(
        {
          error:
            'Request limit reached. Provide your own Gemini API key to continue.',
          code: 'quota_exceeded',
          limit,
        },
        { status: 429 }
      )
      if (shouldSetCookie) {
        response.cookies.set(cookieName, encodePayload(payload), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        })
      }
      return response
    }

    if (!userKey) {
      await incrementRequestCount(payload.userId)
    }

    const prompt = buildPrompt(fullInput, model, style)
    const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-pro'
    let text = ''
    let keyIndex = -1

    try {
      if (userKey) {
        text = await generateWithSingleKey(userKey, prompt, modelId)
        keyIndex = -1
      } else {
        const result = await generateWithKeyRotation(
          getApiKeys(),
          prompt,
          modelId
        )
        text = result.text
        keyIndex = result.keyIndex
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error)
      const isRateLimited =
        /429|rate limit|resource_exhausted|quota/i.test(message)
      if (userKey && isRateLimited) {
        const response = NextResponse.json(
          {
            error:
              'Your token limit has been reached. Check the Gemini rate limit page for details.',
            code: 'user_rate_limited',
          },
          { status: 429 }
        )
        if (shouldSetCookie) {
          response.cookies.set(cookieName, encodePayload(payload), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
          })
        }
        return response
      }
      throw error
    }

    const output = wrapAsSingleMarkdownCodeBlock(text, MAX_OUTPUT_CHARS)

    const response = NextResponse.json({
      output,
      model,
      style,
      charCount: output.length,
      keyIndex,
      timestamp: Date.now(),
    })
    if (shouldSetCookie) {
      response.cookies.set(cookieName, encodePayload(payload), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    return response
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    console.error('[Preceto] Generation error:', message)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
