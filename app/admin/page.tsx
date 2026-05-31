'use client'
// app/admin/page.tsx
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, RotateCcw, UserCheck, RefreshCw } from 'lucide-react'
import { useAuth, useApi } from '../context/AuthContext'

const CHIP_SLUGS = [
  // Original
  'flash','smokescreen','substitute','recover','swift','haze','night-shade',
  'swords-dance','double-team','disable','reflect','mimic','confuse-ray','leech-seed',
  'mega-drain','screech','metronome','spore','bide','skull-bash',
  // Expansion (enabled)
  'cushion','spotlight','insight','gamble','foresight','amnesty',
  'toxic','payday','protect','bounty','cleanse','mirror-coat',
  'usurp','earthquake','time-bomb','curse',
  'veto','insurance','pickpocket','blackout','crown',
  'wildcard','donation','decree',
  'switcheroo','copycat','mute',
]

const CYCLE_ACTIONS: Record<string, { label: string; next: string; color: string }> = {
  PENDING:  { label: 'Open Submissions',  next: 'open',    color: 'var(--green)' },
  OPEN:     { label: 'Close Submissions', next: 'close',   color: 'var(--orange)' },
  CLOSED:   { label: 'Reveal Results',    next: 'reveal',  color: 'var(--cyan)' },
  REVEALED: { label: 'Archive Cycle',     next: 'archive', color: 'var(--muted)' },
}

