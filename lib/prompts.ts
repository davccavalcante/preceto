import type { ModelTier, StyleMode } from './types'

type LanguageHint = {
  label: string
  script: string
}

function countMatches(text: string, pattern: RegExp) {
  const matches = text.match(pattern)
  return matches ? matches.length : 0
}

function detectScript(text: string): string {
  const scripts: Array<{ name: string; pattern: RegExp }> = [
    { name: 'Hiragana', pattern: /[\u3040-\u309F]/g },
    { name: 'Katakana', pattern: /[\u30A0-\u30FF]/g },
    { name: 'Han', pattern: /[\u4E00-\u9FFF]/g },
    { name: 'Hangul', pattern: /[\uAC00-\uD7AF]/g },
    { name: 'Cyrillic', pattern: /[\u0400-\u04FF]/g },
    { name: 'Arabic', pattern: /[\u0600-\u06FF]/g },
    { name: 'Devanagari', pattern: /[\u0900-\u097F]/g },
    { name: 'Hebrew', pattern: /[\u0590-\u05FF]/g },
    { name: 'Thai', pattern: /[\u0E00-\u0E7F]/g },
    { name: 'Greek', pattern: /[\u0370-\u03FF]/g },
    { name: 'Latin', pattern: /[A-Za-zÀ-ÖØ-öø-ÿ]/g },
  ]
  let best = { name: 'Unknown', score: 0 }
  for (const script of scripts) {
    const score = countMatches(text, script.pattern)
    if (score > best.score) {
      best = { name: script.name, score }
    }
  }
  if (best.score === 0) return 'Unknown'
  if (best.name === 'Hiragana' || best.name === 'Katakana') return 'Japanese'
  if (best.name === 'Han') return 'Chinese'
  if (best.name === 'Hangul') return 'Korean'
  return best.name
}

function scoreLanguage(words: string[], candidates: Record<string, string[]>) {
  const text = ` ${words.join(' ')} `
  const scores: Record<string, number> = {}
  for (const [lang, markers] of Object.entries(candidates)) {
    scores[lang] = markers.reduce((acc, marker) => {
      const pattern = new RegExp(`\\b${marker}\\b`, 'g')
      return acc + countMatches(text, pattern)
    }, 0)
  }
  let best = { lang: 'Unknown', score: 0 }
  for (const [lang, score] of Object.entries(scores)) {
    if (score > best.score) {
      best = { lang, score }
    }
  }
  return best.lang
}

