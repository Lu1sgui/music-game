'use client'
// app/change-password/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function ChangePasswordPage() {
  const { user, token, refreshUser } = useAuth()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirm, setConfirm]                 = useState('')
  const [mustChange, setMustChange]           = useState(false)
  const [error, setError]                     = useState('')
  const [success, setSuccess]                 = useState(false)
  const [loading, setLoading]                 = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    // Check if user must change password
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} })
      .then(me => setMustChange(!!me.mustChangePassword))
  }, [user])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) { setError('Passwords do not match'); return }
    if (newPassword.length < 8)  { setError('New password must be at least 8 characters'); return }

    setLoading(true)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: mustChange ? undefined : currentPassword, newPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    await refreshUser()
    setSuccess(true)
    setTimeout(() => router.push('/'), 1500)
  }

  if (success) return (
    <div className="page flex-center" style={{ minHeight: '80dvh', flexDirection: 'column', gap: 16 }}>
      <span className="font-pixel txt-green" style={{ fontSize: 13 }}>✓ PASSWORD UPDATED</span>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Redirecting...</p>
    </div>
  )

  return (
    <div className="page">
      <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: '2rem' }}>
        <form onSubmit={submit} className="card corners" style={{ padding: '1.5rem' }}>
          <h2 className="font-title txt-cyan" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            CHANGE PASSWORD
          </h2>
          {mustChange && (
            <p style={{ fontSize: '0.82rem', color: 'var(--orange)', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.5 }}>
              Your password was reset. Please set a new one to continue.
            </p>
          )}

          {!mustChange && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="label">Current password</label>
              <input className="input" type="password" required
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
          )}
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">New password</label>
            <input className="input" type="password" required minLength={8}
              value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Confirm new password</label>
            <input className="input" type="password" required
              value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', marginBottom: '1rem',
                          background: 'rgba(255,45,135,.1)', border: '1px solid var(--pink)',
                          borderRadius: 4, fontSize: '0.85rem', color: 'var(--pink)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-pink" disabled={loading}>
            {loading ? 'UPDATING...' : '⚡ UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  )
}