export default function AdminPage() {
  const { user, impersonate } = useAuth()
  const api = useApi()
  const router = useRouter()

  const [users, setUsers]   = useState<any[]>([])
  const [cycle, setCycle]   = useState<any>(null)
  const [gmUserId, setGmUserId]     = useState('')
  const [chipUserId, setChipUserId] = useState('')
  const [resetPasswordUser, setResetPasswordUser] = useState('')
  const [impersonateUser, setImpersonateUser] = useState('')
  const [resetResult, setResetResult] = useState<{ tempPassword?: string; emailSentTo?: string } | null>(null)
  const [chipSlug, setChipSlug]     = useState('')
  const [msg, setMsg]       = useState('')
  const [loading, setLoading] = useState(true)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastEmail, setBroadcastEmail] = useState(false)
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  const loadData = () => {
    Promise.all([
      fetch('/api/ladder').then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/cycle/current').then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
    ]).then(([l, c]) => {
      // Admin sees ALL users for assignment, not just ladder players
      setUsers(l.ladder ?? [])
      setCycle(c)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'ADMIN') { router.push('/'); return }
    loadData()
  }, [user])

  const flash = (msg: string) => { setMsg(msg); setTimeout(() => setMsg(''), 5000) }

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return
    setSendingBroadcast(true)
    const res = await api.post('/api/admin/broadcast', { message: broadcastMsg.trim(), email: broadcastEmail })
    setSendingBroadcast(false)
    if (res.error) { flash(res.error) }
    else {
      flash(`✓ Broadcast sent${broadcastEmail ? ` (${res.emailed} emails)` : ''}`)
      setBroadcastMsg('')
    }
  }

  const assignGM = async () => {
    if (!gmUserId) return
    // gmUserId is the actual database user id (p.id)
    const res = await api.patch('/api/admin/assign-gm', { userId: parseInt(gmUserId) })
    flash(res.error ? `Error: ${res.error}` : `✓ ${res.message}`)
    loadData()
  }

  const giveChip = async () => {
    if (!chipUserId || !chipSlug) return
    // chipUserId is the actual database user id (p.id)
    const res = await api.post('/api/admin/chips', { userId: parseInt(chipUserId), chipSlug })
    flash(res.error ? `Error: ${res.error}` : `✓ ${res.message}`)
  }

  const cycleAction = async (action: string) => {
    const res = await api.post('/api/admin/cycle', { action })
    flash(res.error ? `Error: ${res.error}` : `✓ ${res.message}`)
    loadData()
  }

  const resetPassword = async () => {
    if (!resetPasswordUser) return
    if (!confirm('Reset password for this user? They will receive an email with a temporary password.')) return
    const res = await api.post('/api/admin/reset-password', { userId: parseInt(resetPasswordUser) })
    if (res.error) { flash(`Error: ${res.error}`); return }
    setResetResult({ tempPassword: res.tempPassword, emailSentTo: res.emailSentTo })
    flash(`✓ ${res.message}`)
  }

  const loginAsUser = async () => {
    if (!impersonateUser) return
    const u = users.find((p: any) => p.id === parseInt(impersonateUser))
    if (!u) return
    if (!confirm(`Log in as @${u.username}? You'll be able to return to your admin account anytime.`)) return
    const ok = await impersonate(parseInt(impersonateUser))
    if (ok) router.push('/')
    else flash('Failed to impersonate')
  }

  if (loading) return (
    <div className="page flex-center" style={{ minHeight:'80dvh' }}>
      <span className="font-pixel txt-pink" style={{ fontSize:9 }}>LOADING<span className="anim-blink">_</span></span>
    </div>
  )

  const cycleStatus = cycle?.status ?? 'NONE'
  const cycleAction2 = CYCLE_ACTIONS[cycleStatus]

  return (
    <div className="page">
      <div style={{ paddingTop:'1.25rem', marginBottom:'1rem' }}>
        <h1 className="font-pixel txt-pink" style={{ fontSize:11 }}>⚡ ADMIN</h1>
      </div>

      {msg && (
        <div style={{ marginBottom:'1rem', padding:'10px 14px', borderRadius:4, fontSize:'0.85rem',
                      background: msg.startsWith('✓') ? 'rgba(57,255,20,.1)' : 'rgba(255,45,135,.1)',
                      border: `1px solid ${msg.startsWith('✓') ? 'var(--green)' : 'var(--pink)'}`,
                      color: msg.startsWith('✓') ? 'var(--green)' : 'var(--pink)' }}>
          {msg}
        </div>
      )}

      {/* ── Cycle state machine ──────────────────────────────── */}
      <div className="card corners anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
          <span className="font-ui" style={{ color:'var(--cyan)' }}>CYCLE CONTROL</span>
          <button onClick={loadData} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div style={{ marginBottom:'1rem', padding:'10px 12px', background:'var(--bg)', borderRadius:4 }}>
          <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>CURRENT CYCLE</div>
          <div className="font-ui" style={{ fontSize:'1rem' }}>
            {cycle?.weekNumber ? `Week ${cycle.weekNumber} · ${cycle.theme ?? 'No theme'}` : 'No active cycle'}
          </div>
          {cycle?.status && (
            <span className={`badge badge-${cycle.status.toLowerCase()}`} style={{ marginTop:4 }}>
              {cycle.status}
            </span>
          )}
          {cycle?.gm && (
            <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:4 }}>GM: @{cycle.gm.username}</div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {/* Next natural action */}
          {cycleAction2 && (
            <button className="btn btn-cyan" style={{ borderColor: cycleAction2.color, color: cycleAction2.color }}
              onClick={() => cycleAction(cycleAction2.next)}>
              {cycleAction2.label}
            </button>
          )}
          {/* Create new cycle */}
          {cycleStatus === 'ARCHIVED' && (
            <button className="btn btn-cyan" onClick={() => cycleAction('new')}>Create New Cycle (PENDING)</button>
          )}
          {/* Force reset always available */}
          <button className="btn btn-red btn-sm" style={{ width:'auto' }}
            onClick={() => { if (confirm('Force reset: archive current + open new. Continue?')) cycleAction('reset') }}>
            <RotateCcw size={13} /> FORCE RESET
          </button>
        </div>
      </div>

      {/* ── Assign GM ────────────────────────────────────────── */}
      <div className="card corners anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
          <UserCheck size={14} style={{ color:'var(--purple)' }} />
          <span className="font-ui" style={{ color:'var(--purple)' }}>ASSIGN GAME MASTER</span>
        </div>
        <label className="label">Select player</label>
        {/* Use p.id as value — NOT p.rank! */}
        <select className="input" value={gmUserId} onChange={e => setGmUserId(e.target.value)} style={{ marginBottom:'0.75rem' }}>
          <option value="">— Select a player —</option>
          {users.map((p: any) => (
            <option key={p.id} value={p.id}>{p.username} (#{p.rank} · {p.totalPoints} pts)</option>
          ))}
        </select>
        <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={assignGM} disabled={!gmUserId}>
          <UserCheck size={13} /> ASSIGN GM
        </button>
      </div>

      {/* ── Give chip ────────────────────────────────────────── */}
      <div className="card corners-yellow anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
          <Zap size={14} style={{ color:'var(--yellow)' }} />
          <span className="font-ui txt-yellow">GIVE CHIP TO PLAYER</span>
        </div>
        <label className="label">Player</label>
        {/* Use p.id as value — NOT p.rank! */}
        <select className="input" value={chipUserId} onChange={e => setChipUserId(e.target.value)} style={{ marginBottom:'0.5rem' }}>
          <option value="">— Select player —</option>
          {users.map((p: any) => (
            <option key={p.id} value={p.id}>{p.username}</option>
          ))}
        </select>
        <label className="label">Chip</label>
        <select className="input" value={chipSlug} onChange={e => setChipSlug(e.target.value)} style={{ marginBottom:'0.75rem' }}>
          <option value="">— Select chip —</option>
          {CHIP_SLUGS.map(s => (
            <option key={s} value={s}>{s.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={giveChip} disabled={!chipUserId || !chipSlug}>
          <Zap size={13} /> GIVE CHIP
        </button>
      </div>

      {/* ── Impersonate user ──────────────────────────────── */}
      <div className="card corners anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
          <span style={{ fontSize:14 }}>👁</span>
          <span className="font-ui" style={{ color:'var(--cyan)' }}>IMPERSONATE USER</span>
        </div>
        <p style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:'0.75rem', lineHeight:1.5 }}>
          Log in as any player to see what they see. You can return to your admin account anytime.
        </p>
        <label className="label">Select player</label>
        <select className="input" value={impersonateUser} onChange={e => setImpersonateUser(e.target.value)} style={{ marginBottom:'0.75rem' }}>
          <option value="">— Select a player —</option>
          {users.map((p: any) => (
            <option key={p.id} value={p.id}>{p.username} ({p.role ?? 'PLAYER'})</option>
          ))}
        </select>
        <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={loginAsUser} disabled={!impersonateUser}>
          👁 LOGIN AS USER
        </button>
      </div>

      {/* ── Reset password ────────────────────────────────── */}
      <div className="card corners anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
          <span style={{ fontSize:14 }}>🔑</span>
          <span className="font-ui" style={{ color:'var(--orange)' }}>RESET USER PASSWORD</span>
        </div>
        <label className="label">Select player</label>
        <select className="input" value={resetPasswordUser} onChange={e => setResetPasswordUser(e.target.value)} style={{ marginBottom:'0.75rem' }}>
          <option value="">— Select a player —</option>
          {users.map((p: any) => (
            <option key={p.id} value={p.id}>{p.username}</option>
          ))}
        </select>
        <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={resetPassword} disabled={!resetPasswordUser}>
          🔑 RESET PASSWORD
        </button>
        {resetResult && (
          <div style={{ marginTop:'0.75rem', padding:'10px 12px', background:'rgba(255,215,0,.1)',
                        border:'1px solid var(--yellow)', borderRadius:4, fontSize:'0.82rem' }}>
            <div style={{ color:'var(--muted)', marginBottom:4 }}>Temporary password (also sent to {resetResult.emailSentTo}):</div>
            <code style={{ fontFamily:'monospace', fontSize:'1.05rem', color:'var(--yellow)', letterSpacing:'1px' }}>
              {resetResult.tempPassword}
            </code>
            <div style={{ marginTop:8, fontSize:'0.72rem', color:'var(--muted)' }}>
              The user will be forced to change it on next login.
            </div>
          </div>
        )}
      </div>

      {/* ── Broadcast to all players ─────────────────────────── */}
      <div className="card corners" style={{ padding:'1.25rem', marginTop:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.75rem' }}>
          <span className="font-ui" style={{ color:'var(--cyan)' }}>📢 BROADCAST</span>
        </div>
        <textarea className="input" rows={3} placeholder="Message to all active players..."
          value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
          style={{ resize:'none', marginBottom:'0.75rem' }} />
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.75rem', fontSize:'0.82rem', color:'var(--muted)', cursor:'pointer' }}>
          <input type="checkbox" checked={broadcastEmail} onChange={e => setBroadcastEmail(e.target.checked)} />
          Also send as email (to opted-in players only)
        </label>
        <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={sendBroadcast} disabled={sendingBroadcast || !broadcastMsg.trim()}>
          {sendingBroadcast ? 'SENDING...' : 'SEND BROADCAST'}
        </button>
      </div>
    </div>
  )
}
