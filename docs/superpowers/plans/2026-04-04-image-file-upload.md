# Image & File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let workshop participants attach an image or CSV file to any prompt so Claude can see/read it and build a tailored app around it.

**Architecture:** Files are read client-side via `FileReader` (images → base64, CSVs → plain text), passed through to `/api/build`, then `buildMessages` in `claude.ts` constructs a multimodal Claude message for images or prepends CSV text to the prompt. No server-side storage; attachments are per-prompt only.

**Tech Stack:** TypeScript, React (Next.js App Router), Anthropic SDK multimodal messages, `@testing-library/react` + jest

---

## File Map

| File | What changes |
|---|---|
| `src/types/index.ts` | Add `ImageMimeType`, `Attachment` types; add `attachment?` to `BuildRequest` |
| `src/lib/claude.ts` | Update `SYSTEM_PROMPT`; update `buildMessages` + `createClaudeStream` to accept optional `Attachment` |
| `src/app/api/build/route.ts` | Thread `attachment?` from request body into `createClaudeStream` |
| `src/components/PromptInput.tsx` | Extend `onSubmit` prop; add attach button, file preview strip, FileReader logic, inline errors |
| `src/components/Builder.tsx` | Extend `handleBuild` to accept and pass `attachment?` |
| `__tests__/lib/claude.test.ts` | Add tests for multimodal and CSV content building |
| `__tests__/components/PromptInput.test.tsx` | Add tests for file attachment UI |

---

### Task 1: Add `Attachment` type and update `BuildRequest`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update types**

Replace the full contents of `src/types/index.ts` with:

```ts
export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export type Attachment =
  | { type: 'image'; name: string; base64: string; mimeType: ImageMimeType }
  | { type: 'csv'; name: string; text: string; rowCount: number }

export interface BuildRequest {
  prompt: string
  history: Message[]
  attachment?: Attachment
}

export interface PublishRequest {
  html: string
  title?: string
}

export interface PublishResponse {
  url: string
  slug: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd jetpackers-vibe-lab
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Attachment type and update BuildRequest"
```

---

### Task 2: Update `claude.ts` — system prompt and multimodal message building

**Files:**
- Modify: `src/lib/claude.ts`
- Modify: `__tests__/lib/claude.test.ts`

- [ ] **Step 1: Write failing tests**

Replace the full contents of `__tests__/lib/claude.test.ts` with:

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/lib/claude.test.ts --no-coverage
```

Expected: failures on the new multimodal and system prompt tests

- [ ] **Step 3: Update `claude.ts`**

Replace the full contents of `src/lib/claude.ts` with:

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/lib/claude.test.ts --no-coverage
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/claude.ts __tests__/lib/claude.test.ts
git commit -m "feat: support image and CSV attachments in buildMessages"
```

---

### Task 3: Thread attachment through `/api/build` route

**Files:**
- Modify: `src/app/api/build/route.ts`

- [ ] **Step 1: Update the route**

Replace the full contents of `src/app/api/build/route.ts` with:

```ts
import { NextRequest } from 'next/server'
import { createClaudeStream } from '@/lib/claude'
import type { BuildRequest } from '@/types'

export async function POST(request: NextRequest) {
  const body: BuildRequest = await request.json()

  if (!body.prompt?.trim()) {
    return new Response('Prompt is required', { status: 400 })
  }

  const stream = createClaudeStream(body.prompt, body.history ?? [], body.attachment)
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/build/route.ts
git commit -m "feat: pass attachment from build request to Claude stream"
```

---

### Task 4: Update `PromptInput` — attach button, file reading, preview, validation

**Files:**
- Modify: `src/components/PromptInput.tsx`
- Modify: `__tests__/components/PromptInput.test.tsx`

- [ ] **Step 1: Write failing tests**

Replace the full contents of `__tests__/components/PromptInput.test.tsx` with:

