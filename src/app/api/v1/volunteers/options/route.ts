import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)))

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { volunteerNumber: { contains: search, mode: 'insensitive' } },
        { ic: { contains: search, mode: 'insensitive' } },
      ]
    }

    const volunteers = await db.volunteer.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        volunteerNumber: true,
        status: true,
        totalHours: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: volunteers,
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }

    console.error('Error fetching volunteer options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volunteer options' },
      { status: 500 },
    )
  }
}
