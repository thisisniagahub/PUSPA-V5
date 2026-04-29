import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { normalizeUserRole, type AppRole } from '@/lib/auth-shared'

export async function POST(request: NextRequest) {
  try {
    const defaultUsers = [
      { email: 'staff@puspa.org.my', password: 'Staff@2026', name: 'Kakitangan PUSPA', role: 'staff' as AppRole },
      { email: 'admin@puspa.org.my', password: 'Admin@2026', name: 'Pentadbir PUSPA', role: 'admin' as AppRole },
      { email: 'dev@puspa.org.my', password: 'Dev@2026', name: 'Pembangun PUSPA', role: 'developer' as AppRole },
    ]

    const results: { email: string; status: string; error?: string }[] = []

    for (const userData of defaultUsers) {
      try {
        const existing = await db.user.findUnique({ where: { email: userData.email } })
        if (existing) {
          results.push({ email: userData.email, status: 'already_exists' })
          continue
        }

        const hashedPassword = await hashPassword(userData.password)
        await db.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            isActive: true,
          },
        })
        results.push({ email: userData.email, status: 'created' })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        results.push({ email: userData.email, status: 'error', error: message })
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Ralat pelayan dalaman' },
      { status: 500 },
    )
  }
}
