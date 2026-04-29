import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireBotAuth, botAuthErrorResponse } from '@/lib/bot-middleware'

export async function GET(request: NextRequest) {
  try {
    await requireBotAuth(request, 'dashboard')
  } catch (error) {
    return botAuthErrorResponse(error)
  }

  try {
    const [
      totalMembers,
      activeMembers,
      totalDonations,
      totalDisbursements,
      pendingCases,
      activeProgrammes,
    ] = await Promise.all([
      db.member.count(),
      db.member.count({ where: { status: 'active' } }),
      db.donation.aggregate({ _sum: { amount: true } }),
      db.disbursement.aggregate({ _sum: { amount: true } }),
      db.case.count({ where: { status: { in: ['draft', 'submitted', 'verifying'] } } }),
      db.programme.count({ where: { status: 'active' } }),
    ])

    // Monthly donations last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyDonations = await db.donation.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sixMonthsAgo } },
      _sum: { amount: true },
    })

    // Format monthly data
    const monthlyData: Record<string, number> = {}
    monthlyDonations.forEach((d) => {
      const month = d.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + Number(d._sum.amount || 0)
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalMembers,
          activeMembers,
          totalDonations: Number(totalDonations._sum.amount || 0),
          totalDisbursements: Number(totalDisbursements._sum.amount || 0),
          pendingCases,
          activeProgrammes,
        },
        monthlyDonations: monthlyData,
      },
    })
  } catch (error: any) {
    console.error('[BOT_DASHBOARD]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}