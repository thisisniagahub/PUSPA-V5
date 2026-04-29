import { NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    await requireAuth(request)
    const recentCases = await db.case.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        caseNumber: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    })

    const recentDonations = await db.donation.findMany({
      take: 5,
      orderBy: { donatedAt: 'desc' },
      select: {
        donationNumber: true,
        donorName: true,
        amount: true,
        fundType: true,
        donatedAt: true,
      },
    })

    const recentMembers = await db.member.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        memberNumber: true,
        name: true,
        status: true,
        createdAt: true,
      },
    })

    // Merge and sort all activities by date
    const activities = [
      ...recentCases.map(c => ({
        id: c.caseNumber,
        type: 'case',
        title: `Kes ${c.caseNumber}`,
        description: c.title,
        timestamp: c.updatedAt.toISOString(),
      })),
      ...recentDonations.map(d => ({
        id: d.donationNumber,
        type: 'donation',
        title: `Donasi ${d.donationNumber}`,
        description: `${d.donorName} — RM ${d.amount.toLocaleString()}`,
        timestamp: d.donatedAt.toISOString(),
      })),
      ...recentMembers.map(m => ({
        id: m.memberNumber,
        type: 'member',
        title: `Ahli ${m.memberNumber}`,
        description: m.name,
        timestamp: m.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 5)

    return NextResponse.json({ success: true, data: activities })
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
