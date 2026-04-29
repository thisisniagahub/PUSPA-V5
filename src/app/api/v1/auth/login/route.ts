import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionToken, getDefaultRole, getOperatorPassword, SESSION_COOKIE_NAME } from '@/lib/puspa-auth'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limit: 5 attempts per minute per IP
  const rl = rateLimit(request, { limit: 5, windowMs: 60_000, keyPrefix: 'login-operator' })
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak percubaan log masuk. Sila cuba lagi dalam beberapa minit.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    )
  }

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

  const role = getDefaultRole()
  // Find an active user with the default operator role to use as session identity
  const operatorUser = await db.user.findFirst({ where: { role, isActive: true } })
  const userId = operatorUser?.id || 'operator'

  const token = await createSessionToken(role, userId)
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
