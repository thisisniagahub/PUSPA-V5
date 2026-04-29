import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { backfillDonorsFromDonations } from '@/lib/donor-sync'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    await backfillDonorsFromDonations(db)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)))

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { donorNumber: { contains: search, mode: 'insensitive' } },
        { ic: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const donors = await db.donor.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        donorNumber: true,
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: donors,
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }

    console.error('Error fetching donor options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donor options' },
      { status: 500 },
    )
  }
}
