import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get subagent status + result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subagentId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { subagentId } = await params

    const subagent = await db.hermesSubagent.findFirst({
      where: { id: subagentId, userId },
    })

    if (!subagent) {
      return NextResponse.json({ success: false, error: 'Subagent not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: subagent })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// DELETE — Cancel subagent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subagentId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { subagentId } = await params

    const subagent = await db.hermesSubagent.findFirst({
      where: { id: subagentId, userId },
    })

    if (!subagent) {
      return NextResponse.json({ success: false, error: 'Subagent not found' }, { status: 404 })
    }

    if (subagent.status !== 'running') {
      return NextResponse.json(
        { success: false, error: `Cannot cancel subagent in "${subagent.status}" status` },
        { status: 400 },
      )
    }

    const now = new Date()
    const durationMs = now.getTime() - new Date(subagent.startedAt).getTime()

    const updated = await db.hermesSubagent.update({
      where: { id: subagentId },
      data: {
        status: 'cancelled',
        completedAt: now,
        durationMs,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
