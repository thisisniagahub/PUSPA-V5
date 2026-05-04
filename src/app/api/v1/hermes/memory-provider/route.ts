import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get current provider config
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    let provider = await db.hermesMemoryProvider.findUnique({
      where: { userId },
    })

    if (!provider) {
      // Return default config
      provider = await db.hermesMemoryProvider.create({
        data: {
          userId,
          provider: 'builtin',
          config: null,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...provider,
        config: provider.config ? JSON.parse(provider.config) : null,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// PUT — Set provider (body: { provider, config? })
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { provider: providerName, config } = body

    if (!providerName) {
      return NextResponse.json(
        { success: false, error: 'provider is required' },
        { status: 400 },
      )
    }

    const validProviders = [
      'builtin',
      'honcho',
      'mem0',
      'hindsight',
      'holographic',
      'retaindb',
      'byterover',
      'supermemory',
    ]

    if (!validProviders.includes(providerName)) {
      return NextResponse.json(
        { success: false, error: `provider must be one of: ${validProviders.join(', ')}` },
        { status: 400 },
      )
    }

    const provider = await db.hermesMemoryProvider.upsert({
      where: { userId },
      update: {
        provider: providerName,
        config: config ? JSON.stringify(config) : null,
        isActive: true,
      },
      create: {
        userId,
        provider: providerName,
        config: config ? JSON.stringify(config) : null,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...provider,
        config: provider.config ? JSON.parse(provider.config) : null,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Sync memories (body: { action: "sync" })
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    if (body.action !== 'sync') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "sync"' },
        { status: 400 },
      )
    }

    const provider = await db.hermesMemoryProvider.findUnique({
      where: { userId },
    })

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'No memory provider configured' },
        { status: 404 },
      )
    }

    // In production, this would trigger actual sync with external provider
    // For now, update the lastSyncAt timestamp
    const updated = await db.hermesMemoryProvider.update({
      where: { id: provider.id },
      data: { lastSyncAt: new Date() },
    })

    // Count current memories
    const memoryCount = await db.hermesMemory.count({
      where: { userId, isActive: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        synced: true,
        provider: updated.provider,
        memoriesSynced: memoryCount,
        syncedAt: updated.lastSyncAt,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
