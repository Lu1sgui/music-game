'use client'
// app/forgot-password/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    setMessage(data.message ?? 'Done.')
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="font-pixel txt-pink anim-flicker" style={{ fontSize: 13, marginBottom: 6 }}>WEEKLY</h1>
          <h1 className="font-pixel txt-cyan" style={{ fontSize: 13 }}>BEATS ⚡</h1>
        </div>

        <form onSubmit={submit} className="card corners" style={{ padding: '1.5rem' }}>
          <h2 className="font-title txt-cyan" style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
            RESET PASSWORD
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Email</label>
            <input className="input" type="email" required placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {message && (
            <div style={{ padding: '10px 14px', marginBottom: '1rem',
                          background: 'rgba(57,255,20,.08)', border: '1px solid var(--green)',
                          borderRadius: 4, fontSize: '0.85rem', color: 'var(--green)' }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn btn-pink" disabled={loading}>
            {loading ? 'SENDING...' : '⚡ SEND RESET LINK'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
            <button type="button" onClick={() => router.push('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)',
                       fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
              ← BACK TO LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
