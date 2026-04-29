import { Prisma, PrismaClient } from '@prisma/client'
import { createWithGeneratedUniqueValue } from '@/lib/sequence'

type DbClient = Prisma.TransactionClient | PrismaClient

type DonationIdentitySnapshot = {
  donorName?: string | null
  donorIC?: string | null
  donorEmail?: string | null
  donorPhone?: string | null
  isAnonymous?: boolean | null
}

function cleanNullableString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function buildDonorLookup(snapshot: DonationIdentitySnapshot) {
  const donorIC = cleanNullableString(snapshot.donorIC)
  const donorEmail = cleanNullableString(snapshot.donorEmail)?.toLowerCase()
  const donorPhone = cleanNullableString(snapshot.donorPhone)
  const donorName = cleanNullableString(snapshot.donorName)
  const isAnonymous = Boolean(snapshot.isAnonymous)

  const filters: Array<Record<string, string>> = []
  if (donorIC) filters.push({ ic: donorIC })
  if (donorEmail) filters.push({ email: donorEmail })
  if (donorPhone) filters.push({ phone: donorPhone })

  return {
    donorName,
    donorIC,
    donorEmail,
    donorPhone,
    isAnonymous,
    filters,
  }
}

function buildDonationMatchWhere(donor: {
  name: string
  ic: string | null
  email: string | null
  phone: string | null
  isAnonymous: boolean
}) {
  const orFilters: Record<string, unknown>[] = []

  if (donor.ic) {
    orFilters.push({ donorIC: donor.ic })
  }
  if (donor.email) {
    orFilters.push({ donorEmail: donor.email })
  }
  if (donor.phone) {
    orFilters.push({ donorPhone: donor.phone })
  }

  if (orFilters.length === 0) {
    return null
  }

  return { OR: orFilters }
}

async function generateDonorNumber(client: DbClient): Promise<string> {
  const lastDonor = await client.donor.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { donorNumber: true },
  })

  let nextNum = 1
  if (lastDonor?.donorNumber) {
    const match = lastDonor.donorNumber.match(/DNR-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }

  return `DNR-${String(nextNum).padStart(4, '0')}`
}

export async function findOrCreateDonorForDonation(client: DbClient, snapshot: DonationIdentitySnapshot) {
  const lookup = buildDonorLookup(snapshot)

  if (lookup.filters.length === 0) {
    return null
  }

  let donor = await client.donor.findFirst({
    where: { OR: lookup.filters },
  })

  if (!donor) {
    donor = await createWithGeneratedUniqueValue({
      generateValue: () => generateDonorNumber(client),
      uniqueFields: ['donorNumber'],
      create: (donorNumber) =>
        client.donor.create({
          data: {
            donorNumber,
            name: lookup.donorName || 'Penderma',
            ic: lookup.donorIC,
            email: lookup.donorEmail,
            phone: lookup.donorPhone,
            isAnonymous: lookup.isAnonymous,
            preferredContact: lookup.donorEmail ? 'email' : lookup.donorPhone ? 'phone' : null,
            status: 'active',
          },
        }),
    })
  } else {
    donor = await client.donor.update({
      where: { id: donor.id },
      data: {
        name: lookup.donorName || donor.name,
        ic: lookup.donorIC || donor.ic,
        email: lookup.donorEmail || donor.email,
        phone: lookup.donorPhone || donor.phone,
        isAnonymous: lookup.isAnonymous || donor.isAnonymous,
        preferredContact:
          donor.preferredContact || (lookup.donorEmail ? 'email' : lookup.donorPhone ? 'phone' : null),
      },
    })
  }

  return donor
}

export async function findMatchingDonorIdsForDonation(client: DbClient, snapshot: DonationIdentitySnapshot) {
  const lookup = buildDonorLookup(snapshot)

  if (lookup.filters.length === 0) {
    return []
  }

  const donors = await client.donor.findMany({
    where: { OR: lookup.filters },
    select: { id: true },
  })

  return donors.map((donor) => donor.id)
}

export async function syncDonorTotals(client: DbClient, donorId: string) {
  const donor = await client.donor.findUnique({
    where: { id: donorId },
    select: {
      id: true,
      name: true,
      ic: true,
      email: true,
      phone: true,
      isAnonymous: true,
    },
  })

  if (!donor) {
    return
  }

  const donationMatchWhere = buildDonationMatchWhere(donor)

  if (!donationMatchWhere) {
    await client.donor.update({
      where: { id: donorId },
      data: {
        totalDonated: 0,
        donationCount: 0,
        firstDonationAt: null,
        lastDonationAt: null,
      },
    })
    return
  }

  const aggregate = await client.donation.aggregate({
    where: {
      AND: [
        donationMatchWhere,
        { status: 'confirmed' },
      ],
    },
    _sum: { amount: true },
    _count: { id: true },
    _min: { donatedAt: true },
    _max: { donatedAt: true },
  })

  await client.donor.update({
    where: { id: donorId },
    data: {
      totalDonated: aggregate._sum.amount || 0,
      donationCount: aggregate._count.id || 0,
      firstDonationAt: aggregate._min.donatedAt || null,
      lastDonationAt: aggregate._max.donatedAt || null,
    },
  })
}

export async function backfillDonorsFromDonations(client: DbClient) {
  const [donorCount, donationCount] = await Promise.all([
    client.donor.count(),
    client.donation.count(),
  ])

  if (donorCount > 0 || donationCount === 0) {
    return
  }

  const donations = await client.donation.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      donorName: true,
      donorIC: true,
      donorEmail: true,
      donorPhone: true,
      isAnonymous: true,
    },
  })

  const donors = await Promise.all(
    donations.map((donation) => findOrCreateDonorForDonation(client, donation))
  )

  const donorIds = new Set<string>()
  for (const donor of donors) {
    if (donor) {
      donorIds.add(donor.id)
    }
  }

  await Promise.all(
    Array.from(donorIds).map((donorId) => syncDonorTotals(client, donorId))
  )
}
