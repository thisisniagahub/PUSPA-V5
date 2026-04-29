import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { FundType } from '@prisma/client';

const querySchema = z.object({
  period: z.enum(['monthly', 'quarterly', 'yearly']).optional().default('yearly'),
  year: z.coerce.number().int().min(2000).max(2100).optional().default(() => new Date().getFullYear()),
  fundType: z.string().optional(),
});

function getDateRange(period: string, year: number) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function getQuarterDates(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

function getMonthDates(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer']);
    const searchParams = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      period: searchParams.get('period') || 'yearly',
      year: searchParams.get('year') || new Date().getFullYear(),
      fundType: searchParams.get('fundType') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { period, year, fundType } = parsed.data;
    const { start, end } = getDateRange(period, year);

    // Build donation where clause
    const donationWhere = {
      status: { in: ['confirmed' as const] },
      donatedAt: { gte: start, lte: end },
      ...(fundType ? { fundType: fundType as FundType } : {}),
    };

    // Build disbursement where clause — 'completed' is not a valid DisbursementStatus, use 'disbursed'
    const disbursementWhere = {
      status: { in: ['approved', 'processing', 'disbursed'] as import('@prisma/client').DisbursementStatus[] },
      processedDate: { gte: start, lte: end },
    };

    // ─── 1. Total Donations by FundType (ISF Segregation) ───
    const donationsByFundType = await db.donation.groupBy({
      by: ['fundType'],
      where: donationWhere,
      _sum: { amount: true },
      _count: true,
    });

    const isfBreakdown: Record<string, { amount: number; count: number }> = {
      zakat: { amount: 0, count: 0 },
      sadaqah: { amount: 0, count: 0 },
      waqf: { amount: 0, count: 0 },
      infaq: { amount: 0, count: 0 },
      donation_general: { amount: 0, count: 0 },
    };

    for (const item of donationsByFundType) {
      const key = item.fundType as string;
      if (key && isfBreakdown[key]) {
        isfBreakdown[key].amount = Number(item._sum.amount || 0);
        isfBreakdown[key].count = item._count;
      }
    }

    const totalDonations = Object.values(isfBreakdown).reduce((sum, v) => sum + v.amount, 0);

    // ─── 2. Total Disbursements by Status ───
    const disbursementsByStatus = await db.disbursement.groupBy({
      by: ['status'],
      where: disbursementWhere,
      _sum: { amount: true },
      _count: true,
    });

    const disbursementStatusMap: Record<string, { amount: number; count: number }> = {};
    for (const item of disbursementsByStatus) {
      disbursementStatusMap[item.status] = {
        amount: Number(item._sum?.amount || 0),
        count: item._count,
      };
    }

    const totalDisbursements = Object.values(disbursementStatusMap).reduce((sum, v) => sum + v.amount, 0);

    // ─── 3. Budget vs Actual per Programme ───
    const programmes = await db.programme.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        budget: true,
        totalSpent: true,
        targetBeneficiaries: true,
        actualBeneficiaries: true,
      },
    });

    const budgetVsActual = programmes.map((p) => {
      const utilization = Number(p.budget) > 0 ? Math.round((Number(p.totalSpent) / Number(p.budget)) * 100) : 0;
      return {
        programmeId: p.id,
        programmeName: p.name,
        category: p.category,
        status: p.status,
        budget: Number(p.budget),
        actual: Number(p.totalSpent),
        variance: Number(p.budget) - Number(p.totalSpent),
        utilization,
        targetBeneficiaries: p.targetBeneficiaries,
        actualBeneficiaries: p.actualBeneficiaries,
      };
    });

    // ─── 4. Income Statement Summary ───
    const [allDonations, allDisbursements] = await Promise.all([
      db.donation.aggregate({
        where: donationWhere,
        _sum: { amount: true },
        _count: true,
      }),
      db.disbursement.aggregate({
        where: disbursementWhere,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const grossIncome = Number(allDonations._sum?.amount || 0);
    const totalExpenses = Number(allDisbursements._sum?.amount || 0);
    const netIncome = grossIncome - totalExpenses;

    // ─── 5. Period-based breakdown ───
    let periodBreakdown: { label: string; income: number; expenditure: number; net: number }[] = [];

    if (period === 'monthly') {
      for (let m = 1; m <= 12; m++) {
        const { start: ms, end: me } = getMonthDates(year, m);
        const [inc, exp] = await Promise.all([
          db.donation.aggregate({
            where: {
              status: { in: ['confirmed' as const] },
              donatedAt: { gte: ms, lte: me },
              ...(fundType ? { fundType: fundType as FundType } : {}),
            },
            _sum: { amount: true },
          }),
          db.disbursement.aggregate({
            where: {
              status: { in: ['approved', 'processing', 'disbursed'] as import('@prisma/client').DisbursementStatus[] },
              processedDate: { gte: ms, lte: me },
            },
            _sum: { amount: true },
          }),
        ]);
        const monthNames = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
        periodBreakdown.push({
          label: monthNames[m - 1],
          income: Number(inc._sum?.amount || 0),
          expenditure: Number(exp._sum?.amount || 0),
          net: Number(inc._sum?.amount || 0) - Number(exp._sum?.amount || 0),
        });
      }
    } else if (period === 'quarterly') {
      const quarterNames = ['Suku 1', 'Suku 2', 'Suku 3', 'Suku 4'];
      for (let q = 1; q <= 4; q++) {
        const { start: qs, end: qe } = getQuarterDates(year, q);
        const [inc, exp] = await Promise.all([
          db.donation.aggregate({
            where: {
              status: { in: ['confirmed' as const] },
              donatedAt: { gte: qs, lte: qe },
              ...(fundType ? { fundType: fundType as FundType } : {}),
            },
            _sum: { amount: true },
          }),
          db.disbursement.aggregate({
            where: {
              status: { in: ['approved', 'processing', 'disbursed'] as import('@prisma/client').DisbursementStatus[] },
              processedDate: { gte: qs, lte: qe },
            },
            _sum: { amount: true },
          }),
        ]);
        periodBreakdown.push({
          label: quarterNames[q - 1],
          income: Number(inc._sum?.amount || 0),
          expenditure: Number(exp._sum?.amount || 0),
          net: Number(inc._sum?.amount || 0) - Number(exp._sum?.amount || 0),
        });
      }
    } else {
      // yearly — just one entry
      periodBreakdown.push({
        label: String(year),
        income: grossIncome,
        expenditure: totalExpenses,
        net: netIncome,
      });
    }

    // ─── 6. Zakat-specific breakdown ───
    const zakatByCategory = await db.donation.groupBy({
      by: ['zakatCategory'],
      where: {
        ...donationWhere,
        fundType: 'zakat',
      },
      _sum: { amount: true },
      _count: true,
    });

    const zakatBreakdown = zakatByCategory.map((item) => ({
      category: item.zakatCategory || 'Tidak Dikategorikan',
      amount: Number(item._sum.amount || 0),
      count: item._count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        year,
        totalDonations,
        totalDisbursements,
        netIncome,
        incomeStatement: {
          grossIncome,
          totalExpenses,
          netIncome,
          donationCount: allDonations._count,
          disbursementCount: allDisbursements._count,
        },
        isfBreakdown,
        disbursementsByStatus: disbursementStatusMap,
        budgetVsActual,
        periodBreakdown,
        zakatBreakdown,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching financial reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial reports' },
      { status: 500 }
    );
  }
}
