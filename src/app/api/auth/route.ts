import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  const validCodes = (process.env.ACCESS_CODE || '').split(',').map(s => s.trim())
  if (!code || !validCodes.includes(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('vibe_session', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}
