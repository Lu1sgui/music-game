'use client'
// app/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface AuthUser {
  id: number
  username: string
  role: 'ADMIN' | 'GM' | 'PLAYER'
  totalPoints: number
  streakWeeks: number
  avatarSeed?: string | null
  avatarStyle?: string
}

interface AuthCtx {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null)
  const [token, setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('wb_token')
    const u = localStorage.getItem('wb_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('wb_token', newToken)
    localStorage.setItem('wb_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('wb_token')
    localStorage.removeItem('wb_user')
    setToken(null)
    setUser(null)
  }

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('wb_token')
    if (!t) return
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      if (!res.ok) return
      const data = await res.json()
      // Merge full profile with auth user shape, preserving avatar fields
      const updated: AuthUser = {
        id: data.id, username: data.username, role: data.role,
        totalPoints: data.totalPoints, streakWeeks: data.streakWeeks,
        avatarSeed: data.avatarSeed, avatarStyle: data.avatarStyle,
      }
      setUser(updated)
      localStorage.setItem('wb_user', JSON.stringify(updated))
    } catch {}
  }, [])

  return <Ctx.Provider value={{ user, token, loading, login, logout, refreshUser }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function useApi() {
  const { token } = useAuth()
  const h = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) })
  return {
    get:   (path: string) => fetch(path, { headers: h() }).then(r => r.json()),
    post:  (path: string, data?: unknown) => fetch(path, { method: 'POST',  headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    patch: (path: string, data?: unknown) => fetch(path, { method: 'PATCH', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  }
}
