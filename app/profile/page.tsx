'use client'
// app/profile/page.tsx
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ChipIconGlowing, AchievementIcon } from '../components/ChipIcon'
import Avatar from '../components/Avatar'
import AvatarPicker from '../components/AvatarPicker'

const TIER_BORDER: Record<string,string> = { BRONZE:'#CD9060', SILVER:'#C0C0D0', GOLD:'#FFD700', PLATINUM:'#CECBF6', SPECIAL:'#9FE1CB' }
const RARITY_COLOR: Record<string,string> = { COMMON:'#888780', RARE:'#7F77DD', LEGENDARY:'#FFD700' }

// Human-readable reason for each achievement condition
function achievedBecause(ua: any): string {
  const a = ua.achievement
  const map: Record<string, string> = {
    SUBMISSION_COUNT: `Submitted ${a.conditionValue} song${a.conditionValue > 1 ? 's' : ''}`,
    PODIUM_COUNT:     `Reached the podium ${a.conditionValue} time${a.conditionValue > 1 ? 's' : ''}`,
    TOP_1_COUNT:      `Won 1st place ${a.conditionValue} time${a.conditionValue > 1 ? 's' : ''}`,
    STREAK_WEEKS:     `${a.conditionValue} consecutive weeks`,
    GM_COUNT:         `Served as GM ${a.conditionValue} time${a.conditionValue > 1 ? 's' : ''}`,
    SPECIAL:          a.description,
  }
  return map[a.conditionType] ?? a.description
}

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [me, setMe]           = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rank, setRank]       = useState<number | null>(null)
  const [editAvatar, setEditAvatar] = useState(false)
  const [newSeed, setNewSeed]   = useState('')
  const [newStyle, setNewStyle] = useState('miniavs')
  const [saving, setSaving]     = useState(false)
  const [emailOptIn, setEmailOptIn] = useState(true)
  const [savingEmail, setSavingEmail] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
      fetch('/api/ladder')
        .then(async r => { const t = await r.text(); return t ? JSON.parse(t) : {} }),
    ]).then(([me, l]) => {
      setMe(me)
      setNewSeed(me.avatarSeed ?? user.username)
      setNewStyle(me.avatarStyle ?? 'miniavs')
      setEmailOptIn(me.emailOptIn ?? true)
      setRank(l.ladder?.find((p: any) => p.username === user.username)?.rank ?? null)
      setLoading(false)
    })
  }, [user])

  const toggleEmail = async () => {
    const next = !emailOptIn
    setEmailOptIn(next)
    setSavingEmail(true)
    await fetch('/api/auth/email-prefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emailOptIn: next }),
    }).catch(() => setEmailOptIn(!next)) // revert on failure
    setSavingEmail(false)
  }

  const saveAvatar = async () => {
    setSaving(true)
    await fetch('/api/auth/avatar', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatarSeed: newSeed, avatarStyle: newStyle }),
    })
    await refreshUser()   // updates sidebar avatar
    setMe((prev: any) => ({ ...prev, avatarSeed: newSeed, avatarStyle: newStyle }))
    setSaving(false)
    setEditAvatar(false)
  }

  if (loading) return (
    <div className="page flex-center" style={{ minHeight:'80dvh' }}>
      <span className="font-pixel txt-pink" style={{ fontSize:9 }}>LOADING<span className="anim-blink">_</span></span>
    </div>
  )

  const chips = me?.userChips ?? []
  const achievements = me?.userAchievements ?? []

  return (
    <div className="page">
      <div style={{ paddingTop:'1.25rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="font-pixel txt-cyan" style={{ fontSize:11 }}>PROFILE</h1>
        <button onClick={() => { logout(); router.push('/') }}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontFamily:'var(--font-ui)', fontWeight:600, fontSize:'0.8rem' }}>
          LOGOUT
        </button>
      </div>

      {/* Player card */}
      <div className="card corners anim-slide-up" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <div className="flex-between" style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative' }}>
              <Avatar seed={me?.avatarSeed} style={me?.avatarStyle ?? 'miniavs'} size={56} />
              <button onClick={() => setEditAvatar(v => !v)}
                style={{ position:'absolute', bottom:-2, right:-2, width:20, height:20, borderRadius:'50%',
                         background:'var(--pink)', border:'2px solid var(--bg-card)', display:'flex',
                         alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:9 }}>
                ✏
              </button>
            </div>
            <div>
              <div className="font-title" style={{ fontSize:'1.3rem' }}>@{me?.username}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{me?.role} · {new Date(me?.createdAt).getFullYear()}</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="font-pixel txt-yellow" style={{ fontSize:15 }}>{me?.totalPoints}</div>
            <div className="label" style={{ marginBottom:0 }}>POINTS</div>
          </div>
        </div>

        {/* Avatar editor */}
        {editAvatar && (
          <div style={{ marginBottom:'1rem', padding:'1rem', background:'var(--bg)', borderRadius:4, border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <span className="font-title txt-cyan" style={{ fontSize:'0.9rem' }}>CHANGE AVATAR</span>
              <button onClick={() => setEditAvatar(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18 }}>×</button>
            </div>
            <AvatarPicker initialSeed={newSeed} initialStyle={newStyle}
              onSelect={(s, st) => { setNewSeed(s); setNewStyle(st) }} />
            <div style={{ display:'flex', gap:8, marginTop:'0.75rem' }}>
              <button className="btn btn-pink btn-sm" style={{ flex:1 }} onClick={saveAvatar} disabled={saving}>
                {saving ? 'SAVING...' : <><Check size={13} /> SAVE</>}
              </button>
              <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={() => setEditAvatar(false)}>
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { label:'RANK',   value:rank ? `#${rank}` : '—',       color:'var(--yellow)' },
            { label:'STREAK', value:`${me?.streakWeeks ?? 0}W 🔥`,  color:'var(--orange)' },
            { label:'BADGES', value:achievements.length,             color:'var(--cyan)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg)', borderRadius:4, padding:'10px 4px', textAlign:'center' }}>
              <div className="font-pixel" style={{ fontSize:12, color:s.color }}>{s.value}</div>
              <div className="label" style={{ marginBottom:0, marginTop:4, fontSize:'0.62rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email preferences */}
      <div className="card" style={{ padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="font-ui" style={{ fontSize:'0.9rem' }}>📧 Email me game updates</div>
          <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>Weekly results & announcements (password emails always send)</div>
        </div>
        <button onClick={toggleEmail} disabled={savingEmail} aria-label="Toggle game emails"
          style={{ position:'relative', width:46, height:26, borderRadius:13, border:'none', cursor:'pointer',
                   background: emailOptIn ? 'var(--green)' : 'var(--border)', transition:'background .15s', flexShrink:0 }}>
          <span style={{ position:'absolute', top:3, left: emailOptIn ? 23 : 3, width:20, height:20, borderRadius:'50%',
                         background:'#fff', transition:'left .15s' }} />
        </button>
      </div>

      {/* Chips with description tooltip */}
      <div style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem' }}>
          <span className="font-pixel txt-yellow" style={{ fontSize:9 }}>⚡ CHIPS</span>
          <span style={{ fontSize:'0.72rem', color:'var(--muted)', marginLeft:'auto' }}>
            {chips.reduce((s: number, c: any) => s + c.quantity, 0)} / 5
          </span>
        </div>
        {chips.length === 0 ? (
          <div className="card" style={{ padding:'1rem', textAlign:'center', color:'var(--muted)', fontSize:'0.85rem' }}>
            No chips yet. Earn them through achievements and weekly play.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {chips.map((uc: any) => (
              <div key={uc.chip.slug} className="card has-tooltip" data-tooltip={uc.chip.description}
                style={{ padding:'0.75rem', borderLeft:`3px solid ${RARITY_COLOR[uc.chip.rarity]}`,
                         display:'flex', gap:12, alignItems:'center' }}>
                <ChipIconGlowing slug={uc.chip.slug} rarity={uc.chip.rarity} size={24} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span className="font-ui" style={{ fontSize:'0.95rem' }}>{uc.chip.name}</span>
                    <span className="font-pixel" style={{ fontSize:9, color:'var(--cyan)' }}>×{uc.quantity}</span>
                  </div>
                  <div style={{ fontSize:'0.75rem', color:RARITY_COLOR[uc.chip.rarity], marginTop:2 }}>{uc.chip.rarity}</div>
                  {/* Description visible always in profile */}
                  <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginTop:4, lineHeight:1.4 }}>
                    {uc.chip.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements with icon + earned reason */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem' }}>
          <span className="font-pixel txt-cyan" style={{ fontSize:9 }}>ACHIEVEMENTS ({achievements.length})</span>
        </div>
        {achievements.length === 0 ? (
          <div className="card" style={{ padding:'1rem', textAlign:'center', color:'var(--muted)', fontSize:'0.85rem' }}>
            Submit your first song to start unlocking achievements!
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {achievements.map((ua: any) => (
              <div key={ua.achievement.slug}
                className="has-tooltip"
                data-tooltip={ua.achievement.description}
                style={{ padding:'0.75rem', borderRadius:4, background:'var(--bg-card)',
                         borderTop:`2px solid ${TIER_BORDER[ua.achievement.badgeTier] ?? '#888'}`,
                         display:'flex', gap:8, alignItems:'flex-start' }}>
                <AchievementIcon slug={ua.achievement.slug} tier={ua.achievement.badgeTier} size={18} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="font-ui" style={{ fontSize:'0.82rem', marginBottom:2 }}>{ua.achievement.name}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--muted)' }}>{achievedBecause(ua)}</div>
                  {ua.achievement.pointsBonus > 0 && (
                    <div style={{ fontSize:'0.68rem', color:'var(--yellow)', marginTop:2 }}>+{ua.achievement.pointsBonus} pts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
