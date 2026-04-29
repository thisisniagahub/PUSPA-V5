import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(_request);
    const now = new Date();

    // ─── 1. Organization Profile ───
    const orgProfile = await db.organizationProfile.findFirst({
      select: {
        legalName: true,
        registrationNumber: true,
        registrationType: true,
        foundedDate: true,
        lhdnApprovalRef: true,
        lhdnApprovalExpiry: true,
        isTaxExempt: true,
        rosCertificateUrl: true,
        constitutionUrl: true,
      },
    });

    // ─── 2. Board Members / Committee ───
    const boardMembers = await db.boardMember.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const currentMembers = boardMembers.filter((m) => m.isCurrent);
    const expiredMembers = boardMembers.filter((m) => !m.isCurrent);

    // Check term expiry — flag members whose endDate is within 90 days or already passed
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const membersNearExpiry = currentMembers.filter((m) => {
      if (!m.endDate) return false;
      return m.endDate <= ninetyDaysFromNow;
    });

    const membersExpired = currentMembers.filter((m) => {
      if (!m.endDate) return false;
      return m.endDate < now;
    });

    // ─── 3. ROS Checklist (category: governance, registration) ───
    const rosChecklist = await db.complianceChecklist.findMany({
      where: {
        category: { in: ['registration', 'governance'] },
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    const rosChecklistTotal = rosChecklist.length;
    const rosChecklistCompleted = rosChecklist.filter((i) => i.isCompleted).length;
    const rosChecklistPending = rosChecklistTotal - rosChecklistCompleted;
    const rosComplianceScore = rosChecklistTotal > 0
      ? Math.round((rosChecklistCompleted / rosChecklistTotal) * 100)
      : 0;

    // ─── 4. AGM Status ───
    // Derive from public reports of type "annual"
    const annualReports = await db.publicReport.findMany({
      where: { type: 'annual' },
      orderBy: { year: 'desc' },
      take: 5,
    });

    const lastAGMYear = annualReports.length > 0 ? annualReports[0].year : null;
    const currentYear = now.getFullYear().toString();
    // AGM is typically due within 6 months after financial year end
    const agmDueDate = new Date(parseInt(currentYear) + 1, 5, 30); // June 30 next year
    const agmOverdue = annualReports.length === 0 || (lastAGMYear && parseInt(lastAGMYear) < (parseInt(currentYear) - 1));
    const agmScheduled = annualReports.some((r) => r.year === currentYear && r.status === 'published');

    // ─── 5. Annual Return Filing Status ───
    // Check if ROS checklist has filing-related items
    const filingItems = rosChecklist.filter((item) =>
      item.item.toLowerCase().includes('borang') ||
      item.item.toLowerCase().includes('annual return') ||
      item.item.toLowerCase().includes('tahunan') ||
      item.item.toLowerCase().includes('fail')
    );

    const allFilingDone = filingItems.length > 0 && filingItems.every((i) => i.isCompleted);
    const hasPendingFilings = filingItems.some((i) => !i.isCompleted);

    // ─── 6. Key compliance dates ───
    const keyDates = {
      agmDueDate: agmDueDate.toISOString().split('T')[0],
      lastAGMYear,
      lhdnExpiry: orgProfile?.lhdnApprovalExpiry?.toISOString().split('T')[0] || null,
      lhdnExpired: orgProfile?.lhdnApprovalExpiry ? orgProfile.lhdnApprovalExpiry < now : false,
    };

    return NextResponse.json({
      success: true,
      data: {
        organization: orgProfile,
        agm: {
          lastHeldYear: lastAGMYear,
          dueDate: agmDueDate.toISOString().split('T')[0],
          overdue: agmOverdue,
          scheduled: agmScheduled,
        },
        committee: {
          current: currentMembers,
          expired: expiredMembers,
          totalCurrent: currentMembers.length,
          nearExpiry: membersNearExpiry,
          expiredTerms: membersExpired,
        },
        checklist: {
          items: rosChecklist,
          total: rosChecklistTotal,
          completed: rosChecklistCompleted,
          pending: rosChecklistPending,
          score: rosComplianceScore,
        },
        annualReturn: {
          filed: allFilingDone,
          hasPending: hasPendingFilings,
          filingItems: filingItems.map((f) => ({
            id: f.id,
            item: f.item,
            isCompleted: f.isCompleted,
            completedAt: f.completedAt,
          })),
        },
        keyDates,
        overallScore: rosComplianceScore,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching ROS compliance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ROS compliance data' },
      { status: 500 }
    );
  }
}
