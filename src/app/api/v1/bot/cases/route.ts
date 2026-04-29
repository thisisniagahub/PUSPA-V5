import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireBotAuth, botAuthErrorResponse } from '@/lib/bot-middleware'

export async function GET(request: NextRequest) {
  try {
    await requireBotAuth(request, 'cases')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          member: {
            select: { id: true, name: true, memberNumber: true, phone: true },
          },
          assignee: {
            select: { id: true, name: true },
          },
        },
      }),
      db.case.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        cases: cases.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          status: c.status,
          priority: c.priority,
          category: c.category,
          member: c.member,
          assignee: c.assignee,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + cases.length < total,
        },
      },
    })
  } catch (error: any) {
    console.error('[BOT_CASES]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
}