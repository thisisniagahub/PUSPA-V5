import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/puspa-auth'

export async function GET() {
  const cookieStore = await cookies()
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)

  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak sah.' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: {
      role: session.role,
      expiresAt: session.expiresAt,
    },
  })
}
