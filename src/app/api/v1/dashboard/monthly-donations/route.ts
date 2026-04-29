import { NextResponse } from 'next/server'
import { AuthorizationError, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    await requireAuth(request)
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis']
    const currentYear = new Date().getFullYear()

    const donations = await db.donation.findMany({
      where: {
        status: 'confirmed',
        donatedAt: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
      },
      select: {
        amount: true,
        fundType: true,
        donatedAt: true,
      },
    })

    const monthlyData = months.map((month, index) => {
      const monthDonations = donations.filter((donation) => {
        const donationDate = new Date(donation.donatedAt)
        return donationDate.getMonth() === index
      })

      return {
        month,
        bulan: month,
        zakat: monthDonations.filter((x) => x.fundType === 'zakat').reduce((sum, x) => sum + Number(x.amount), 0),
        sadaqah: monthDonations.filter((x) => x.fundType === 'sadaqah').reduce((sum, x) => sum + Number(x.amount), 0),
        waqf: monthDonations.filter((x) => x.fundType === 'waqf').reduce((sum, x) => sum + Number(x.amount), 0),
        infaq: monthDonations.filter((x) => x.fundType === 'infaq').reduce((sum, x) => sum + Number(x.amount), 0),
        general: monthDonations.filter((x) => x.fundType === 'donation_general').reduce((sum, x) => sum + Number(x.amount), 0),
      }
    })

    return NextResponse.json({ success: true, data: monthlyData })
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
