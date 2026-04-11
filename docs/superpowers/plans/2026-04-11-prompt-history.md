# Prompt History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "History" tab to the Vibe Lab sidebar that shows the user's past prompts for the current session, each with a copy-to-clipboard button.

**Architecture:** Two pieces of new state in `Builder.tsx` — `promptHistory: string[]` (populated on each successful build) and `activeTab: 'build' | 'history'`. A tab bar replaces the section toggle, and the scrollable sidebar content area conditionally renders either the existing build UI or the history list.

**Tech Stack:** React `useState`, `navigator.clipboard.writeText`, `@testing-library/react`, `@testing-library/user-event`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/Builder.tsx` | Modify | Add state, tab bar, history tab content |
| `__tests__/components/Builder.test.tsx` | Create | Tests for all new history behaviour |

---

### Task 1: Write failing tests for Builder prompt history

**Files:**
- Create: `__tests__/components/Builder.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { render, screen, act } from '@testing-library/react'
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
  // After the first build the button label changes to 'Update →'.
  // We wait for whichever label appears after building.
  const submitBtn =
    screen.queryByRole('button', { name: 'Build it →' }) ??
    screen.getByRole('button', { name: 'Update →' })
  await userEvent.type(
    screen.getByPlaceholderText(/describe your app/i),
    prompt,
  )
  await userEvent.click(submitBtn)
  // Wait until the label changes back from 'Building…' to 'Update →'
  await screen.findByRole('button', { name: 'Update →' })
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('Builder — prompt history', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
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
    const items = screen.getAllByRole('listitem')
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
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    mockBuildResponse()
    render(<Builder />)
    await user.type(
      screen.getByPlaceholderText(/describe your app/i),
      'a todo app',
    )
    await user.click(screen.getByRole('button', { name: 'Build it →' }))
    // With fake timers, flush the streaming promise chain manually
    await act(async () => {
      jest.runAllTimers()
      await Promise.resolve()
    })
    await user.click(screen.getByRole('button', { name: /history/i }))
    await user.click(screen.getByRole('button', { name: /copy prompt/i }))
    // Icon should now show the "Copied" label
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
    // Advance past the 1500ms reset
    act(() => jest.advanceTimersByTime(1500))
    expect(
      screen.queryByRole('button', { name: /copied/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /copy prompt/i }),
    ).toBeInTheDocument()
    jest.useRealTimers()
  })
})
```

- [ ] **Step 2: Run the tests — confirm they all fail**

```bash
cd jetpackers-vibe-lab
npx jest __tests__/components/Builder.test.tsx --no-coverage
```

Expected: 5 failures. Common errors: "Cannot find module", or buttons not found. This is expected — the feature isn't implemented yet.

---

### Task 2: Implement prompt history in Builder.tsx

**Files:**
- Modify: `src/components/Builder.tsx`

- [ ] **Step 3: Add new state and handleCopy to Builder**

Open `src/components/Builder.tsx`. After the existing `useState` declarations (line ~21), add:

```tsx
const [promptHistory, setPromptHistory] = useState<string[]>([])
const [activeTab, setActiveTab] = useState<'build' | 'history'>('build')
const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
```

After the existing `handlePublish` function (before the `hasApp` const), add:

```tsx
function handleCopy(prompt: string, index: number) {
  navigator.clipboard.writeText(prompt)
  setCopiedIndex(index)
  setTimeout(() => setCopiedIndex(null), 1500)
}
```

In `handleBuild`, add one line after `setHistory(...)`:

```tsx
setPromptHistory((prev) => [...prev, prompt])
```

The full `handleBuild` try block should look like this after the change:

```tsx
setHtml(accumulated)
setTotalBuilds(n => n + 1)
setHistory((prev) => [
  ...prev,
  { role: 'user', content: prompt },
  { role: 'assistant', content: accumulated },
])
setPromptHistory((prev) => [...prev, prompt])
```

- [ ] **Step 4: Add the tab bar to the sidebar JSX**

In the sidebar JSX, immediately after the closing `</div>` of the logo block (which ends with `border-b border-white/10`), insert:

```tsx
{/* ── Tab bar ── */}
<div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
  <div className="flex gap-1 bg-black/20 rounded-lg p-1">
    {(['build', 'history'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
          activeTab === tab
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        {tab === 'build' ? '🔨 Build' : '📜 History'}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Wrap the existing build content in a conditional**

The existing scrollable content `<div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto min-h-0">` should only render when `activeTab === 'build'`. Wrap it:

```tsx
{/* ── Build tab ── */}
{activeTab === 'build' && (
  <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto min-h-0">
    {/* … existing prompt area, publish button, My Apps — unchanged … */}
  </div>
)}
```

Do not change any of the content inside this div.

- [ ] **Step 6: Add the History tab content**

Immediately after the build tab conditional (before the footer stats `<div>`), add:

```tsx
{/* ── History tab ── */}
{activeTab === 'history' && (
  <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto min-h-0">
    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
      📜 Prompt History
    </p>
    {promptHistory.length === 0 ? (
      <p className="text-white/30 text-sm text-center mt-8">
        Your prompts will appear here.
      </p>
    ) : (
      <ul className="flex flex-col gap-2">
        {[...promptHistory].reverse().map((prompt, i) => {
          const originalIndex = promptHistory.length - 1 - i
          return (
            <li
              key={originalIndex}
              className="flex items-start gap-2 bg-white/8 rounded-xl px-3 py-2.5"
            >
              <p
                className="flex-1 text-sm text-white/70 line-clamp-2 min-w-0"
                title={prompt}
              >
                {prompt}
              </p>
              <button
                onClick={() => handleCopy(prompt, originalIndex)}
                aria-label={
                  copiedIndex === originalIndex ? 'Copied' : 'Copy prompt'
                }
                className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5 text-base leading-none"
              >
                {copiedIndex === originalIndex ? '✓' : '📋'}
              </button>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)}
```

- [ ] **Step 7: Run tests — confirm all 5 pass**

```bash
npx jest __tests__/components/Builder.test.tsx --no-coverage
```

Expected output:
```
PASS __tests__/components/Builder.test.tsx
  Builder — prompt history
    ✓ History tab shows empty state when no prompts have been submitted
    ✓ shows the submitted prompt in History tab after a build
    ✓ shows multiple prompts newest-first
    ✓ copy button calls clipboard.writeText with the correct prompt
    ✓ copy button shows "Copied" label for 1500ms then resets

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

- [ ] **Step 8: Run the full test suite — confirm no regressions**

```bash
npx jest --no-coverage
```

Expected: all tests pass. If any pre-existing test fails, check that the Builder.tsx changes didn't accidentally alter shared state or remove exported symbols.

- [ ] **Step 9: Commit**

```bash
git add src/components/Builder.tsx __tests__/components/Builder.test.tsx
git commit -m "feat: add prompt history tab to sidebar"
```
