/**
 * @deprecated This file is a legacy artifact from the Supabase migration.
 * The project has fully migrated to local SQLite auth via:
 *   - API routes: /api/v1/auth/supabase/login, /api/v1/auth/supabase/logout, /api/v1/auth/supabase/me
 *   - Library: @/lib/supabase/auth.ts (local DB password auth + session tokens)
 *   - Library: @/lib/supabase/server.ts (getLocalAuthUser)
 *   - Library: @/lib/puspa-auth.ts (HMAC session token creation/verification)
 *   - Library: @/lib/auth.ts (requireAuth, requireRole)
 *
 * Nothing imports this file. It is retained only for reference.
 * Do NOT add new imports from this module.
 */

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null } }),
    signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Deprecated: Use /api/v1/auth/supabase/login' } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: { message: 'Deprecated: Use @/lib/uploads' } }),
      download: async () => ({ error: { message: 'Deprecated: Use @/lib/uploads' } }),
      remove: async () => ({ error: { message: 'Deprecated: Use @/lib/uploads' } }),
      createSignedUrl: async () => ({ error: { message: 'Deprecated: Use @/lib/uploads' } }),
    }),
  },
  from: () => ({
    select: () => ({ data: null, error: { message: 'Deprecated: Use Prisma via @/lib/db' } }),
    insert: () => ({ data: null, error: { message: 'Deprecated: Use Prisma via @/lib/db' } }),
    update: () => ({ data: null, error: { message: 'Deprecated: Use Prisma via @/lib/db' } }),
    delete: () => ({ data: null, error: { message: 'Deprecated: Use Prisma via @/lib/db' } }),
  }),
}
