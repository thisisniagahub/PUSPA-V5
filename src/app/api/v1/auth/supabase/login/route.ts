import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/puspa-auth'
import { normalizeUserRole } from '@/lib/auth-shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Emel dan kata laluan diperlukan' },
        { status: 400 },
      )
    }

    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Emel atau kata laluan tidak sah' },
        { status: 401 },
      )
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Emel atau kata laluan tidak sah' },
        { status: 401 },
      )
    }

    // Create session token
    const role = normalizeUserRole(user.role)
    const token = await createSessionToken(role)

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          supabaseId: user.supabaseId || user.id,
        },
      },
    })

    // Set session cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Ralat pelayan dalaman' },
      { status: 500 },
    )
  }
}
