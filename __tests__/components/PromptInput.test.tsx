import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText(/too large.*CSVs must be under 500KB/i)).toBeInTheDocument()
  })

  it('shows error when FileReader fails to read the file', async () => {
    const instance = makeFileReaderMock('')
    instance.readAsDataURL.mockImplementation(function (this: typeof instance) {
      this.onerror?.({} as any)
    })
    jest.spyOn(global, 'FileReader').mockImplementation(() => instance as any)

    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, makePngFile('broken.png'))
    expect(screen.getByText(/could not read file/i)).toBeInTheDocument()
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
