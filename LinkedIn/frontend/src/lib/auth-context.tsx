'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError, getStoredToken, setStoredToken } from '@/lib/api'

interface AuthUser {
  email: string
  fullName: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('tisoro_linkedin_user') : null
    if (raw && getStoredToken()) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        /* ignore corrupt storage */
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; email: string; fullName: string }>('/api/auth/login', {
      email,
      password,
    })
    setStoredToken(result.token)
    const authUser = { email: result.email, fullName: result.fullName }
    window.localStorage.setItem('tisoro_linkedin_user', JSON.stringify(authUser))
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    setStoredToken(null)
    window.localStorage.removeItem('tisoro_linkedin_user')
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

/** Redirects to /login if not authenticated. Call from the top of any protected page component. */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  return { user, loading }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}
