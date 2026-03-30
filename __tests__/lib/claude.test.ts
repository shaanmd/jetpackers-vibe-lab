import { buildMessages, SYSTEM_PROMPT } from '@/lib/claude'
import type { Message } from '@/types'

describe('buildMessages', () => {
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

describe('SYSTEM_PROMPT', () => {
  it('instructs Claude to return only raw HTML starting with DOCTYPE', () => {
    expect(SYSTEM_PROMPT).toContain('<!DOCTYPE html>')
    expect(SYSTEM_PROMPT).toContain('No explanation')
    expect(SYSTEM_PROMPT).toContain('No markdown')
  })

  it('specifies Tailwind CDN', () => {
    expect(SYSTEM_PROMPT).toContain('cdn.tailwindcss.com')
  })
})
