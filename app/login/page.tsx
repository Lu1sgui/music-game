'use client'
// app/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Login failed'); return }

    login(data.token, data.user)
    // Forced password change after admin reset
    if (data.user.mustChangePassword) {
      router.push('/change-password')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="font-pixel txt-pink anim-flicker" style={{ fontSize: 13, marginBottom: 6 }}>WEEKLY</h1>
          <h1 className="font-pixel txt-cyan" style={{ fontSize: 13 }}>BEATS ⚡</h1>
        </div>

        <form onSubmit={handle} className="card corners" style={{ padding: '1.5rem' }}>
          <h2 className="font-title" style={{ fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>
            LOGIN
          </h2>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">Email</label>
            <input className="input" type="email" required placeholder="your@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">Password</label>
            <input className="input" type="password" required placeholder="Your password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', marginBottom: '1rem',
                          background: 'rgba(255,45,135,.1)', border: '1px solid var(--pink)',
                          borderRadius: 4, fontSize: '0.85rem', color: 'var(--pink)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-pink" disabled={loading}>
            {loading ? 'LOGGING IN...' : '▶ LOGIN'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button type="button" onClick={() => router.push('/forgot-password')}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                       color: 'var(--cyan)', fontSize: '0.82rem', fontFamily: 'var(--font-ui)' }}>
              Forgot password?
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem',
                        borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--muted)' }}>
            New player?{' '}
            <button type="button" onClick={() => router.push('/register')}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                       color: 'var(--pink)', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
              CREATE ACCOUNT
            </button>
            <div style={{ marginTop: '0.75rem' }}>
              <button type="button" onClick={() => router.push('/manual')}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                         color: 'var(--cyan)', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                📖 READ THE GAME MANUAL
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
