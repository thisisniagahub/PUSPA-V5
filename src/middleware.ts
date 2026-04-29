import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_API_PATHS = new Set([
  '/api/v1/auth/supabase/login',
  '/api/v1/auth/supabase/logout',
  '/api/v1/auth/supabase/me',
  '/api/v1/auth/supabase/signup',
  '/api/v1/auth/supabase/seed',
  '/api/v1/auth/login',
  '/api/v1/auth/me',
])

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public API paths - always allow
  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Bot API routes use API key auth, not session auth
  if (pathname.startsWith('/api/v1/bot/')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('puspa_session')?.value

  // If has session, allow through
  if (sessionCookie) {
    return NextResponse.next()
  }

  // Unauthenticated API access — return 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: 'Sesi tidak sah atau pengguna belum log masuk' },
      { status: 401 },
    )
  }

  // Static assets — just pass through
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)) {
    return NextResponse.next()
  }

  // Login page — allow access
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Unauthenticated page access — redirect to login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!api/auth|login|public|puspa-logo-official.png|puspa-logo-transparent.png|puspa-logo.png|_next/static|_next/image|favicon.ico).*)',
  ],
}
