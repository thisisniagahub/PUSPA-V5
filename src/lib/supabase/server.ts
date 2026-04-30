import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/puspa-auth'
import { db } from '@/lib/db'
import { normalizeUserRole, type AppRole } from '@/lib/auth-shared'

export type LocalAuthResult = {
  id: string
  email: string
  name: string
  role: AppRole
  supabaseId: string
}

export async function createClient() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = await verifySessionToken(token)

  if (!session) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    }
  }

  // Find user by userId from session
  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },
  })

  return {
    auth: {
      getUser: async () => ({
        data: {
          user: user
            ? {
                id: user.id,
                email: user.email,
                role: normalizeUserRole(user.role),
              }
            : null,
        },
      }),
    },
  }
}

// Alias for compatibility
export const getSupabaseAuthUser = getLocalAuthUser

export async function getLocalAuthUser(): Promise<LocalAuthResult | null> {
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
}
