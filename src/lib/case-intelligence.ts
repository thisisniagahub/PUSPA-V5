type CaseData = {
  id: string;
  status?: string;
  category?: string;
  amountRequested?: number | null;
};

type HouseholdMember = {
  isStudent?: boolean;
};

type Member = {
  id: string;
  status?: string;
  ic?: string | null;
  phone?: string | null;
  address?: string | null;
  monthlyIncome?: number | null;
  householdSize?: number | null;
  householdMembers?: HouseholdMember[];
};

type Disbursement = {
  id: string;
  amount?: number | null;
  recipientBank?: string | null;
  recipientAcc?: string | null;
  reference?: string | null;
  scheduledDate?: string | Date | null;
  status?: string | null;
};

type Programme = {
  id: string;
  category?: string | null;
};

// Types for intelligence outputs
export interface EligibilityResult {
  eligible: boolean;
  score: number; // 0-100
  reasons: string[];
}

export interface RecommendationResult {
  recommendedProgrammeId: string | null;
  recommendedAmount: number | null;
  reasons: string[];
}

export interface RiskFlag {
  type: 'duplicate' | 'high-risk' | 'missing-info' | 'inconsistency';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Beneficiary360 {
  member: Member;
  household: any[];
  pastCases: CaseData[];
  totalDisbursed: number;
  disbursements: Disbursement[];
  avgCaseAmount: number;
}

export interface NextAction {
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DisbursementReconciliation {
  gaps: string[];
  missingBankInfo: boolean;
  missingContact: boolean;
  scheduleGaps: string[];
}

/**
 * Compute eligibility for a case based on member and programme rules
 */
export function computeEligibility(
  casedata: CaseData,
  member: Member | null,
  programme: Programme | null
): EligibilityResult {
  const reasons: string[] = [];
  let score = 0;

  if (!member) {
    reasons.push('No member linked');
    return { eligible: false, score: 0, reasons };
  }

  // Example rules (to be adapted)
  // 1. Member must be active
  if (member.status !== 'active') {
    reasons.push(`Member status is ${member.status}`);
  } else {
    score += 20;
  }

  // 2. Income threshold (example: programme may have max income)
  // For simplicity, assume if monthlyIncome > 5000 then ineligible for certain programmes
  if (member.monthlyIncome && member.monthlyIncome > 5000) {
    reasons.push('Income exceeds typical threshold for assistance');
  } else {
    score += 20;
  }

  // 3. Has required documents (IC, phone, address)
  if (!member.ic || member.ic.length < 8) {
    reasons.push('Missing or invalid IC');
  } else {
    score += 15;
  }
  if (!member.phone || member.phone.length < 8) {
    reasons.push('Missing phone');
  } else {
    score += 10;
  }
  if (!member.address) {
    reasons.push('Missing address');
  } else {
    score += 10;
  }

  // 4. Case amount requested vs income (should not exceed, say, 3x monthly income)
  if (
    casedata.amountRequested &&
    member.monthlyIncome &&
    casedata.amountRequested > member.monthlyIncome * 3
  ) {
    reasons.push('Requested amount is too high relative to income');
  } else {
    score += 15;
  }

  // 5. Programme-specific rules (if programme provided)
  if (programme) {
    // Example: education programme might require student in household
    if (programme.category === 'education') {
      const hasStudent = member.householdMembers?.some(
        (hm) => hm.isStudent === true
      );
      if (!hasStudent) {
        reasons.push('No student in household for education programme');
      } else {
        score += 10;
      }
    }
  }

  const eligible = score >= 60; // threshold
  return { eligible, score: Math.min(score, 100), reasons };
}

/**
 * Compute recommendation for case (programme and amount)
 */
export function computeRecommendation(
  casedata: CaseData,
  member: Member | null,
  programme: Programme | null
): RecommendationResult {
  const reasons: string[] = [];
  let recommendedProgrammeId: string | null = programme?.id ?? null;
  let recommendedAmount: number | null = null;

  if (!member) {
    reasons.push('Cannot recommend without member');
    return { recommendedProgrammeId: null, recommendedAmount: null, reasons };
  }

  // If no programme linked, suggest based on case category or member profile
  if (!programme) {
    // Simple mapping from case category to programme category
    const categoryMap: Record<string, string> = {
      zakat: 'financial_assistance',
      sedekah: 'financial_assistance',
      wakaf: 'community',
      infak: 'financial_assistance',
      bantuan_kerajaan: 'financial_assistance',
    };
    const mapped = casedata.category ? categoryMap[casedata.category] : undefined;
    if (mapped) {
      // Find first programme with matching category
      // In real app, we'd have a list of all programmes; here we just keep null
      reasons.push(`No programme linked; suggested category: ${mapped}`);
    } else {
      reasons.push('Cannot determine recommended programme');
    }
  }

  // Recommend amount based on income and existing disbursements
  const baseAmount = member.monthlyIncome ? member.monthlyIncome * 0.5 : 500; // 50% of monthly income or 500
  // Adjust for household size
  const householdSize = member.householdSize ?? 1;
  const adjusted = baseAmount * Math.min(householdSize, 4); // cap at 4x
  recommendedAmount = Math.round(adjusted / 100) * 100; // round to nearest 100

  reasons.push(
    `Based on ${member.monthlyIncome ?? 0} income and ${householdSize} household size`
  );

  return {
    recommendedProgrammeId,
    recommendedAmount,
    reasons,
  };
}

/**
 * Compute risk flags for a case and member
 */
export function computeRiskFlags(
  casedata: CaseData,
  member: Member | null,
  allMembers: Member[] = []
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (!member) {
    flags.push({
      type: 'missing-info',
      message: 'No member linked to case',
      severity: 'high',
    });
    return flags;
  }

  // 1. Duplicate IC check
  const duplicateMembers = allMembers.filter(
    (m) => m.id !== member.id && m.ic === member.ic
  );
  if (duplicateMembers.length > 0) {
    flags.push({
      type: 'duplicate',
      message: `IC duplicates found in ${duplicateMembers.length} other member(s)`,
      severity: 'high',
    });
  }

  // 2. High risk from eKYC (if available via member.eKYCVerification)
  // Since we don't have that relation in the member object, we skip for now.
  // In real implementation, we would check member.eKYCVerification?.riskLevel === 'high'

  // 3. Missing critical info
  if (!member.ic || member.ic.length < 8) {
    flags.push({
      type: 'missing-info',
      message: 'Missing or invalid IC',
      severity: 'high',
    });
  }
  if (!member.phone || member.phone.length < 8) {
    flags.push({
      type: 'missing-info',
      message: 'Missing phone number',
      severity: 'medium',
    });
  }
  if (!member.address) {
    flags.push({
      type: 'missing-info',
      message: 'Missing address',
      severity: 'medium',
    });
  }

  // 4. Inconsistency: case amount vs member income
  if (
    member.monthlyIncome &&
    casedata.amountRequested &&
    casedata.amountRequested > member.monthlyIncome * 5
  ) {
    flags.push({
      type: 'inconsistency',
      message: 'Requested amount exceeds 5x monthly income',
      severity: 'medium',
    });
  }

  return flags;
}

/**
 * Compute beneficiary 360 summary
 */
export function computeBeneficiary360(
  member: Member | null,
  pastCases: CaseData[] = [],
  disbursements: Disbursement[] = []
): Beneficiary360 {
  if (!member) {
    return {
      member: {} as Member,
      household: [],
      pastCases: [],
      totalDisbursed: 0,
      disbursements: [],
      avgCaseAmount: 0,
    };
  }

  const totalDisbursed = disbursements.reduce(
    (sum, d) => sum + (d.amount ?? 0),
    0
  );
  const avgCaseAmount =
    pastCases.length > 0
      ? pastCases.reduce((sum, c) => sum + (c.amountRequested ?? 0), 0) /
        pastCases.length
      : 0;

  return {
    member,
    household: member.householdMembers ?? [],
    pastCases,
    totalDisbursed,
    disbursements,
    avgCaseAmount: Math.round(avgCaseAmount),
  };
}

/**
 * Compute next suggested action based on case status and workflow
 */
export function computeNextAction(casedata: CaseData): NextAction {
  const status = casedata.status as string;

  // Define next actions per status (simplified)
  const nextActions: Record<string, NextAction> = {
    draft: {
      action: 'Submit for verification',
      description: 'Complete case details and submit to begin verification process',
      priority: 'medium',
    },
    submitted: {
      action: 'Start verification',
      description: 'Assign verifier and begin document checks',
      priority: 'high',
    },
    verifying: {
      action: 'Complete verification',
      description: 'Finish verification and move to scoring',
      priority: 'high',
    },
    verified: {
      action: 'Begin scoring',
      description: 'Assign scorer to evaluate case against criteria',
      priority: 'medium',
    },
    scoring: {
      action: 'Finish scoring',
      description: 'Complete scoring and move to approval',
      priority: 'medium',
    },
    scored: {
      action: 'Request approval',
      description: 'Submit scored case for approval by authorised officer',
      priority: 'medium',
    },
    approved: {
      action: 'Prepare disbursement',
      description: 'Set up disbursement details and schedule payment',
      priority: 'high',
    },
    disbursing: {
      action: 'Complete disbursement',
      description: 'Process payment and mark as disbursed',
      priority: 'high',
    },
    disbursed: {
      action: 'Schedule follow-up',
      description: 'Plan follow-up visit or check-in after disbursement',
      priority: 'medium',
    },
    follow_up: {
      action: 'Close case',
      description: 'Complete follow-up and close case',
      priority: 'low',
    },
    closed: {
      action: 'Case closed',
      description: 'No further action required',
      priority: 'low',
    },
    rejected: {
      action: 'Review rejection',
      description: 'Review rejection reasons and consider appeal or resubmission',
      priority: 'medium',
    },
  };

  return (
    nextActions[status] || {
      action: 'Review case',
      description: 'Check case status and determine next steps',
      priority: 'low',
    }
  );
}

/**
 * Compute disbursement reconciliation signals
 */
export function computeDisbursementReconciliation(
  disbursements: Disbursement[]
): DisbursementReconciliation {
  const gaps: string[] = [];
  let missingBankInfo = false;
  let missingContact = false;
  const scheduleGaps: string[] = [];

  disbursements.forEach((d, index) => {
    // Check for missing bank info
    if (!d.recipientBank || !d.recipientAcc) {
      missingBankInfo = true;
      gaps.push(`Disbursement ${d.reference || d.id}: missing bank information`);
    }
    // Check for missing contact (we don't have contact in disbursement; maybe from member)
    // We'll skip for now
    // Check schedule gaps: if scheduledDate is in the past and status not completed
    if (
      d.scheduledDate &&
      new Date(d.scheduledDate) < new Date() &&
      d.status !== 'completed'
    ) {
      scheduleGaps.push(
        `Disbursement ${d.reference || d.id}: scheduled ${d.scheduledDate} but status is ${d.status}`
      );
    }
  });

  return {
    gaps,
    missingBankInfo,
    missingContact: false, // placeholder
    scheduleGaps,
  };
}