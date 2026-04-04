import { buildMessages, SYSTEM_PROMPT } from '@/lib/claude'
import type { Attachment, Message } from '@/types'

describe('buildMessages — no attachment', () => {
  it('appends the prompt as the last user message with empty history', () => {
    const messages = buildMessages('build a game', [])
    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual({ role: 'user', content: 'build a game' })
  })

  it('preserves conversation history before the new prompt', () => {
    const history: Message[] = [
      { role: 'user', content: 'first prompt' },
      { role: 'assistant', content: '<!DOCTYPE html>...' },
    ]
    const messages = buildMessages('make it blue', history)
    expect(messages).toHaveLength(3)
    expect(messages[0]).toEqual({ role: 'user', content: 'first prompt' })
    expect(messages[1]).toEqual({ role: 'assistant', content: '<!DOCTYPE html>...' })
    expect(messages[2]).toEqual({ role: 'user', content: 'make it blue' })
  })

  it('does not mutate the history array', () => {
    const history: Message[] = [{ role: 'user', content: 'original' }]
    buildMessages('new', history)
    expect(history).toHaveLength(1)
  })
})

describe('buildMessages — image attachment', () => {
  it('returns multimodal content array with image block first, text second', () => {
    const attachment: Attachment = {
      type: 'image',
      name: 'logo.png',
      base64: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
    }
    const messages = buildMessages('use this logo', [], attachment)
    expect(messages).toHaveLength(1)
    const content = messages[0].content as Array<{ type: string; source?: object; text?: string }>
    expect(content[0]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'abc123' },
    })
    expect(content[1]).toEqual({ type: 'text', text: 'use this logo' })
  })

  it('strips the data URL prefix before sending to Claude', () => {
    const attachment: Attachment = {
      type: 'image',
      name: 'photo.jpg',
      base64: 'data:image/jpeg;base64,/9j/xyz==',
      mimeType: 'image/jpeg',
    }
    const messages = buildMessages('use this', [], attachment)
    const content = messages[0].content as Array<{ source: { data: string } }>
    expect(content[0].source.data).toBe('/9j/xyz==')
  })

  it('works with images that already have no data URL prefix', () => {
    const attachment: Attachment = {
      type: 'image',
      name: 'pic.png',
      base64: 'rawbase64data',
      mimeType: 'image/png',
    }
    const messages = buildMessages('use this', [], attachment)
    const content = messages[0].content as Array<{ source: { data: string } }>
    expect(content[0].source.data).toBe('rawbase64data')
  })

  it('still includes history before the multimodal user message', () => {
    const history: Message[] = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: '<!DOCTYPE html>' },
    ]
    const attachment: Attachment = {
      type: 'image',
      name: 'logo.png',
      base64: 'data:image/png;base64,abc',
      mimeType: 'image/png',
    }
    const messages = buildMessages('add my logo', history, attachment)
    expect(messages).toHaveLength(3)
    expect(messages[0]).toEqual({ role: 'user', content: 'first' })
    expect(messages[2].content).toBeInstanceOf(Array)
  })
})

describe('buildMessages — CSV attachment', () => {
  it('prepends CSV text to the prompt in the user message', () => {
    const attachment: Attachment = {
      type: 'csv',
      name: 'sales.csv',
      text: 'name,amount\nAlice,100\nBob,200',
      rowCount: 2,
    }
    const messages = buildMessages('make a chart', [], attachment)
    expect(messages).toHaveLength(1)
    const content = messages[0].content as string
    expect(content).toContain('name,amount\nAlice,100\nBob,200')
    expect(content).toContain('make a chart')
  })

  it('content is a plain string (not an array) for CSV attachments', () => {
    const attachment: Attachment = {
      type: 'csv',
      name: 'data.csv',
      text: 'a,b\n1,2',
      rowCount: 1,
    }
    const messages = buildMessages('analyse this', [], attachment)
    expect(typeof messages[0].content).toBe('string')
  })
})

describe('SYSTEM_PROMPT', () => {
  it('instructs Claude to return only raw HTML starting with DOCTYPE', () => {
    expect(SYSTEM_PROMPT).toContain('<!DOCTYPE html>')
    expect(SYSTEM_PROMPT).toContain('No explanation')
    expect(SYSTEM_PROMPT).toContain('No markdown')
  })

  it('specifies Tailwind CDN', () => {
    expect(SYSTEM_PROMPT).toContain('cdn.tailwindcss.com')
  })

  it('allows embedding user-provided images as base64 data URLs', () => {
    expect(SYSTEM_PROMPT).toContain('base64 data URL')
  })

  it('instructs Claude to use actual CSV data, not placeholders', () => {
    expect(SYSTEM_PROMPT).toContain('never use placeholder data')
  })
})
