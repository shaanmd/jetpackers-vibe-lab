# Image & File Upload — Design Spec

**Date:** 2026-04-04
**Status:** Approved
**Feature:** Attach images and CSV files to prompts so Claude can read and build around them

---

## Overview

Workshop participants can attach a file to any prompt before submitting. Claude reads the content — images via vision API, CSVs as plain text — and uses it to generate a tailored app. Attachments are per-prompt only; nothing is stored after the build completes.

---

## Scope

- **Supported types:** Images (jpg, png, gif, webp) and CSV files only
- **Limits:** Images max 5MB, CSVs max 500KB — enforced client-side
- **One file per prompt:** Attaching a second file replaces the first
- **No Excel support:** Users save `.xlsx` as CSV first (no parsing library dependency)
- **No persistence:** Attachments clear after each build; base64 data is not stored in history
- **Image embedding:** When Claude uses a provided image in the generated app, it embeds it as a base64 data URL (`<img src="data:image/png;base64,...">`) so the HTML remains self-contained

---

## Architecture & Data Flow

### Client side (`PromptInput` component)

1. User clicks the attach button (📎), opens native file picker filtered to `image/*,.csv`
2. File is validated client-side (size, type) — rejected immediately if invalid
3. `FileReader` reads the file:
   - **Images** → `readAsDataURL()` → base64 data URL + mime type
   - **CSVs** → `readAsText()` → plain text string + row count
4. Result stored in `PromptInput` local state as:
   ```ts
   type Attachment =
     | { type: 'image'; name: string; base64: string; mimeType: string }
     | { type: 'csv';   name: string; text: string;   rowCount: number }
   ```
5. On submit, attachment is passed up via `onSubmit(prompt, attachment?)`
6. Attachment state clears immediately after submit

### Server side (`/api/build` route + `claude.ts`)

The `BuildRequest` type gains an optional `attachment` field. The route passes it through to `buildMessages` in `claude.ts`, which constructs the Claude user message content:

**Image attached:**
```ts
// User message content becomes a multimodal array
content: [
  { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64WithoutPrefix } },
  { type: 'text', text: prompt }
]
```

**CSV attached:**
```ts
// CSV text prepended to the prompt as a single text string
content: `Here is the data the user has provided:\n\n${csvText}\n\nBuild: ${prompt}`
```

**No attachment:** unchanged — `buildMessages` returns plain string content as today.

> Note: the base64 data URL from `FileReader` includes a `data:image/png;base64,` prefix. Strip the prefix before passing to Claude's API (`data.split(',')[1]`).

### History handling

`Message.content` stays typed as `string`. When appending the user's message to history after a build, store only the **text portion** of the prompt (never the base64 data). This keeps subsequent builds lean and the `Message` type unchanged.

---

## System Prompt Changes

Two targeted changes to `SYSTEM_PROMPT` in `claude.ts`:

1. **Amend** the existing "No external images" rule to carve out an exception:
   > "No external images — use CSS gradients, inline SVG, or emoji instead. Exception: if the user has provided an image, embed it using its base64 data URL in an `<img>` tag."

2. **Add** a new instruction at the end:
   > "When the user provides an image, study its colours, layout, typography, and style and reflect these faithfully in the app you build. When the user provides CSV data, build the app around those actual column names and data values — never use placeholder data."

---

## UI Components

### Attach button

Rendered inside `PromptInput`, between the textarea and the submit button, left-aligned:
- Label: `📎 Attach image or CSV`
- Triggers a hidden `<input type="file" accept="image/*,.csv">`

### File preview strip

Appears between the attach button and submit button after selection:

- **Image:** `<img>` thumbnail (48×48px, object-cover) + filename + ✕ button
- **CSV:** file icon + filename + `· N rows` + ✕ button

Clicking ✕ clears the attachment state and removes the strip.

### Inline error message

Small red text below the preview strip (or below the attach button if no file selected yet):

- File too large: `"[filename] is too large. Images must be under 5MB, CSVs under 500KB."`
- Wrong type: `"Only images (jpg, png, gif, webp) and CSV files are supported."`

---

## Error Handling

| Scenario | Handling |
|---|---|
| File too large | Rejected client-side via `file.size` check; error shown inline; no API call |
| Unsupported type | Rejected by file picker `accept` + secondary `file.type` check |
| Claude vision error (corrupt image) | Surfaces as standard build error via existing catch block |
| Build fails with attachment | Attachment clears on error same as on success |

---

## Files Changed

| File | Change |
|---|---|
| `src/components/PromptInput.tsx` | Add attach button, file preview strip, `FileReader` logic, inline error, extend `onSubmit` signature |
| `src/components/Builder.tsx` | Thread `attachment?` through `onSubmit`, pass to `/api/build` request body |
| `src/app/api/build/route.ts` | Accept `attachment?` from request body, pass to `buildMessages` |
| `src/lib/claude.ts` | Update `buildMessages` to accept optional attachment and construct multimodal content; update `SYSTEM_PROMPT` |
| `src/types/index.ts` | Add `attachment?` field to `BuildRequest`; add `Attachment` type |

No new files, no new routes, no Vercel Blob changes.

---

## Out of Scope

- Multiple file attachments per prompt
- Excel (`.xlsx`) parsing
- Persistent asset library / sidebar
- File attachments in history (past turns)
- PDF support
- Uploading images to Vercel Blob for URL-based embedding
