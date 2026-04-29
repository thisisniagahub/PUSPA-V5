import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/password'
import { normalizeUserRole, type AppRole } from '@/lib/auth-shared'
import { cookies } from 'next/headers'
import { verifySessionToken, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/puspa-auth'

export type SupabaseAuthResult = {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    role: AppRole
    supabaseId: string
  }
  error?: string
}

export async function signInWithEmailPassword(email: string, password: string): Promise<SupabaseAuthResult> {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return { success: false, error: 'Emel atau kata laluan tidak sah' }
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return { success: false, error: 'Emel atau kata laluan tidak sah' }
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeUserRole(user.role),
        supabaseId: user.supabaseId || user.id,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Ralat pelayan dalaman' }
  }
}

export async function signUpLocal(
  email: string,
  password: string,
  name: string,
  role: AppRole = 'staff',
): Promise<SupabaseAuthResult> {
  try {
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return { success: false, error: 'Emel sudah wujud' }
    }

    const hashedPassword = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        isActive: true,
      },
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeUserRole(user.role),
        supabaseId: user.supabaseId || user.id,
      },
    }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'Gagal mencipta pengguna' }
  }
}

export async function getSupabaseAuthUser(): Promise<SupabaseAuthResult['user'] | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    const session = await verifySessionToken(token)

    if (!session) return null

    const user = await db.user.findUnique({
      where: {
        id: session.userId,
      },
    })

    if (!user || !user.isActive) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeUserRole(user.role),
      supabaseId: user.supabaseId || user.id,
    }
  } catch {
    return null
  }
}

export async function seedLocalUsers(): Promise<{ email: string; status: string; error?: string }[]> {
  const defaultUsers = [
    { email: 'staff@puspa.org.my', password: 'Staff@2026', name: 'Kakitangan PUSPA', role: 'staff' as AppRole },
    { email: 'admin@puspa.org.my', password: 'Admin@2026', name: 'Pentadbir PUSPA', role: 'admin' as AppRole },
    { email: 'dev@puspa.org.my', password: 'Dev@2026', name: 'Pembangun PUSPA', role: 'developer' as AppRole },
  ]

  const results: { email: string; status: string; error?: string }[] = []

  for (const userData of defaultUsers) {
    try {
      const existing = await db.user.findUnique({
        where: { email: userData.email },
      })

      if (existing) {
        results.push({ email: userData.email, status: 'already_exists' })
        continue
      }

      await signUpLocal(userData.email, userData.password, userData.name, userData.role)
      results.push({ email: userData.email, status: 'created' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ email: userData.email, status: 'error', error: message })
    }
  }

  return results
}

// Keep these for backward compatibility
export { signInWithEmailPassword as signInWithSupabase }
export { signUpLocal as signUpWithSupabase }
export { seedLocalUsers as seedSupabaseAuthUsers }
export { signOutSupabase }
async function signOutSupabase(): Promise<{ success: boolean; error?: string }> {
  return { success: true }
}
