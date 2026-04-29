// Local auth client - no Supabase dependency
// Auth is handled via API routes and session cookies
export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Use API login' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
}
