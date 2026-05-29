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
  isImpersonating: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  refreshUser: () => Promise<void>
  impersonate: (targetUserId: number) => Promise<boolean>
  returnToAdmin: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null)
  const [token, setToken]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('wb_token')
    const u = localStorage.getItem('wb_user')
    const adminBackup = localStorage.getItem('wb_admin_backup')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    if (adminBackup) setIsImpersonating(true)
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
    localStorage.removeItem('wb_admin_backup')
    setToken(null)
    setUser(null)
    setIsImpersonating(false)
  }

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('wb_token')
    if (!t) return
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      if (!res.ok) return
      const data = await res.json()
      const updated: AuthUser = {
        id: data.id, username: data.username, role: data.role,
        totalPoints: data.totalPoints, streakWeeks: data.streakWeeks,
        avatarSeed: data.avatarSeed, avatarStyle: data.avatarStyle,
      }
      setUser(updated)
      localStorage.setItem('wb_user', JSON.stringify(updated))
    } catch {}
  }, [])

  const impersonate = useCallback(async (targetUserId: number): Promise<boolean> => {
    const t = localStorage.getItem('wb_token')
    if (!t) return false

    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ userId: targetUserId }),
    })
    if (!res.ok) return false

    const data = await res.json()
    // Save current admin session for later return
    const backup = { token: t, user: localStorage.getItem('wb_user') }
    localStorage.setItem('wb_admin_backup', JSON.stringify(backup))

    // Replace with impersonated session
    localStorage.setItem('wb_token', data.token)
    localStorage.setItem('wb_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    setIsImpersonating(true)
    return true
  }, [])

  const returnToAdmin = useCallback(() => {
    const backup = localStorage.getItem('wb_admin_backup')
    if (!backup) return
    const { token: t, user: u } = JSON.parse(backup)
    localStorage.setItem('wb_token', t)
    localStorage.setItem('wb_user', u)
    localStorage.removeItem('wb_admin_backup')
    setToken(t)
    setUser(JSON.parse(u))
    setIsImpersonating(false)
    window.location.href = '/'
  }, [])

  return (
    <Ctx.Provider value={{ user, token, loading, isImpersonating, login, logout, refreshUser, impersonate, returnToAdmin }}>
      {children}
    </Ctx.Provider>
  )
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
