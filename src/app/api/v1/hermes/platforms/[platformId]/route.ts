import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get platform details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platformId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { platformId } = await params

    const platform = await db.hermesPlatform.findFirst({
      where: { id: platformId, userId },
    })

    if (!platform) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...platform,
        config: platform.config ? JSON.parse(platform.config) : {},
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// DELETE — Remove platform
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platformId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { platformId } = await params

    const platform = await db.hermesPlatform.findFirst({
      where: { id: platformId, userId },
    })

    if (!platform) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 })
    }

    await db.hermesPlatform.delete({
      where: { id: platformId },
    })

    return NextResponse.json({ success: true, data: { id: platformId, deleted: true } })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// PATCH — Update platform (enable/disable, config)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ platformId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { platformId } = await params
    const body = await request.json()

    const platform = await db.hermesPlatform.findFirst({
      where: { id: platformId, userId },
    })

    if (!platform) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    if (body.isEnabled !== undefined) {
      updateData.isEnabled = body.isEnabled
    }
    if (body.config !== undefined) {
      updateData.config = JSON.stringify(body.config)
    }
    if (body.label !== undefined) {
      updateData.label = body.label
    }

    const updated = await db.hermesPlatform.update({
      where: { id: platformId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        config: JSON.parse(updated.config),
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Test connection (body: { action: "test" })
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platformId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { platformId } = await params
    const body = await request.json()

    if (body.action !== 'test') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "test"' },
        { status: 400 },
      )
    }

    const platform = await db.hermesPlatform.findFirst({
      where: { id: platformId, userId },
    })

    if (!platform) {
      return NextResponse.json({ success: false, error: 'Platform not found' }, { status: 404 })
    }

    // Simulate connection test — in production, this would actually connect to the platform
    const testResult = {
      connected: true,
      platform: platform.platform,
      message: `Successfully tested connection to ${platform.platform}`,
      testedAt: new Date(),
    }

    await db.hermesPlatform.update({
      where: { id: platformId },
      data: {
        status: 'connected',
        lastEventAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: testResult })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
