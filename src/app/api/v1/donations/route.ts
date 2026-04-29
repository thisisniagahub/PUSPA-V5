import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { getRequestIp, writeAuditLog } from '@/lib/audit'
import { db } from '@/lib/db'
import {
  findMatchingDonorIdsForDonation,
  findOrCreateDonorForDonation,
  syncDonorTotals,
} from '@/lib/donor-sync'
import { createWithGeneratedUniqueValue } from '@/lib/sequence'

const donationCreateSchema = z.object({
  donorName: z.string().min(1, 'Nama penderma diperlukan'),
  donorIC: z.string().optional().or(z.literal('')),
  donorEmail: z.string().email('Format emel tidak sah').optional().or(z.literal('')),
  donorPhone: z.string().optional().or(z.literal('')),
  amount: z.number().positive('Jumlah mesti lebih daripada 0'),
  status: z.enum(['pending', 'confirmed', 'failed', 'refunded']).optional().default('pending'),
  method: z.enum(['cash', 'bank_transfer', 'online', 'cheque', 'ewallet']).optional().default('cash'),
  channel: z.string().optional().or(z.literal('')),
  fundType: z.enum(['zakat', 'sadaqah', 'waqf', 'infaq', 'donation_general']).optional().default('donation_general'),
  zakatCategory: z.enum(['fitrah', 'harta', 'pendapatan', 'perniagaan']).optional(),
  zakatAuthority: z.string().optional().or(z.literal('')),
  shariahCompliant: z.boolean().optional().default(true),
  isAnonymous: z.boolean().optional().default(false),
  isTaxDeductible: z.boolean().optional().default(false),
  receiptNumber: z.string().optional().or(z.literal('')),
  programmeId: z.string().optional().or(z.literal('')),
  caseId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  donatedAt: z.string().optional(),
})

async function generateDonationNumber(): Promise<string> {
  const lastDonation = await db.donation.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { donationNumber: true },
  })

  let nextNum = 1
  if (lastDonation?.donationNumber) {
    const match = lastDonation.donationNumber.match(/DN-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }

  return `DN-${String(nextNum).padStart(4, '0')}`
}

function buildDonationPayload(validated: z.infer<typeof donationCreateSchema>) {
  return {
    donorName: validated.isAnonymous ? 'Penderma Tanpa Nama' : validated.donorName.trim(),
    donorIC: validated.donorIC || null,
    donorEmail: validated.donorEmail ? validated.donorEmail.trim().toLowerCase() : null,
    donorPhone: validated.donorPhone || null,
    amount: validated.amount,
    status: validated.status,
    method: validated.method,
    channel: validated.channel || null,
    fundType: validated.fundType,
    zakatCategory: validated.fundType === 'zakat' ? validated.zakatCategory || null : null,
    zakatAuthority: validated.fundType === 'zakat' ? validated.zakatAuthority || null : null,
    shariahCompliant: validated.shariahCompliant,
    isAnonymous: validated.isAnonymous,
    isTaxDeductible: validated.isTaxDeductible,
    receiptNumber: validated.receiptNumber || null,
    programmeId: validated.programmeId || null,
    caseId: validated.caseId || null,
    notes: validated.notes || null,
    donatedAt: validated.donatedAt ? new Date(validated.donatedAt) : new Date(),
  }
}

