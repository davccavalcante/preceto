import { GoogleGenAI } from '@google/genai'

type KeyMetrics = {
  success: number
  failure: number
  consecutiveFailures: number
  lastSuccessAt?: number
  lastFailureAt?: number
}

type RotationOptions = {
  execute?: (key: string, prompt: string, model: string) => Promise<string>
  sleep?: (ms: number) => Promise<void>
  onCycleExhausted?: (cycle: number) => void
}

let currentKeyIndex = 0
let cycleFailures = 0
let cycleCount = 0
const keyMetrics = new Map<number, KeyMetrics>()

function getKeyMetrics(keyIndex: number): KeyMetrics {
  const metrics = keyMetrics.get(keyIndex)
  if (metrics) return metrics
  const created: KeyMetrics = {
    success: 0,
    failure: 0,
    consecutiveFailures: 0,
  }
  keyMetrics.set(keyIndex, created)
  return created
}

export function getKeyMetricsSnapshot() {
  return Array.from(keyMetrics.entries()).map(([keyIndex, metrics]) => ({
    keyIndex,
    ...metrics,
  }))
}

export function resetKeyRotationState() {
  currentKeyIndex = 0
  cycleFailures = 0
  cycleCount = 0
  keyMetrics.clear()
}

export function getApiKeys(): string[] {
  const raw =
    process.env.GEMINI_KEYS ||
    process.env.GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEY ||
    ''
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

async function defaultExecute(
  key: string,
  prompt: string,
  model: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: key })
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    },
  })
  return response.text ?? ''
}

function getDelayMs(consecutiveFailures: number) {
  const base = 400
  const max = 4000
  return Math.min(max, base * Math.max(1, consecutiveFailures))
}

export async function generateWithKeyRotation(
  keys: string[],
  prompt: string,
  model: string,
  options: RotationOptions = {}
): Promise<{ text: string; keyIndex: number; attempts: number }> {
  if (keys.length === 0) {
    throw new Error('No API keys configured. Set GEMINI_KEYS in .env.')
  }

  const execute = options.execute ?? defaultExecute
  const sleep =
    options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const onCycleExhausted =
    options.onCycleExhausted ??
    ((cycle: number) =>
      console.warn(`[Preceto] All keys failed in cycle ${cycle}.`))

  let attempts = 0

  while (true) {
    const keyIndex = currentKeyIndex % keys.length
    const key = keys[keyIndex]
    const metrics = getKeyMetrics(keyIndex)

    try {
      attempts += 1
      const text = await execute(key, prompt, model)
      metrics.success += 1
      metrics.consecutiveFailures = 0
      metrics.lastSuccessAt = Date.now()
      currentKeyIndex = keyIndex
      console.info(`[Preceto] Key ${keyIndex} success.`)
      return { text, keyIndex, attempts }
    } catch (error: unknown) {
      attempts += 1
      metrics.failure += 1
      metrics.consecutiveFailures += 1
      metrics.lastFailureAt = Date.now()
      const errMsg =
        error instanceof Error ? error.message : String(error)
      console.error(
        `[Preceto] Key ${keyIndex} failed (attempt ${attempts}): ${errMsg}`
      )
      currentKeyIndex = (keyIndex + 1) % keys.length
      cycleFailures += 1

      if (cycleFailures >= keys.length) {
        cycleCount += 1
        cycleFailures = 0
        onCycleExhausted(cycleCount)
      }

      await sleep(getDelayMs(metrics.consecutiveFailures))
    }
  }
}

export async function generateWithSingleKey(
  key: string,
  prompt: string,
  model: string,
  options: RotationOptions = {}
): Promise<string> {
  const execute = options.execute ?? defaultExecute
  return execute(key, prompt, model)
}
