import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(_request);
    const now = new Date();

    // ─── 1. Data Retention Summary ───
    // Count records across key entities for retention overview
    const [
      totalMembers,
      totalDonors,
      totalVolunteers,
      totalDonations,
      totalDisbursements,
      totalAuditLogs,
      totalSecurityLogs,
      totalDeviceBindings,
      totalCases,
      totalDocuments,
    ] = await Promise.all([
      db.member.count(),
      db.donor.count(),
      db.volunteer.count(),
      db.donation.count(),
      db.disbursement.count(),
      db.auditLog.count(),
      db.securityLog.count(),
      db.deviceBinding.count(),
      db.case.count(),
      db.document.count(),
    ]);

    const dataRetention = {
      personalData: {
        members: totalMembers,
        donors: totalDonors,
        volunteers: totalVolunteers,
        total: totalMembers + totalDonors + totalVolunteers,
      },
      transactionData: {
        donations: totalDonations,
        disbursements: totalDisbursements,
        cases: totalCases,
        total: totalDonations + totalDisbursements + totalCases,
      },
      systemData: {
        auditLogs: totalAuditLogs,
        securityLogs: totalSecurityLogs,
        deviceBindings: totalDeviceBindings,
        documents: totalDocuments,
        total: totalAuditLogs + totalSecurityLogs + totalDeviceBindings + totalDocuments,
      },
      totalRecords: totalMembers + totalDonors + totalVolunteers + totalDonations +
        totalDisbursements + totalAuditLogs + totalSecurityLogs + totalDeviceBindings +
        totalCases + totalDocuments,
    };

    // ─── 2. Consent Records ───
    // Check if privacy/compliance checklist items exist related to PDPA consent
    const pdpaChecklist = await db.complianceChecklist.findMany({
      where: {
        category: 'financial',
      },
      orderBy: { order: 'asc' },
    });

    // Members with data sharing flags (tax deductible = consent)
    const membersWithTaxConsent = await db.member.count({
      where: { NOT: [{ bankName: null }, { bankAccount: null }] },
    });

    // Donors with consent (isTaxDeductible flag)
    const donorsWithTaxConsent = await db.donation.count({
      where: { isTaxDeductible: true },
    });

    const donorsTotal = await db.donation.count();

    // Anonymous donations (no personal data retained)
    const anonymousDonations = await db.donation.count({
      where: { isAnonymous: true },
    });

    // ─── 3. Privacy Settings Overview ───
    // Organization privacy-related settings
    const orgProfile = await db.organizationProfile.findFirst({
      select: {
        legalName: true,
        email: true,
        phone: true,
        website: true,
      },
    });

    // Tax exemption status
    const lhdnInfo = await db.organizationProfile.findFirst({
      select: {
        lhdnApprovalRef: true,
        lhdnApprovalExpiry: true,
        isTaxExempt: true,
      },
    });

    // eKYC consent tracking
    const ekycVerified = await db.eKYCVerification.count({
      where: { status: 'verified' },
    });
    const ekycPending = await db.eKYCVerification.count({
      where: { status: 'pending' },
    });
    const ekycTotal = await db.eKYCVerification.count();

    // ─── 4. Data Access & Security ───
    const activeUsers = await db.user.count({
      where: { isActive: true },
    });

    const recentSecurityLogs = await db.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // ─── 5. PDPA Compliance Checklist ───
    // Build PDPA compliance items
    const pdpaItems = [
      {
        item: 'Dasar Privasi',
        description: 'Polisi privasi yang jelas dan dikemas kini untuk pemprosesan data peribadi',
        status: pdpaChecklist.some((c) => c.item.toLowerCase().includes('privasi') && c.isCompleted) ? 'completed' : 'pending',
      },
      {
        item: 'Persetujuan Penderma',
        description: 'Persetujuan penderma diperoleh sebelum memproses data peribadi',
        status: donorsWithTaxConsent > 0 ? 'completed' : 'pending',
      },
      {
        item: 'Keselamatan Data',
        description: 'Langkah keselamatan yang mencukupi untuk melindungi data peribadi',
        status: recentSecurityLogs.length > 0 ? 'completed' : 'pending',
      },
      {
        item: 'Hak Akses Data',
        description: 'Mekanisme untuk individu mengakses dan membetulkan data peribadi mereka',
        status: activeUsers > 0 ? 'completed' : 'pending',
      },
      {
        item: 'eKYC Persetujuan',
        description: 'Persetujuan jelas untuk pengesahan identiti digital',
        status: ekycVerified > 0 ? 'completed' : 'pending',
      },
      {
        item: 'Penyimpanan Data',
        description: 'Polisi pengekalan dan pemusnahan data yang sesuai',
        status: totalAuditLogs > 0 ? 'completed' : 'pending',
      },
      {
        item: 'Pemberitahuan Pelanggaran',
        description: 'Prosedur pemberitahuan pelanggaran data kepada pihak berkuasa dan individu yang terjejas',
        status: 'pending',
      },
      {
        item: 'Latihan Kakitangan',
        description: 'Latihan PDPA berkala untuk kakitangan yang memproses data peribadi',
        status: 'pending',
      },
    ];

    const pdpaCompleted = pdpaItems.filter((i) => i.status === 'completed').length;
    const pdpaTotal = pdpaItems.length;
    const pdpaScore = pdpaTotal > 0 ? Math.round((pdpaCompleted / pdpaTotal) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        dataRetention,
        consent: {
          membersWithBankData: membersWithTaxConsent,
          donorsWithTaxConsent,
          donorsTotal,
          anonymousDonations,
          ekycVerified,
          ekycPending,
          ekycTotal,
        },
        privacy: {
          organization: orgProfile,
          taxExempt: lhdnInfo?.isTaxExempt || false,
          lhdnRef: lhdnInfo?.lhdnApprovalRef || null,
          lhdnExpiry: lhdnInfo?.lhdnApprovalExpiry || null,
          lhdnExpired: lhdnInfo?.lhdnApprovalExpiry ? lhdnInfo.lhdnApprovalExpiry < now : false,
        },
        security: {
          activeUsers,
          recentSecurityEvents: recentSecurityLogs.map((log) => ({
            id: log.id,
            action: log.action,
            method: log.method,
            status: log.status,
            user: log.user ? { name: log.user.name, role: log.user.role } : null,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt,
          })),
        },
        checklist: {
          items: pdpaItems,
          completed: pdpaCompleted,
          total: pdpaTotal,
          score: pdpaScore,
        },
        overallScore: pdpaScore,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Error fetching PDPA compliance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PDPA compliance data' },
      { status: 500 }
    );
  }
}
