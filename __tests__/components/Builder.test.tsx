import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Builder } from '@/components/Builder'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns a fetch mock that streams `content` as the build response. */
function mockBuildResponse(content = '<p>app</p>') {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(content))
      controller.close()
    },
  })
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    body: stream,
  } as any)
}

/** Types a prompt and submits, then waits for the build to finish. */
async function submitAndWait(prompt: string) {
  await userEvent.type(
    screen.getByPlaceholderText(/describe your app/i),
    prompt,
  )
  const submitBtn =
    screen.queryByRole('button', { name: 'Build it →' }) ??
    screen.getByRole('button', { name: 'Update →' })
  await userEvent.click(submitBtn)
  await screen.findByRole('button', { name: 'Update →' })
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('Builder — prompt history', () => {
  beforeEach(() => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    }
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    })
  })
  afterEach(() => jest.restoreAllMocks())

  it('History tab shows empty state when no prompts have been submitted', async () => {
    render(<Builder />)
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(
      screen.getByText(/your prompts will appear here/i),
    ).toBeInTheDocument()
  })

  it('shows the submitted prompt in History tab after a build', async () => {
    mockBuildResponse()
    render(<Builder />)
    await submitAndWait('a meal planner app')
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(screen.getByText('a meal planner app')).toBeInTheDocument()
  })

  it('shows multiple prompts newest-first', async () => {
    mockBuildResponse()
    render(<Builder />)
    await submitAndWait('first prompt')
    mockBuildResponse()
    await submitAndWait('second prompt')
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    const list = screen.getByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('second prompt')
    expect(items[1]).toHaveTextContent('first prompt')
  })

  it('copy button calls clipboard.writeText with the correct prompt', async () => {
    mockBuildResponse()
    render(<Builder />)
    await submitAndWait('a pet diary app')
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    await userEvent.click(screen.getByRole('button', { name: /copy prompt/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('a pet diary app')
  })

  it('copy button shows "Copied" label for 1500ms then resets', async () => {
    jest.useFakeTimers()
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      mockBuildResponse()
      render(<Builder />)
      await user.type(
        screen.getByPlaceholderText(/describe your app/i),
        'a todo app',
      )
      await user.click(screen.getByRole('button', { name: 'Build it →' }))
      // Wait for build to complete without triggering timers (let async complete naturally)
      await act(async () => {
        // Advance timers enough to let streaming complete, but not so much that we hit infinite loop
        jest.advanceTimersByTime(0)
        // Drain microtasks from the streaming reader
        for (let i = 0; i < 50; i++) await Promise.resolve()
      })
      await user.click(screen.getByRole('button', { name: /history/i }))
      await user.click(screen.getByRole('button', { name: /copy prompt/i }))
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
      act(() => jest.advanceTimersByTime(1500))
      expect(
        screen.queryByRole('button', { name: /copied/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /copy prompt/i }),
      ).toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
  })
})
