import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get auxiliary model config
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    let config = await db.hermesAuxiliaryConfig.findUnique({
      where: { userId },
    })

    if (!config) {
      // Return default config
      config = await db.hermesAuxiliaryConfig.create({
        data: { userId },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        vision: config.vision ? JSON.parse(config.vision) : null,
        compression: config.compression ? JSON.parse(config.compression) : null,
        curator: config.curator ? JSON.parse(config.curator) : null,
        summarization: config.summarization ? JSON.parse(config.summarization) : null,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// PUT — Set task model (body: { task, provider, model })
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { task, provider, model } = body

    if (!task || !provider || !model) {
      return NextResponse.json(
        { success: false, error: 'task, provider, and model are required' },
        { status: 400 },
      )
    }

    const validTasks = ['vision', 'compression', 'curator', 'summarization']
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { success: false, error: `task must be one of: ${validTasks.join(', ')}` },
        { status: 400 },
      )
    }

    const modelConfig = JSON.stringify({ provider, model })

    // Get current config or create default
    let currentConfig = await db.hermesAuxiliaryConfig.findUnique({
      where: { userId },
    })

    if (!currentConfig) {
      currentConfig = await db.hermesAuxiliaryConfig.create({
        data: { userId, [task]: modelConfig },
      })
    } else {
      await db.hermesAuxiliaryConfig.update({
        where: { userId },
        data: { [task]: modelConfig },
      })
    }

    const updated = await db.hermesAuxiliaryConfig.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        vision: updated!.vision ? JSON.parse(updated!.vision) : null,
        compression: updated!.compression ? JSON.parse(updated!.compression) : null,
        curator: updated!.curator ? JSON.parse(updated!.curator) : null,
        summarization: updated!.summarization ? JSON.parse(updated!.summarization) : null,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
