import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { requireBotAuth, botAuthErrorResponse } from '@/lib/bot-middleware'
import { db } from '@/lib/db'
import { z } from 'zod'

const rpaRequestSchema = z.object({
  icNumber: z.string().min(1, 'icNumber is required'),
  memberName: z.string().optional(),
  actionType: z.string().min(1, 'actionType is required'),
  details: z.record(z.string(), z.unknown()).optional(),
  caseId: z.string().optional(),
  memberId: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
})

export async function POST(req: NextRequest) {
  try {
    await requireBotAuth(req, 'ops')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const body = await req.json()
    const parsed = rpaRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { icNumber, memberName, actionType, details, caseId, memberId, priority } = parsed.data

    // Create a WorkItem record to track this RPA request
    const workItem = await db.workItem.create({
      data: {
        title: `eCoss RPA: ${actionType} - ${memberName || icNumber}`,
        project: 'PUSPA',
        domain: 'ecoss-rpa',
        sourceChannel: 'bot-api',
        requestText: `RPA task for IC ${icNumber}${memberName ? ` (${memberName})` : ''}: ${actionType}`,
        intent: actionType,
        status: 'queued',
        priority,
        currentStep: 'submitted',
        nextAction: 'pending_processing',
        tags: JSON.stringify({ icNumber, actionType, memberName: memberName || null }),
        ...(caseId ? {} : {}),
      },
    })

    // Create an execution event to record the submission
    await db.executionEvent.create({
      data: {
        workItemId: workItem.id,
        type: 'rpa_submitted',
        summary: `RPA request submitted for IC: ${icNumber}`,
        detail: JSON.stringify({
          icNumber,
          memberName: memberName || null,
          actionType,
          details: details || null,
          caseId: caseId || null,
          memberId: memberId || null,
        }),
        status: 'success',
      },
    })

    // If a caseId is provided, link by storing in tags
    if (caseId || memberId) {
      await db.workItem.update({
        where: { id: workItem.id },
        data: {
          tags: JSON.stringify({
            icNumber,
            actionType,
            memberName: memberName || null,
            caseId: caseId || null,
            memberId: memberId || null,
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'RPA task submitted and queued for processing',
      data: {
        workItemId: workItem.id,
        workItemNumber: workItem.workItemNumber,
        status: workItem.status,
        priority: workItem.priority,
        submittedAt: workItem.createdAt.toISOString(),
        currentStep: workItem.currentStep,
        nextAction: workItem.nextAction,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'RPA Execution Failed'
    console.error('[OpenClaw RPA Error]', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve status of RPA work items
 */
export async function GET(req: NextRequest) {
  try {
    await requireBotAuth(req, 'ops')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const { searchParams } = new URL(req.url)
    const workItemId = searchParams.get('workItemId')
    const status = searchParams.get('status')

    if (workItemId) {
      // Return specific work item with its execution events
      const workItem = await db.workItem.findUnique({
        where: { id: workItemId },
        include: { executionEvents: { orderBy: { createdAt: 'desc' } } },
      })

      if (!workItem || workItem.domain !== 'ecoss-rpa') {
        return NextResponse.json(
          { success: false, error: 'RPA work item not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          workItemId: workItem.id,
          workItemNumber: workItem.workItemNumber,
          title: workItem.title,
          status: workItem.status,
          priority: workItem.priority,
          currentStep: workItem.currentStep,
          nextAction: workItem.nextAction,
          blockerReason: workItem.blockerReason,
          resolutionSummary: workItem.resolutionSummary,
          submittedAt: workItem.createdAt.toISOString(),
          startedAt: workItem.startedAt?.toISOString() || null,
          completedAt: workItem.completedAt?.toISOString() || null,
          events: workItem.executionEvents.map((e) => ({
            type: e.type,
            summary: e.summary,
            status: e.status,
            timestamp: e.createdAt.toISOString(),
          })),
        },
      })
    }

    // List RPA work items
    const where: Record<string, unknown> = { domain: 'ecoss-rpa' }
    if (status) where.status = status

    const workItems = await db.workItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        workItemNumber: true,
        title: true,
        status: true,
        priority: true,
        currentStep: true,
        createdAt: true,
        completedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: workItems.map((wi) => ({
        workItemId: wi.id,
        workItemNumber: wi.workItemNumber,
        title: wi.title,
        status: wi.status,
        priority: wi.priority,
        currentStep: wi.currentStep,
        submittedAt: wi.createdAt.toISOString(),
        completedAt: wi.completedAt?.toISOString() || null,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve RPA work items'
    console.error('[OpenClaw RPA Error]', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
