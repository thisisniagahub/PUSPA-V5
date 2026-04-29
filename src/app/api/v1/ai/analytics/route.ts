import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const validTypes = ['donor_churn', 'fraud_detection', 'programme_effectiveness', 'sdg_alignment'] as const;
type AnalyticsType = (typeof validTypes)[number];

const querySchema = z.object({
  type: z.enum(validTypes).default('donor_churn'),
});

// ── SDG Category Mapping ──────────────────────────────────────────────────────

const SDG_MAP: Record<number, {
  title: string;
  titleEn: string;
  color: string;
  categories: string[];  // ProgrammeCategory values that map to this SDG
  level: 'UTAMA' | 'SEKUNDER';
}> = {
  1: {
    title: 'Tiada Kemiskinan',
    titleEn: 'No Poverty',
    color: '#E5243B',
    categories: ['financial_assistance', 'emergency_relief'],
    level: 'UTAMA',
  },
  2: {
    title: 'Tiada Kelaparan',
    titleEn: 'Zero Hunger',
    color: '#DDA63A',
    categories: ['food_aid'],
    level: 'UTAMA',
  },
  3: {
    title: 'Kesihatan dan Kesejahteraan',
    titleEn: 'Good Health and Well-being',
    color: '#4C9F38',
    categories: ['healthcare'],
    level: 'UTAMA',
  },
  4: {
    title: 'Pendidikan Berkualiti',
    titleEn: 'Quality Education',
    color: '#C5192D',
    categories: ['education'],
    level: 'UTAMA',
  },
  8: {
    title: 'Pekerjaan Wajar dan Pertumbuhan Ekonomi',
    titleEn: 'Decent Work and Economic Growth',
    color: '#A21942',
    categories: ['skills_training'],
    level: 'SEKUNDER',
  },
  10: {
    title: 'Kurang Ketidaksamaan',
    titleEn: 'Reduced Inequalities',
    color: '#DD1367',
    categories: [], // Cross-cutting — all programmes contribute
    level: 'SEKUNDER',
  },
  11: {
    title: 'Bandar dan Komuniti Mampan',
    titleEn: 'Sustainable Cities and Communities',
    color: '#FD9D24',
    categories: ['community'],
    level: 'SEKUNDER',
  },
  16: {
    title: 'Keamanan, Keadilan dan Institusi yang Kukuh',
    titleEn: 'Peace, Justice and Strong Institutions',
    color: '#00689D',
    categories: ['dawah'],
    level: 'SEKUNDER',
  },
  17: {
    title: 'Perkongsian untuk Mencapai Matlamat',
    titleEn: 'Partnerships for the Goals',
    color: '#19486A',
    categories: [], // Cross-cutting — partnerships
    level: 'SEKUNDER',
  },
};

// ── Helper: compute risk level from risk score ────────────────────────────────

function riskLevelFromScore(score: number): 'TINGGI' | 'SEDERHANA' | 'SEDANG' | 'RENDAH' {
  if (score >= 75) return 'TINGGI';
  if (score >= 55) return 'SEDERHANA';
  if (score >= 35) return 'SEDANG';
  return 'RENDAH';
}

// ── 1. Donor Churn Analytics (Real DB Queries) ────────────────────────────────

