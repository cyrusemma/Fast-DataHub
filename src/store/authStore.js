import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      profile: null,
      session: null,
      isAuthenticated: false,
      setAuth: (profile, session) => set({ profile, session, isAuthenticated: true }),
      updateProfile: (u) => set((s) => ({ profile: { ...s.profile, ...u } })),
      clearAuth: () => set({ profile: null, session: null, isAuthenticated: false }),
    }),
    { name: 'datahub-auth' }
  )
)
