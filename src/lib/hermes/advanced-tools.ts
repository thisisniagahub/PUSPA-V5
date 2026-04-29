// ============================================================
// Hermes Agent — Advanced Tool Registry
// 30+ tools with FULL CRUD access to ALL PuspaCare modules
// Inspired by NousResearch Hermes Agent tool architecture
// ============================================================

import { db } from '@/lib/db'
import type { HermesToolDefinition, ToolResult, ToolExecutionContext } from './types'

// ============================================================
// Helper: Generate sequential number
// ============================================================
async function generateNumber(prefix: string, model: string): Promise<string> {
  const count = await (db as any)[model].count()
  const num = (count + 1).toString().padStart(4, '0')
  return `${prefix}-${num}`
}

function ok(data: unknown, module: string, action: string, extra?: Partial<ToolResult>): ToolResult {
  return { success: true, data, metadata: { module, action, ...extra?.metadata }, ...extra }
}

function err(error: string): ToolResult {
  return { success: false, error }
}

// ============================================================
// QUERY TOOLS (Enhanced)
// ============================================================

const queryStatsTool: HermesToolDefinition = {
  name: 'query_stats',
  description: 'Query aggregate statistics from PUSPA database. Returns counts and totals for any module.',
  category: 'query',
  permission: 'read',
  parameters: {
    module: {
      type: 'string',
      description: 'Module to query: members, cases, donations, donors, volunteers, programmes, disbursements, compliance, activities, documents, ekyc',
      required: true,
      enum: ['members', 'cases', 'donations', 'donors', 'volunteers', 'programmes', 'disbursements', 'compliance', 'activities', 'documents', 'ekyc'],
    },
  },
  handler: async (args) => {
    const mod = args.module as string
    try {
      switch (mod) {
        case 'members': {
          const [total, active, inactive] = await Promise.all([
            db.member.count(),
            db.member.count({ where: { status: 'active' } }),
            db.member.count({ where: { status: { not: 'active' } } }),
          ])
          const incomeAgg = await db.member.aggregate({ _avg: { monthlyIncome: true }, _sum: { householdSize: true } })
          return ok({ total, active, inactive, avgIncome: Math.round(Number(incomeAgg._avg.monthlyIncome || 0)), totalHousehold: incomeAgg._sum.householdSize || 0 }, 'members', 'stats')
        }
        case 'cases': {
          const statuses = ['draft', 'submitted', 'verifying', 'verified', 'scoring', 'scored', 'approved', 'disbursing', 'disbursed', 'follow_up', 'closed', 'rejected']
          const counts = await Promise.all(statuses.map(s => db.case.count({ where: { status: s as import('@prisma/client').CaseStatus } })))
          const total = counts.reduce((a, b) => a + b, 0)
          const pending = counts.slice(0, 6).reduce((a, b) => a + b, 0)
          const amountAgg = await db.case.aggregate({ _sum: { amount: true } })
          return ok({ total, pending, approved: counts[6], closed: counts[10], rejected: counts[11], totalAmount: amountAgg._sum.amount || 0, byStatus: statuses.map((s, i) => ({ status: s, count: counts[i] })).filter((_, i) => counts[i] > 0) }, 'cases', 'stats')
        }
        case 'donations': {
          const [total, confirmed, pending] = await Promise.all([
            db.donation.count(),
            db.donation.count({ where: { status: 'confirmed' } }),
            db.donation.count({ where: { status: 'pending' } }),
          ])
          const amountAgg = await db.donation.aggregate({ _sum: { amount: true }, where: { status: 'confirmed' } })
          const byFundType = await db.donation.groupBy({ by: ['fundType'], _sum: { amount: true }, _count: true, where: { status: 'confirmed' } })
          return ok({ total, confirmed, pending, totalAmount: amountAgg._sum.amount || 0, byFundType: byFundType.map(f => ({ type: f.fundType, amount: f._sum.amount || 0, count: f._count })) }, 'donations', 'stats')
        }
        case 'donors': {
          const [total, active] = await Promise.all([db.donor.count(), db.donor.count({ where: { status: 'active' } })])
          const bySegment = await db.donor.groupBy({ by: ['segment'], _count: true })
          return ok({ total, active, bySegment: bySegment.map(s => ({ segment: s.segment, count: s._count })) }, 'donors', 'stats')
        }
        case 'volunteers': {
          const [total, active] = await Promise.all([db.volunteer.count(), db.volunteer.count({ where: { status: 'active' } })])
          const hoursAgg = await db.volunteer.aggregate({ _sum: { totalHours: true } })
          return ok({ total, active, totalHours: hoursAgg._sum.totalHours || 0 }, 'volunteers', 'stats')
        }
        case 'programmes': {
          const [total, active] = await Promise.all([db.programme.count(), db.programme.count({ where: { status: 'active' } })])
          const budgetAgg = await db.programme.aggregate({ _sum: { budget: true, totalSpent: true } })
          return ok({ total, active, totalBudget: budgetAgg._sum.budget || 0, totalSpent: budgetAgg._sum.totalSpent || 0 }, 'programmes', 'stats')
        }
        case 'disbursements': {
          const [total, pending, completed] = await Promise.all([
            db.disbursement.count(),
            db.disbursement.count({ where: { status: 'pending' } }),
            db.disbursement.count({ where: { status: 'disbursed' } }),
          ])
          const amountAgg = await db.disbursement.aggregate({ _sum: { amount: true } })
          return ok({ total, pending, completed, totalAmount: amountAgg._sum.amount || 0 }, 'disbursements', 'stats')
        }
        case 'compliance': {
          const [total, completed] = await Promise.all([
            db.complianceChecklist.count(),
            db.complianceChecklist.count({ where: { isCompleted: true } }),
          ])
          return ok({ total, completed, pending: total - completed, score: total > 0 ? Math.round((completed / total) * 100) : 0 }, 'compliance', 'stats')
        }
        case 'activities': {
          const [total, planned, inProgress, completed] = await Promise.all([
            db.activity.count(),
            db.activity.count({ where: { status: 'planned' } }),
            db.activity.count({ where: { status: 'in_progress' } }),
            db.activity.count({ where: { status: 'completed' } }),
          ])
          return ok({ total, planned, inProgress, completed }, 'activities', 'stats')
        }
        case 'documents': {
          const [total, active] = await Promise.all([db.document.count(), db.document.count({ where: { status: 'active' } })])
          const byCategory = await db.document.groupBy({ by: ['category'], _count: true })
          return ok({ total, active, byCategory: byCategory.map(c => ({ category: c.category, count: c._count })) }, 'documents', 'stats')
        }
        case 'ekyc': {
          const [total, verified, pending, rejected] = await Promise.all([
            db.eKYCVerification.count(),
            db.eKYCVerification.count({ where: { status: 'verified' } }),
            db.eKYCVerification.count({ where: { status: 'pending' } }),
            db.eKYCVerification.count({ where: { status: 'rejected' } }),
          ])
          return ok({ total, verified, pending, rejected }, 'ekyc', 'stats')
        }
        default:
          return err(`Module tidak diketahui: ${mod}`)
      }
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan statistik')
    }
  },
}

