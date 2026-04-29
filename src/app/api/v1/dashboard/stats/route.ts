import { NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

const getMonthWindow = (offset = 0) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

const getTrendPercentage = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function GET(request: Request) {
  try {
    await requireAuth(request)
    const currentMonth = getMonthWindow()
    const previousMonth = getMonthWindow(-1)

    const [
      totalMembers,
      activeProgrammes,
      donations,
      activeVolunteers,
      complianceItems,
      totalCases,
      pendingCases,
      thisMonthDonations,
      previousMonthDonations,
      currentMonthMembers,
      previousMonthMembers,
      currentMonthProgrammes,
      previousMonthProgrammes,
      currentMonthVolunteers,
      previousMonthVolunteers,
      currentMonthComplianceCompleted,
      previousMonthComplianceCompleted,
    ] = await Promise.all([
      db.member.count(),
      db.programme.count({ where: { status: 'active' } }),
      db.donation.aggregate({ _sum: { amount: true }, where: { status: 'confirmed' } }),
      db.volunteer.count({ where: { status: 'active' } }),
      db.complianceChecklist.findMany(),
      db.case.count(),
      db.case.count({ where: { status: { in: ['draft', 'submitted', 'verifying', 'verified', 'scoring', 'scored', 'approved', 'disbursing'] } } }),
      db.donation.aggregate({
        _sum: { amount: true },
        where: {
          status: 'confirmed',
          donatedAt: {
            gte: currentMonth.start,
            lte: currentMonth.end,
          },
        },
      }),
      db.donation.aggregate({
        _sum: { amount: true },
        where: {
          status: 'confirmed',
          donatedAt: {
            gte: previousMonth.start,
            lte: previousMonth.end,
          },
        },
      }),
      db.member.count({
        where: {
          joinedAt: {
            gte: currentMonth.start,
            lte: currentMonth.end,
          },
        },
      }),
      db.member.count({
        where: {
          joinedAt: {
            gte: previousMonth.start,
            lte: previousMonth.end,
          },
        },
      }),
      db.programme.count({
        where: {
          createdAt: {
            gte: currentMonth.start,
            lte: currentMonth.end,
          },
        },
      }),
      db.programme.count({
        where: {
          createdAt: {
            gte: previousMonth.start,
            lte: previousMonth.end,
          },
        },
      }),
      db.volunteer.count({
        where: {
          createdAt: {
            gte: currentMonth.start,
            lte: currentMonth.end,
          },
        },
      }),
      db.volunteer.count({
        where: {
          createdAt: {
            gte: previousMonth.start,
            lte: previousMonth.end,
          },
        },
      }),
      db.complianceChecklist.count({
        where: {
          isCompleted: true,
          completedAt: {
            gte: currentMonth.start,
            lte: currentMonth.end,
          },
        },
      }),
      db.complianceChecklist.count({
        where: {
          isCompleted: true,
          completedAt: {
            gte: previousMonth.start,
            lte: previousMonth.end,
          },
        },
      }),
    ])

    const completedCompliance = complianceItems.filter(i => i.isCompleted).length
    const complianceScore = complianceItems.length > 0
      ? Math.round((completedCompliance / complianceItems.length) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalMembers,
        activeProgrammes,
        totalDonations: Number(donations._sum.amount || 0),
        activeVolunteers,
        complianceScore,
        totalCases,
        pendingCases,
        thisMonthDonations: Number(thisMonthDonations._sum.amount || 0),
        trendMembers: getTrendPercentage(currentMonthMembers, previousMonthMembers),
        trendProgrammes: getTrendPercentage(currentMonthProgrammes, previousMonthProgrammes),
        trendDonations: getTrendPercentage(
          Number(thisMonthDonations._sum.amount || 0),
          Number(previousMonthDonations._sum.amount || 0),
        ),
        trendVolunteers: getTrendPercentage(currentMonthVolunteers, previousMonthVolunteers),
        trendCompliance: getTrendPercentage(
          currentMonthComplianceCompleted,
          previousMonthComplianceCompleted,
        ),
      },
    })
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
