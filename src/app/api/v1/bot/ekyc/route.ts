import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireBotAuth, botAuthErrorResponse } from '@/lib/bot-middleware'

export async function GET(request: NextRequest) {
  try {
    await requireBotAuth(request, 'ekyc')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status

    const [verifications, total, pendingCount] = await Promise.all([
      db.eKYCVerification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              memberNumber: true,
              ic: true,
              phone: true,
            },
          },
        },
      }),
      db.eKYCVerification.count({ where }),
      db.eKYCVerification.count({ where: { status: 'pending' } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        verifications: verifications.map((v) => ({
          id: v.id,
          status: v.status,
          // Removed idType
          idNumber: v.member.ic,
          idImageFront: v.icFrontUrl,
          idImageBack: v.icBackUrl,
          selfieImage: v.selfieUrl,
          verifiedAt: v.verifiedAt,
          // removed rejectedAt
          rejectionReason: v.rejectionReason,
          member: v.member,
          createdAt: v.createdAt,
        })),
        summary: {
          total,
          pending: pendingCount,
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + verifications.length < total,
        },
      },
    })
  } catch (error: any) {
    console.error('[BOT_EKYC]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch eKYC verifications' },
      { status: 500 }
    )
  }
}