const searchMembersTool: HermesToolDefinition = {
  name: 'search_members',
  description: 'Search PUSPA members (asnaf) by name, IC, number, city, state, or status. Returns matching profiles.',
  category: 'query',
  permission: 'read',
  parameters: {
    query: { type: 'string', description: 'Search term (name, IC, or member number)', required: false },
    status: { type: 'string', description: 'Filter by status: active, inactive', required: false },
    city: { type: 'string', description: 'Filter by city', required: false },
    state: { type: 'string', description: 'Filter by state', required: false },
    minIncome: { type: 'number', description: 'Minimum monthly income filter', required: false },
    maxIncome: { type: 'number', description: 'Maximum monthly income filter', required: false },
    limit: { type: 'number', description: 'Max results (default 10, max 50)', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.status) where.status = args.status
      if (args.city) where.city = { contains: args.city as string }
      if (args.state) where.state = { contains: args.state as string }
      if (args.minIncome || args.maxIncome) {
        const inc: Record<string, number> = {}
        if (args.minIncome) inc.gte = args.minIncome as number
        if (args.maxIncome) inc.lte = args.maxIncome as number
        where.monthlyIncome = inc
      }
      if (args.query) {
        where.OR = [
          { name: { contains: args.query as string } },
          { ic: { contains: args.query as string } },
          { memberNumber: { contains: args.query as string } },
        ]
      }
      const limit = Math.min((args.limit as number) || 10, 50)
      const members = await db.member.findMany({
        where,
        take: limit,
        select: { id: true, memberNumber: true, name: true, ic: true, phone: true, city: true, state: true, monthlyIncome: true, householdSize: true, status: true, joinedAt: true },
      })
      return ok({ count: members.length, members }, 'members', 'search', { metadata: { module: 'members', action: 'search', recordCount: members.length } })
    } catch (error: any) {
      return err(error?.message || 'Gagal mencari ahli')
    }
  },
}

const searchCasesTool: HermesToolDefinition = {
  name: 'search_cases',
  description: 'Search PUSPA cases by status, priority, category, or keyword. Returns matching cases with details.',
  category: 'query',
  permission: 'read',
  parameters: {
    query: { type: 'string', description: 'Search term (case number, title, applicant name)', required: false },
    status: { type: 'string', description: 'Filter by status: draft, submitted, verifying, verified, scoring, scored, approved, disbursing, disbursed, follow_up, closed, rejected', required: false },
    priority: { type: 'string', description: 'Filter by priority: urgent, high, normal, low', required: false },
    category: { type: 'string', description: 'Filter by category: zakat, sedekah, wakaf, infak, government_aid', required: false },
    limit: { type: 'number', description: 'Max results (default 10, max 50)', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.status) where.status = args.status
      if (args.priority) where.priority = args.priority
      if (args.category) where.category = args.category
      if (args.query) {
        where.OR = [
          { caseNumber: { contains: args.query as string } },
          { title: { contains: args.query as string } },
          { applicantName: { contains: args.query as string } },
        ]
      }
      const limit = Math.min((args.limit as number) || 10, 50)
      const cases = await db.case.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, caseNumber: true, title: true, status: true, priority: true, category: true, amount: true, applicantName: true, createdAt: true },
      })
      return ok({ count: cases.length, cases }, 'cases', 'search', { metadata: { module: 'cases', action: 'search', recordCount: cases.length } })
    } catch (error: any) {
      return err(error?.message || 'Gagal mencari kes')
    }
  },
}

const getDonationsSummaryTool: HermesToolDefinition = {
  name: 'get_donations_summary',
  description: 'Get donation summary with totals by fund type and recent donations. Supports time period filtering.',
  category: 'query',
  permission: 'read',
  parameters: {
    period: { type: 'string', description: 'Time period: this_month, this_year, all_time', required: false },
  },
  handler: async (args) => {
    try {
      const period = (args.period as string) || 'all_time'
      const now = new Date()
      let dateFilter: Date | undefined
      if (period === 'this_month') dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
      else if (period === 'this_year') dateFilter = new Date(now.getFullYear(), 0, 1)

      const where = { status: 'confirmed' as const, ...(dateFilter ? { donatedAt: { gte: dateFilter } } : {}) }
      const [totalAmount, totalCount] = await Promise.all([
        db.donation.aggregate({ _sum: { amount: true }, where }),
        db.donation.count({ where }),
      ])
      const byFundType = await db.donation.groupBy({ by: ['fundType'], _sum: { amount: true }, _count: true, where })
      const recentDonations = await db.donation.findMany({
        where,
        orderBy: { donatedAt: 'desc' },
        take: 5,
        select: { donationNumber: true, donorName: true, amount: true, fundType: true, donatedAt: true, isAnonymous: true },
      })
      return ok({
        totalAmount: Number(totalAmount._sum.amount || 0),
        totalCount,
        byFundType: byFundType.map(f => ({ type: f.fundType, amount: Number(f._sum.amount || 0), count: f._count })),
        recentDonations: recentDonations.map(d => ({ ...d, donorName: d.isAnonymous ? 'Tanpa Nama' : d.donorName })),
      }, 'donations', 'summary')
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan ringkasan donasi')
    }
  },
}

const listProgrammesTool: HermesToolDefinition = {
  name: 'list_programmes',
  description: 'List PUSPA programmes with their status, budget, and beneficiary counts.',
  category: 'query',
  permission: 'read',
  parameters: {
    status: { type: 'string', description: 'Filter by status: active, planned, completed, suspended', required: false },
    category: { type: 'string', description: 'Filter by category', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.status) where.status = args.status
      if (args.category) where.category = args.category
      const programmes = await db.programme.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, category: true, status: true, budget: true, totalSpent: true, targetBeneficiaries: true, actualBeneficiaries: true, location: true },
      })
      return ok({ count: programmes.length, programmes }, 'programmes', 'list')
    } catch (error: any) {
      return err(error?.message || 'Gagal menyenaraikan program')
    }
  },
}

const complianceStatusTool: HermesToolDefinition = {
  name: 'compliance_status',
  description: 'Get compliance checklist progress with category breakdown and pending items.',
  category: 'query',
  permission: 'read',
  parameters: {},
  handler: async () => {
    try {
      const [total, completed] = await Promise.all([
        db.complianceChecklist.count(),
        db.complianceChecklist.count({ where: { isCompleted: true } }),
      ])
      const byCategory = await db.complianceChecklist.groupBy({ by: ['category'], _count: true })
      const pendingItems = await db.complianceChecklist.findMany({
        where: { isCompleted: false },
        take: 10,
        select: { id: true, category: true, item: true, description: true },
      })
      return ok({ total, completed, pending: total - completed, score: total > 0 ? Math.round((completed / total) * 100) : 0, byCategory, pendingItems }, 'compliance', 'status')
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan status pematuhan')
    }
  },
}

const searchDonorsTool: HermesToolDefinition = {
  name: 'search_donors',
  description: 'Search donors by name, segment, or status. Returns matching donor profiles.',
  category: 'query',
  permission: 'read',
  parameters: {
    query: { type: 'string', description: 'Search term (name or donor number)', required: false },
    segment: { type: 'string', description: 'Filter by segment: major, regular, occasional, lapsed', required: false },
    status: { type: 'string', description: 'Filter by status: active, inactive', required: false },
    limit: { type: 'number', description: 'Max results', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.segment) where.segment = args.segment
      if (args.status) where.status = args.status
      if (args.query) {
        where.OR = [
          { name: { contains: args.query as string } },
          { donorNumber: { contains: args.query as string } },
          { email: { contains: args.query as string } },
        ]
      }
      const donors = await db.donor.findMany({
        where,
        take: (args.limit as number) || 10,
        select: { id: true, donorNumber: true, name: true, segment: true, totalDonated: true, donationCount: true, status: true, lastDonationAt: true },
      })
      return ok({ count: donors.length, donors }, 'donors', 'search')
    } catch (error: any) {
      return err(error?.message || 'Gagal mencari penderma')
    }
  },
}

