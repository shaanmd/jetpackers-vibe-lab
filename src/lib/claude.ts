import Anthropic from '@anthropic-ai/sdk'
import type { Attachment, Message } from '@/types'

export const SYSTEM_PROMPT = `You are a web app builder. Return ONLY a complete, self-contained HTML file.

Rules:
- All CSS must be inside a <style> tag in the <head>
- All JavaScript must be inside a <script> tag before </body>
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- No external images — use CSS gradients, inline SVG, or emoji instead. Exception: if the user has provided an image, embed it using its base64 data URL in an <img> tag.
- The app must work immediately when rendered in a browser
- Beautiful modern design: rounded corners, soft shadows, good typography, thoughtful colour
- Mobile-friendly by default
- Return ONLY the raw HTML starting with <!DOCTYPE html>
- No explanation. No markdown. No code fences. Just the raw HTML.
- NEVER use localStorage, sessionStorage, or IndexedDB — the app runs in a sandboxed iframe where these are blocked. Store all state in JavaScript variables instead.
- NEVER use alert(), confirm(), or prompt() — they are blocked in sandboxed iframes.
- When the user provides an image, study its colours, layout, typography, and style and reflect these faithfully in the app you build. When the user provides CSV data, build the app around those actual column names and data values — never use placeholder data.`

function buildUserContent(
  prompt: string,
  attachment?: Attachment
): Anthropic.MessageParam['content'] {
  if (!attachment) return prompt

  if (attachment.type === 'image') {
    const data = attachment.base64.includes(',')
      ? attachment.base64.split(',')[1]
      : attachment.base64
    return [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: attachment.mimeType,
          data,
        },
      },
      { type: 'text', text: prompt },
    ]
  }

  // CSV: prepend data as text
  return `Here is the data the user has provided:\n\n${attachment.text}\n\nBuild: ${prompt}`
}

export function buildMessages(
  prompt: string,
  history: Message[],
  attachment?: Attachment
): Anthropic.MessageParam[] {
  return [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: buildUserContent(prompt, attachment) },
  ]
}

export function createClaudeStream(
  prompt: string,
  history: Message[],
  attachment?: Attachment
) {
  const client = new Anthropic()
  return client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: buildMessages(prompt, history, attachment),
  })
}
