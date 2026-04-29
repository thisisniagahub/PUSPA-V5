import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    await requireRole(_request, ['admin', 'developer']);
    const now = new Date();

    // Income by fund type
    const incomeByFundType = await db.donation.groupBy({
      by: ['fundType'],
      where: { status: { in: ['confirmed'] } },
      _sum: { amount: true },
      _count: true,
    });

    // Expenditure by programme — 'completed' is not a valid DisbursementStatus, use 'disbursed'
    const expenditures = await db.disbursement.findMany({
      where: { status: { in: ['approved', 'processing', 'disbursed'] } },
      include: {
        programme: { select: { id: true, name: true } },
      },
    });

    const expenditureByProgramme: Record<string, number> = {};
    for (const exp of expenditures) {
      const key = exp.programme?.name || 'Unassigned';
      expenditureByProgramme[key] = (expenditureByProgramme[key] || 0) + Number(exp.amount);
    }

    const expenditureByProgrammeArray = Object.entries(expenditureByProgramme).map(
      ([programme, amount]) => ({ programme, amount })
    );

    // Monthly trend (last 12 months)
    const monthlyTrend: { month: string; income: number; expenditure: number; net: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const [incomeResult, expenditureResult] = await Promise.all([
        db.donation.aggregate({
          where: {
            status: { in: ['confirmed'] },
            donatedAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        db.disbursement.aggregate({
          where: {
            status: { in: ['approved', 'processing', 'disbursed'] },
            processedDate: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
      ]);

      const income = Number(incomeResult._sum.amount || 0);
      const expenditure = Number(expenditureResult._sum.amount || 0);

      monthlyTrend.push({
        month: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        income,
        expenditure,
        net: income - expenditure,
      });
    }

    // Impact metrics
    const impactMetrics = await db.impactMetric.findMany({
      include: {
        programme: { select: { id: true, name: true } },
      },
    });

    const impactMetricsSummary = impactMetrics.map((metric) => ({
      id: metric.id,
      programme: metric.programme?.name || 'Unassigned',
      metricName: metric.metricName,
      description: metric.description,
      selfReportedValue: metric.selfReportedValue,
      verifiedValue: metric.verifiedValue,
      verificationSource: metric.verificationSource,
      period: metric.period,
    }));

    // Overall financial summary
    const [totalIncome, totalExpenditure] = await Promise.all([
      db.donation.aggregate({
        where: { status: { in: ['confirmed'] } },
        _sum: { amount: true },
        _count: true,
      }),
      db.disbursement.aggregate({
        where: { status: { in: ['approved', 'processing', 'disbursed'] } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Cases by status
    const casesByStatus = await db.case.groupBy({
      by: ['status'],
      _count: true,
    });

    // Members by status
    const membersByStatus = await db.member.groupBy({
      by: ['status'],
      _count: true,
    });

    // Programme budgets vs spent
    const programmeBudgets = await db.programme.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        budget: true,
        totalSpent: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome: Number(totalIncome._sum.amount || 0),
          totalExpenditure: Number(totalExpenditure._sum.amount || 0),
          netBalance: Number(totalIncome._sum.amount || 0) - Number(totalExpenditure._sum.amount || 0),
          totalDonations: totalIncome._count,
          totalDisbursements: totalExpenditure._count,
        },
        incomeByFundType: incomeByFundType.map((item) => ({
          fundType: item.fundType,
          amount: Number(item._sum.amount || 0),
          count: item._count,
        })),
        expenditureByProgramme: expenditureByProgrammeArray,
        monthlyTrend,
        impactMetrics: impactMetricsSummary,
        casesByStatus: casesByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        membersByStatus: membersByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        programmeBudgets,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'This endpoint only supports GET requests' },
    { status: 405 }
  );
}

export async function PUT(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'This endpoint only supports GET requests' },
    { status: 405 }
  );
}

export async function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'This endpoint only supports GET requests' },
    { status: 405 }
  );
}
