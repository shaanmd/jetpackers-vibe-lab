import { put, list } from '@vercel/blob'

export async function saveApp(slug: string, html: string): Promise<string> {
  const blob = await put(`apps/${slug}.html`, html, {
    access: 'public',
    contentType: 'text/html',
  })
  return blob.url
}

export async function findApp(slug: string): Promise<string | null> {
  const { blobs } = await list({ prefix: `apps/${slug}.html` })
  if (blobs.length === 0) return null
  const response = await fetch(blobs[0].url)
  if (!response.ok) return null
  return response.text()
}
