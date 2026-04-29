import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { normalizeUserRole, type AppRole } from '@/lib/auth-shared'
import { requireRole } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer'])

    const body = await request.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const name = typeof body?.name === 'string' ? body.name : ''
    const role = typeof body?.role === 'string' ? (body.role as AppRole) : 'staff'

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Emel, kata laluan dan nama diperlukan' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Kata laluan mestilah sekurang-kurangnya 8 aksara' },
        { status: 400 },
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Emel sudah wujud' },
        { status: 400 },
      )
    }

    const hashedPassword = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: normalizeUserRole(user.role),
          supabaseId: user.supabaseId || user.id,
        },
      },
    })
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string }
    if (err.status === 401 || err.status === 403) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status },
      )
    }
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Ralat pelayan dalaman' },
      { status: 500 },
    )
  }
}