function detectLanguage(input: string): LanguageHint {
  const script = detectScript(input)
  if (script !== 'Latin') {
    return { label: script, script }
  }
  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const candidates: Record<string, string[]> = {
    Portuguese: ['não', 'para', 'com', 'uma', 'que', 'não', 'isso', 'esta', 'está', 'se', 'são', 'como', 'mais', 'menos', 'ser', 'tem', 'pode', 'vai', 'por', 'também', 'estamos', 'você'],
    Spanish: ['para', 'con', 'una', 'que', 'pero', 'como', 'más', 'menos', 'ser', 'tiene', 'puede', 'por', 'también', 'estamos', 'usted'],
    English: ['the', 'and', 'is', 'are', 'to', 'in', 'of', 'for', 'with', 'that', 'this', 'not', 'you', 'your', 'can', 'will'],
    French: ['le', 'la', 'les', 'des', 'pour', 'avec', 'mais', 'comme', 'être', 'vous', 'votre', 'peut'],
    German: ['der', 'die', 'das', 'und', 'nicht', 'für', 'mit', 'dass', 'ist', 'sind', 'sie', 'ihr'],
    Italian: ['che', 'per', 'con', 'non', 'come', 'più', 'meno', 'essere', 'voi', 'vostro'],
    Russian: ['не', 'для', 'с', 'один', 'что', 'но', 'как', 'более', 'менее', 'быть', 'есть', 'может', 'также', 'мы', 'вы'],
    Chinese: ['的', '了', '是', '在', '我', '你', '他', '她', '它', '不', '也', '但', '嗎'],
    Japanese: ['の', 'で', 'は', 'を', 'が', 'た', 'て', 'な', 'も', 'あり', 'ます', 'です'],
    Korean: ['은', '는', '이', '가', '을', '를', '에', '에게', '께', '랑', '랑께', '께서', '께게'],
    Paquistani: ['کیا', 'ہم', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری', 'ہماری'],
  }

  const label = scoreLanguage(normalized, candidates)
  return { label: label === 'Unknown' ? 'Latin' : label, script }
}

function buildMiniPrompt(input: string, style: StyleMode): string {
  const language = detectLanguage(input)
  const styleInstructions: Record<StyleMode, string> = {
    simple:
      'Use clear, direct and accessible language. Keep sentences short and straightforward.',
    concise:
      'Be extremely brief and to the point. Remove all unnecessary words. Every sentence must carry essential meaning.',
    technical:
      'Use precise technical terminology. Maintain formal register with domain-specific vocabulary.',
  }

  return `You are an advanced prompt engineering assistant. Your task is to take the user's raw input and produce an optimized, grammatically correct, and well-organized version as a clean prompt.

RULES:
- Correct all grammar, spelling, and punctuation errors
- Reorganize the content for logical flow and clarity
- Style: ${styleInstructions[style]}
- Output ONLY the refined text as plain Markdown without any outer code block
- Use plain text with minimal Markdown syntax when helpful
- Do NOT add explanations or meta-commentary
- Maximum output 6000 characters but before generating plan the entire content to ensure completeness within the limit and the all the content response must not be cut off
- Language: Output must be exactly the same language as the input
- Never translate or switch languages unless explicitly requested in the input
- If the input mixes languages, preserve the same mix and proportions
- Before finalizing, verify the output language matches the input language
- Never use triple backticks
- For code, use fences with 3 (three) backticks: \`\`\`language code\`\`\`
- For commands or terminal instructions, use 1 (one) single quote: \'like this\'
- For file paths or folders, use 1 (one single) backtick: \`like this\`

LANGUAGE DETECTION:
- Input language (heuristic): ${language.label}
- Input script: ${language.script}
- Use the input language regardless of the heuristic label if they conflict

USER INPUT:
${input}`
}

function buildPlusPrompt(input: string, style: StyleMode): string {
  const language = detectLanguage(input)
  const styleInstructions: Record<StyleMode, string> = {
    simple:
      'Use clear, direct and accessible language. Keep sentences short and straightforward.',
    concise:
      'Be extremely brief and to the point. Remove all unnecessary words. Every sentence must carry essential meaning.',
    technical:
      'Use precise technical terminology. Maintain formal register with domain-specific vocabulary.',
  }

  return `You are an advanced prompt engineering assistant. Your task is to take the user's raw input and produce an optimized prompt formatted in Markdown.

RULES:
- Correct all grammar, spelling, and punctuation errors
- Reorganize the content for logical flow and clarity
- Style: ${styleInstructions[style]}
- Format the output as a minimal, well-structured Markdown document without any outer code block
- Use simple headers, short lists, and short paragraphs
- Output must be plain Markdown without any outer code block
- For code, use fences with 3 (three) backticks: \`\`\`language code\`\`\`
- For commands or terminal instructions, use 1 (one) single quote: \'like this\'
- For file paths or folders, use 1 (one single) backtick: \`like this\`
- Do NOT add explanations or meta-commentary outside the markdown content
- Maximum output 6000 characters but before generating plan the entire content to ensure completeness within the limit and the all the content response must not be cut off
- Language: Output must be exactly the same language as the input
- Never translate or switch languages unless explicitly requested in the input
- If the input mixes languages, preserve the same mix and proportions
- Before finalizing, verify the output language matches the input language
- Never use triple backticks

LANGUAGE DETECTION:
- Input language (heuristic): ${language.label}
- Input script: ${language.script}
- Use the input language regardless of the heuristic label if they conflict

USER INPUT:
${input}`
}

function buildEngineerPrompt(input: string, style: StyleMode): string {
  const language = detectLanguage(input)
  const styleInstructions: Record<StyleMode, string> = {
    simple:
      'Use clear, direct and accessible language. Keep sentences short and straightforward.',
    concise:
      'Be extremely brief and to the point. Remove all unnecessary words. Every sentence must carry essential meaning.',
    technical:
      'Use precise technical terminology. Maintain formal register with domain-specific vocabulary.',
  }

  return `You are an expert-level prompt engineer. Your task is to transform the user's raw input into a fully structured, production-grade prompt using advanced engineering techniques.

RULES:
- Correct all grammar, spelling, and punctuation errors
- Reorganize for maximum logical clarity
- Style: ${styleInstructions[style]}
- Maximum output 7000 characters but before generating plan the entire content to ensure completeness within the limit and the all the content response must not be cut off
- Language: Output must be exactly the same language as the input
- Never translate or switch languages unless explicitly requested in the input
- If the input mixes languages, preserve the same mix and proportions
- Before finalizing, verify the output language matches the input language
- Output must be plain Markdown without any outer code block
- For code, use fences with 3 (three) backticks: \`\`\`language code\`\`\`
- For commands or terminal instructions, use 1 (one) single quote: \'like this\'
- For file paths or folders, use 1 (one single) backtick: \`like this\`
- Never use triple backticks

LANGUAGE DETECTION:
- Input language (heuristic): ${language.label}
- Input script: ${language.script}
- Use the input language regardless of the heuristic label if they conflict

OUTPUT FORMAT (follow exactly, and keep everything as plain Markdown without outer code block):

1. FIRST: Output a header between lines with --- containing the metadata, after closing the header with the final --- line you MUST add an empty line, this empty line must appear only after the header is fully closed, ensuring that the following content starts in a new paragraph
   - name: A concise identifier for the prompt
   - description: A one-line summary of the prompt's purpose
   - author: "David C Cavalcante"
   - model: "hybrid-entity-intelligence-model-1.4"
   - version: "1.0.0"
   - company: "Takk Innovate Studio"
   - category: The domain/category e.g,: \"Development", "Analysis", "Creative"\
   - tags: An array of relevant tags
   - license: An array of relevant licenses, e.g,: \"MIT", "Apache-2.0"\
   - homepage: "https://linkedin.com/in/hellodav"
   - repository: "https://github.com/davccavalcante/preceto"
   - bugs: "https://github.com/davccavalcante/preceto/issues"
   - techniques: An array of applied techniques e.g,: \"Meta-Prompting", "RAG", "Prompt-Chaining"\
   - dependencies: An array of required dependencies, e.g,: \"python", "pytorch"\
   - compatibility: An array of compatible models, e.g,: \"grok-5.1", "gemini-3.1-pro", "gpt-5.2-codex", "claude-4.6-opus"\ but always include "hybrid-entity-intelligence-model-1.4" with another models
   - max_tokens: Estimated token count
   - style: "${style}"
   handoffs:
    - label: An array of labels for the handoffs, e.g,: \"Refine Prompt"\
      agent: An array of agents for the handoffs, e.g,: \"RefineAgent"\
      prompt: An array of prompts for the handoffs, e.g,: \"Refine the prompt based on the feedback provided."\
      showContinueOn: An array of booleans for the handoffs, e.g,: \'true'\

2. THEN: Output the Markdown content containing:
   - # Title of the prompt
   - ## Context: Background information
   - ## Objective: Clear statement of what the prompt achieves
   - ## Instructions: Step-by-step instructions
   - ## Diagrams (if applicable): Visual aids using Mermaid syntax
     When relevant, include visual elements such as:
     - Tables for comparisons or structured data
     - Flowcharts using Mermaid to illustrate processes
     - Diagrams using Mermaid to show relationships or architectures
   - ## Constraints: Rules and limitations
   - ## Output Format: Expected output structure
   - ## Examples (if applicable): One or two few-shot examples
   - ## Questions (if applicable): Open-ended questions to encourage exploration
   - ## Notes (if applicable): Additional context or considerations
   - ## References (if applicable): External resources or citations

Apply these techniques as relevant:
- Chain of Thought (CoT): Break down reasoning into steps
- ReAct: Include Thought/Action/Observation loops if task involves tool use
- Tree of Thoughts (ToT): Explore alternative approaches with DFS backtracking if task is complex
- Self-Consistency: Note where multiple reasoning paths should converge, generate variations and vote on the best
- Role-Prompting: Assign clear roles/personas
- Meta-Prompting: Include self-reflection instructions
- RAG (Retrieval-Augmented Generation): Note where external data retrieval would enrich context
- Faithful CoT: Ensure fidelity in the reasoning process, grounding each step
- Reflection: Add self-evaluation checkpoints to identify and correct potential flaws
- Prompt Chaining: Break complex tasks into sequential sub-prompts when beneficial
- Iterative Prompting: Include refinement loops for progressive improvement
- Zero-Shot / Few-Shot: Apply as appropriate based on task complexity

Do NOT output anything outside the markdown content.

USER INPUT:
${input}`
}

export function buildPrompt(
  input: string,
  model: ModelTier,
  style: StyleMode
): string {
  switch (model) {
    case 'mini':
      return buildMiniPrompt(input, style)
    case 'plus':
      return buildPlusPrompt(input, style)
    case 'engineer':
      return buildEngineerPrompt(input, style)
  }
}

function unwrapOuterFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^(`{3,})(\w+)?\n([\s\S]*?)\n\1\s*$/)
  if (!match) return text
  return match[3]
}

export function wrapAsSingleMarkdownCodeBlock(
  content: string,
  maxChars: number
): string {
  const normalized = (content ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const unwrapped = unwrapOuterFence(normalized).replace(/\n+$/g, '')
  return unwrapped.slice(0, Math.max(0, maxChars))
}
