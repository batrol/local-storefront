import { api, tokenStore } from '@/lib/apiClient'
import type { User } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  shop_name: string
  phone?: string
}

interface AuthResponse {
  token: string
  user: { data?: User } & User
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tokenStore.get()) return
    api<{ data: User }>('GET', '/me')
      .then((r) => setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const finish = useCallback((r: AuthResponse) => {
    tokenStore.set(r.token)
    setUser(r.user.data ?? r.user)
  }, [])

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => finish(await api<AuthResponse>('POST', '/auth/login', { email, password })),
    register: async (input) => finish(await api<AuthResponse>('POST', '/auth/register', { ...input })),
    logout: async () => {
      await api('POST', '/auth/logout').catch(() => undefined)
      tokenStore.clear()
      setUser(null)
      queryClient.clear()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
