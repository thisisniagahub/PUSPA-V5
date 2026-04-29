import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionToken, getDefaultRole, getOperatorPassword, SESSION_COOKIE_NAME } from '@/lib/puspa-auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const password = typeof body?.password === 'string' ? body.password : ''
  const operatorPassword = getOperatorPassword()

  if (!operatorPassword) {
    return NextResponse.json(
      { success: false, error: 'Konfigurasi auth belum lengkap pada server.' },
      { status: 500 },
    )
  }

  if (!password || password !== operatorPassword) {
    return NextResponse.json(
      { success: false, error: 'Kata laluan operator tidak sah.' },
      { status: 401 },
    )
  }

  const token = await createSessionToken(getDefaultRole())
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return NextResponse.json({
    success: true,
    data: {
      role: getDefaultRole(),
    },
  })
}