const searchVolunteersTool: HermesToolDefinition = {
  name: 'search_volunteers',
  description: 'Search volunteers by name, skills, or status.',
  category: 'query',
  permission: 'read',
  parameters: {
    query: { type: 'string', description: 'Search term (name or volunteer number)', required: false },
    skills: { type: 'string', description: 'Filter by skills keyword', required: false },
    status: { type: 'string', description: 'Filter by status: active, inactive', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.status) where.status = args.status
      if (args.skills) where.skills = { contains: args.skills as string }
      if (args.query) {
        where.OR = [
          { name: { contains: args.query as string } },
          { volunteerNumber: { contains: args.query as string } },
        ]
      }
      const volunteers = await db.volunteer.findMany({
        where,
        take: 10,
        select: { id: true, volunteerNumber: true, name: true, skills: true, totalHours: true, status: true, availability: true },
      })
      return ok({ count: volunteers.length, volunteers }, 'volunteers', 'search')
    } catch (error: any) {
      return err(error?.message || 'Gagal mencari sukarelawan')
    }
  },
}

const searchDisbursementsTool: HermesToolDefinition = {
  name: 'search_disbursements',
  description: 'Search disbursements by status, date, or amount range.',
  category: 'query',
  permission: 'read',
  parameters: {
    status: { type: 'string', description: 'Filter by status: pending, approved, completed, cancelled', required: false },
    limit: { type: 'number', description: 'Max results', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.status) where.status = args.status
      const disbursements = await db.disbursement.findMany({
        where,
        take: (args.limit as number) || 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, disbursementNumber: true, amount: true, purpose: true, status: true, recipientName: true, scheduledDate: true, createdAt: true },
      })
      return ok({ count: disbursements.length, disbursements }, 'disbursements', 'search')
    } catch (error: any) {
      return err(error?.message || 'Gagal mencari pembayaran')
    }
  },
}

const getMemberDetailsTool: HermesToolDefinition = {
  name: 'get_member_details',
  description: 'Get full member profile with related cases, disbursements, and household members.',
  category: 'query',
  permission: 'read',
  parameters: {
    memberId: { type: 'string', description: 'Member ID or member number', required: true },
  },
  handler: async (args) => {
    try {
      const id = args.memberId as string
      const where = id.startsWith('PUSPA-') ? { memberNumber: id } : { id }
      const member = await db.member.findFirst({
        where,
        include: {
          householdMembers: true,
          cases: { select: { id: true, caseNumber: true, title: true, status: true, priority: true, amount: true, createdAt: true }, take: 10, orderBy: { createdAt: 'desc' } },
          disbursements: { select: { id: true, disbursementNumber: true, amount: true, purpose: true, status: true, createdAt: true }, take: 10, orderBy: { createdAt: 'desc' } },
          eKYCVerification: { select: { status: true, livenessScore: true, faceMatchScore: true, bnmCompliant: true } },
        },
      })
      if (!member) return err('Ahli tidak dijumpai')
      return ok(member, 'members', 'details', { metadata: { module: 'members', action: 'details', recordId: member.id } })
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan maklumat ahli')
    }
  },
}

