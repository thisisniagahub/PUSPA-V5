/**
 * @deprecated This file is a legacy backward-compat placeholder from the Supabase migration.
 * The project has fully migrated to local SQLite auth via:
 *   - API routes: /api/v1/auth/supabase/login, /api/v1/auth/supabase/logout, /api/v1/auth/supabase/me
 *   - Library: @/lib/supabase/auth.ts (local DB password auth + session tokens)
 *   - Library: @/lib/supabase/server.ts (getLocalAuthUser)
 *   - Library: @/lib/puspa-auth.ts (HMAC session token creation/verification)
 *   - Library: @/lib/auth.ts (requireAuth, requireRole)
 *   - Client: @/components/auth-provider.tsx (AuthProvider using API routes)
 *
 * Nothing imports this file. It is retained only for reference.
 * Do NOT add new imports from this module.
 */

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Deprecated: Use /api/v1/auth/supabase/login' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
}
