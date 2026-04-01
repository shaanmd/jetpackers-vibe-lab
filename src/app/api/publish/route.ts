import { NextRequest, NextResponse } from 'next/server'
import { saveApp } from '@/lib/blob'
import { generateSlug } from '@/lib/slug'
import type { PublishRequest, PublishResponse } from '@/types'

export async function POST(request: NextRequest) {
  const body: PublishRequest = await request.json()

  if (!body.html?.trim()) {
    return NextResponse.json({ error: 'HTML is required' }, { status: 400 })
  }

  const slug = generateSlug(body.title)
  try {
    await saveApp(slug, body.html)
  } catch (err) {
    console.error('Blob save error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get('origin') ||
    'http://localhost:3000'

  const response: PublishResponse = {
    url: `${base}/view/${slug}`,
    slug,
  }

  return NextResponse.json(response)
}
