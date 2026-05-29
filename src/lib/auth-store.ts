import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: { id: string; nombre: string; email: string; tema: string } | null
  isAuthenticated: boolean
  login: (user: { id: string; nombre: string; email: string; tema: string }) => void
  logout: () => void
  setTheme: (tema: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setTheme: (tema) => set((state) => ({ user: state.user ? { ...state.user, tema } : null })),
    }),
    { name: 'agroeve-auth' }
  )
)