const getCaseDetailsTool: HermesToolDefinition = {
  name: 'get_case_details',
  description: 'Get full case details with notes, documents, and disbursements.',
  category: 'query',
  permission: 'read',
  parameters: {
    caseId: { type: 'string', description: 'Case ID or case number', required: true },
  },
  handler: async (args) => {
    try {
      const id = args.caseId as string
      const where = id.includes('-') && !id.startsWith('c') ? { caseNumber: id } : { id }
      const caseData = await db.case.findFirst({
        where,
        include: {
          caseNotes: { take: 20, orderBy: { createdAt: 'desc' } },
          caseDocuments: true,
          disbursements: true,
          member: { select: { id: true, memberNumber: true, name: true, ic: true, phone: true } },
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      })
      if (!caseData) return err('Kes tidak dijumpai')
      return ok(caseData, 'cases', 'details', { metadata: { module: 'cases', action: 'details', recordId: caseData.id } })
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan maklumat kes')
    }
  },
}

const getDashboardAnalyticsTool: HermesToolDefinition = {
  name: 'get_dashboard_analytics',
  description: 'Get comprehensive dashboard analytics with key metrics across all modules.',
  category: 'query',
  permission: 'read',
  parameters: {},
  handler: async () => {
    try {
      const [memberCount, activeMembers, caseCount, pendingCases, donationAgg, donorCount, volunteerCount, programmeCount] = await Promise.all([
        db.member.count(),
        db.member.count({ where: { status: 'active' } }),
        db.case.count(),
        db.case.count({ where: { status: { in: ['submitted', 'verifying', 'verified', 'scoring'] } } }),
        db.donation.aggregate({ _sum: { amount: true }, where: { status: 'confirmed' } }),
        db.donor.count({ where: { status: 'active' } }),
        db.volunteer.count({ where: { status: 'active' } }),
        db.programme.count({ where: { status: 'active' } }),
      ])
      const urgentCases = await db.case.count({ where: { priority: 'urgent', status: { notIn: ['closed', 'rejected'] } } })
      return ok({
        members: { total: memberCount, active: activeMembers },
        cases: { total: caseCount, pending: pendingCases, urgent: urgentCases },
        donations: { totalAmount: donationAgg._sum.amount || 0 },
        donors: { active: donorCount },
        volunteers: { active: volunteerCount },
        programmes: { active: programmeCount },
      }, 'dashboard', 'analytics')
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan analitik')
    }
  },
}

// ============================================================
// CRUD TOOLS (NEW — Write Operations)
// ============================================================

const createMemberTool: HermesToolDefinition = {
  name: 'create_member',
  description: 'Register a new asnaf member in PUSPA. Requires name, IC, phone, and address.',
  category: 'crud',
  permission: 'write',
  parameters: {
    name: { type: 'string', description: 'Full name of the member', required: true },
    ic: { type: 'string', description: 'IC number (e.g., 900101-10-1234)', required: true },
    phone: { type: 'string', description: 'Phone number', required: true },
    address: { type: 'string', description: 'Home address', required: true },
    city: { type: 'string', description: 'City', required: false },
    state: { type: 'string', description: 'State', required: false },
    householdSize: { type: 'number', description: 'Number of household members (default 1)', required: false },
    monthlyIncome: { type: 'number', description: 'Monthly household income (RM)', required: false },
    maritalStatus: { type: 'string', description: 'Marital status: single, married, divorced, widowed', required: false },
    occupation: { type: 'string', description: 'Occupation', required: false },
  },
  handler: async (args) => {
    try {
      // Check for duplicate IC
      const existing = await db.member.findUnique({ where: { ic: args.ic as string } })
      if (existing) return err(`Ahli dengan IC ${args.ic} sudah wujud (${existing.memberNumber})`)

      const memberNumber = await generateNumber('PUSPA', 'member')
      const member = await db.member.create({
        data: {
          memberNumber,
          name: args.name as string,
          ic: args.ic as string,
          phone: args.phone as string,
          address: args.address as string,
          city: (args.city as string) || null,
          state: (args.state as string) || null,
          householdSize: (args.householdSize as number) || 1,
          monthlyIncome: (args.monthlyIncome as number) || 0,
          maritalStatus: (args.maritalStatus as import('@prisma/client').MaritalStatus) || 'single',
          occupation: (args.occupation as string) || null,
          status: 'active',
        },
      })
      return ok(member, 'members', 'create', {
        metadata: { module: 'members', action: 'create', recordId: member.id },
        clientAction: { type: 'create', module: 'members', recordId: member.id, message: `Ahli baru ${member.name} (${member.memberNumber}) berjaya didaftarkan` },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mendaftarkan ahli baru')
    }
  },
}

const updateMemberTool: HermesToolDefinition = {
  name: 'update_member',
  description: 'Update an existing member\'s details. Only provided fields will be updated.',
  category: 'crud',
  permission: 'write',
  parameters: {
    memberId: { type: 'string', description: 'Member ID or member number', required: true },
    name: { type: 'string', description: 'Updated name', required: false },
    phone: { type: 'string', description: 'Updated phone', required: false },
    address: { type: 'string', description: 'Updated address', required: false },
    city: { type: 'string', description: 'Updated city', required: false },
    state: { type: 'string', description: 'Updated state', required: false },
    householdSize: { type: 'number', description: 'Updated household size', required: false },
    monthlyIncome: { type: 'number', description: 'Updated monthly income', required: false },
    status: { type: 'string', description: 'Updated status: active, inactive', required: false },
    notes: { type: 'string', description: 'Additional notes', required: false },
  },
  handler: async (args) => {
    try {
      const id = args.memberId as string
      const where = id.startsWith('PUSPA-') ? { memberNumber: id } : { id }
      const existing = await db.member.findFirst({ where })
      if (!existing) return err('Ahli tidak dijumpai')

      const updateData: Record<string, unknown> = {}
      const fields = ['name', 'phone', 'address', 'city', 'state', 'householdSize', 'monthlyIncome', 'status', 'notes']
      for (const f of fields) {
        if (args[f] !== undefined) updateData[f] = args[f]
      }

      const updated = await db.member.update({ where: { id: existing.id }, data: updateData })
      return ok(updated, 'members', 'update', {
        metadata: { module: 'members', action: 'update', recordId: updated.id },
        clientAction: { type: 'update', module: 'members', recordId: updated.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mengemaskini ahli')
    }
  },
}

const createCaseTool: HermesToolDefinition = {
  name: 'create_case',
  description: 'Create a new assistance case. Requires title, category, and amount.',
  category: 'crud',
  permission: 'write',
  parameters: {
    title: { type: 'string', description: 'Case title', required: true },
    category: { type: 'string', description: 'Category: zakat, sedekah, wakaf, infak, government_aid', required: true },
    amount: { type: 'number', description: 'Requested amount (RM)', required: true },
    priority: { type: 'string', description: 'Priority: urgent, high, normal, low (default normal)', required: false },
    applicantName: { type: 'string', description: 'Applicant name', required: false },
    applicantIC: { type: 'string', description: 'Applicant IC number', required: false },
    applicantPhone: { type: 'string', description: 'Applicant phone', required: false },
    applicantAddress: { type: 'string', description: 'Applicant address', required: false },
    memberId: { type: 'string', description: 'Link to existing member (ID or member number)', required: false },
    programmeId: { type: 'string', description: 'Link to programme', required: false },
    description: { type: 'string', description: 'Case description', required: false },
  },
  handler: async (args, context) => {
    try {
      const caseNumber = await generateNumber('KES', 'case')
      let memberId = args.memberId as string | undefined
      if (memberId && memberId.startsWith('PUSPA-')) {
        const member = await db.member.findUnique({ where: { memberNumber: memberId } })
        memberId = member?.id
      }

      const caseData = await db.case.create({
        data: {
          caseNumber,
          title: args.title as string,
          category: args.category as import('@prisma/client').CaseCategory,
          priority: (args.priority as import('@prisma/client').CasePriority) || 'normal',
          status: 'draft',
          applicantName: (args.applicantName as string) || null,
          applicantIC: (args.applicantIC as string) || null,
          applicantPhone: (args.applicantPhone as string) || null,
          applicantAddress: (args.applicantAddress as string) || null,
          memberId: memberId || null,
          programmeId: (args.programmeId as string) || null,
          description: (args.description as string) || null,
          creatorId: context?.userId || 'system',
        },
      })
      return ok(caseData, 'cases', 'create', {
        metadata: { module: 'cases', action: 'create', recordId: caseData.id },
        clientAction: { type: 'create', module: 'cases', recordId: caseData.id, message: `Kes baru ${caseData.caseNumber} berjaya dibuat` },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal membuat kes baru')
    }
  },
}

const updateCaseStatusTool: HermesToolDefinition = {
  name: 'update_case_status',
  description: 'Advance a case through workflow stages. Valid transitions follow the 12-step workflow.',
  category: 'crud',
  permission: 'write',
  parameters: {
    caseId: { type: 'string', description: 'Case ID or case number', required: true },
    status: { type: 'string', description: 'New status: draft, submitted, verifying, verified, scoring, scored, approved, disbursing, disbursed, follow_up, closed, rejected', required: true },
    note: { type: 'string', description: 'Optional note for the status change', required: false },
  },
  handler: async (args, context) => {
    try {
      const id = args.caseId as string
      const where = id.includes('-') && !id.startsWith('c') ? { caseNumber: id } : { id }
      const existing = await db.case.findFirst({ where })
      if (!existing) return err('Kes tidak dijumpai')

      const updated = await db.case.update({
        where: { id: existing.id },
        data: {
          status: args.status as import('@prisma/client').CaseStatus,
          ...(args.status === 'closed' ? { closedAt: new Date() } : {}),
        },
      })

      // Add note if provided
      if (args.note && context?.userId) {
        await db.caseNote.create({
          data: {
            content: args.note as string,
            type: 'status_change',
            caseId: existing.id,
            authorId: context.userId,
          },
        })
      }

      return ok(updated, 'cases', 'update_status', {
        metadata: { module: 'cases', action: 'update_status', recordId: updated.id },
        clientAction: { type: 'update', module: 'cases', recordId: updated.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mengemaskini status kes')
    }
  },
}

const addCaseNoteTool: HermesToolDefinition = {
  name: 'add_case_note',
  description: 'Add a note to an existing case.',
  category: 'crud',
  permission: 'write',
  parameters: {
    caseId: { type: 'string', description: 'Case ID or case number', required: true },
    content: { type: 'string', description: 'Note content', required: true },
    type: { type: 'string', description: 'Note type: note, observation, recommendation, follow_up (default note)', required: false },
  },
  handler: async (args, context) => {
    try {
      const id = args.caseId as string
      const where = id.includes('-') && !id.startsWith('c') ? { caseNumber: id } : { id }
      const existing = await db.case.findFirst({ where })
      if (!existing) return err('Kes tidak dijumpai')

      const note = await db.caseNote.create({
        data: {
          content: args.content as string,
          type: (args.type as string) || 'note',
          caseId: existing.id,
          authorId: context?.userId || 'system',
        },
      })
      return ok(note, 'cases', 'add_note', { metadata: { module: 'cases', action: 'add_note', recordId: note.id } })
    } catch (error: any) {
      return err(error?.message || 'Gagal menambah nota')
    }
  },
}

const createDonationTool: HermesToolDefinition = {
  name: 'create_donation',
  description: 'Record a new donation. Requires donor name, amount, and fund type.',
  category: 'crud',
  permission: 'write',
  parameters: {
    donorName: { type: 'string', description: 'Name of the donor', required: true },
    amount: { type: 'number', description: 'Donation amount (RM)', required: true },
    fundType: { type: 'string', description: 'Fund type: zakat, sedekah, wakaf, infak, donation_general', required: true },
    method: { type: 'string', description: 'Payment method: cash, bank_transfer, online, cheque (default cash)', required: false },
    donorPhone: { type: 'string', description: 'Donor phone number', required: false },
    donorEmail: { type: 'string', description: 'Donor email', required: false },
    isAnonymous: { type: 'boolean', description: 'Anonymous donation (default false)', required: false },
    programmeId: { type: 'string', description: 'Link to programme', required: false },
    notes: { type: 'string', description: 'Additional notes', required: false },
  },
  handler: async (args) => {
    try {
      const donationNumber = await generateNumber('DON', 'donation')
      const donation = await db.donation.create({
        data: {
          donationNumber,
          donorName: args.donorName as string,
          amount: args.amount as number,
          fundType: args.fundType as import('@prisma/client').FundType,
          method: (args.method as import('@prisma/client').DonationMethod) || 'cash',
          status: 'pending',
          donorPhone: (args.donorPhone as string) || null,
          donorEmail: (args.donorEmail as string) || null,
          isAnonymous: (args.isAnonymous as boolean) || false,
          programmeId: (args.programmeId as string) || null,
          notes: (args.notes as string) || null,
        },
      })
      return ok(donation, 'donations', 'create', {
        metadata: { module: 'donations', action: 'create', recordId: donation.id },
        clientAction: { type: 'create', module: 'donations', recordId: donation.id, message: `Donasi ${donation.donationNumber} berjaya direkodkan` },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal merekodkan donasi')
    }
  },
}

const createDisbursementTool: HermesToolDefinition = {
  name: 'create_disbursement',
  description: 'Create a new disbursement record for payment to a recipient.',
  category: 'crud',
  permission: 'write',
  parameters: {
    amount: { type: 'number', description: 'Disbursement amount (RM)', required: true },
    purpose: { type: 'string', description: 'Purpose of disbursement', required: true },
    recipientName: { type: 'string', description: 'Recipient name', required: true },
    recipientIC: { type: 'string', description: 'Recipient IC', required: false },
    recipientBank: { type: 'string', description: 'Bank name', required: false },
    recipientAcc: { type: 'string', description: 'Bank account number', required: false },
    caseId: { type: 'string', description: 'Link to case', required: false },
    programmeId: { type: 'string', description: 'Link to programme', required: false },
    memberId: { type: 'string', description: 'Link to member', required: false },
    scheduledDate: { type: 'string', description: 'Scheduled date (ISO format)', required: false },
  },
  handler: async (args) => {
    try {
      const disbursementNumber = await generateNumber('DISB', 'disbursement')
      const disbursement = await db.disbursement.create({
        data: {
          disbursementNumber,
          amount: args.amount as number,
          purpose: args.purpose as string,
          recipientName: args.recipientName as string,
          recipientIC: (args.recipientIC as string) || null,
          recipientBank: (args.recipientBank as string) || null,
          recipientAcc: (args.recipientAcc as string) || null,
          caseId: (args.caseId as string) || null,
          programmeId: (args.programmeId as string) || null,
          memberId: (args.memberId as string) || null,
          scheduledDate: args.scheduledDate ? new Date(args.scheduledDate as string) : null,
          status: 'pending',
        },
      })
      return ok(disbursement, 'disbursements', 'create', {
        metadata: { module: 'disbursements', action: 'create', recordId: disbursement.id },
        clientAction: { type: 'create', module: 'disbursements', recordId: disbursement.id, message: `Pembayaran ${disbursement.disbursementNumber} berjaya dibuat` },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal membuat pembayaran')
    }
  },
}

const updateDisbursementStatusTool: HermesToolDefinition = {
  name: 'update_disbursement_status',
  description: 'Update disbursement status (approve, complete, cancel).',
  category: 'crud',
  permission: 'write',
  parameters: {
    disbursementId: { type: 'string', description: 'Disbursement ID or number', required: true },
    status: { type: 'string', description: 'New status: approved, completed, cancelled', required: true },
  },
  handler: async (args) => {
    try {
      const id = args.disbursementId as string
      const where = id.startsWith('DISB-') ? { disbursementNumber: id } : { id }
      const existing = await db.disbursement.findFirst({ where })
      if (!existing) return err('Pembayaran tidak dijumpai')

      const updateData: Record<string, unknown> = { status: args.status }
      if (args.status === 'completed') updateData.processedDate = new Date()

      const updated = await db.disbursement.update({ where: { id: existing.id }, data: updateData })
      return ok(updated, 'disbursements', 'update_status', {
        metadata: { module: 'disbursements', action: 'update_status', recordId: updated.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mengemaskini status pembayaran')
    }
  },
}

const createVolunteerTool: HermesToolDefinition = {
  name: 'create_volunteer',
  description: 'Register a new volunteer. Requires name, IC, and phone.',
  category: 'crud',
  permission: 'write',
  parameters: {
    name: { type: 'string', description: 'Full name', required: true },
    ic: { type: 'string', description: 'IC number', required: true },
    phone: { type: 'string', description: 'Phone number', required: true },
    email: { type: 'string', description: 'Email address', required: false },
    skills: { type: 'string', description: 'Skills (comma-separated)', required: false },
    availability: { type: 'string', description: 'Availability: weekday, weekend, flexible', required: false },
    address: { type: 'string', description: 'Address', required: false },
  },
  handler: async (args) => {
    try {
      const existing = await db.volunteer.findUnique({ where: { ic: args.ic as string } })
      if (existing) return err(`Sukarelawan dengan IC ${args.ic} sudah wujud`)

      const volunteerNumber = await generateNumber('VOL', 'volunteer')
      const volunteer = await db.volunteer.create({
        data: {
          volunteerNumber,
          name: args.name as string,
          ic: args.ic as string,
          phone: args.phone as string,
          email: (args.email as string) || null,
          skills: (args.skills as string) || null,
          availability: (args.availability as import('@prisma/client').VolunteerAvailability) || null,
          address: (args.address as string) || null,
          status: 'active',
        },
      })
      return ok(volunteer, 'volunteers', 'create', {
        metadata: { module: 'volunteers', action: 'create', recordId: volunteer.id },
        clientAction: { type: 'create', module: 'volunteers', recordId: volunteer.id, message: `Sukarelawan ${volunteer.name} berjaya didaftarkan` },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mendaftarkan sukarelawan')
    }
  },
}

const recordVolunteerHoursTool: HermesToolDefinition = {
  name: 'record_volunteer_hours',
  description: 'Log volunteer service hours.',
  category: 'crud',
  permission: 'write',
  parameters: {
    volunteerId: { type: 'string', description: 'Volunteer ID or number', required: true },
    hours: { type: 'number', description: 'Hours served', required: true },
    date: { type: 'string', description: 'Date of service (ISO format)', required: true },
    activity: { type: 'string', description: 'Activity description', required: false },
  },
  handler: async (args, context) => {
    try {
      const id = args.volunteerId as string
      const where = id.startsWith('VOL-') ? { volunteerNumber: id } : { id }
      const volunteer = await db.volunteer.findFirst({ where })
      if (!volunteer) return err('Sukarelawan tidak dijumpai')

      const hourLog = await db.volunteerHourLog.create({
        data: {
          volunteerId: volunteer.id,
          hours: args.hours as number,
          date: new Date(args.date as string),
          activity: (args.activity as string) || null,
          status: 'pending',
          approvedBy: context?.userId || null,
        },
      })

      // Update total hours
      await db.volunteer.update({
        where: { id: volunteer.id },
        data: { totalHours: { increment: args.hours as number } },
      })

      return ok(hourLog, 'volunteers', 'record_hours', {
        metadata: { module: 'volunteers', action: 'record_hours', recordId: volunteer.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal merekodkan jam sukarelawan')
    }
  },
}

const createProgrammeTool: HermesToolDefinition = {
  name: 'create_programme',
  description: 'Create a new programme. Requires name, category, and budget.',
  category: 'crud',
  permission: 'write',
  parameters: {
    name: { type: 'string', description: 'Programme name', required: true },
    category: { type: 'string', description: 'Category: bantuan_makanan, pendidikan, latihan, kesihatan, kewangan, lain', required: true },
    budget: { type: 'number', description: 'Budget allocation (RM)', required: true },
    description: { type: 'string', description: 'Programme description', required: false },
    location: { type: 'string', description: 'Location', required: false },
    targetBeneficiaries: { type: 'number', description: 'Target number of beneficiaries', required: false },
    startDate: { type: 'string', description: 'Start date (ISO format)', required: false },
    endDate: { type: 'string', description: 'End date (ISO format)', required: false },
  },
  handler: async (args) => {
    try {
      const programme = await db.programme.create({
        data: {
          name: args.name as string,
          category: args.category as import('@prisma/client').ProgrammeCategory,
          budget: (args.budget as number) || 0,
          description: (args.description as string) || null,
          location: (args.location as string) || null,
          targetBeneficiaries: (args.targetBeneficiaries as number) || null,
          startDate: args.startDate ? new Date(args.startDate as string) : null,
          endDate: args.endDate ? new Date(args.endDate as string) : null,
          status: 'planned',
        },
      })
      return ok(programme, 'programmes', 'create', {
        metadata: { module: 'programmes', action: 'create', recordId: programme.id },
        clientAction: { type: 'create', module: 'programmes', recordId: programme.id, message: `Program ${programme.name} berjaya dibuat` },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal membuat program baru')
    }
  },
}

const updateProgrammeTool: HermesToolDefinition = {
  name: 'update_programme',
  description: 'Update an existing programme\'s details.',
  category: 'crud',
  permission: 'write',
  parameters: {
    programmeId: { type: 'string', description: 'Programme ID', required: true },
    name: { type: 'string', description: 'Updated name', required: false },
    status: { type: 'string', description: 'Updated status: active, planned, completed, suspended', required: false },
    budget: { type: 'number', description: 'Updated budget', required: false },
    totalSpent: { type: 'number', description: 'Updated total spent', required: false },
    actualBeneficiaries: { type: 'number', description: 'Updated actual beneficiaries count', required: false },
    notes: { type: 'string', description: 'Updated notes', required: false },
  },
  handler: async (args) => {
    try {
      const existing = await db.programme.findUnique({ where: { id: args.programmeId as string } })
      if (!existing) return err('Program tidak dijumpai')

      const updateData: Record<string, unknown> = {}
      const fields = ['name', 'status', 'budget', 'totalSpent', 'actualBeneficiaries', 'notes']
      for (const f of fields) {
        if (args[f] !== undefined) updateData[f] = args[f]
      }

      const updated = await db.programme.update({ where: { id: existing.id }, data: updateData })
      return ok(updated, 'programmes', 'update', {
        metadata: { module: 'programmes', action: 'update', recordId: updated.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mengemaskini program')
    }
  },
}

const createActivityTool: HermesToolDefinition = {
  name: 'create_activity',
  description: 'Create a new activity or task.',
  category: 'crud',
  permission: 'write',
  parameters: {
    title: { type: 'string', description: 'Activity title', required: true },
    type: { type: 'string', description: 'Activity type: task, event, meeting, training, distribution', required: false },
    description: { type: 'string', description: 'Activity description', required: false },
    programmeId: { type: 'string', description: 'Link to programme', required: false },
    location: { type: 'string', description: 'Location', required: false },
    date: { type: 'string', description: 'Activity date (ISO format)', required: false },
    assignees: { type: 'string', description: 'Assignees (comma-separated names)', required: false },
  },
  handler: async (args) => {
    try {
      const activity = await db.activity.create({
        data: {
          title: args.title as string,
          type: (args.type as import('@prisma/client').ActivityType) || 'other',
          description: (args.description as string) || null,
          programmeId: (args.programmeId as string) || null,
          location: (args.location as string) || null,
          date: args.date ? new Date(args.date as string) : null,
          assignees: (args.assignees as string) || null,
          status: 'planned',
        },
      })
      return ok(activity, 'activities', 'create', {
        metadata: { module: 'activities', action: 'create', recordId: activity.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal membuat aktiviti')
    }
  },
}

const updateActivityStatusTool: HermesToolDefinition = {
  name: 'update_activity_status',
  description: 'Update activity status.',
  category: 'crud',
  permission: 'write',
  parameters: {
    activityId: { type: 'string', description: 'Activity ID', required: true },
    status: { type: 'string', description: 'New status: planned, in_progress, completed, cancelled', required: true },
  },
  handler: async (args) => {
    try {
      const updated = await db.activity.update({
        where: { id: args.activityId as string },
        data: { status: args.status as import('@prisma/client').ActivityStatus },
      })
      return ok(updated, 'activities', 'update_status', {
        metadata: { module: 'activities', action: 'update_status', recordId: updated.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mengemaskini status aktiviti')
    }
  },
}

const createDonorTool: HermesToolDefinition = {
  name: 'create_donor',
  description: 'Add a new donor to the system.',
  category: 'crud',
  permission: 'write',
  parameters: {
    name: { type: 'string', description: 'Donor name', required: true },
    phone: { type: 'string', description: 'Phone number', required: false },
    email: { type: 'string', description: 'Email address', required: false },
    segment: { type: 'string', description: 'Segment: major, regular, occasional, lapsed', required: false },
    address: { type: 'string', description: 'Address', required: false },
  },
  handler: async (args) => {
    try {
      const donorNumber = await generateNumber('DR', 'donor')
      const donor = await db.donor.create({
        data: {
          donorNumber,
          name: args.name as string,
          phone: (args.phone as string) || null,
          email: (args.email as string) || null,
          segment: (args.segment as import('@prisma/client').DonorSegment) || 'occasional',
          address: (args.address as string) || null,
          status: 'active',
        },
      })
      return ok(donor, 'donors', 'create', {
        metadata: { module: 'donors', action: 'create', recordId: donor.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal menambah penderma')
    }
  },
}

const updateComplianceItemTool: HermesToolDefinition = {
  name: 'update_compliance_item',
  description: 'Mark a compliance checklist item as completed or update it.',
  category: 'crud',
  permission: 'write',
  parameters: {
    itemId: { type: 'string', description: 'Compliance checklist item ID', required: true },
    isCompleted: { type: 'boolean', description: 'Mark as completed (true) or incomplete (false)', required: true },
    evidenceUrl: { type: 'string', description: 'URL to evidence document', required: false },
    notes: { type: 'string', description: 'Notes', required: false },
  },
  handler: async (args) => {
    try {
      const updated = await db.complianceChecklist.update({
        where: { id: args.itemId as string },
        data: {
          isCompleted: args.isCompleted as boolean,
          completedAt: args.isCompleted ? new Date() : null,
          evidenceUrl: (args.evidenceUrl as string) || undefined,
          notes: (args.notes as string) || undefined,
        },
      })
      return ok(updated, 'compliance', 'update', {
        metadata: { module: 'compliance', action: 'update', recordId: updated.id },
      })
    } catch (error: any) {
      return err(error?.message || 'Gagal mengemaskini item pematuhan')
    }
  },
}

// ============================================================
// NAVIGATION & WORKFLOW TOOLS
// ============================================================

const navigateToTool: HermesToolDefinition = {
  name: 'navigate_to',
  description: 'Navigate the user to a specific module/view in PuspaCare.',
  category: 'navigation',
  permission: 'read',
  parameters: {
    viewId: { type: 'string', description: 'Module/view to navigate to: dashboard, members, cases, donations, donors, programmes, disbursements, volunteers, activities, compliance, documents, reports, admin, ekyc, tapsecure', required: true },
  },
  handler: async (args) => {
    return ok({ navigated: true, viewId: args.viewId }, 'navigation', 'navigate', {
      clientAction: { type: 'navigate', viewId: args.viewId as string, message: `Membuka modul ${args.viewId}` },
    })
  },
}

const explainModuleTool: HermesToolDefinition = {
  name: 'explain_module',
  description: 'Get a detailed description of what a PUSPA module does, its features, and available actions.',
  category: 'navigation',
  permission: 'read',
  parameters: {
    module: { type: 'string', description: 'The module/view ID to explain', required: true },
  },
  handler: async (args) => {
    const { getModuleDescription } = await import('./module-descriptions')
    return ok(getModuleDescription(args.module as string), 'navigation', 'explain')
  },
}

const suggestActionsTool: HermesToolDefinition = {
  name: 'suggest_actions',
  description: 'Suggest context-aware actions based on current data and module. Returns actionable recommendations.',
  category: 'workflow',
  permission: 'read',
  parameters: {
    module: { type: 'string', description: 'Current module context', required: true },
  },
  handler: async (args) => {
    try {
      const mod = args.module as string
      const suggestions: { action: string; description: string; priority: string }[] = []

      switch (mod) {
        case 'cases': {
          const urgentCount = await db.case.count({ where: { priority: 'urgent', status: { notIn: ['closed', 'rejected'] } } })
          const pendingCount = await db.case.count({ where: { status: { in: ['submitted', 'verifying'] } } })
          if (urgentCount > 0) suggestions.push({ action: 'review_urgent_cases', description: `${urgentCount} kes memerlukan tindakan segera`, priority: 'urgent' })
          if (pendingCount > 0) suggestions.push({ action: 'process_pending', description: `${pendingCount} kes menunggu pengesahan`, priority: 'high' })
          break
        }
        case 'donations': {
          const pendingDonations = await db.donation.count({ where: { status: 'pending' } })
          if (pendingDonations > 0) suggestions.push({ action: 'confirm_donations', description: `${pendingDonations} donasi menunggu pengesahan`, priority: 'high' })
          break
        }
        case 'disbursements': {
          const pendingDisb = await db.disbursement.count({ where: { status: 'pending' } })
          if (pendingDisb > 0) suggestions.push({ action: 'approve_disbursements', description: `${pendingDisb} pembayaran menunggu kelulusan`, priority: 'high' })
          break
        }
        case 'compliance': {
          const pendingItems = await db.complianceChecklist.count({ where: { isCompleted: false } })
          if (pendingItems > 0) suggestions.push({ action: 'complete_compliance', description: `${pendingItems} item pematuhan belum selesai`, priority: 'medium' })
          break
        }
        default: {
          suggestions.push({ action: 'view_stats', description: 'Lihat statistik modul', priority: 'low' })
        }
      }

      return ok({ module: mod, suggestions }, 'workflow', 'suggest')
    } catch (error: any) {
      return err(error?.message || 'Galan menjana cadangan')
    }
  },
}

const generateReportTool: HermesToolDefinition = {
  name: 'generate_report',
  description: 'Generate a summary report for a specific module or time period.',
  category: 'analytics',
  permission: 'read',
  parameters: {
    module: { type: 'string', description: 'Module to report on: members, cases, donations, disbursements, volunteers, compliance', required: true },
    period: { type: 'string', description: 'Time period: this_month, this_quarter, this_year, all_time', required: false },
  },
  handler: async (args) => {
    try {
      const mod = args.module as string
      const period = (args.period as string) || 'this_year'
      const now = new Date()
      let dateFilter: Date | undefined
      if (period === 'this_month') dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
      else if (period === 'this_quarter') { const q = Math.floor(now.getMonth() / 3); dateFilter = new Date(now.getFullYear(), q * 3, 1) }
      else if (period === 'this_year') dateFilter = new Date(now.getFullYear(), 0, 1)

      let report: Record<string, unknown> = { module: mod, period, generatedAt: now.toISOString() }

      switch (mod) {
        case 'donations': {
          const where = { status: 'confirmed' as const, ...(dateFilter ? { donatedAt: { gte: dateFilter } } : {}) }
          const [totalAmount, count, byType] = await Promise.all([
            db.donation.aggregate({ _sum: { amount: true }, where }),
            db.donation.count({ where }),
            db.donation.groupBy({ by: ['fundType'], _sum: { amount: true }, _count: true, where }),
          ])
          report = { ...report, totalAmount: totalAmount._sum.amount || 0, count, byFundType: byType.map(t => ({ type: t.fundType, amount: t._sum.amount || 0, count: t._count })) }
          break
        }
        case 'cases': {
          const where = { ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}) }
          const [total, byStatus] = await Promise.all([
            db.case.count({ where }),
            db.case.groupBy({ by: ['status'], _count: true, where }),
          ])
          const amountAgg = await db.case.aggregate({ _sum: { amount: true }, where })
          report = { ...report, total, totalAmount: amountAgg._sum.amount || 0, byStatus: byStatus.map(s => ({ status: s.status, count: s._count })) }
          break
        }
        default:
          report = { ...report, note: 'Laporan terperinci untuk modul ini akan datang' }
      }

      return ok(report, mod, 'report')
    } catch (error: any) {
      return err(error?.message || 'Gagal menjana laporan')
    }
  },
}

// ============================================================
// ANALYTICS TOOLS
// ============================================================

const analyzeTrendsTool: HermesToolDefinition = {
  name: 'analyze_trends',
  description: 'Analyze trends for donations, cases, or members over recent months.',
  category: 'analytics',
  permission: 'read',
  parameters: {
    metric: { type: 'string', description: 'What to analyze: donations, cases, members', required: true, enum: ['donations', 'cases', 'members'] },
    months: { type: 'number', description: 'Number of months to analyze (default 6)', required: false },
  },
  handler: async (args) => {
    try {
      const metric = args.metric as string
      const months = (args.months as number) || 6
      const now = new Date()
      const dataPoints: { month: string; value: number }[] = []

      for (let i = months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthLabel = start.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' })

        let count = 0
        switch (metric) {
          case 'donations':
            count = await db.donation.count({ where: { status: 'confirmed', donatedAt: { gte: start, lte: end } } })
            break
          case 'cases':
            count = await db.case.count({ where: { createdAt: { gte: start, lte: end } } })
            break
          case 'members':
            count = await db.member.count({ where: { joinedAt: { gte: start, lte: end } } })
            break
        }
        dataPoints.push({ month: monthLabel, value: count })
      }

      const trend = dataPoints.length >= 2
        ? dataPoints[dataPoints.length - 1].value > dataPoints[0].value ? 'increasing' : dataPoints[dataPoints.length - 1].value < dataPoints[0].value ? 'decreasing' : 'stable'
        : 'insufficient_data'

      return ok({ metric, dataPoints, trend, summary: `Trend ${metric} dalam ${months} bulan terakhir: ${trend}` }, 'analytics', 'trends')
    } catch (error: any) {
      return err(error?.message || 'Gagal menganalisis trend')
    }
  },
}

const riskAssessmentTool: HermesToolDefinition = {
  name: 'risk_assessment',
  description: 'Identify at-risk cases, members, or compliance gaps that need attention.',
  category: 'analytics',
  permission: 'read',
  parameters: {
    type: { type: 'string', description: 'Risk type: cases, compliance, disbursements', required: true, enum: ['cases', 'compliance', 'disbursements'] },
  },
  handler: async (args) => {
    try {
      const type = args.type as string
      let risks: { category: string; description: string; severity: string; count: number }[] = []

      switch (type) {
        case 'cases': {
          const [urgent, stale, highAmount] = await Promise.all([
            db.case.count({ where: { priority: 'urgent', status: { notIn: ['closed', 'rejected'] } } }),
            db.case.count({ where: { status: { in: ['submitted', 'verifying'] }, updatedAt: { lt: new Date(Date.now() - 7 * 86400000) } } }),
            db.case.count({ where: { amount: { gt: 10000 }, status: { in: ['approved', 'disbursing'] } } }),
          ])
          if (urgent > 0) risks.push({ category: 'Urgent Cases', description: 'Kes memerlukan tindakan segera', severity: 'critical', count: urgent })
          if (stale > 0) risks.push({ category: 'Stale Cases', description: 'Kes tertunggak > 7 hari', severity: 'high', count: stale })
          if (highAmount > 0) risks.push({ category: 'High-Value Cases', description: 'Kes bernilai tinggi menunggu pemprosesan', severity: 'medium', count: highAmount })
          break
        }
        case 'compliance': {
          const pendingCount = await db.complianceChecklist.count({ where: { isCompleted: false } })
          if (pendingCount > 0) risks.push({ category: 'Incomplete Compliance', description: 'Item pematuhan belum selesai', severity: 'high', count: pendingCount })
          break
        }
        case 'disbursements': {
          const pendingDisb = await db.disbursement.count({ where: { status: 'pending', scheduledDate: { lt: new Date() } } })
          if (pendingDisb > 0) risks.push({ category: 'Overdue Payments', description: 'Pembayaran tertunggak melebihi tarikh jadual', severity: 'high', count: pendingDisb })
          break
        }
      }

      return ok({ type, risks, totalRisks: risks.reduce((a, r) => a + r.count, 0) }, 'analytics', 'risk')
    } catch (error: any) {
      return err(error?.message || 'Gagal menilai risiko')
    }
  },
}

// ============================================================
// SYSTEM TOOLS
// ============================================================

const searchMemoryTool: HermesToolDefinition = {
  name: 'search_memory',
  description: 'Search stored memories and preferences for the current user.',
  category: 'system',
  permission: 'read',
  parameters: {
    query: { type: 'string', description: 'Search term', required: false },
    category: { type: 'string', description: 'Memory category: preference, fact, procedure, context', required: false },
  },
  handler: async (args, context) => {
    try {
      const { recallMemories } = await import('./memory')
      const memories = await recallMemories({
        userId: context?.userId || 'anonymous',
        query: args.query as string,
        category: args.category as any,
        limit: 10,
      })
      return ok({ count: memories.length, memories }, 'system', 'search_memory')
    } catch (error: any) {
      return err(error?.message || 'Galan mencari memori')
    }
  },
}

const getAuditTrailTool: HermesToolDefinition = {
  name: 'get_audit_trail',
  description: 'Get recent audit log entries for tracking system activities.',
  category: 'system',
  permission: 'admin',
  parameters: {
    entity: { type: 'string', description: 'Filter by entity type', required: false },
    limit: { type: 'number', description: 'Max entries (default 20)', required: false },
  },
  handler: async (args) => {
    try {
      const where: Record<string, unknown> = {}
      if (args.entity) where.entity = args.entity
      const logs = await db.auditLog.findMany({
        where,
        take: (args.limit as number) || 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      })
      return ok({ count: logs.length, logs }, 'system', 'audit')
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan jejak audit')
    }
  },
}

const getNotificationsTool: HermesToolDefinition = {
  name: 'get_notifications',
  description: 'Get unread notifications for the current user.',
  category: 'system',
  permission: 'read',
  parameters: {
    limit: { type: 'number', description: 'Max notifications', required: false },
  },
  handler: async (args, context) => {
    try {
      const notifications = await db.notification.findMany({
        where: { userId: context?.userId, isRead: false },
        take: (args.limit as number) || 10,
        orderBy: { createdAt: 'desc' },
      })
      return ok({ count: notifications.length, notifications }, 'system', 'notifications')
    } catch (error: any) {
      return err(error?.message || 'Gagal mendapatkan notifikasi')
    }
  },
}

const manageSkillTool: HermesToolDefinition = {
  name: 'manage_skill',
  description: 'Create, update, or list PUSPA AI skills. Skills are learned procedures that improve over time.',
  category: 'system',
  permission: 'write',
  parameters: {
    action: { type: 'string', description: 'Action: create, list, update', required: true, enum: ['create', 'list', 'update'] },
    name: { type: 'string', description: 'Skill name (for create/update)', required: false },
    description: { type: 'string', description: 'Skill description', required: false },
    instructions: { type: 'string', description: 'Step-by-step instructions', required: false },
    triggerPatterns: { type: 'string', description: 'Comma-separated trigger patterns', required: false },
    category: { type: 'string', description: 'Skill category', required: false },
  },
  handler: async (args, context) => {
    try {
      const action = args.action as string
      const { createSkill, listSkills, autoCreateSkill } = await import('./skills')

      if (action === 'list') {
        const skills = await listSkills({ userId: context?.userId })
        return ok({ count: skills.length, skills }, 'system', 'list_skills')
      }

      if (action === 'create') {
        if (!args.name || !args.description || !args.instructions) return err('Nama, deskripsi, dan arahan diperlukan')
        const skill = await autoCreateSkill({
          name: args.name as string,
          description: args.description as string,
          instructions: args.instructions as string,
          triggerPatterns: args.triggerPatterns ? (args.triggerPatterns as string).split(',').map(p => p.trim()) : [],
          category: (args.category as string) || 'general',
          userId: context?.userId,
        })
        return ok(skill, 'system', 'create_skill')
      }

      return err(`Action tidak diketahui: ${action}`)
    } catch (error: any) {
      return err(error?.message || 'Galan menguruskan kemahiran')
    }
  },
}

// ============================================================
// TOOL REGISTRY — 30+ Tools
// ============================================================

export const hermesTools: HermesToolDefinition[] = [
  // Query Tools (12)
  queryStatsTool,
  searchMembersTool,
  searchCasesTool,
  getDonationsSummaryTool,
  listProgrammesTool,
  complianceStatusTool,
  searchDonorsTool,
  searchVolunteersTool,
  searchDisbursementsTool,
  getMemberDetailsTool,
  getCaseDetailsTool,
  getDashboardAnalyticsTool,

  // CRUD Tools (14)
  createMemberTool,
  updateMemberTool,
  createCaseTool,
  updateCaseStatusTool,
  addCaseNoteTool,
  createDonationTool,
  createDisbursementTool,
  updateDisbursementStatusTool,
  createVolunteerTool,
  recordVolunteerHoursTool,
  createProgrammeTool,
  updateProgrammeTool,
  createActivityTool,
  updateActivityStatusTool,
  createDonorTool,
  updateComplianceItemTool,

  // Navigation & Workflow Tools (4)
  navigateToTool,
  explainModuleTool,
  suggestActionsTool,
  generateReportTool,

  // Analytics Tools (2)
  analyzeTrendsTool,
  riskAssessmentTool,

  // System Tools (4)
  searchMemoryTool,
  getAuditTrailTool,
  getNotificationsTool,
  manageSkillTool,
]

// Tool lookup map
export const toolMap = new Map(hermesTools.map(t => [t.name, t]))

// Get tools by category
export function getToolsByCategory(category: string): HermesToolDefinition[] {
  return hermesTools.filter(t => t.category === category)
}

// Get tools by permission level
export function getToolsByPermission(permission: string): HermesToolDefinition[] {
  return hermesTools.filter(t => {
    const levels: Record<string, number> = { read: 0, write: 1, admin: 2 }
    return levels[t.permission] <= (levels[permission] ?? 0)
  })
}
