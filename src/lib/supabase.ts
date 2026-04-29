// Legacy Supabase client stub - no longer uses Supabase
// All auth is now handled via API routes and local SQLite database
// This file is kept for backward compatibility only

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null } }),
    signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Use API login' } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: { message: 'Storage not available' } }),
      download: async () => ({ error: { message: 'Storage not available' } }),
      remove: async () => ({ error: { message: 'Storage not available' } }),
      createSignedUrl: async () => ({ error: { message: 'Storage not available' } }),
    }),
  },
  from: () => ({
    select: () => ({ data: null, error: { message: 'Not available' } }),
    insert: () => ({ data: null, error: { message: 'Not available' } }),
    update: () => ({ data: null, error: { message: 'Not available' } }),
    delete: () => ({ data: null, error: { message: 'Not available' } }),
  }),
}
