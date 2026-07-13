import { create } from 'zustand'

interface AuthUser {
  id: string
  nombre: string
  email: string
  tema: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
  setTheme: (tema: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setTheme: (tema) => set((state) => ({
    user: state.user ? { ...state.user, tema } : null,
  })),
}))
