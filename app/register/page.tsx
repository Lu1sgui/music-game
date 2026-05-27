'use client'
// app/register/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import AvatarPicker from '../components/AvatarPicker'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [avatarSeed, setAvatarSeed]   = useState('player-' + Math.random().toString(36).slice(2,8))
  const [avatarStyle, setAvatarStyle] = useState('miniavs')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, avatarSeed, avatarStyle }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Registration failed'); return }
    login(data.token, data.user)
    router.push('/')
  }

  return (
    <div className="page" style={{ paddingBottom: '2rem' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: '1.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="font-pixel txt-pink anim-flicker" style={{ fontSize: 13, marginBottom: 6 }}>WEEKLY</h1>
          <h1 className="font-pixel txt-cyan" style={{ fontSize: 13 }}>BEATS ⚡</h1>
          <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Create your player profile
          </p>
        </div>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Account fields */}
          <div className="card corners" style={{ padding: '1.25rem' }}>
            <h2 className="font-title" style={{ fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>
              NEW PLAYER
            </h2>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="label">Username</label>
              <input className="input" type="text" placeholder="@your_alias" required
                minLength={3} maxLength={30}
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="your@email.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="min 8 characters" required minLength={8}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          {/* Avatar picker */}
          <div className="card corners-cyan" style={{ padding: '1.25rem' }}>
            <h3 className="font-title txt-cyan" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              CHOOSE YOUR AVATAR
            </h3>
            <AvatarPicker
              initialSeed={avatarSeed}
              initialStyle={avatarStyle}
              onSelect={(seed, style) => { setAvatarSeed(seed); setAvatarStyle(style) }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,45,135,.1)',
                          border: '1px solid var(--pink)', borderRadius: 4,
                          fontSize: '0.85rem', color: 'var(--pink)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-pink" disabled={loading}>
            {loading ? 'CREATING...' : '▶ START GAME'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Already playing?{' '}
            <button type="button" onClick={() => router.push('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)',
                       fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
              LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
