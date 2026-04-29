import { NextRequest, NextResponse } from 'next/server'
import { AuthorizationError, requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Zod Schemas ──────────────────────────────────────────────

const ekycCreateSchema = z.object({
  memberId: z.string().min(1, 'ID ahli diperlukan'),
  icFrontUrl: z.string().optional(),
  icBackUrl: z.string().optional(),
  selfieUrl: z.string().optional(),
  icName: z.string().optional(),
  icNumber: z.string().optional(),
  icAddress: z.string().optional(),
  icDateOfBirth: z.string().optional(),
  icGender: z.string().optional(),
  livenessScore: z.number().min(0).max(100).optional(),
  livenessMethod: z.string().optional(),
  faceMatchScore: z.number().min(0).max(100).optional(),
})

// ─── GET: Retrieve eKYC verifications (paginated, searchable, filterable) ──

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer'])
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')

    // If memberId is provided, return single record (bypass pagination)
    if (memberId) {
      const verification = await db.eKYCVerification.findUnique({
        where: { memberId },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              ic: true,
              memberNumber: true,
            },
          },
        },
      })

      if (!verification) {
        return NextResponse.json(
          { success: false, error: 'Pengesahan eKYC tidak dijumpai untuk ahli ini' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: verification })
    }

    // Paginated list with search, filter, and sort
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const riskLevel = searchParams.get('riskLevel') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { icName: { contains: search, mode: 'insensitive' } },
        { icNumber: { contains: search, mode: 'insensitive' } },
        { icAddress: { contains: search, mode: 'insensitive' } },
        { member: {
          name: { contains: search, mode: 'insensitive' },
        }},
        { member: {
          memberNumber: { contains: search, mode: 'insensitive' },
        }},
        { member: {
          ic: { contains: search, mode: 'insensitive' },
        }},
      ]
    }

    if (status) {
      where.status = status
    }

    if (riskLevel) {
      where.riskLevel = riskLevel
    }

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'status',
      'riskLevel',
      'livenessScore',
      'faceMatchScore',
      'walletLimit',
      'verifiedAt',
    ]
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'

    const [verifications, total] = await Promise.all([
      db.eKYCVerification.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              ic: true,
              memberNumber: true,
              phone: true,
            },
          },
        },
      }),
      db.eKYCVerification.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: verifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    console.error('Error fetching eKYC verifications:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuatkan data pengesahan eKYC' },
      { status: 500 }
    )
  }
}

// ─── POST: Create or update eKYC verification ─────────────────

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'developer'])
    const body = await request.json()
    const validated = ekycCreateSchema.parse(body)

    // Check member exists
    const member = await db.member.findUnique({
      where: { id: validated.memberId },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Ahli tidak dijumpai' },
        { status: 404 }
      )
    }

    // Parse date of birth if provided
    let parsedDob: Date | undefined
    if (validated.icDateOfBirth) {
      parsedDob = new Date(validated.icDateOfBirth)
      if (isNaN(parsedDob.getTime())) {
        parsedDob = undefined
      }
    }

    // Check if EKYC verification already exists for this member
    const existing = await db.eKYCVerification.findUnique({
      where: { memberId: validated.memberId },
    })

    if (existing) {
      // Don't allow updating already-verified records
      if (existing.status === 'verified') {
        return NextResponse.json(
          { success: false, error: 'Tidak boleh mengemaskini pengesahan eKYC yang telah disahkan' },
          { status: 400 }
        )
      }

      // Update existing record
      const updated = await db.eKYCVerification.update({
        where: { id: existing.id },
        data: {
          icFrontUrl: validated.icFrontUrl ?? existing.icFrontUrl,
          icBackUrl: validated.icBackUrl ?? existing.icBackUrl,
          selfieUrl: validated.selfieUrl ?? existing.selfieUrl,
          icName: validated.icName ?? existing.icName,
          icNumber: validated.icNumber ?? existing.icNumber,
          icAddress: validated.icAddress ?? existing.icAddress,
          icDateOfBirth: parsedDob ?? existing.icDateOfBirth,
          icGender: validated.icGender ?? existing.icGender,
          livenessScore: validated.livenessScore ?? existing.livenessScore,
          livenessMethod: validated.livenessMethod ?? existing.livenessMethod,
          faceMatchScore: validated.faceMatchScore ?? existing.faceMatchScore,
          status: 'pending',
          rejectionReason: null, // Clear previous rejection reason on resubmission
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              ic: true,
              memberNumber: true,
              phone: true,
            },
          },
        },
      })

      return NextResponse.json({ success: true, data: updated })
    }

    // Create new EKYC verification
    const verification = await db.eKYCVerification.create({
      data: {
        memberId: validated.memberId,
        icFrontUrl: validated.icFrontUrl,
        icBackUrl: validated.icBackUrl,
        selfieUrl: validated.selfieUrl,
        icName: validated.icName,
        icNumber: validated.icNumber,
        icAddress: validated.icAddress,
        icDateOfBirth: parsedDob,
        icGender: validated.icGender,
        livenessScore: validated.livenessScore,
        livenessMethod: validated.livenessMethod,
        faceMatchScore: validated.faceMatchScore,
        status: 'pending',
        walletLimit: 200,
        previousLimit: 200,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            ic: true,
            memberNumber: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: verification }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Pengesahan gagal', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating eKYC verification:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mencipta pengesahan eKYC' },
      { status: 500 }
    )
  }
}
