import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppRole } from '@/lib/auth-shared'
import type { ViewId } from '@/types'

// ---------------------------------------------------------------------------
// Role types — determines which nav sections are visible
// ---------------------------------------------------------------------------
export type UserRole = AppRole

export interface AppState {
  currentView: ViewId
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  userRole: UserRole
  onboardingDone: boolean
  setView: (view: ViewId) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setUserRole: (role: UserRole) => void
  setOnboardingDone: (done: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'dashboard',
      sidebarOpen: false,
      sidebarCollapsed: true,
      commandPaletteOpen: false,
      userRole: 'staff',
      onboardingDone: false,
      setView: (view) => set({ currentView: view, sidebarOpen: false }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setUserRole: (role) => set({ userRole: role }),
      setOnboardingDone: (done) => set({ onboardingDone: done }),
    }),
    {
      name: 'puspa-app-state',
      partialize: (state) => ({
        onboardingDone: state.onboardingDone,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)
