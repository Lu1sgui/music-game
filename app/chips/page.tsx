'use client'
// app/chips/page.tsx — play up to 3 chips per cycle (Activation model v2)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { useAuth, useApi } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import { ChipIconGlowing } from '../components/ChipIcon'

const RARITY_COLOR: Record<string, string> = { COMMON: '#888780', RARE: '#7F77DD', LEGENDARY: '#FFD700', GOLDEN: '#FF8A00' }
// Enabled, non-target Common chips a Wildcard may become
const WILDCARD_OPTIONS = [
  { slug: 'cushion', name: 'Cushion' },
  { slug: 'spotlight', name: 'Spotlight' },
  { slug: 'insight', name: 'Insight' },
]

export default function ChipsPage() {
  const { user, token } = useAuth()
  const api = useApi()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [chips, setChips] = useState<any[]>([])
  const [mine, setMine] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null) // the chip being played
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  // per-chip params
  const [targetUserId, setTargetUserId] = useState('')
  const [wildcardSlug, setWildcardSlug] = useState('')
  const [donationSlug, setDonationSlug] = useState('')
  const [theme, setTheme] = useState('')
  const [swap, setSwap] = useState({ swapTitle: '', swapArtist: '', swapUrl: '' })

  const load = () => {
    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/chips/mine', { headers: { Authorization: `Bearer ${token}` } }).then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/ladder').then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
    ]).then(([me, m, l]) => {
      setChips((me.userChips ?? []).filter((uc: any) => uc.quantity > 0))
      setMine(m)
      setUsers(l.ladder ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { if (!user) { router.push('/login'); return } load() }, [user])

  const resetParams = () => { setTargetUserId(''); setWildcardSlug(''); setDonationSlug(''); setTheme(''); setSwap({ swapTitle: '', swapArtist: '', swapUrl: '' }) }

  const status = mine?.cycle?.status ?? null
  const played = mine?.played ?? 0
  const limit = mine?.limit ?? 3
  const atLimit = played >= limit
  const sporeLocked = mine?.sporeLocked

  // Is a chip playable right now given its phase and the cycle status?
  const playable = (chip: any) => {
    if (!status) return false
    if (chip.phase === 'OPEN_ONLY') return status === 'OPEN'
    return status === 'OPEN' || status === 'CLOSED' // ANYTIME
  }

  const play = async () => {
    if (!selected) return
    const c = selected.chip
    const body: any = { chipSlug: c.slug }
    if (c.requiresTarget) {
      if (!targetUserId) { setMsg('Pick a target'); return }
      body.targetUserId = parseInt(targetUserId)
    }
    if (c.effectType === 'WILDCARD') { if (!wildcardSlug) { setMsg('Choose a Common chip'); return } body.wildcardSlug = wildcardSlug }
    if (c.effectType === 'DONATION') { if (!donationSlug) { setMsg('Choose a chip to donate'); return } body.donationSlug = donationSlug }
    if (c.effectType === 'DECREE') { if (!theme.trim()) { setMsg('Enter a theme'); return } body.theme = theme.trim() }
    if (c.effectType === 'SWITCHEROO') {
      if (!swap.swapTitle || !swap.swapArtist || !swap.swapUrl) { setMsg('Fill in the replacement song'); return }
      Object.assign(body, swap)
    }
    setBusy(true); setMsg('')
    const res = await api.post('/api/chips/activate', body)
    setBusy(false)
    if (res.error) { setMsg(res.error); return }
    setMsg(`✓ ${c.name} played!`)
    setSelected(null); resetParams(); load()
  }

  if (loading) return <div className="page"><LoadingScreen /></div>

  return (
    <div className="page">
      <div style={{ paddingTop: '1.25rem', marginBottom: '1rem' }}>
        <h1 className="font-pixel txt-yellow" style={{ fontSize: 11 }}><Zap size={14} style={{ display: 'inline', marginRight: 6 }} />MY CHIPS</h1>
        <p style={{ marginTop: 6, color: 'var(--muted)', fontSize: '0.82rem' }}>
          {status ? <>Week {mine.cycle.weekNumber} · <span className="txt-cyan">{status}</span> · played <span className="txt-yellow">{played}/{limit}</span> this week</> : 'No active cycle right now'}
        </p>
      </div>

      {sporeLocked && (
        <div className="card" style={{ padding: '10px 14px', marginBottom: '1rem', border: '1px solid var(--orange)', color: 'var(--orange)', fontSize: '0.82rem' }}>
          🍄 You're Spore-locked this week and can't activate chips.
        </div>
      )}

      {msg && (
        <div style={{ marginBottom: '1rem', padding: '8px 12px', borderRadius: 4, fontSize: '0.85rem',
          background: msg.startsWith('✓') ? 'rgba(57,255,20,.1)' : 'rgba(255,45,135,.1)',
          border: `1px solid ${msg.startsWith('✓') ? 'var(--green)' : 'var(--pink)'}`,
          color: msg.startsWith('✓') ? 'var(--green)' : 'var(--pink)' }}>{msg}</div>
      )}

      {atLimit && <div className="card" style={{ padding: '10px 14px', marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.82rem' }}>You've played all {limit} chips this week. Come back next cycle!</div>}

      {chips.length === 0 ? (
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
          No chips yet. Earn them through achievements and weekly play.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chips.map((uc: any) => {
            const c = uc.chip
            const canPlay = playable(c) && !atLimit && !sporeLocked
            const isSel = selected?.chip?.slug === c.slug
            return (
              <div key={c.slug} className="card" style={{ padding: '0.875rem 1rem', borderLeft: `3px solid ${RARITY_COLOR[c.rarity] ?? '#888'}`, opacity: canPlay || isSel ? 1 : 0.55 }}>
                <div className="flex-between">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ChipIconGlowing slug={c.slug} rarity={c.rarity} size={26} />
                    <div>
                      <div className="font-ui" style={{ fontSize: '0.95rem' }}>{c.name} <span style={{ color: 'var(--cyan)', fontSize: '0.75rem' }}>×{uc.quantity}</span></div>
                      <div style={{ fontSize: '0.72rem', color: RARITY_COLOR[c.rarity] ?? '#888' }}>{c.rarity} · {c.phase === 'OPEN_ONLY' ? 'Tue–Fri' : 'until reveal'}</div>
                    </div>
                  </div>
                  <button className="btn btn-sm" disabled={!canPlay}
                    style={{ width: 'auto', borderColor: canPlay ? 'var(--yellow)' : 'var(--border)', color: canPlay ? 'var(--yellow)' : 'var(--muted)' }}
                    onClick={() => { setSelected(isSel ? null : uc); resetParams(); setMsg('') }}>
                    {isSel ? 'Cancel' : canPlay ? 'Play' : (c.phase === 'OPEN_ONLY' && status !== 'OPEN' ? 'Closed' : '—')}
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>{c.description}</div>

                {/* Inline play form */}
                {isSel && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {c.requiresTarget && (
                      <div>
                        <label className="label">Target player</label>
                        <select className="input" value={targetUserId} onChange={e => setTargetUserId(e.target.value)}>
                          <option value="">— Select player —</option>
                          {users.filter((p: any) => c.effectType === 'CROWN' || p.username !== user?.username).map((p: any) => (
                            <option key={p.id} value={p.id}>{p.username}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {c.effectType === 'WILDCARD' && (
                      <div>
                        <label className="label">Becomes which Common?</label>
                        <select className="input" value={wildcardSlug} onChange={e => setWildcardSlug(e.target.value)}>
                          <option value="">— Choose —</option>
                          {WILDCARD_OPTIONS.map(o => <option key={o.slug} value={o.slug}>{o.name}</option>)}
                        </select>
                      </div>
                    )}
                    {c.effectType === 'DONATION' && (
                      <div>
                        <label className="label">Chip to give</label>
                        <select className="input" value={donationSlug} onChange={e => setDonationSlug(e.target.value)}>
                          <option value="">— Choose —</option>
                          {chips.filter((x: any) => x.chip.slug !== 'donation').map((x: any) => <option key={x.chip.slug} value={x.chip.slug}>{x.chip.name} ×{x.quantity}</option>)}
                        </select>
                      </div>
                    )}
                    {c.effectType === 'DECREE' && (
                      <div>
                        <label className="label">Next week's theme</label>
                        <input className="input" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. 90s nostalgia" />
                      </div>
                    )}
                    {c.effectType === 'SWITCHEROO' && (
                      <>
                        <div><label className="label">Replacement song title</label><input className="input" value={swap.swapTitle} onChange={e => setSwap(s => ({ ...s, swapTitle: e.target.value }))} /></div>
                        <div><label className="label">Replacement artist</label><input className="input" value={swap.swapArtist} onChange={e => setSwap(s => ({ ...s, swapArtist: e.target.value }))} /></div>
                        <div><label className="label">Replacement link (Spotify/YouTube)</label><input className="input" value={swap.swapUrl} onChange={e => setSwap(s => ({ ...s, swapUrl: e.target.value }))} /></div>
                      </>
                    )}
                    <button className="btn btn-pink btn-sm" onClick={play} disabled={busy}>{busy ? 'PLAYING...' : '⚡ PLAY CHIP'}</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* What you've played this week */}
      {mine?.activations?.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div className="font-pixel" style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 6 }}>PLAYED THIS WEEK</div>
          {mine.activations.map((a: any, i: number) => (
            <div key={i} className="card" style={{ padding: '8px 12px', marginBottom: 6, fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>{a.chipName}{a.target ? <span style={{ color: 'var(--muted)' }}> → @{a.target}</span> : ''}</span>
              <span style={{ color: a.status === 'RESOLVED' ? 'var(--green)' : 'var(--yellow)' }}>{a.status === 'RESOLVED' ? '✓' : '⏳'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
