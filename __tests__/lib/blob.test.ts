jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  list: jest.fn(),
}))

import { put, list } from '@vercel/blob'
import { saveApp, findApp } from '@/lib/blob'

const mockPut = put as jest.MockedFunction<typeof put>
const mockList = list as jest.MockedFunction<typeof list>

describe('saveApp', () => {
  beforeEach(() => jest.clearAllMocks())

  it('stores html at the correct blob path', async () => {
    mockPut.mockResolvedValueOnce({
      url: 'https://blob.vercel-storage.com/apps/my-app-abc123.html',
      downloadUrl: 'https://blob.vercel-storage.com/apps/my-app-abc123.html',
      pathname: 'apps/my-app-abc123.html',
      contentType: 'text/html',
      contentDisposition: 'inline',
    })

    const result = await saveApp('my-app-abc123', '<html>hello</html>')

    expect(mockPut).toHaveBeenCalledWith(
      'apps/my-app-abc123.html',
      '<html>hello</html>',
      expect.objectContaining({ access: 'public', contentType: 'text/html' })
    )
    expect(result).toBe('https://blob.vercel-storage.com/apps/my-app-abc123.html')
  })
})

describe('findApp', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns html string when blob exists', async () => {
    mockList.mockResolvedValueOnce({
      blobs: [{
        url: 'https://blob.vercel-storage.com/apps/my-slug.html',
        downloadUrl: 'https://blob.vercel-storage.com/apps/my-slug.html',
        pathname: 'apps/my-slug.html',
        size: 100,
        uploadedAt: new Date(),
      }],
      cursor: undefined,
      hasMore: false,
    })

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<!DOCTYPE html><html>my app</html>'),
    } as unknown as Response)

    const html = await findApp('my-slug')
    expect(html).toBe('<!DOCTYPE html><html>my app</html>')
  })

  it('returns null when no blob found', async () => {
    mockList.mockResolvedValueOnce({
      blobs: [],
      cursor: undefined,
      hasMore: false,
    })

    const html = await findApp('missing-slug')
    expect(html).toBeNull()
  })

  it('returns null when fetch fails', async () => {
    mockList.mockResolvedValueOnce({
      blobs: [{
        url: 'https://blob.vercel-storage.com/apps/my-slug.html',
        downloadUrl: 'https://blob.vercel-storage.com/apps/my-slug.html',
        pathname: 'apps/my-slug.html',
        size: 100,
        uploadedAt: new Date(),
      }],
      cursor: undefined,
      hasMore: false,
    })

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve(''),
    } as unknown as Response)

    const html = await findApp('my-slug')
    expect(html).toBeNull()
  })
})