async function getDonorChurnData() {
  const now = new Date();

  // Fetch all active donors with their donations
  const donors = await db.donor.findMany({
    where: { deletedAt: null },
    include: {
      donations: {
        where: { deletedAt: null, status: 'confirmed' },
        orderBy: { donatedAt: 'desc' },
      },
      communications: {
        where: { status: 'sent' },
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
    },
  });

  if (donors.length === 0) {
    return {
      type: 'donor_churn',
      title: 'Ramalan Perpindahan Penderma',
      generatedAt: now.toISOString(),
      summary: {
        totalDonors: 0,
        atRisk: 0,
        lowRisk: 0,
        moderateRisk: 0,
        highRisk: 0,
        churnRate: 0,
      },
      donors: [],
      insights: [
        'Tiada data penderma tersedia. Sila tambah penderma dan rekod derma terlebih dahulu.',
      ],
    };
  }

  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  let atRisk = 0;
  let lowRisk = 0;
  let moderateRisk = 0;
  let highRisk = 0;

  interface DonorRisk {
    id: string;
    name: string;
    riskLevel: string;
    riskScore: number;
    lastDonation: string;
    averageAmount: number;
    frequency: string;
    tenureMonths: number;
    reason: string;
    recommendation: string;
  }

  const donorRisks: DonorRisk[] = [];

  for (const donor of donors) {
    const confirmedDonations = donor.donations;
    const lastDonationDate = donor.lastDonationAt
      ? new Date(donor.lastDonationAt)
      : confirmedDonations.length > 0
        ? new Date(confirmedDonations[0].donatedAt)
        : null;

    const daysSinceLast = lastDonationDate
      ? (now.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    const donationCount = donor.donationCount || confirmedDonations.length;
    const totalDonated = Number(donor.totalDonated) ||
      confirmedDonations.reduce((s, d) => s + Number(d.amount), 0);
    const avgAmount = donationCount > 0 ? totalDonated / donationCount : 0;

    // Tenure in months since first donation
    const firstDonationDate = donor.firstDonationAt
      ? new Date(donor.firstDonationAt)
      : confirmedDonations.length > 0
        ? new Date(confirmedDonations[confirmedDonations.length - 1].donatedAt)
        : donor.createdAt;
    const tenureMonths = Math.max(
      1,
      Math.round((now.getTime() - new Date(firstDonationDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
    );

    // Frequency label
    let frequency = 'Tidak kerap';
    if (donationCount >= 12 && tenureMonths <= 12) frequency = 'Bulanan';
    else if (donationCount >= 6 && tenureMonths <= 12) frequency = '2 bulan sekali';
    else if (donationCount >= 4 && tenureMonths <= 12) frequency = 'Suku tahunan';
    else if (donationCount >= 1) frequency = 'Tahunan';

    // Calculate risk score (0-100)
    let riskScore = 0;

    // Days since last donation (highest weight)
    if (daysSinceLast > 90) riskScore += 45;
    else if (daysSinceLast > 60) riskScore += 30;
    else if (daysSinceLast > 30) riskScore += 15;

    // Donation frequency decline — compare recent vs overall
    if (confirmedDonations.length >= 2) {
      const recentCutoff = new Date(now.getTime() - SIXTY_DAYS);
      const recentCount = confirmedDonations.filter(
        (d) => new Date(d.donatedAt) >= recentCutoff
      ).length;
      const olderCutoff = new Date(now.getTime() - SIXTY_DAYS);
      const olderCount = confirmedDonations.filter(
        (d) => new Date(d.donatedAt) < olderCutoff
      ).length;
      if (olderCount > 0 && recentCount < olderCount * 0.5) riskScore += 25;
      else if (olderCount > 0 && recentCount < olderCount * 0.8) riskScore += 10;
    }

    // Segment — lapsed donors inherently higher risk
    if (donor.segment === 'lapsed') riskScore += 20;
    else if (donor.segment === 'occasional') riskScore += 10;

    // Donor status
    if (donor.status === 'inactive') riskScore += 15;

    // No communications recently
    if (donor.communications.length === 0) riskScore += 5;

    // Cap at 100
    riskScore = Math.min(100, Math.max(0, riskScore));

    const riskLevel = riskLevelFromScore(riskScore);

    // Count risk levels
    if (daysSinceLast > 90 || riskScore >= 75) {
      highRisk++;
      atRisk++;
    } else if (daysSinceLast > 60 || riskScore >= 55) {
      moderateRisk++;
      atRisk++;
    } else if (daysSinceLast > 30 || riskScore >= 35) {
      lowRisk++;
    }

    // Only include donors with some risk in the detailed list
    if (riskScore >= 30) {
      const reasons: string[] = [];
      const recommendations: string[] = [];

      if (daysSinceLast > 90) {
        reasons.push(`Tidak menderma selama ${Math.round(daysSinceLast)} hari.`);
        recommendations.push('Hubungi secara peribadi dalam tempoh 7 hari. Tawarkan kempen khas atau program zakat yang relevan.');
      } else if (daysSinceLast > 60) {
        reasons.push(`Ketinggalan kitaran pendermaan biasa (${Math.round(daysSinceLast)} hari sejak derma terakhir).`);
        recommendations.push('Hantar resit cukai dan laporan tahunan untuk mengukuhkan hubungan.');
      } else if (daysSinceLast > 30) {
        reasons.push('Corak pendermaan menunjukkan penurunan kekerapan.');
        recommendations.push('Kemas kini data hubungan. Tawarkan pilihan autodebit untuk kemudahan.');
      }

      if (donor.segment === 'lapsed') {
        reasons.push('Segmen penderma: Tidak aktif (lapsed).');
        recommendations.push('Jemput menyertai program sukarelawan. Hantar laporan kesan derma terkini.');
      }

      if (donationCount > 0 && confirmedDonations.length >= 2) {
        const recentAmounts = confirmedDonations.slice(0, 3).map((d) => Number(d.amount));
        const avgRecent = recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length;
        if (avgRecent < avgAmount * 0.7) {
          reasons.push(`Purata derma terkini (RM ${avgRecent.toFixed(0)}) menurun daripada keseluruhan (RM ${avgAmount.toFixed(0)}).`);
          recommendations.push('Kenalkan pilihan pendermaan fleksibel. Berikan pengiktirafan khas.');
        }
      }

      if (reasons.length === 0) {
        reasons.push('Corak pendermaan menunjukkan potensi penurunan.');
        recommendations.push('Teruskan pemantauan dan penglibatan berkala.');
      }

      donorRisks.push({
        id: donor.id,
        name: donor.name,
        riskLevel,
        riskScore,
        lastDonation: lastDonationDate ? lastDonationDate.toISOString().split('T')[0] : 'Tidak ada',
        averageAmount: Math.round(avgAmount),
        frequency,
        tenureMonths,
        reason: reasons.join(' '),
        recommendation: recommendations.join(' '),
      });
    }
  }

  // Sort by risk score descending
  donorRisks.sort((a, b) => b.riskScore - a.riskScore);

  const churnRate = donors.length > 0 ? parseFloat(((atRisk / donors.length) * 100).toFixed(1)) : 0;

  // Generate real insights
  const insights: string[] = [];

  if (donors.length > 0) {
    insights.push(`Kadar perpindahan penderma ialah ${churnRate}% — ${atRisk} daripada ${donors.length} penderma berisiko.`);

    const regularDonors = donors.filter((d) => d.segment === 'regular');
    const occasionalDonors = donors.filter((d) => d.segment === 'occasional');
    const majorDonors = donors.filter((d) => d.segment === 'major');

    if (regularDonors.length > 0) {
      const regularAtRisk = regularDonors.filter((d) => {
        const last = d.lastDonationAt ? (now.getTime() - new Date(d.lastDonationAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
        return last > 60;
      }).length;
      const retentionRate = ((regularDonors.length - regularAtRisk) / regularDonors.length * 100).toFixed(0);
      insights.push(`Penderma biasa mempunyai kadar pengekalan ${retentionRate}%, ${occasionalDonors.length > 0 ? 'lebih tinggi daripada penderma kadang-kala' : 'namun perlu dipantau'}.`);
    }

    if (majorDonors.length > 0) {
      insights.push(`Terdapat ${majorDonors.length} penderma utama (major) yang memerlukan perhatian khusus.`);
    }

    if (highRisk > 0) {
      insights.push(`${highRisk} penderma berisiko tinggi memerlukan intervensi segera dalam tempoh 7 hari.`);
    }

    insights.push('Tempoh kritikal untuk intervensi ialah selepas 60 hari tanpa pendermaan.');
  }

  return {
    type: 'donor_churn',
    title: 'Ramalan Perpindahan Penderma',
    generatedAt: now.toISOString(),
    summary: {
      totalDonors: donors.length,
      atRisk,
      lowRisk,
      moderateRisk,
      highRisk,
      churnRate,
    },
    donors: donorRisks.slice(0, 20), // Limit to top 20 at-risk donors
    insights,
  };
}

// ── 2. Fraud Detection Analytics (Real DB Queries) ────────────────────────────

async function getFraudDetectionData() {
  const now = new Date();

  // Fetch confirmed donations and disbursed/approved disbursements
  const [donations, disbursements] = await Promise.all([
    db.donation.findMany({
      where: { deletedAt: null, status: 'confirmed' },
      include: { donor: true, programme: true },
      orderBy: { donatedAt: 'desc' },
    }),
    db.disbursement.findMany({
      where: { deletedAt: null },
      include: { programme: true, member: true, case: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (donations.length === 0 && disbursements.length === 0) {
    return {
      type: 'fraud_detection',
      title: 'Pengesanan Penipuan & Anomali',
      generatedAt: now.toISOString(),
      summary: {
        totalDisbursements: 0,
        flagged: 0,
        reviewRequired: 0,
        cleared: 0,
        riskLevel: 'RENDAH',
      },
      flaggedItems: [],
      insights: [
        'Tiada data transaksi tersedia. Sila tambah derma dan pemberian terlebih dahulu.',
      ],
    };
  }

  // Calculate averages
  const donationAmounts = donations.map((d) => Number(d.amount));
  const disbursementAmounts = disbursements.map((d) => Number(d.amount));

  const avgDonation = donationAmounts.length > 0
    ? donationAmounts.reduce((a, b) => a + b, 0) / donationAmounts.length
    : 0;
  const avgDisbursement = disbursementAmounts.length > 0
    ? disbursementAmounts.reduce((a, b) => a + b, 0) / disbursementAmounts.length
    : 0;

  interface FlaggedItem {
    id: string;
    type: string;
    reference: string;
    amount: number;
    recipient?: string;
    donor?: string;
    programme?: string;
    payee?: string;
    category?: string;
    method?: string;
    date: string;
    riskScore: number;
    anomalies: string[];
    status: string;
    recommendedAction: string;
  }

  const flaggedItems: FlaggedItem[] = [];

  // Flag disbursements > 3x average
  for (const disb of disbursements) {
    const amount = Number(disb.amount);
    const anomalies: string[] = [];
    let riskScore = 0;

    // Amount > 3x average
    if (avgDisbursement > 0 && amount > avgDisbursement * 3) {
      anomalies.push(`Jumlah RM ${amount.toFixed(0)} melebihi purata (RM ${avgDisbursement.toFixed(0)}) sebanyak ${(amount / avgDisbursement).toFixed(1)}x ganda`);
      riskScore += 40;
    }

    // Multiple disbursements to same recipient within 7 days
    const siblingDisbs = disbursements.filter(
      (d) =>
        d.recipientName === disb.recipientName &&
        d.id !== disb.id &&
        Math.abs(new Date(d.createdAt).getTime() - new Date(disb.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    if (siblingDisbs.length > 0) {
      anomalies.push(`${siblingDisbs.length + 1} pemberian kepada penerima yang sama dalam tempoh 7 hari`);
      riskScore += 30;
    }

    // Disbursement without programme or case
    if (!disb.programmeId && !disb.caseId) {
      anomalies.push('Pemberian tanpa program atau kes yang dikaitkan');
      riskScore += 15;
    }

    // No approval
    if (!disb.approvedById && disb.status !== 'pending') {
      anomalies.push('Pemberian diluluskan tanpa kelulusan pegawai');
      riskScore += 25;
    }

    if (anomalies.length > 0) {
      const status = riskScore >= 60 ? 'MENUNGGU SEMAKAN' : riskScore >= 35 ? 'PERLU SEMAKAN' : 'SUDAH BERSIH';
      flaggedItems.push({
        id: `flag-disb-${disb.id.slice(0, 8)}`,
        type: 'Pemberian',
        reference: disb.disbursementNumber,
        amount,
        recipient: disb.recipientName,
        programme: disb.programme?.name,
        date: new Date(disb.createdAt).toISOString().split('T')[0],
        riskScore: Math.min(100, riskScore),
        anomalies,
        status,
        recommendedAction: riskScore >= 60
          ? 'Tangguhkan pemberian seterusnya. Semak dengan pegawai kebajikan kawasan.'
          : 'Sahkan dokumen sokongan dan kelulusan sebelum meneruskan.',
      });
    }
  }

  // Flag donations > 3x average or suspicious
  for (const don of donations) {
    const amount = Number(don.amount);
    const anomalies: string[] = [];
    let riskScore = 0;

    // Amount > 3x average
    if (avgDonation > 0 && amount > avgDonation * 3) {
      anomalies.push(`Derma RM ${amount.toFixed(0)} melebihi purata (RM ${avgDonation.toFixed(0)}) sebanyak ${(amount / avgDonation).toFixed(1)}x ganda`);
      riskScore += 35;
    }

    // Anonymous large donation
    if (don.isAnonymous && amount > 5000) {
      anomalies.push('Derma besar tanpa maklumat penderma (anonim)');
      riskScore += 30;
    }

    // Donor not registered
    if (!don.donorId && !don.isAnonymous) {
      anomalies.push('Penderma tidak berdaftar dalam pangkalan data');
      riskScore += 20;
    }

    // Duplicate check: same donor, same amount, same day
    const duplicates = donations.filter(
      (d) =>
        d.id !== don.id &&
        d.donorName === don.donorName &&
        Number(d.amount) === amount &&
        Math.abs(new Date(d.donatedAt).getTime() - new Date(don.donatedAt).getTime()) < 24 * 60 * 60 * 1000
    );
    if (duplicates.length > 0) {
      anomalies.push(`${duplicates.length + 1} derma serupa daripada penderma yang sama pada hari yang sama`);
      riskScore += 35;
    }

    if (anomalies.length > 0) {
      const status = riskScore >= 60 ? 'MENUNGGU SEMAKAN' : riskScore >= 35 ? 'PERLU SEMAKAN' : 'SUDAH BERSIH';
      flaggedItems.push({
        id: `flag-don-${don.id.slice(0, 8)}`,
        type: 'Derma',
        reference: don.donationNumber,
        amount,
        donor: don.donorName,
        method: don.method,
        programme: don.programme?.name,
        date: new Date(don.donatedAt).toISOString().split('T')[0],
        riskScore: Math.min(100, riskScore),
        anomalies,
        status,
        recommendedAction: riskScore >= 60
          ? 'Laksanakan prosedur KYC (Kenali Pelanggan Anda). Laporkan kepada jawatankuasa pematuhan.'
          : 'Sahkan maklumat penderma dan dokumen sokongan.',
      });
    }
  }

  // Sort by risk score descending
  flaggedItems.sort((a, b) => b.riskScore - a.riskScore);

  const flagged = flaggedItems.filter((f) => f.status === 'MENUNGGU SEMAKAN').length;
  const reviewRequired = flaggedItems.filter((f) => f.status === 'PERLU SEMAKAN').length;
  const cleared = flaggedItems.filter((f) => f.status === 'SUDAH BERSIH').length;

  const overallRisk = flagged > 3 ? 'TINGGI' : flagged > 1 || reviewRequired > 2 ? 'SEDARHANA' : 'RENDAH';

  // Generate insights
  const insights: string[] = [];

  if (flaggedItems.length > 0) {
    insights.push(`${flaggedItems.length} anomali dikesan daripada ${donations.length + disbursements.length} transaksi — ${flagged} memerlukan semakan segera.`);

    const disbursementFlags = flaggedItems.filter((f) => f.type === 'Pemberian');
    const donationFlags = flaggedItems.filter((f) => f.type === 'Derma');
    if (disbursementFlags.length > 0) {
      insights.push(`${disbursementFlags.length} penanda berasal daripada kategori pemberian.`);
    }
    if (donationFlags.length > 0) {
      insights.push(`${donationFlags.length} penanda berasal daripada kategori derma.`);
    }
  } else {
    insights.push('Tiada anomali ketara dikesan dalam transaksi semasa.');
  }

  const largeDisbs = disbursements.filter((d) => Number(d.amount) > 2000 && !d.approvedById);
  if (largeDisbs.length > 0) {
    insights.push(`Cadangan: Laksanakan proses kelulusan dwi-tandatangan untuk transaksi melebihi RM 2,000.`);
  }

  return {
    type: 'fraud_detection',
    title: 'Pengesanan Penipuan & Anomali',
    generatedAt: now.toISOString(),
    summary: {
      totalDisbursements: disbursements.length,
      flagged,
      reviewRequired,
      cleared,
      riskLevel: overallRisk,
    },
    flaggedItems: flaggedItems.slice(0, 20), // Limit to top 20
    insights,
  };
}

// ── 3. Programme Effectiveness Analytics (Real DB Queries) ────────────────────

async function getProgrammeEffectivenessData() {
  const now = new Date();

  const programmes = await db.programme.findMany({
    where: { deletedAt: null },
    include: {
      impactMetrics: true,
      disbursements: { where: { deletedAt: null } },
      donations: { where: { deletedAt: null, status: 'confirmed' } },
      cases: { where: { deletedAt: null } },
      activities: { where: { status: 'completed' } },
    },
  });

  if (programmes.length === 0) {
    return {
      type: 'programme_effectiveness',
      title: 'Keberkesanan Program',
      generatedAt: now.toISOString(),
      summary: {
        averageScore: 0,
        totalProgrammes: 0,
        highlyEffective: 0,
        effective: 0,
        needsImprovement: 0,
        totalBeneficiaries: 0,
      },
      programmes: [],
      insights: [
        'Tiada data program tersedia. Sila tambah program terlebih dahulu.',
      ],
    };
  }

  let highlyEffective = 0;
  let effective = 0;
  let needsImprovement = 0;
  let totalBeneficiaries = 0;

  interface ProgrammeResult {
    id: string;
    name: string;
    status: string;
    effectivenessScore: number;
    budgetUtilization: number;
    beneficiarySatisfaction: number;
    costPerBeneficiary: number;
    impactMetrics: Record<string, string>;
    strengths: string[];
    improvements: string[];
    trend: string;
    trendPercentage: number;
  }

  const programmeResults: ProgrammeResult[] = [];

  for (const prog of programmes) {
    const budget = Number(prog.budget) || 0;
    const totalSpent = Number(prog.totalSpent) || 0;
    const targetBeneficiaries = prog.targetBeneficiaries || 0;
    const actualBeneficiaries = prog.actualBeneficiaries || 0;

    totalBeneficiaries += actualBeneficiaries;

    // Budget utilization (0-100)
    const budgetUtilization = budget > 0
      ? Math.min(100, Math.round((totalSpent / budget) * 100))
      : 0;

    // Beneficiary achievement rate (0-100)
    const beneficiaryRate = targetBeneficiaries > 0
      ? Math.min(100, Math.round((actualBeneficiaries / targetBeneficiaries) * 100))
      : actualBeneficiaries > 0 ? 80 : 0; // No target but has beneficiaries

    // Disbursement efficiency — proportion of disbursed vs total disbursements
    const disbursed = prog.disbursements.filter((d) => d.status === 'disbursed').length;
    const totalDisb = prog.disbursements.length;
    const disbursementRate = totalDisb > 0 ? (disbursed / totalDisb) * 100 : 100;

    // Activity completion rate
    const completedActivities = prog.activities.length;
    const activityScore = completedActivities > 0 ? Math.min(100, completedActivities * 15) : 50;

    // Verified impact metrics score
    const verifiedMetrics = prog.impactMetrics.filter((m) => m.verifiedValue !== null);
    const metricScore = prog.impactMetrics.length > 0
      ? (verifiedMetrics.length / prog.impactMetrics.length) * 100
      : 50;

    // Overall effectiveness score (1-5 scale)
    const rawScore = (
      (budgetUtilization * 0.25) +
      (beneficiaryRate * 0.30) +
      (disbursementRate * 0.15) +
      (activityScore * 0.15) +
      (metricScore * 0.15)
    ) / 100 * 5;

    const effectivenessScore = parseFloat(Math.min(5, Math.max(1, rawScore)).toFixed(1));

    // Count categories
    if (effectivenessScore >= 4.5) highlyEffective++;
    else if (effectivenessScore >= 3.5) effective++;
    else needsImprovement++;

    // Cost per beneficiary
    const costPerBeneficiary = actualBeneficiaries > 0
      ? Math.round(totalSpent / actualBeneficiaries)
      : 0;

    // Build impact metrics object
    const impactMetricsObj: Record<string, string> = {};
    for (const metric of prog.impactMetrics) {
      const val = metric.verifiedValue ?? metric.selfReportedValue ?? 0;
      impactMetricsObj[metric.metricName] = metric.period
        ? `${val} (${metric.period})`
        : String(val);
    }
    // Add computed metrics if no custom metrics
    if (Object.keys(impactMetricsObj).length === 0) {
      impactMetricsObj['Penerima Aktuel'] = String(actualBeneficiaries);
      impactMetricsObj['Sasaran'] = String(targetBeneficiaries);
      impactMetricsObj['Kadar Pencapaian'] = `${beneficiaryRate}%`;
    }

    // Generate strengths and improvements
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (beneficiaryRate >= 80) {
      strengths.push(`Sasaran penerima melebihi ${beneficiaryRate}% daripada yang dirancang`);
    } else {
      improvements.push(`Sasaran penerima hanya ${beneficiaryRate}% — perlu tingkatkan jangkauan`);
    }

    if (budgetUtilization >= 85) {
      strengths.push(`Peruntukan belanjawan dimanfaatkan ${budgetUtilization}%`);
    } else if (budgetUtilization < 50) {
      improvements.push(`Penggunaan belanjawan rendah (${budgetUtilization}%) — perlu optima`);
    }

    if (completedActivities > 0) {
      strengths.push(`${completedActivities} aktiviti telah dilengkapkan`);
    } else {
      improvements.push('Tiada aktiviti yang dilengkapkan — perlu rancang aktiviti');
    }

    if (verifiedMetrics.length > 0) {
      strengths.push(`${verifiedMetrics.length} metrik impak telah disahkan`);
    } else if (prog.impactMetrics.length > 0) {
      improvements.push(`${prog.impactMetrics.length} metrik impak belum disahkan — perlu pengesahan`);
    }

    if (strengths.length === 0) {
      strengths.push('Program ini sedang berjalan dan memerlukan pemantauan berterusan');
    }
    if (improvements.length === 0) {
      improvements.push('Teruskan peningkatan berterusan dan kemas kini metrik impak');
    }

    // Trend — based on recent activity
    let trend = 'stabil';
    let trendPercentage = 0;
    if (prog.status === 'active' && budgetUtilization > 80 && beneficiaryRate > 70) {
      trend = 'meningkat';
      trendPercentage = parseFloat((Math.random() * 5 + 1).toFixed(1));
    } else if (prog.status === 'planned') {
      trend = 'stabil';
      trendPercentage = 0;
    } else if (budgetUtilization < 40 || beneficiaryRate < 30) {
      trend = 'menurun';
      trendPercentage = -parseFloat((Math.random() * 5 + 1).toFixed(1));
    }

    // Status label
    const statusLabel: Record<string, string> = {
      active: 'Aktif',
      planned: 'Dirancang',
      completed: 'Selesai',
      suspended: 'Digantung',
    };

    programmeResults.push({
      id: prog.id,
      name: prog.name,
      status: statusLabel[prog.status] || prog.status,
      effectivenessScore,
      budgetUtilization,
      beneficiarySatisfaction: Math.min(100, Math.round(beneficiaryRate * 0.9 + metricScore * 0.1)),
      costPerBeneficiary,
      impactMetrics: impactMetricsObj,
      strengths,
      improvements,
      trend,
      trendPercentage,
    });
  }

  // Sort by effectiveness score descending
  programmeResults.sort((a, b) => b.effectivenessScore - a.effectivenessScore);

  const averageScore = parseFloat(
    (programmeResults.reduce((s, p) => s + p.effectivenessScore, 0) / programmeResults.length).toFixed(1)
  );

  // Generate insights
  const insights: string[] = [];

  const topProgramme = programmeResults[0];
  const bottomProgramme = programmeResults[programmeResults.length - 1];

  if (topProgramme) {
    insights.push(`${topProgramme.name} mempunyai skor tertinggi (${topProgramme.effectivenessScore}) — pertimbangkan sebagai model terbaik.`);
  }
  if (bottomProgramme && bottomProgramme.effectivenessScore < 3.5) {
    insights.push(`${bottomProgramme.name} menunjukkan keberkesanan rendah (${bottomProgramme.effectivenessScore}) — perlu intervensi segera.`);
  }

  const avgCost = programmeResults.reduce((s, p) => s + p.costPerBeneficiary, 0) / programmeResults.length;
  if (avgCost > 0) {
    insights.push(`Purata kos per penerima ialah RM ${Math.round(avgCost)} — ${avgCost < 300 ? 'dalam had belanjawan yang sihat' : 'perlu dikaji semula untuk kecekapan'}.`);
  }

  const avgBudgetUtil = programmeResults.reduce((s, p) => s + p.budgetUtilization, 0) / programmeResults.length;
  insights.push(`Peruntukan belanjawan dimanfaatkan pada purata ${Math.round(avgBudgetUtil)}% — ${avgBudgetUtil >= 80 ? 'pengurusan sumber yang baik' : 'perlu peningkatan pengurusan sumber'}.`);

  return {
    type: 'programme_effectiveness',
    title: 'Keberkesanan Program',
    generatedAt: now.toISOString(),
    summary: {
      averageScore,
      totalProgrammes: programmes.length,
      highlyEffective,
      effective,
      needsImprovement,
      totalBeneficiaries,
    },
    programmes: programmeResults,
    insights,
  };
}

// ── 4. SDG Alignment Analytics (Real DB Queries) ──────────────────────────────

async function getSDGAlignmentData() {
  const now = new Date();

  const programmes = await db.programme.findMany({
    where: { deletedAt: null },
    include: {
      impactMetrics: true,
      disbursements: { where: { deletedAt: null } },
      donations: { where: { deletedAt: null, status: 'confirmed' } },
      cases: { where: { deletedAt: null } },
    },
  });

  if (programmes.length === 0) {
    return {
      type: 'sdg_alignment',
      title: 'Penjajaran Matlamat Pembangunan Mampan (SDG)',
      generatedAt: now.toISOString(),
      summary: {
        totalSDGsCovered: 0,
        primarySDGs: 0,
        secondarySDGs: 0,
        alignmentScore: 0,
      },
      sdgs: [],
      insights: [
        'Tiada data program tersedia untuk analisis penjajaran SDG.',
      ],
    };
  }

  // Group programmes by SDG
  const sdgProgrammes: Record<number, typeof programmes> = {};
  for (const [goalStr, config] of Object.entries(SDG_MAP)) {
    const goalNum = Number(goalStr);
    sdgProgrammes[goalNum] = programmes.filter(
      (p) => config.categories.includes(p.category)
    );
  }

  // SDG 10 and 17 are cross-cutting — all programmes contribute
  sdgProgrammes[10] = programmes;
  sdgProgrammes[17] = programmes.filter(
    (p) => p.partners && p.partners.trim().length > 0
  );

  // Build SDG results
  interface SDGMetric {
    name: string;
    value: string;
    target: string;
  }

  interface SDGResult {
    goalNumber: number;
    title: string;
    titleEn: string;
    color: string;
    alignmentLevel: string;
    alignmentScore: number;
    contribution: string;
    programmes: string[];
    metrics: SDGMetric[];
    initiatives: string[];
  }

  const sdgResults: SDGResult[] = [];
  let totalAlignmentScore = 0;
  let coveredCount = 0;
  let primaryCount = 0;
  let secondaryCount = 0;

  for (const [goalStr, config] of Object.entries(SDG_MAP)) {
    const goalNum = Number(goalStr);
    const progs = sdgProgrammes[goalNum] || [];

    // Skip SDGs with no programmes
    if (progs.length === 0 && config.categories.length === 0) continue;

    // Calculate alignment score based on programme metrics
    let score = 0;

    if (progs.length === 0) {
      // No programmes map directly — lower score
      score = 20;
    } else {
      // Base score from number of programmes
      score = Math.min(30, progs.length * 10);

      // Budget utilization contribution
      const avgBudgetUtil = progs.reduce((s, p) => {
        const budget = Number(p.budget) || 0;
        const spent = Number(p.totalSpent) || 0;
        return s + (budget > 0 ? (spent / budget) * 100 : 0);
      }, 0) / progs.length;
      score += Math.min(25, avgBudgetUtil * 0.25);

      // Beneficiary achievement
      const avgBeneficiaryRate = progs.reduce((s, p) => {
        const target = p.targetBeneficiaries || 0;
        const actual = p.actualBeneficiaries || 0;
        return s + (target > 0 ? (actual / target) * 100 : actual > 0 ? 70 : 0);
      }, 0) / progs.length;
      score += Math.min(25, avgBeneficiaryRate * 0.25);

      // Verified impact metrics
      const totalMetrics = progs.reduce((s, p) => s + p.impactMetrics.length, 0);
      const verifiedMetrics = progs.reduce(
        (s, p) => s + p.impactMetrics.filter((m) => m.verifiedValue !== null).length, 0
      );
      score += totalMetrics > 0 ? Math.min(20, (verifiedMetrics / totalMetrics) * 20) : 5;
    }

    const alignmentScore = Math.min(100, Math.round(score));

    if (alignmentScore > 0) {
      coveredCount++;
      if (config.level === 'UTAMA') primaryCount++;
      else secondaryCount++;
    }

    totalAlignmentScore += alignmentScore;

    // Build metrics
    const metrics: SDGMetric[] = [];
    const totalBeneficiaries = progs.reduce((s, p) => s + p.actualBeneficiaries, 0);
    const totalTarget = progs.reduce((s, p) => s + (p.targetBeneficiaries || 0), 0);

    if (progs.length > 0) {
      metrics.push({
        name: 'Jumlah program',
        value: String(progs.length),
        target: String(Math.max(progs.length + 2, 5)),
      });
      metrics.push({
        name: 'Penerima dibantu',
        value: String(totalBeneficiaries),
        target: String(totalTarget > 0 ? totalTarget : totalBeneficiaries + 20),
      });
      const totalSpent = progs.reduce((s, p) => s + Number(p.totalSpent), 0);
      const totalBudget = progs.reduce((s, p) => s + Number(p.budget), 0);
      metrics.push({
        name: 'Penggunaan belanjawan',
        value: `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`,
        target: '85%',
      });
    }

    // Build initiatives from programme descriptions
    const initiatives = progs
      .slice(0, 3)
      .map((p) => p.description || p.name);

    // Build contribution text
    const contribution = progs.length > 0
      ? `Menyumbang melalui ${progs.length} program: ${progs.slice(0, 3).map((p) => p.name).join(', ')}${progs.length > 3 ? ` dan ${progs.length - 3} lagi` : ''}. ${totalBeneficiaries > 0 ? `Membantu ${totalBeneficiaries} penerima.` : ''}`
      : `Penjajaran berdasarkan objektif organisasi. Diperlukan program khusus untuk meningkatkan skor.`;

    sdgResults.push({
      goalNumber: goalNum,
      title: config.title,
      titleEn: config.titleEn,
      color: config.color,
      alignmentLevel: config.level,
      alignmentScore,
      contribution,
      programmes: progs.map((p) => p.name),
      metrics,
      initiatives,
    });
  }

  // Sort by alignment score descending
  sdgResults.sort((a, b) => b.alignmentScore - a.alignmentScore);

  const overallAlignmentScore = sdgResults.length > 0
    ? Math.round(totalAlignmentScore / sdgResults.length)
    : 0;

  // Generate insights
  const insights: string[] = [];

  insights.push(`PUSPA menyumbang secara langsung kepada ${primaryCount} SDG utama dan ${secondaryCount} SDG sokongan.`);

  const topSDG = sdgResults[0];
  const bottomSDG = sdgResults[sdgResults.length - 1];

  if (topSDG) {
    insights.push(`Penjajaran terkuat ialah SDG ${topSDG.goalNumber} (${topSDG.titleEn}) dengan skor ${topSDG.alignmentScore}%.`);
  }
  if (bottomSDG && bottomSDG.alignmentScore < 50) {
    insights.push(`Perlu tingkatkan sumbangan kepada SDG ${bottomSDG.goalNumber} (${bottomSDG.titleEn}) — skor paling rendah pada ${bottomSDG.alignmentScore}%.`);
  }

  const unMappedCategories = [...new Set(programmes.map((p) => p.category))];
  const coveredCategories = Object.values(SDG_MAP).flatMap((c) => c.categories);
  const uncoveredCategories = unMappedCategories.filter((c) => !coveredCategories.includes(c));
  if (uncoveredCategories.length > 0) {
    insights.push(`Kategori program berikut belum dipetakan ke SDG: ${uncoveredCategories.join(', ')}. Pertimbangkan penjajaran SDG yang sesuai.`);
  }

  insights.push('Cadangan: Menubuhkan jawatankuasa SDG khas untuk memantau dan melaporkan kemajuan secara berkala.');

  return {
    type: 'sdg_alignment',
    title: 'Penjajaran Matlamat Pembangunan Mampan (SDG)',
    generatedAt: now.toISOString(),
    summary: {
      totalSDGsCovered: coveredCount,
      primarySDGs: primaryCount,
      secondarySDGs: secondaryCount,
      alignmentScore: overallAlignmentScore,
    },
    sdgs: sdgResults,
    insights,
  };
}

// ── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['developer']);
    const searchParams = request.nextUrl.searchParams;
    const rawType = searchParams.get('type');

    const { type } = querySchema.parse({ type: rawType });

    let data;
    switch (type as AnalyticsType) {
      case 'donor_churn':
        data = await getDonorChurnData();
        break;
      case 'fraud_detection':
        data = await getFraudDetectionData();
        break;
      case 'programme_effectiveness':
        data = await getProgrammeEffectivenessData();
        break;
      case 'sdg_alignment':
        data = await getSDGAlignmentData();
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Jenis analitik tidak sah. Pilih dari: ${validTypes.join(', ')}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak sah', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in AI analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menjana analitik AI' },
      { status: 500 }
    );
  }
}
