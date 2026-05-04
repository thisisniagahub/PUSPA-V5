import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — List configured platforms
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    const platforms = await db.hermesPlatform.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Parse config JSON for each platform
    const platformsParsed = platforms.map((p) => ({
      ...p,
      config: p.config ? JSON.parse(p.config) : {},
    }))

    return NextResponse.json({ success: true, data: platformsParsed })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Add platform (body: platform, label?, config)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { platform, label, config } = body

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'platform is required' },
        { status: 400 },
      )
    }

    const validPlatforms = ['telegram', 'discord', 'slack', 'whatsapp', 'signal', 'matrix', 'web']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `platform must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 },
      )
    }

    // Check for duplicate platform
    const existing = await db.hermesPlatform.findUnique({
      where: { userId_platform: { userId, platform } },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Platform "${platform}" is already configured` },
        { status: 409 },
      )
    }

    const platformRecord = await db.hermesPlatform.create({
      data: {
        userId,
        platform,
        label: label || null,
        config: config ? JSON.stringify(config) : '{}',
        isEnabled: true,
        status: 'disconnected',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...platformRecord,
        config: JSON.parse(platformRecord.config),
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
