'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AppRole } from '@/lib/auth-shared'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: AppRole
  supabaseId: string
}

interface AuthContextType {
  user: AuthUser | null
  supabaseUser: null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.role) {
          // We need to get the full user profile - try the supabase/me endpoint as well
          const meRes = await fetch('/api/v1/auth/supabase/me')
          if (meRes.ok) {
            const meData = await meRes.json()
            if (meData.success && meData.data?.user) {
              setUser(meData.data.user)
            } else {
              // Create a basic user from session data
              setUser({
                id: 'session',
                email: 'admin@puspa.org.my',
                name: data.data.role === 'developer' ? 'Pembangun PUSPA' : data.data.role === 'admin' ? 'Pentadbir PUSPA' : 'Kakitangan PUSPA',
                role: data.data.role,
                supabaseId: 'session',
              })
            }
          } else {
            setUser({
              id: 'session',
              email: 'admin@puspa.org.my',
              name: data.data.role === 'developer' ? 'Pembangun PUSPA' : data.data.role === 'admin' ? 'Pentadbir PUSPA' : 'Kakitangan PUSPA',
              role: data.data.role,
              supabaseId: 'session',
            })
          }
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Use the local login API route
      const res = await fetch('/api/v1/auth/supabase/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Log masuk gagal' }
      }

      // Set the session cookie via the login API
      // Then fetch user profile
      await fetchUser()

      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Log masuk gagal' }
    }
  }, [fetchUser])

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {}
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser: null,
        loading,
        signIn,
        signOut: handleSignOut,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