async function getDonationSummary() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [totalResult, thisMonthResult, countByFundType] = await Promise.all([
    db.donation.aggregate({
      where: { status: 'confirmed' },
      _sum: { amount: true },
      _count: true,
    }),
    db.donation.aggregate({
      where: {
        status: 'confirmed',
        donatedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.donation.groupBy({
      by: ['fundType'],
      where: { status: 'confirmed' },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      totalAmount: totalResult._sum.amount || 0,
      totalDonations: totalResult._count,
      thisMonthAmount: thisMonthResult._sum.amount || 0,
      thisMonthDonations: thisMonthResult._count,
      countByFundType: countByFundType.map((item) => ({
        fundType: item.fundType,
        amount: item._sum.amount || 0,
        count: item._count,
      })),
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const searchParams = request.nextUrl.searchParams

    if (searchParams.get('summary') === 'true') {
      return getDonationSummary()
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const fundType = searchParams.get('fundType') || ''
    const method = searchParams.get('method') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { donorName: { contains: search, mode: 'insensitive' } },
        { donationNumber: { contains: search, mode: 'insensitive' } },
        { donorIC: { contains: search, mode: 'insensitive' } },
        { donorEmail: { contains: search, mode: 'insensitive' } },
        { donorPhone: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    if (fundType) where.fundType = fundType
    if (method) where.method = method

    const [donations, total] = await Promise.all([
      db.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          programme: { select: { id: true, name: true } },
        },
      }),
      db.donation.count({ where }),
    ])

    return NextResponse.json({ success: true, data: donations, total, page, pageSize })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }

    console.error('Error fetching donations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const validated = donationCreateSchema.parse(body)
    const donation = await createWithGeneratedUniqueValue({
      generateValue: generateDonationNumber,
      uniqueFields: ['donationNumber'],
      create: (donationNumber) =>
        db.$transaction(async (tx) => {
          const createdDonation = await tx.donation.create({
            data: {
              ...buildDonationPayload(validated),
              donationNumber,
            },
            include: {
              programme: { select: { id: true, name: true } },
            },
          })

          const donor = await findOrCreateDonorForDonation(tx, validated)
          if (donor) {
            await syncDonorTotals(tx, donor.id)
          }

          return createdDonation
        }),
    })

    await writeAuditLog({
      action: 'create',
      entity: 'Donation',
      entityId: donation.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donationNumber: donation.donationNumber,
        amount: donation.amount,
        status: donation.status,
        fundType: donation.fundType,
      },
    })

    return NextResponse.json({ success: true, data: donation }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    console.error('Error creating donation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create donation' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Donation id is required' },
        { status: 400 },
      )
    }

    const partialSchema = donationCreateSchema.partial()
    const validated = partialSchema.parse(updateData)

    const existing = await db.donation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 },
      )
    }

    const donation = await db.$transaction(async (tx) => {
      const previousDonorIds = await findMatchingDonorIdsForDonation(tx, existing)

      const dataToUpdate: Record<string, unknown> = {}
      if (validated.donorName !== undefined || validated.isAnonymous === true) {
        dataToUpdate.donorName = validated.isAnonymous ? 'Penderma Tanpa Nama' : (validated.donorName?.trim() || existing.donorName)
      }
      if (validated.donorIC !== undefined) dataToUpdate.donorIC = validated.donorIC || null
      if (validated.donorEmail !== undefined) dataToUpdate.donorEmail = validated.donorEmail ? validated.donorEmail.trim().toLowerCase() : null
      if (validated.donorPhone !== undefined) dataToUpdate.donorPhone = validated.donorPhone || null
      if (validated.amount !== undefined) dataToUpdate.amount = validated.amount
      if (validated.status !== undefined) dataToUpdate.status = validated.status
      if (validated.method !== undefined) dataToUpdate.method = validated.method
      if (validated.channel !== undefined) dataToUpdate.channel = validated.channel || null
      if (validated.fundType !== undefined) dataToUpdate.fundType = validated.fundType
      if (validated.zakatCategory !== undefined || validated.fundType !== undefined) {
        dataToUpdate.zakatCategory =
          (validated.fundType || existing.fundType) === 'zakat'
            ? validated.zakatCategory || existing.zakatCategory || null
            : null
      }
      if (validated.zakatAuthority !== undefined || validated.fundType !== undefined) {
        dataToUpdate.zakatAuthority =
          (validated.fundType || existing.fundType) === 'zakat'
            ? validated.zakatAuthority || existing.zakatAuthority || null
            : null
      }
      if (validated.shariahCompliant !== undefined) dataToUpdate.shariahCompliant = validated.shariahCompliant
      if (validated.isAnonymous !== undefined) dataToUpdate.isAnonymous = validated.isAnonymous
      if (validated.isTaxDeductible !== undefined) dataToUpdate.isTaxDeductible = validated.isTaxDeductible
      if (validated.receiptNumber !== undefined) dataToUpdate.receiptNumber = validated.receiptNumber || null
      if (validated.programmeId !== undefined) dataToUpdate.programmeId = validated.programmeId || null
      if (validated.caseId !== undefined) dataToUpdate.caseId = validated.caseId || null
      if (validated.notes !== undefined) dataToUpdate.notes = validated.notes || null
      if (validated.donatedAt !== undefined) dataToUpdate.donatedAt = validated.donatedAt ? new Date(validated.donatedAt) : existing.donatedAt

      const updatedDonation = await tx.donation.update({
        where: { id },
        data: dataToUpdate,
        include: {
          programme: { select: { id: true, name: true } },
        },
      })

      const currentDonor = await findOrCreateDonorForDonation(tx, updatedDonation)
      const donorIdsToSync = new Set(previousDonorIds)
      if (currentDonor) {
        donorIdsToSync.add(currentDonor.id)
      }

      for (const donorId of donorIdsToSync) {
        await syncDonorTotals(tx, donorId)
      }

      return updatedDonation
    })

    await writeAuditLog({
      action: 'update',
      entity: 'Donation',
      entityId: donation.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donationNumber: donation.donationNumber,
        amount: donation.amount,
        status: donation.status,
        fundType: donation.fundType,
      },
    })

    return NextResponse.json({ success: true, data: donation })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    console.error('Error updating donation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update donation' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Donation id is required' },
        { status: 400 },
      )
    }

    const existing = await db.donation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 },
      )
    }

    await db.$transaction(async (tx) => {
      const donorIdsToSync = await findMatchingDonorIdsForDonation(tx, existing)
      await tx.donation.delete({ where: { id } })

      for (const donorId of donorIdsToSync) {
        await syncDonorTotals(tx, donorId)
      }
    })

    await writeAuditLog({
      action: 'delete',
      entity: 'Donation',
      entityId: existing.id,
      userId: session.user.id,
      ipAddress: getRequestIp(request),
      details: {
        donationNumber: existing.donationNumber,
        amount: existing.amount,
        status: existing.status,
        fundType: existing.fundType,
      },
    })

    return NextResponse.json({ success: true, message: 'Donation deleted successfully' })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      )
    }

    console.error('Error deleting donation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete donation' },
      { status: 500 },
    )
  }
}
