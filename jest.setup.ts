// jest.setup.ts
import '@testing-library/jest-dom'

// Disable accept-attribute filtering in userEvent.upload so that our JS
// validation logic (not the browser's native file-type filter) is exercised in
// tests. Without this, user-event v14 silently drops files that don't match the
// input's `accept` attribute before the React onChange handler ever fires.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const directApi = require('@testing-library/user-event/dist/cjs/setup/directApi.js')
if (directApi && typeof directApi.upload === 'function') {
  const origUpload = directApi.upload
  directApi.upload = (element: Element, fileOrFiles: unknown, options: Record<string, unknown> = {}) =>
    origUpload(element, fileOrFiles, { applyAccept: false, ...options })
}
