import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get user's SOUL.md config
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    let soulConfig = await db.hermesSoulConfig.findUnique({
      where: { userId },
    })

    if (!soulConfig) {
      // Create default soul config if it doesn't exist
      soulConfig = await db.hermesSoulConfig.create({
        data: {
          userId,
          content:
            '# PUSPA Hermes Personality\n\nAnda adalah Hermes, penasihat AI untuk PUSPA.',
          isActive: true,
        },
      })
    }

    return NextResponse.json({ success: true, data: soulConfig })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// PUT — Update SOUL.md content (body: { content })
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { content } = body

    if (content === undefined || content === null) {
      return NextResponse.json(
        { success: false, error: 'content is required' },
        { status: 400 },
      )
    }

    const soulConfig = await db.hermesSoulConfig.upsert({
      where: { userId },
      update: { content, isActive: true },
      create: { userId, content, isActive: true },
    })

    return NextResponse.json({ success: true, data: soulConfig })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
