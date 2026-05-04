import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — Get job details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { jobId } = await params

    const job = await db.hermesCronJob.findFirst({
      where: { id: jobId, userId },
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Cron job not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// PATCH — Update job (enable/disable, schedule, task)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { jobId } = await params
    const body = await request.json()

    const job = await db.hermesCronJob.findFirst({
      where: { id: jobId, userId },
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Cron job not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    if (body.isEnabled !== undefined) {
      updateData.isEnabled = body.isEnabled
    }
    if (body.schedule !== undefined) {
      updateData.schedule = body.schedule
    }
    if (body.task !== undefined) {
      updateData.task = body.task
    }
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.tz !== undefined) {
      updateData.tz = body.tz
    }
    if (body.kind !== undefined) {
      updateData.kind = body.kind
    }
    if (body.platform !== undefined) {
      updateData.platform = body.platform
    }
    if (body.sessionId !== undefined) {
      updateData.sessionId = body.sessionId
    }

    const updated = await db.hermesCronJob.update({
      where: { id: jobId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// DELETE — Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { jobId } = await params

    const job = await db.hermesCronJob.findFirst({
      where: { id: jobId, userId },
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Cron job not found' }, { status: 404 })
    }

    await db.hermesCronJob.delete({
      where: { id: jobId },
    })

    return NextResponse.json({ success: true, data: { id: jobId, deleted: true } })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

// POST — Execute job now (body: { action: "execute" })
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await requireRole(request, ['admin', 'developer'])
    const userId = session.user.id
    const { jobId } = await params
    const body = await request.json()

    if (body.action !== 'execute') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "execute"' },
        { status: 400 },
      )
    }

    const job = await db.hermesCronJob.findFirst({
      where: { id: jobId, userId },
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Cron job not found' }, { status: 404 })
    }

    const now = new Date()

    // Update the job to record execution
    const updated = await db.hermesCronJob.update({
      where: { id: jobId },
      data: {
        lastRunAt: now,
        runCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        executedAt: now,
        message: `Job "${job.name}" executed manually`,
      },
    })
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
