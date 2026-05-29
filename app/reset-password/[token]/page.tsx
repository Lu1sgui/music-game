'use client'
// app/reset-password/[token]/page.tsx
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token  = params?.token as string

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to reset password'); return }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (success) return (
    <div className="page flex-center" style={{ minHeight: '80dvh', flexDirection: 'column', gap: 16 }}>
      <span className="font-pixel txt-green" style={{ fontSize: 13 }}>✓ PASSWORD UPDATED</span>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Redirecting to login...</p>
    </div>
  )

  return (
    <div className="page">
      <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="font-pixel txt-pink anim-flicker" style={{ fontSize: 13, marginBottom: 6 }}>WEEKLY</h1>
          <h1 className="font-pixel txt-cyan" style={{ fontSize: 13 }}>BEATS ⚡</h1>
        </div>

        <form onSubmit={submit} className="card corners-cyan" style={{ padding: '1.5rem' }}>
          <h2 className="font-title txt-cyan" style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
            NEW PASSWORD
          </h2>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">New password</label>
            <input className="input" type="password" required minLength={8}
              placeholder="At least 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Confirm password</label>
            <input className="input" type="password" required
              placeholder="Same again"
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
            {loading ? 'UPDATING...' : '⚡ SET NEW PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  )
}
