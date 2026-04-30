import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

// Kifayah thresholds (Selangor LZS guidelines simplified)
const BASE_HOUSEHOLD = 1180
const CHILD_ALLOWANCE = 250

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json().catch(() => ({}))
    const ic = typeof body?.ic === 'string' ? body.ic.trim() : ''

    if (!ic) {
      return NextResponse.json(
        { success: false, error: 'Nombor IC diperlukan' },
        { status: 400 },
      )
    }

    // Find member by IC number
    const member = await db.member.findUnique({
      where: { ic },
      include: { householdMembers: true },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Ahli tidak dijumpai dengan nombor IC tersebut' },
        { status: 404 },
      )
    }

    // Get active programmes
    const programmes = await db.programme.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        category: true,
        targetBeneficiaries: true,
        actualBeneficiaries: true,
        budget: true,
        totalSpent: true,
      },
    })

    // Calculate Had Kifayah for this member
    const householdSize = member.householdSize || 1
    const monthlyIncome = Number(member.monthlyIncome) || 0
    const totalAllowance = BASE_HOUSEHOLD + Math.max(0, householdSize - 2) * CHILD_ALLOWANCE
    const hadKifayah = Math.max(BASE_HOUSEHOLD, totalAllowance)
    const deficit = hadKifayah - monthlyIncome
    const isEligible = deficit > 0

    // Calculate eligibility for each programme based on member profile
    const eligibilityResults = programmes.map((prog) => {
      let score = 50 // base score
      let status: string

      // Factor 1: Income deficit (higher deficit = higher priority)
      if (deficit > 500) {
        score += 25
      } else if (deficit > 0) {
        score += 15
      } else {
        score -= 20
      }

      // Factor 2: Household size (larger household = more need)
      if (householdSize >= 6) {
        score += 15
      } else if (householdSize >= 4) {
        score += 10
      } else if (householdSize >= 2) {
        score += 5
      }

      // Factor 3: Programme capacity (still has room)
      const capacity = prog.targetBeneficiaries || 0
      const current = prog.actualBeneficiaries || 0
      if (capacity > 0 && current < capacity) {
        score += 5
      } else if (capacity > 0 && current >= capacity) {
        score -= 10
      }

      // Factor 4: Budget availability
      const budget = Number(prog.budget) || 0
      const spent = Number(prog.totalSpent) || 0
      if (budget > 0 && spent < budget * 0.9) {
        score += 5
      } else if (budget > 0 && spent >= budget * 0.9) {
        score -= 5
      }

      // Factor 5: Category match
      const category = (prog.category || '').toLowerCase()
      if (category === 'welfare' || category === 'bmt') {
        if (deficit > 0) score += 10
      }
      if (category === 'education' && householdSize > 2) {
        score += 5
      }
      if (category === 'health' && deficit > 300) {
        score += 5
      }

      // Clamp score
      score = Math.max(0, Math.min(100, score))

      if (score >= 75) {
        status = 'Layak'
      } else if (score >= 50) {
        status = 'Perlu Semakan'
      } else {
        status = 'Tidak Layak'
      }

      return {
        name: prog.name,
        score,
        status,
      }
    })

    // Sort by score descending
    eligibilityResults.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      data: {
        member: {
          id: member.id,
          name: member.name,
          ic: member.ic,
          householdSize,
          monthlyIncome,
          hadKifayah,
          deficit,
        },
        eligible: isEligible,
        programmes: eligibilityResults,
      },
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }
    console.error('Error checking eligibility:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menyemak kelayakan' },
      { status: 500 },
    )
  }
}
