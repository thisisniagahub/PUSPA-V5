import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { unstable_cache } from 'next/cache';

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

const getCachedDashboardData = unstable_cache(
  async (session: { user: { id: string } }) => {
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }
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
      monthlyDonationTrend,
      memberCategoryBreakdown,
      recentActivities,
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
          donatedAt: { gte: currentMonth.start, lte: currentMonth.end },
        },
      }),
      db.donation.aggregate({
        _sum: { amount: true },
        where: {
          status: 'confirmed',
          donatedAt: { gte: previousMonth.start, lte: previousMonth.end },
        },
      }),
      db.member.count({
        where: { joinedAt: { gte: currentMonth.start, lte: currentMonth.end } },
      }),
      db.member.count({
        where: { joinedAt: { gte: previousMonth.start, lte: previousMonth.end } },
      }),
      db.programme.count({
        where: { createdAt: { gte: currentMonth.start, lte: currentMonth.end } },
      }),
      db.programme.count({
        where: { createdAt: { gte: previousMonth.start, lte: previousMonth.end } },
      }),
      db.volunteer.count({
        where: { createdAt: { gte: currentMonth.start, lte: currentMonth.end } },
      }),
      db.volunteer.count({
        where: { createdAt: { gte: previousMonth.start, lte: previousMonth.end } },
      }),
      db.complianceChecklist.count({
        where: {
          isCompleted: true,
          completedAt: { gte: currentMonth.start, lte: currentMonth.end },
        },
      }),
      db.complianceChecklist.count({
        where: {
          isCompleted: true,
          completedAt: { gte: previousMonth.start, lte: previousMonth.end },
        },
      }),
      buildMonthlyDonationTrend(),
      db.member.groupBy({ by: ['status'], _count: true }),
      db.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { programme: { select: { id: true, name: true } } },
      }),
    ])

    const completedCompliance = complianceItems.filter((i: any) => i.isCompleted).length
    const complianceScore = complianceItems.length > 0
      ? Math.round((completedCompliance / complianceItems.length) * 100)
      : 0

    return {
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
      monthlyDonationTrend,
      memberCategoryBreakdown: memberCategoryBreakdown.map((item: any) => ({
        status: item.status,
        count: item._count,
      })),
      recentActivities,
    };
  },
  ['dashboard-data'],
  { tags: ['dashboard'], revalidate: 3600 }
);

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(_request);
    
    const data = await getCachedDashboardData({ user: { id: 'dashboard' } });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function buildMonthlyDonationTrend() {
  const monthsStr = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const currentYear = new Date().getFullYear();

  const donations = await db.donation.findMany({
    where: {
      status: 'confirmed',
      donatedAt: {
        gte: new Date(currentYear, 0, 1),
        lte: new Date(currentYear, 11, 31),
      },
    },
    select: {
      amount: true,
      fundType: true,
      donatedAt: true,
    },
  });

  return monthsStr.map((month, index) => {
    const monthDonations = donations.filter((donation: any) => {
      const donationDate = new Date(donation.donatedAt);
      return donationDate.getMonth() === index;
    });

    return {
      month,
      bulan: month,
      zakat: monthDonations.filter((x: any) => x.fundType === 'zakat').reduce((sum: number, x: any) => sum + Number(x.amount), 0),
      sadaqah: monthDonations.filter((x: any) => x.fundType === 'sadaqah').reduce((sum: number, x: any) => sum + Number(x.amount), 0),
      waqf: monthDonations.filter((x: any) => x.fundType === 'waqf').reduce((sum: number, x: any) => sum + Number(x.amount), 0),
      infaq: monthDonations.filter((x: any) => x.fundType === 'infaq').reduce((sum: number, x: any) => sum + Number(x.amount), 0),
      general: monthDonations.filter((x: any) => x.fundType === 'donation_general').reduce((sum: number, x: any) => sum + Number(x.amount), 0),
    };
  });
}
