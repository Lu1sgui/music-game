'use client'
// app/components/PlayerModal.tsx
import { useState, useEffect } from 'react'
import { X, Flame } from 'lucide-react'
import Avatar from './Avatar'
import { ChipIconGlowing, AchievementIcon } from './ChipIcon'

const TIER_BORDER: Record<string,string> = { BRONZE:'#CD9060', SILVER:'#C0C0D0', GOLD:'#FFD700', PLATINUM:'#CECBF6', SPECIAL:'#9FE1CB' }
const RARITY_COLOR: Record<string,string> = { COMMON:'#888780', RARE:'#7F77DD', LEGENDARY:'#FFD700' }
const MEDALS = ['🥇','🥈','🥉']

export default function PlayerModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(async r => {
        const t = await r.text()
        if (t) try { setPlayer(JSON.parse(t)) } catch {}
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [username])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const chips = player?.userChips ?? []
  const achievements = player?.userAchievements ?? []
  const medal = player?.rank <= 3 ? MEDALS[player.rank - 1] : null

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', inset:0, zIndex:201, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'1rem', pointerEvents:'none' }}>
        <div onClick={e => e.stopPropagation()} className="anim-slide-up"
          style={{ width:'100%', maxWidth:480, maxHeight:'88dvh', background:'var(--bg-card)',
                   border:'1px solid var(--border)', borderRadius:'12px 12px 4px 4px',
                   overflow:'hidden', display:'flex', flexDirection:'column', pointerEvents:'auto' }}>

          {/* Header */}
          <div style={{ padding:'0.875rem 1.25rem', background:'var(--bg-hi)', borderBottom:'1px solid var(--border)',
                        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span className="font-pixel txt-cyan" style={{ fontSize:9 }}>PLAYER PROFILE</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ overflowY:'auto', flex:1, padding:'1.25rem' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'2rem' }}>
                <span className="font-pixel txt-pink" style={{ fontSize:9 }}>LOADING<span className="anim-blink">_</span></span>
              </div>
            ) : !player ? (
              <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem', fontSize:'0.85rem' }}>Player not found</div>
            ) : (
              <>
                {/* Avatar + medal overlaid at bottom-center */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:'1.5rem' }}>
                  <div style={{
                    position: 'relative',
                    width: 72, height: 72,   /* match Avatar size */
                    /* bottom padding so medal doesn't clip */
                    marginBottom: medal ? 16 : 0,
                  }}>
                    <Avatar seed={player.avatarSeed} style={player.avatarStyle ?? 'miniavs'} size={72} />
                    {medal && (
                      <div style={{
                        position: 'absolute',
                        bottom: -16,         /* half-overlaps below the circle */
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 28, lineHeight: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.9))',
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}>
                        {medal}
                      </div>
                    )}
                    {!medal && (
                      <div style={{
                        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 3, padding: '1px 6px',
                        fontFamily: 'var(--font-pixel)', fontSize: 8, color: 'var(--muted)',
                        lineHeight: '16px', whiteSpace: 'nowrap',
                      }}>
                        #{player.rank}
                      </div>
                    )}
                  </div>

                  {/* Identity — pushed down to account for medal margin */}
                  <div style={{ paddingTop: medal ? 8 : 0 }}>
                    <div className="font-title" style={{ fontSize:'1.4rem' }}>@{player.username}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{player.role}</div>
                    {player.streakWeeks >= 3 && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4, fontSize:'0.8rem', color:'var(--orange)' }}>
                        <Flame size={13} /> {player.streakWeeks} week streak
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1.25rem' }}>
                  {[
                    { label:'RANK',   value:`#${player.rank}`,   color:'var(--yellow)' },
                    { label:'POINTS', value:player.totalPoints,   color:'var(--pink)' },
                    { label:'BADGES', value:achievements.length,  color:'var(--cyan)' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--bg)', borderRadius:4, padding:'10px 4px', textAlign:'center' }}>
                      <div className="font-pixel" style={{ fontSize:11, color:s.color }}>{s.value}</div>
                      <div className="label" style={{ marginBottom:0, marginTop:4, fontSize:'0.62rem' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chips */}
                {chips.length > 0 && (
                  <div style={{ marginBottom:'1.25rem' }}>
                    <span className="font-pixel txt-yellow" style={{ fontSize:8 }}>⚡ CHIPS</span>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:'0.5rem' }}>
                      {chips.map((uc: any) => (
                        <div key={uc.chip.slug}
                          className="has-tooltip" data-tooltip={uc.chip.description}
                          style={{ padding:'6px 10px', borderRadius:4, border:`1px solid ${RARITY_COLOR[uc.chip.rarity]}`,
                                   background:`${RARITY_COLOR[uc.chip.rarity]}18`, display:'flex', alignItems:'center', gap:6 }}>
                          <ChipIconGlowing slug={uc.chip.slug} rarity={uc.chip.rarity} size={20} />
                          <div>
                            <div className="font-ui" style={{ fontSize:'0.78rem' }}>{uc.chip.name}</div>
                            <div style={{ fontSize:'0.62rem', color:RARITY_COLOR[uc.chip.rarity] }}>{uc.chip.rarity} ×{uc.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {achievements.length > 0 && (
                  <div>
                    <span className="font-pixel txt-cyan" style={{ fontSize:8 }}>ACHIEVEMENTS ({achievements.length})</span>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:'0.5rem' }}>
                      {achievements.map((ua: any) => (
                        <div key={ua.achievement.slug}
                          className="has-tooltip" data-tooltip={ua.achievement.description}
                          style={{ padding:'0.6rem', borderRadius:4, background:'var(--bg)',
                                   borderTop:`2px solid ${TIER_BORDER[ua.achievement.badgeTier] ?? '#888'}`,
                                   display:'flex', alignItems:'center', gap:8 }}>
                          <AchievementIcon slug={ua.achievement.slug} tier={ua.achievement.badgeTier} size={16} />
                          <div>
                            <div className="font-ui" style={{ fontSize:'0.78rem' }}>{ua.achievement.name}</div>
                            <div style={{ fontSize:'0.62rem', color:'var(--muted)' }}>{ua.achievement.badgeTier}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
