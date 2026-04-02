import { put, head } from '@vercel/blob'

const token = process.env.BLOB_READ_WRITE_TOKEN

export async function saveApp(slug: string, html: string): Promise<string> {
  const blob = await put(`apps/${slug}.html`, html, {
    access: 'public',
    contentType: 'text/html',
    addRandomSuffix: false,
    token,
  })
  return blob.url
}

export async function findApp(slug: string): Promise<string | null> {
  try {
    const blob = await head(`apps/${slug}.html`, { token })
    // Fetch with Bearer auth — works for both public and private stores
    const response = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    return response.text()
  } catch {
    return null
  }
}
