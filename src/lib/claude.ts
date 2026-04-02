import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '@/types'

export const SYSTEM_PROMPT = `You are a web app builder. Return ONLY a complete, self-contained HTML file.

Rules:
- All CSS must be inside a <style> tag in the <head>
- All JavaScript must be inside a <script> tag before </body>
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- No external images — use CSS gradients, inline SVG, or emoji instead
- The app must work immediately when rendered in a browser
- Beautiful modern design: rounded corners, soft shadows, good typography, thoughtful colour
- Mobile-friendly by default
- Return ONLY the raw HTML starting with <!DOCTYPE html>
- No explanation. No markdown. No code fences. Just the raw HTML.
- NEVER use localStorage, sessionStorage, or IndexedDB — the app runs in a sandboxed iframe where these are blocked. Store all state in JavaScript variables instead.
- NEVER use alert(), confirm(), or prompt() — they are blocked in sandboxed iframes.`

export function buildMessages(
  prompt: string,
  history: Message[]
): Anthropic.MessageParam[] {
  return [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ]
}

export function createClaudeStream(prompt: string, history: Message[]) {
  const client = new Anthropic()
  return client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: buildMessages(prompt, history),
  })
}
