import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/puspa-auth'
import { db } from '@/lib/db'
import { normalizeUserRole } from '@/lib/auth-shared'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    const session = await verifySessionToken(token)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak sah' },
        { status: 401 },
      )
    }

    const user = await db.user.findUnique({
      where: {
        id: session.userId,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak dijumpai' },
        { status: 401 },
      )
    }

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
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json(
      { success: false, error: 'Ralat pelayan dalaman' },
      { status: 500 },
    )
  }
}
