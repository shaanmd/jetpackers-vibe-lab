import { NextRequest } from 'next/server'
import { createClaudeStream } from '@/lib/claude'
import type { BuildRequest } from '@/types'

export async function POST(request: NextRequest) {
  const body: BuildRequest = await request.json()

  if (!body.prompt?.trim()) {
    return new Response('Prompt is required', { status: 400 })
  }

  const stream = createClaudeStream(body.prompt, body.history ?? [])
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
