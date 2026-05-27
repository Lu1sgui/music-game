'use client'
// app/submit/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Music2, ExternalLink, Zap } from 'lucide-react'
import { useAuth, useApi } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

function detectPlatform(url: string): 'SPOTIFY' | 'YOUTUBE' | null {
  const u = url.toLowerCase().trim()
  if (u.includes('spotify.com')) return 'SPOTIFY'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE'
  return null
}

export default function SubmitPage() {
  const { user, token } = useAuth()
  const api = useApi()
  const router = useRouter()

  const [cycle, setCycle]           = useState<any>(null)
  const [cycleLoading, setCycleLoading] = useState(true)
  const [myChips, setMyChips]       = useState<any[]>([])
  const [form, setForm]             = useState({ url: '', songTitle: '', songArtist: '' })
  const [platform, setPlatform]     = useState<string | null>(null)
  const [chipSlug, setChipSlug]     = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [users, setUsers]           = useState<any[]>([])
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    Promise.all([
      fetch('/api/cycle/current', { headers: { Authorization: `Bearer ${token}` } })
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/ladder')
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
    ]).then(([c, me, l]) => {
      setCycle(c)
      setMyChips(me.userChips?.filter((uc: any) => uc.quantity > 0) ?? [])
      setUsers(l.ladder ?? [])
      setCycleLoading(false)
    })
  }, [user])

  const handleUrlChange = (url: string) => {
    setForm(f => ({ ...f, url }))
    setPlatform(detectPlatform(url))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // 1. Submit the song
    const res = await api.post('/api/submissions', { ...form, platform })
    if (res.error) { setError(res.error); setSubmitting(false); return }

    // 2. Activate chip if selected (don't block redirect on chip failure)
    if (chipSlug) {
      const selectedChip = myChips.find((uc: any) => uc.chip.slug === chipSlug)?.chip
      const chipRes = await api.post('/api/chips/activate', {
        chipSlug,
        ...(selectedChip?.requiresTarget && targetUserId ? { targetUserId: parseInt(targetUserId) } : {}),
      })
      if (chipRes.error) {
        // Still redirect — song was submitted, just log the chip issue
        console.warn('Chip activation failed:', chipRes.error)
      }
    }

    // Always redirect after song submission succeeds
    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => router.push('/'), 2000)
  }

  if (cycleLoading) return <div className="page"><LoadingScreen /></div>

  if (!cycle || cycle.status !== 'OPEN') return (
    <div className="page flex-center" style={{ minHeight:'80dvh', flexDirection:'column', gap:16 }}>
      <span style={{ fontSize:'2rem' }}>{cycle?.status === 'CLOSED' ? '⏸' : '◌'}</span>
      <span className="font-pixel" style={{ fontSize:9, color:'var(--muted)', textAlign:'center', lineHeight:2 }}>
        SUBMISSIONS {cycle?.status === 'PENDING' ? 'NOT OPEN YET' : 'CLOSED'}
      </span>
      <p style={{ color:'var(--muted)', fontSize:'0.8rem' }}>Check back Tuesday</p>
    </div>
  )

  if (cycle.mySubmission) return (
    <div className="page flex-center" style={{ minHeight:'80dvh', flexDirection:'column', gap:16 }}>
      <span className="font-pixel txt-green" style={{ fontSize:12 }}>✓ SUBMITTED</span>
      <div className="card corners-green" style={{ padding:'1.25rem', width:'100%', maxWidth:360 }}>
        <div className="label">Your song this week</div>
        <div className="font-title" style={{ fontSize:'1.1rem' }}>{cycle.mySubmission.songTitle}</div>
        <div style={{ color:'var(--muted)', fontSize:'0.85rem' }}>{cycle.mySubmission.songArtist}</div>
        <a href={cycle.mySubmission.url} target="_blank" rel="noopener noreferrer"
           style={{ marginTop:8, color:'var(--cyan)', display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem' }}>
          <ExternalLink size={12} /> Listen on {cycle.mySubmission.platform}
        </a>
      </div>
    </div>
  )

  if (success) return (
    <div className="page flex-center" style={{ minHeight:'80dvh', flexDirection:'column', gap:16 }}>
      <img src="/devinsloads.webp" alt="" width={120}
        style={{ imageRendering:'pixelated', animation:'float 2s ease-in-out infinite' }} />
      <span className="font-pixel txt-green anim-pulse-glow" style={{ fontSize:12 }}>✓ SUBMITTED!</span>
      <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>Heading back...</p>
    </div>
  )

  const selectedChip = myChips.find((uc: any) => uc.chip.slug === chipSlug)?.chip
  const ready = platform !== null && form.songTitle.trim() && form.songArtist.trim()

  return (
    <div className="page">
      <div style={{ paddingTop:'1.25rem', marginBottom:'1rem' }}>
        <h1 className="font-pixel txt-pink" style={{ fontSize:11 }}>
          <Music2 size={14} style={{ display:'inline', marginRight:6 }} />
          SUBMIT SONG
        </h1>
        {cycle.theme && (
          <p style={{ marginTop:6, color:'var(--muted)', fontSize:'0.85rem' }}>
            Theme: <span className="txt-yellow">{cycle.theme}</span>
          </p>
        )}
      </div>

      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div className="card corners anim-slide-up" style={{ padding:'1.25rem' }}>
          <label className="label">Spotify or YouTube link</label>
          <input className="input" type="url" required
            placeholder="https://open.spotify.com/track/..."
            value={form.url} onChange={e => handleUrlChange(e.target.value)} />
          {form.url && (
            <div style={{ marginTop:6, fontSize:'0.8rem', display:'flex', alignItems:'center', gap:6 }}>
              {platform
                ? <><span className="txt-green">✓</span><span style={{ color:'var(--muted)' }}>{platform} detected</span></>
                : <span style={{ color:'var(--orange)' }}>⚠ Use a Spotify or YouTube link</span>
              }
              {platform && (
                <a href={form.url} target="_blank" rel="noopener noreferrer"
                   style={{ color:'var(--cyan)', marginLeft:'auto', display:'flex', alignItems:'center', gap:3 }}>
                  <ExternalLink size={12} /> Preview
                </a>
              )}
            </div>
          )}
        </div>

        <div className="card corners-cyan anim-slide-up" style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <div>
            <label className="label">Song title</label>
            <input className="input" type="text" required placeholder="Song title"
              value={form.songTitle} onChange={e => setForm(f => ({ ...f, songTitle: e.target.value }))} />
          </div>
          <div>
            <label className="label">Artist</label>
            <input className="input" type="text" required placeholder="Artist name"
              value={form.songArtist} onChange={e => setForm(f => ({ ...f, songArtist: e.target.value }))} />
          </div>
        </div>

        {myChips.length > 0 && (
          <div className="card anim-slide-up" style={{ padding:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.75rem' }}>
              <Zap size={14} style={{ color:'var(--yellow)' }} />
              <span className="font-ui txt-yellow">Activate a chip (optional)</span>
            </div>
            <label className="label">Select chip</label>
            <select className="input" value={chipSlug}
              onChange={e => { setChipSlug(e.target.value); setTargetUserId('') }}>
              <option value="">— No chip this week —</option>
              {myChips.map((uc: any) => (
                <option key={uc.chip.slug} value={uc.chip.slug}>
                  {uc.chip.name} ({uc.chip.rarity}) ×{uc.quantity}
                </option>
              ))}
            </select>
            {selectedChip && (
              <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(155,89,182,.1)',
                            border:'1px solid var(--purple)', borderRadius:4,
                            fontSize:'0.82rem', color:'var(--muted)', lineHeight:1.5 }}>
                {selectedChip.description}
              </div>
            )}
            {selectedChip?.requiresTarget && (
              <div style={{ marginTop:'0.75rem' }}>
                <label className="label">Target player</label>
                <select className="input" value={targetUserId} onChange={e => setTargetUserId(e.target.value)}>
                  <option value="">— Select player —</option>
                  {users.filter((p: any) => p.username !== user?.username).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.username}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding:'10px 14px', background:'rgba(255,45,135,.1)',
                        border:'1px solid var(--pink)', borderRadius:4,
                        fontSize:'0.85rem', color:'var(--pink)' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-pink anim-pulse-glow" disabled={submitting || !ready}>
          {submitting ? 'SUBMITTING...' : ready ? '⚡ SUBMIT TO BATTLE' : 'Fill in all fields ↑'}
        </button>
      </form>
    </div>
  )
}
