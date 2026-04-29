import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireBotAuth, botAuthErrorResponse } from '@/lib/bot-middleware'

export async function GET(request: NextRequest) {
  try {
    await requireBotAuth(request, 'donations')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const donorName = searchParams.get('donor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status
    if (donorName) where.donorName = { contains: donorName }

    const [donations, total, sum] = await Promise.all([
      db.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          donorName: true,
          donorEmail: true,
          donorPhone: true,
          amount: true,
          method: true,
          status: true,
          donationNumber: true,
          createdAt: true,
        },
      }),
      db.donation.count({ where }),
      db.donation.aggregate({ _sum: { amount: true }, where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        donations,
        summary: {
          totalCount: total,
          totalAmount: sum._sum.amount || 0,
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + donations.length < total,
        },
      },
    })
  } catch (error: any) {
    console.error('[BOT_DONATIONS]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}