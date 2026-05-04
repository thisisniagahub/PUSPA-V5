import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — List subagents (with filters: status, parentSessionId)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const url = new URL(request.url)

    const status = url.searchParams.get('status') || undefined
    const parentSessionId = url.searchParams.get('parentSessionId') || undefined

    const where: Record<string, any> = { userId }

    if (status) {
      where.status = status
    }
    if (parentSessionId) {
      where.parentSessionId = parentSessionId
    }

    const subagents = await db.hermesSubagent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: subagents })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Spawn new subagent (body: parentSessionId, task, model?, provider?)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { parentSessionId, task, model, provider } = body

    if (!parentSessionId || !task) {
      return NextResponse.json(
        { success: false, error: 'parentSessionId and task are required' },
        { status: 400 },
      )
    }

    // Verify the parent conversation exists and belongs to the user
    const conversation = await db.hermesConversation.findFirst({
      where: { id: parentSessionId, userId },
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Parent conversation not found' },
        { status: 404 },
      )
    }

    const subagent = await db.hermesSubagent.create({
      data: {
        parentSessionId,
        userId,
        task,
        model: model || null,
        provider: provider || null,
        status: 'running',
      },
    })

    return NextResponse.json({ success: true, data: subagent })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
