# Prompt History Design

**Date:** 2026-04-11
**Status:** Approved

## Overview

Add a Prompt History feature to the Jetpackers Vibe Lab builder. Users can view a list of prompts they have submitted in the current session, and copy any past prompt to the clipboard.

## Goals

- Let users see what prompts they have tried, so they can learn from and iterate on their work.
- Keep it simple — no database, no login required, session-only.

## Non-Goals

- Persisting history across page reloads or devices.
- Showing Claude's responses in the history view.
- Re-submitting prompts directly from history (copy-to-clipboard is sufficient).

## Data & State

Two new pieces of state are added to `Builder.tsx`:

| State | Type | Description |
|-------|------|-------------|
| `promptHistory` | `string[]` | Ordered list of prompts the user has submitted (oldest first). |
| `activeTab` | `'build' \| 'history'` | Which sidebar tab is currently showing. |

`promptHistory` is populated inside `handleBuild`: after a successful response, the submitted prompt string is appended. It lives in React state — gone on page refresh, no database needed.

The existing `history: Message[]` array (used to pass conversation context to Claude) is unchanged.

## UI / Layout

### Tab bar

Two tabs appear at the top of the left sidebar, immediately below the logo block:

- **Build** — shows the current prompt input, publish button, and My Apps list (no change to existing content).
- **History** — replaces the scrollable content area with the prompt history list.

The tab bar uses the existing sidebar styling: `bg-white/10` active state, small uppercase labels, consistent with the purple gradient sidebar theme.

### History tab content

- Prompts are listed newest-first (reversed `promptHistory`).
- Each item is a card containing:
  - Prompt text, clamped to 2 lines (`line-clamp-2`) with full text visible on hover via `title` attribute.
  - A copy icon button (Lucide `Copy`) on the right edge.
- **Copy behaviour:** clicking the copy button calls `navigator.clipboard.writeText(prompt)` and swaps the icon to `Check` for 1.5 seconds, then resets. No toast or modal needed.
- **Empty state:** when `promptHistory` is empty, the tab shows a centred message: "Your prompts will appear here."

### No changes to existing components

`PromptInput`, `Preview`, and `ShareModal` are unchanged. All changes are isolated to `Builder.tsx`.

## File Changes

| File | Change |
|------|--------|
| `src/components/Builder.tsx` | Add `promptHistory`, `activeTab` state; add tab bar UI; add History tab content. |
| `__tests__/components/Builder.test.tsx` | New test file (create). |

## Tests

New tests in `__tests__/components/Builder.test.tsx`:

1. History tab shows empty state message when no prompts have been submitted.
2. After a successful build, switching to History tab shows the submitted prompt.
3. Prompts appear newest-first when multiple builds have been submitted.
4. Clicking the copy button on a history item calls `navigator.clipboard.writeText` with the correct prompt text.
5. Copy button icon resets after 1.5 seconds (timer-based test with fake timers).

The `/api/build` endpoint is mocked in these tests (same pattern as other component tests if applicable, or using `jest.fn()` on `fetch`).
