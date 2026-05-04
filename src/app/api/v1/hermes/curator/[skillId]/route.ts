import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// POST — Pin/unpin/restore skill (body: { action: "pin" | "unpin" | "restore" })
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { skillId } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['pin', 'unpin', 'restore'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "pin", "unpin", or "restore"' },
        { status: 400 },
      )
    }

    const skill = await db.hermesSkill.findUnique({
      where: { id: skillId },
    })

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })
    }

    let updatedSkill

    switch (action) {
      case 'pin':
        updatedSkill = await db.hermesSkill.update({
          where: { id: skillId },
          data: { pinnedAt: new Date() },
        })
        break
      case 'unpin':
        updatedSkill = await db.hermesSkill.update({
          where: { id: skillId },
          data: { pinnedAt: null },
        })
        break
      case 'restore':
        updatedSkill = await db.hermesSkill.update({
          where: { id: skillId },
          data: { status: 'active', isActive: true, pinnedAt: null },
        })
        break
    }

    return NextResponse.json({ success: true, data: updatedSkill })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
