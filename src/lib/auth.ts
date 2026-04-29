import { getLocalAuthUser } from '@/lib/supabase/server'
import { normalizeUserRole, type AppRole } from '@/lib/auth-shared'

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: AppRole
    supabaseId: string
  }
}

export async function requireAuth(_request?: Request): Promise<AuthSession> {
  const user = await getLocalAuthUser()

  if (!user) {
    throw new AuthorizationError('Sesi tidak sah atau pengguna belum log masuk', 401)
  }

  if (!user.role) {
    throw new AuthorizationError('Peranan pengguna tidak sah', 401)
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      supabaseId: user.supabaseId,
    },
  }
}

export async function requireRole(_request: Request | undefined, roles: AppRole[]): Promise<AuthSession> {
  const session = await requireAuth(_request)

  if (!roles.includes(session.user.role)) {
    throw new AuthorizationError('Anda tidak mempunyai kebenaran untuk tindakan ini', 403)
  }

  return session
}

export { normalizeUserRole } from '@/lib/auth-shared'
export type { AppRole } from '@/lib/auth-shared'
