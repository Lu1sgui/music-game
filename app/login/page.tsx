'use client'
// app/login/page.tsx
import LoadingScreen from '../components/LoadingScreen'
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
    router.push('/')
  }

  return (
    <div className="page flex-center" style={{ minHeight:'100dvh', flexDirection:'column' }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <h1 className="font-pixel txt-pink anim-flicker" style={{ fontSize:13, marginBottom:6 }}>WEEKLY</h1>
          <h1 className="font-pixel txt-cyan" style={{ fontSize:13 }}>BEATS ⚡</h1>
          <p style={{ marginTop:'1rem', color:'var(--muted)', fontSize:'0.85rem' }}>
            Insert coin to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handle} className="card corners" style={{ padding:'1.5rem' }}>
          <h2 className="font-title" style={{ fontSize:'1.3rem', marginBottom:'1.5rem', textAlign:'center' }}>
            LOGIN
          </h2>

          <div style={{ marginBottom:'1rem' }}>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="your@email.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div style={{ marginBottom:'1.5rem' }}>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {error && (
            <div style={{ marginBottom:'1rem', padding:'8px 12px', background:'rgba(255,45,135,.1)',
                          border:'1px solid var(--pink)', borderRadius:4,
                          fontSize:'0.85rem', color:'var(--pink)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-pink" disabled={loading}>
            {loading ? 'LOADING...' : '▶ PLAY'}
          </button>

          <div style={{ marginTop:'1rem', textAlign:'center', fontSize:'0.85rem', color:'var(--muted)' }}>
            No account?{' '}
            <button type="button" onClick={() => router.push('/register')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--cyan)',
                       fontFamily:'Rajdhani', fontWeight:600, letterSpacing:'0.05em' }}>
              REGISTER
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
