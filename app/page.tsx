'use client'
// app/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Trophy, ChevronRight, Bell, X } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import CountdownTimer from './components/CountdownTimer'
import Avatar from './components/Avatar'
import { ChipIconGlowing } from './components/ChipIcon'
import LoadingScreen from './components/LoadingScreen'

const STATUS_BADGE: Record<string,string> = {
  OPEN:'badge-open', CLOSED:'badge-closed', REVEALED:'badge-revealed', PENDING:'badge-pending', ARCHIVED:'badge-archived',
}
const STATUS_LABEL: Record<string,string> = {
  OPEN:'● LIVE', CLOSED:'⏸ SCORING', REVEALED:'✦ REVEALED', PENDING:'◌ COMING SOON', ARCHIVED:'✓ ARCHIVED',
}
const CHIP_STATUS_COLOR: Record<string,string> = {
  PENDING: 'var(--yellow)', RESOLVED: 'var(--green)', CANCELLED: 'var(--muted)',
}
const CHIP_STATUS_LABEL: Record<string,string> = {
  PENDING: '⏳ PENDING', RESOLVED: '✓ ACTIVE', CANCELLED: '✗ CANCELLED',
}

export default function HomePage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [cycle, setCycle]     = useState<any>(null)
  const [ladder, setLadder]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    const fetches: Promise<any>[] = [
      fetch('/api/cycle/current', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/ladder')
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
    ]
    if (token) {
      fetches.push(
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
          .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} })
      )
    }
    Promise.all(fetches).then(([cycleData, ladderData, notifData]) => {
      setCycle(cycleData)
      setLadder(ladderData.ladder?.slice(0, 5) ?? [])
      if (notifData) {
        const unread = (notifData.notifications ?? []).filter((n: any) => !n.read)
        setNotifications(unread)
        if (unread.length > 0) setShowNotifs(true)
      }
      setLoading(false)
    })
  }, [token])

  const dismissNotifications = async () => {
    setShowNotifs(false)
    if (!token) return
    await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    setNotifications([])
  }

  if (loading) return <div className="page"><LoadingScreen /></div>

  const status = cycle?.status
  const isOpen = status === 'OPEN'
  const act = cycle?.myActivation

  return (
    <div className="page">
      {/* Header */}
      <div className="flex-between" style={{ paddingTop:'1.25rem', paddingBottom:'0.75rem' }}>
        <div>
          <h1 className="font-pixel txt-pink anim-flicker" style={{ fontSize:12 }}>WEEKLY</h1>
          <h1 className="font-pixel txt-cyan" style={{ fontSize:12 }}>BEATS ⚡</h1>
        </div>
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Notification bell */}
            {notifications.length > 0 && (
              <button onClick={() => setShowNotifs(v => !v)}
                style={{ position:'relative', background:'none', border:'none', cursor:'pointer', color:'var(--yellow)' }}>
                <Bell size={20} />
                <span style={{ position:'absolute', top:-4, right:-4, background:'var(--pink)',
                               color:'#fff', borderRadius:'50%', width:16, height:16,
                               display:'flex', alignItems:'center', justifyContent:'center',
                               fontSize:9, fontFamily:'var(--font-pixel)' }}>
                  {notifications.length}
                </span>
              </button>
            )}
            <div className="card flex-between" style={{ padding:'8px 12px', gap:8 }}>
              <Avatar seed={user.avatarSeed} style={user.avatarStyle} size={28} />
              <div style={{ textAlign:'right' }}>
                <div className="font-ui" style={{ fontSize:11, color:'var(--muted)' }}>{user.username}</div>
                <div className="font-pixel txt-yellow" style={{ fontSize:10 }}>{user.totalPoints} PTS</div>
              </div>
            </div>
          </div>
        ) : (
          <button className="btn btn-cyan btn-sm" onClick={() => router.push('/login')}>LOGIN</button>
        )}
      </div>

      {/* Notifications panel */}
      {showNotifs && notifications.length > 0 && (
        <div className="card anim-slide-up" style={{ marginBottom:'1rem', padding:'1rem',
                        border:'1px solid var(--yellow)', background:'rgba(255,215,0,.05)' }}>
          <div className="flex-between" style={{ marginBottom:'0.75rem' }}>
            <span className="font-pixel txt-yellow" style={{ fontSize:8 }}>🔔 NOTIFICATIONS</span>
            <button onClick={dismissNotifications}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {notifications.map((n: any) => (
              <div key={n.id} style={{ padding:'8px 10px', background:'var(--bg)', borderRadius:4,
                                       fontSize:'0.82rem', lineHeight:1.5,
                                       borderLeft:'3px solid var(--yellow)' }}>
                {n.message.replace(/\*\*/g, '')}
              </div>
            ))}
          </div>
          <button className="btn btn-cyan btn-sm" style={{ width:'auto', marginTop:'0.75rem' }}
            onClick={dismissNotifications}>
            Mark all read
          </button>
        </div>
      )}

      {/* Current cycle */}
      {cycle?.weekNumber ? (
        <div className="card corners anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
          <div className="flex-between" style={{ marginBottom:'0.75rem' }}>
            <span className="font-pixel" style={{ fontSize:8, color:'var(--muted)' }}>
              WEEK {cycle.weekNumber} · {cycle.year}
            </span>
            <span className={`badge ${STATUS_BADGE[status] ?? 'badge-pending'}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>

          {cycle.theme && (
            <>
              <div className="label">This week's theme</div>
              <h2 className="font-title txt-yellow" style={{ fontSize:'1.4rem', marginBottom:'0.25rem' }}>
                {cycle.theme}
              </h2>
              {cycle.themeDescription && (
                <p style={{ fontSize:'0.85rem', color:'var(--muted)', marginBottom:'0.75rem', lineHeight:1.5 }}>
                  {cycle.themeDescription}
                </p>
              )}
            </>
          )}

          <div className="divider" />
          <div style={{ display:'flex', gap:'1rem', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div className="label">Submissions</div>
              <span className="font-pixel txt-cyan" style={{ fontSize:11 }}>
                {cycle.submissionCount ?? 0} SONGS
              </span>
            </div>
            {isOpen && cycle.closesAt && <CountdownTimer target={cycle.closesAt} label="Closes in" />}
            {status === 'PENDING' && cycle.opensAt && <CountdownTimer target={cycle.opensAt} label="Opens in" />}
          </div>

          {isOpen && user && !cycle.mySubmission && (
            <button className="btn btn-pink anim-pulse-glow" style={{ marginTop:'1rem' }}
              onClick={() => router.push('/submit')}>
              ⚡ SUBMIT YOUR SONG
            </button>
          )}
          {isOpen && user && cycle.mySubmission && (
            <div style={{ marginTop:'1rem', padding:'10px', background:'rgba(57,255,20,.08)',
                          border:'1px solid var(--green)', borderRadius:4, fontSize:'0.85rem' }}>
              <span className="txt-green font-ui">✓ SUBMITTED:</span>
              <span style={{ marginLeft:8 }}>
                {cycle.mySubmission.songTitle} — {cycle.mySubmission.songArtist}
              </span>
            </div>
          )}
          {!user && isOpen && (
            <button className="btn btn-pink" style={{ marginTop:'1rem' }} onClick={() => router.push('/login')}>
              LOGIN TO SUBMIT
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding:'1.5rem', marginBottom:'1rem', textAlign:'center', color:'var(--muted)' }}>
          <div className="font-pixel" style={{ fontSize:9, marginBottom:8 }}>NO ACTIVE CYCLE</div>
          <p style={{ fontSize:'0.85rem' }}>A new cycle will start on Monday.</p>
        </div>
      )}

      {/* Active chip status — all chip types */}
      {act && user && (
        <div className="card anim-slide-up" style={{ padding:'1rem', marginBottom:'1rem',
                        borderLeft:`3px solid ${CHIP_STATUS_COLOR[act.status] ?? 'var(--border)'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <ChipIconGlowing slug={act.chip.slug} rarity={act.chip.rarity} size={22} />
            <span className="font-ui" style={{ fontWeight:700, fontSize:'0.95rem' }}>{act.chip.name}</span>
            <span style={{ marginLeft:'auto', fontSize:'0.65rem', fontFamily:'var(--font-pixel)',
                           color: CHIP_STATUS_COLOR[act.status] }}>
              {CHIP_STATUS_LABEL[act.status]}
            </span>
          </div>
          <div style={{ fontSize:'0.78rem', color:'var(--muted)', lineHeight:1.5, marginBottom: act.targetUser || act.effectData ? 6 : 0 }}>
            {act.chip.description}
          </div>
          {act.targetUser && (
            <div style={{ fontSize:'0.75rem', color:'var(--orange)', marginTop:4 }}>
              🎯 Target: @{act.targetUser.username}
            </div>
          )}
          {act.effectData?.rolledChip && (
            <div style={{ fontSize:'0.75rem', color:'var(--yellow)', marginTop:4 }}>
              🎲 Metronome rolled: <strong>{act.effectData.rolledChip}</strong>
            </div>
          )}
          {act.effectData?.mimickedChip && (
            <div style={{ fontSize:'0.75rem', color:'var(--cyan)', marginTop:4 }}>
              🪞 Mimicking: <strong>{act.effectData.mimickedChip}</strong>
            </div>
          )}
          {act.status === 'CANCELLED' && (
            <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:4, fontStyle:'italic' }}>
              This chip was cancelled (Haze, Disable, or Reflect)
            </div>
          )}
        </div>
      )}

      {/* Flash: live songs visible */}
      {act?.effectData === null && act?.chip?.effectType === 'FLASH' && act?.status === 'RESOLVED'
        && cycle?.submissions?.length > 0 && (
        <div className="anim-slide-up" style={{ marginBottom:'1rem' }}>
          <span className="font-pixel txt-yellow" style={{ fontSize:9 }}>⚡ FLASH — LIVE SUBMISSIONS</span>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:'0.5rem' }}>
            {cycle.submissions.map((s: any) => (
              <div key={s.id} className="card" style={{ padding:'0.75rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div className="font-ui" style={{ fontSize:'0.9rem' }}>{s.songTitle}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{s.songArtist}</div>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color:'var(--cyan)', fontSize:'1rem' }}>▶</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last week podium */}
      {cycle?.results && cycle.results.length > 0 && (
        <div className="anim-slide-up" style={{ marginBottom:'1rem' }}>
          <span className="font-pixel txt-yellow" style={{ fontSize:9 }}>★ HIGH SCORE — WEEK {cycle.weekNumber}</span>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:'0.5rem' }}>
            {cycle.results.slice(0,3).map((r: any) => (
              <div key={r.id} className="card card-hi corners-yellow flex-between" style={{ padding:'0.875rem 1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:18 }}>{r.position===1?'🥇':r.position===2?'🥈':'🥉'}</span>
                  <div>
                    <div className="font-ui">{r.submission?.user?.username ?? '???'}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--muted)' }}>
                      {r.submission?.songTitle} — {r.submission?.songArtist}
                    </div>
                  </div>
                </div>
                <a href={r.submission?.url} target="_blank" rel="noopener noreferrer"
                   style={{ color:'var(--cyan)', fontSize:'0.9rem' }}>▶</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ladder preview */}
      {ladder.length > 0 && (
        <div className="anim-slide-up">
          <div className="flex-between" style={{ marginBottom:'0.5rem' }}>
            <span className="font-pixel" style={{ fontSize:8, color:'var(--muted)' }}>GLOBAL LADDER</span>
            <button onClick={() => router.push('/ladder')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--cyan)',
                       fontSize:'0.8rem', display:'flex', alignItems:'center', gap:2 }}>
              <span className="font-ui">SEE ALL</span> <ChevronRight size={14} />
            </button>
          </div>
          <div className="card corners-cyan" style={{ overflow:'hidden' }}>
            {ladder.map((p: any, i: number) => (
              <div key={p.username} className="flex-between"
                   style={{ padding:'0.7rem 1rem',
                             borderBottom: i < ladder.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar seed={p.avatarSeed} style={p.avatarStyle ?? 'miniavs'} size={26} />
                  <span className="font-ui" style={{ fontSize:'0.9rem' }}>{p.username}</span>
                  {p.streakWeeks >= 3 && <span style={{ fontSize:'0.7rem', color:'var(--orange)' }}>🔥{p.streakWeeks}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="font-pixel" style={{ fontSize:8, color:'var(--muted)' }}>
                    {p.rank<=3?['🥇','🥈','🥉'][p.rank-1]:`#${p.rank}`}
                  </span>
                  <span className="font-pixel txt-pink" style={{ fontSize:10 }}>{p.totalPoints ?? '???'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GM/Admin links */}
      {user && (user.role==='ADMIN'||user.role==='GM') && (
        <div style={{ marginTop:'1rem', display:'flex', gap:8 }}>
          {user.role==='ADMIN' && (
            <button className="btn btn-cyan btn-sm" style={{ flex:1 }} onClick={() => router.push('/admin')}>
              <Zap size={14} /> ADMIN
            </button>
          )}
          <button className="btn btn-cyan btn-sm" style={{ flex:1 }} onClick={() => router.push('/gm')}>
            <Trophy size={14} /> GM PANEL
          </button>
        </div>
      )}
    </div>
  )
}
