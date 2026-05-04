import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — List cron jobs
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id

    const jobs = await db.hermesCronJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: jobs })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Create cron job (body: name, schedule, task, platform?, sessionId?, kind, tz)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const body = await request.json()

    const { name, schedule, task, platform, sessionId, kind, tz } = body

    if (!name || !schedule || !task) {
      return NextResponse.json(
        { success: false, error: 'name, schedule, and task are required' },
        { status: 400 },
      )
    }

    const job = await db.hermesCronJob.create({
      data: {
        userId,
        name,
        schedule,
        task,
        platform: platform || null,
        sessionId: sessionId || null,
        kind: kind || 'cron',
        tz: tz || 'Asia/Kuala_Lumpur',
        isEnabled: true,
      },
    })

    return NextResponse.json({ success: true, data: job })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
