import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public paths, static assets, and files with extensions (images etc.)
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.\w+$/.test(pathname) // any file with an extension (logo.png, .svg, etc.)
  ) {
    return NextResponse.next()
  }

  // Check for valid session cookie
  const session = request.cookies.get('vibe_session')?.value
  if (session === process.env.ACCESS_CODE) {
    return NextResponse.next()
  }

  // Redirect to login
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