```tsx
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptInput } from '@/components/PromptInput'
import type { Attachment } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFileReaderMock(result: string) {
  const instance = {
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    onload: null as any,
    onerror: null as any,
    result,
  }
  instance.readAsDataURL.mockImplementation(function (this: typeof instance) {
    this.onload?.({ target: this })
  })
  instance.readAsText.mockImplementation(function (this: typeof instance) {
    this.onload?.({ target: this })
  })
  return instance
}

function mockFileReader(result: string) {
  const instance = makeFileReaderMock(result)
  jest.spyOn(global, 'FileReader').mockImplementation(() => instance as any)
  return instance
}

function makePngFile(name = 'logo.png', sizeBytes = 1000) {
  const file = new File([''], name, { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

function makeCsvFile(content = 'name,score\nAlice,10\nBob,20', name = 'data.csv') {
  return new File([content], name, { type: 'text/csv' })
}

// ── existing behaviour (unchanged) ───────────────────────────────────────────

describe('PromptInput — existing behaviour', () => {
  it('renders placeholder text in textarea', () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    expect(screen.getByPlaceholderText(/describe your app/i)).toBeInTheDocument()
  })

  it('calls onSubmit with the typed prompt when button is clicked (no attachment)', async () => {
    const onSubmit = jest.fn()
    render(<PromptInput onSubmit={onSubmit} isDisabled={false} label="Build it" />)
    await userEvent.type(screen.getByPlaceholderText(/describe your app/i), 'a meal planner')
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))
    expect(onSubmit).toHaveBeenCalledWith('a meal planner')
  })

  it('clears textarea after submit', async () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const textarea = screen.getByPlaceholderText(/describe your app/i)
    await userEvent.type(textarea, 'a meal planner')
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))
    expect(textarea).toHaveValue('')
  })

  it('disables button and textarea when isDisabled is true', () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={true} label="Building…" />)
    expect(screen.getByRole('button', { name: 'Building…' })).toBeDisabled()
    expect(screen.getByPlaceholderText(/describe your app/i)).toBeDisabled()
  })

  it('does not call onSubmit when prompt is empty', async () => {
    const onSubmit = jest.fn()
    render(<PromptInput onSubmit={onSubmit} isDisabled={false} label="Build it" />)
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

// ── attach button ─────────────────────────────────────────────────────────────

describe('PromptInput — attach button', () => {
  it('renders an attach button', () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    expect(screen.getByRole('button', { name: /attach/i })).toBeInTheDocument()
  })

  it('has a hidden file input accepting images and csv', () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.accept).toContain('image/*')
    expect(input.accept).toContain('.csv')
  })
})

// ── file validation ───────────────────────────────────────────────────────────

describe('PromptInput — file validation', () => {
  afterEach(() => jest.restoreAllMocks())

  it('shows error for unsupported file type', async () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const pdfFile = new File([''], 'doc.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, pdfFile)
    expect(screen.getByText(/only images.*csv/i)).toBeInTheDocument()
  })

  it('shows error when image exceeds 5MB', async () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const bigImage = makePngFile('huge.png', 6 * 1024 * 1024)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, bigImage)
    expect(screen.getByText(/too large.*images must be under 5MB/i)).toBeInTheDocument()
  })

  it('shows error when CSV exceeds 500KB', async () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const bigCsv = new File([''], 'big.csv', { type: 'text/csv' })
    Object.defineProperty(bigCsv, 'size', { value: 600 * 1024 })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, bigCsv)
    expect(screen.getByText(/too large.*csVs must be under 500KB/i)).toBeInTheDocument()
  })
})

// ── file preview strip ────────────────────────────────────────────────────────

describe('PromptInput — file preview strip', () => {
  afterEach(() => jest.restoreAllMocks())

  it('shows image filename in preview strip after valid image selected', async () => {
    mockFileReader('data:image/png;base64,abc123')
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makePngFile('logo.png'))
    expect(screen.getByText('logo.png')).toBeInTheDocument()
  })

  it('shows CSV filename and row count in preview strip after valid CSV selected', async () => {
    mockFileReader('name,score\nAlice,10\nBob,20\nCarol,30')
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makeCsvFile('name,score\nAlice,10\nBob,20\nCarol,30', 'sales.csv'))
    expect(screen.getByText('sales.csv')).toBeInTheDocument()
    expect(screen.getByText(/3 rows/)).toBeInTheDocument()
  })

  it('removes preview strip when clear button is clicked', async () => {
    mockFileReader('data:image/png;base64,abc123')
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makePngFile('logo.png'))
    expect(screen.getByText('logo.png')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(screen.queryByText('logo.png')).not.toBeInTheDocument()
  })
})

// ── submit with attachment ────────────────────────────────────────────────────

describe('PromptInput — submit with attachment', () => {
  afterEach(() => jest.restoreAllMocks())

  it('calls onSubmit with prompt and image attachment when image is attached', async () => {
    mockFileReader('data:image/png;base64,abc123')
    const onSubmit = jest.fn()
    render(<PromptInput onSubmit={onSubmit} isDisabled={false} label="Build it" />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makePngFile('logo.png'))

    await userEvent.type(screen.getByPlaceholderText(/describe your app/i), 'use my logo')
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))

    expect(onSubmit).toHaveBeenCalledWith('use my logo', {
      type: 'image',
      name: 'logo.png',
      base64: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
    } satisfies Attachment)
  })

  it('calls onSubmit with prompt and csv attachment when CSV is attached', async () => {
    const csvContent = 'name,score\nAlice,10\nBob,20'
    mockFileReader(csvContent)
    const onSubmit = jest.fn()
    render(<PromptInput onSubmit={onSubmit} isDisabled={false} label="Build it" />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makeCsvFile(csvContent, 'scores.csv'))

    await userEvent.type(screen.getByPlaceholderText(/describe your app/i), 'make a chart')
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))

    expect(onSubmit).toHaveBeenCalledWith('make a chart', {
      type: 'csv',
      name: 'scores.csv',
      text: csvContent,
      rowCount: 2,
    } satisfies Attachment)
  })

  it('clears attachment after submit', async () => {
    mockFileReader('data:image/png;base64,abc123')
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makePngFile('logo.png'))
    expect(screen.getByText('logo.png')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText(/describe your app/i), 'use my logo')
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))

    expect(screen.queryByText('logo.png')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/components/PromptInput.test.tsx --no-coverage
```

