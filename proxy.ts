import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Fast cookie check only; each page and API route re-verifies the owner server-side.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/sign-in', request.url))
}

export const config = {
  matcher: ['/onboarding/:path*', '/api/chat/:path*'],
}
