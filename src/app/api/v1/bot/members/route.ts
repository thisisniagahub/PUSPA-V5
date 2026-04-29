import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireBotAuth, botAuthErrorResponse } from '@/lib/bot-middleware'

export async function GET(request: NextRequest) {
  try {
    await requireBotAuth(request, 'members')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ic: { contains: search } },
        { phone: { contains: search } },
        { memberNumber: { contains: search } },
      ]
    }

    const [members, total] = await Promise.all([
      db.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          memberNumber: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          householdSize: true,
          monthlyIncome: true,
          createdAt: true,
        },
      }),
      db.member.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + members.length < total,
        },
      },
    })
  } catch (error: any) {
    console.error('[BOT_MEMBERS]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}