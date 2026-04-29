export type AppRole = 'staff' | 'admin' | 'developer'

const LOCAL_DEV_AUTH_SECRET = 'puspa-local-development-secret-change-me'

export function normalizeUserRole(role?: string | null): AppRole {
  const normalized = role?.toLowerCase()

  if (normalized === 'developer') {
    return 'developer'
  }

  if (normalized === 'admin' || normalized === 'finance') {
    return 'admin'
  }

  return 'staff'
}

export function getAuthSecret(): string {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }

  // During CI/Build or Local Dev, we fallback to allow the build/dev to complete
  const isProduction = process.env.NODE_ENV === 'production'
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

  if (!isProduction || isBuildPhase) {
    return LOCAL_DEV_AUTH_SECRET
  }

  throw new Error('NEXTAUTH_SECRET environment variable is required in production runtime')
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3001'
}