Expected: new tests FAIL (attach button not yet rendered), existing tests PASS

- [ ] **Step 3: Update `PromptInput.tsx`**

Replace the full contents of `src/components/PromptInput.tsx` with:

```tsx
'use client'

import { useRef, useState } from 'react'
import type { Attachment, ImageMimeType } from '@/types'

interface PromptInputProps {
  onSubmit: (prompt: string, attachment?: Attachment) => void
  isDisabled: boolean
  label: string
  placeholder?: string
}

const ALLOWED_IMAGE_TYPES: ImageMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const IMAGE_MAX_BYTES = 5 * 1024 * 1024   // 5 MB
const CSV_MAX_BYTES = 500 * 1024           // 500 KB

function validateFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as ImageMimeType)
  const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')

  if (!isImage && !isCsv) {
    return 'Only images (jpg, png, gif, webp) and CSV files are supported.'
  }
  if (isImage && file.size > IMAGE_MAX_BYTES) {
    return `${file.name} is too large. Images must be under 5MB.`
  }
  if (isCsv && file.size > CSV_MAX_BYTES) {
    return `${file.name} is too large. CSVs must be under 500KB.`
  }
  return null
}

export function PromptInput({
  onSubmit,
  isDisabled,
  label,
  placeholder = 'Describe your app…',
}: PromptInputProps) {
  const [value, setValue] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input so the same file can be re-selected
    e.target.value = ''

    const error = validateFile(file)
    if (error) {
      setAttachError(error)
      setAttachment(null)
      return
    }

    setAttachError(null)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as ImageMimeType)
    const reader = new FileReader()

    if (isImage) {
      reader.onload = (evt) => {
        const base64 = evt.target!.result as string
        setAttachment({
          type: 'image',
          name: file.name,
          base64,
          mimeType: file.type as ImageMimeType,
        })
      }
      reader.readAsDataURL(file)
    } else {
      reader.onload = (evt) => {
        const text = evt.target!.result as string
        const rowCount = Math.max(0, text.split('\n').filter((l) => l.trim()).length - 1)
        setAttachment({
          type: 'csv',
          name: file.name,
          text,
          rowCount,
        })
      }
      reader.readAsText(file)
    }
  }

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    if (attachment) {
      onSubmit(trimmed, attachment)
    } else {
      onSubmit(trimmed)
    }
    setValue('')
    setAttachment(null)
    setAttachError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={5}
        className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm
          text-white placeholder-white/30 resize-none
          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Attach button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="text-xs text-white/50 hover:text-white/80 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Attach image or CSV"
        >
          📎 Attach image or CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Error message */}
      {attachError && (
        <p className="text-xs text-red-400">{attachError}</p>
      )}

      {/* File preview strip */}
      {attachment && (
        <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2">
          {attachment.type === 'image' ? (
            <img
              src={attachment.base64}
              alt={attachment.name}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <span className="text-lg flex-shrink-0">📄</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{attachment.name}</p>
            {attachment.type === 'csv' && (
              <p className="text-xs text-white/50">· {attachment.rowCount} rows</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-white/50 hover:text-white/80 text-sm flex-shrink-0"
            aria-label="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        className="w-full rounded-xl bg-purple-500 py-2.5 text-sm font-semibold
          text-white hover:bg-purple-400 active:scale-95 transition-all
          disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <p className="text-xs text-white/25 text-right">⌘ + Enter to submit</p>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/components/PromptInput.test.tsx --no-coverage
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PromptInput.tsx __tests__/components/PromptInput.test.tsx
git commit -m "feat: add file attachment UI to PromptInput (image + CSV)"
```

