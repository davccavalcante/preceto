export type ModelTier = 'mini' | 'plus' | 'engineer'

export type StyleMode = 'simple' | 'concise' | 'technical'

export interface GenerationRequest {
  input: string
  model: ModelTier
  style: StyleMode
  additionalContext?: string
}

export interface GenerationResponse {
  output: string
  model: ModelTier
  style: StyleMode
  charCount: number
  keyIndex: number
  timestamp: number
}

export interface StreamState {
  isGenerating: boolean
  output: string
  error: string | null
  model: ModelTier
  style: StyleMode
}

export const MODEL_CONFIG: Record<
  ModelTier,
  { label: string; description: string; format: string }
> = {
  mini: {
    label: 'Mini',
    description: 'Fast grammar correction and prompt cleanup for LLM optimization',
    format: 'plain',
  },
  plus: {
    label: 'Plus',
    description:
      'Prompt optimization with restructured flow and clean Markdown output',
    format: 'markdown',
  },
  engineer: {
    label: 'Engineer',
    description:
      'Advanced prompt engineering with structured headers, pro techniques, and execution-ready instructions',
    format: 'markdown',
    // format: 'yaml-md',
  },
}

export const STYLE_CONFIG: Record<
  StyleMode,
  { label: string; description: string }
> = {
  simple: {
    label: 'Simple',
    description: 'Clear, direct prompt language optimized for LLM accuracy',
  },
  concise: {
    label: 'Concise',
    description: 'Minimalist prompts with high signal and reduced noise',
  },
  technical: {
    label: 'Technical',
    description: 'Precise, technical prompts for advanced LLM workflows',
  },
}

export const MAX_INPUT_CHARS = 3000
export const MAX_OUTPUT_CHARS = 8000