---

### Task 5: Update `Builder` to thread attachment through `handleBuild`

**Files:**
- Modify: `src/components/Builder.tsx`

- [ ] **Step 1: Update `Builder.tsx`**

In `src/components/Builder.tsx`, make the following two changes:

**Change 1** — Add the `Attachment` import at the top:

```ts
import type { Attachment, Message } from '@/types'
```

(Replace the existing `import type { Message } from '@/types'` line.)

**Change 2** — Update `handleBuild` signature and request body:

```ts
async function handleBuild(prompt: string, attachment?: Attachment) {
  setIsBuilding(true)

  try {
    const response = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, attachment }),
    })

    if (!response.ok) throw new Error('Build failed')

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value, { stream: true })
    }

    setHtml(accumulated)
    setTotalBuilds(n => n + 1)
    setHistory((prev) => [
      ...prev,
      { role: 'user', content: prompt },   // store only the text, not the attachment
      { role: 'assistant', content: accumulated },
    ])
  } catch (err) {
    console.error('Build error:', err)
  } finally {
    setIsBuilding(false)
  }
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests PASS

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Builder.tsx
git commit -m "feat: thread attachment from PromptInput through Builder to build API"
```

---

## Smoke Test (manual, local dev server)

After all tasks are complete, start the dev server and verify end-to-end:

```bash
npm run dev
```

1. **Image test:** Click 📎, select a PNG logo. Confirm thumbnail appears. Type "Build a landing page using my logo". Click Build. Verify the generated HTML contains `<img src="data:image/png;base64,...">`.

2. **CSV test:** Open a spreadsheet, export as CSV (3–10 rows). Click 📎, select the CSV. Confirm filename + row count appear. Type "Build a table showing this data". Click Build. Verify the generated app shows the actual column names and values from the CSV.

3. **Validation test:** Try attaching a `.pdf` — confirm error message appears and no attachment shows.

4. **Clear test:** Attach an image, click ✕, confirm the strip disappears. Submit — confirm `onSubmit` is called without an attachment (next build should be text-only).

5. **Subsequent builds:** After building with an attachment, type a follow-up prompt ("make the table sortable") with no attachment. Confirm the build works normally (history is text-only, no base64 bloat).
