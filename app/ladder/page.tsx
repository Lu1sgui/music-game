'use client'
// app/ladder/page.tsx
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'
import Avatar from '../components/Avatar'
import PlayerModal from '../components/PlayerModal'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LadderPage() {
  const [ladder, setLadder] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ladder')
      .then(async r => {
        const t = await r.text()
        if (t) try { const d = JSON.parse(t); setLadder(d.ladder ?? []) } catch {}
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div style={{ paddingTop: '1.25rem', marginBottom: '1rem' }}>
        <h1 className="font-pixel txt-yellow" style={{ fontSize: 11 }}>🏆 RANKING GLOBAL</h1>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: 200 }}>
          <span className="font-pixel txt-pink" style={{ fontSize: 9 }}>LOADING<span className="anim-blink">_</span></span>
        </div>
      ) : (
        <div className="card corners-yellow anim-slide-up" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', padding: '0.5rem 1rem',
                        background: 'rgba(255,215,0,.06)', borderBottom: '1px solid var(--border)' }}>
            <span className="label" style={{ marginBottom: 0 }}>POS</span>
            <span className="label" style={{ marginBottom: 0 }}>PLAYER</span>
            <span className="label" style={{ marginBottom: 0 }}>PTS</span>
          </div>

          {ladder.map((p, i) => (
            <button key={p.username} onClick={() => setSelectedPlayer(p.username)}
              style={{
                display: 'grid', gridTemplateColumns: '56px 1fr auto', alignItems: 'center',
                padding: '0.75rem 1rem', width: '100%',
                background: p.rank <= 3 ? `rgba(255,215,0,${0.07 - i * 0.02})` : 'transparent',
                borderBottom: i < ladder.length - 1 ? '1px solid var(--border)' : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,45,135,.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = p.rank <= 3 ? `rgba(255,215,0,${0.07 - i * 0.02})` : 'transparent')}
            >
              {/* Avatar with medal overlaid at bottom-center */}
              <div style={{
                position: 'relative',
                width: 36, height: 36,    /* match avatar size */
                margin: '0 auto',
                /* Extra bottom space for the medal to overflow into */
                marginBottom: p.rank <= 3 ? 10 : 0,
              }}>
                <Avatar seed={p.avatarSeed} style={p.avatarStyle ?? 'miniavs'} size={36} />
                {p.rank <= 3 && (
                  <div style={{
                    position: 'absolute',
                    bottom: -12,           /* overlap below the circle */
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 18, lineHeight: 1,
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.9))',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}>
                    {MEDALS[p.rank - 1]}
                  </div>
                )}
                {p.rank > 3 && (
                  <div style={{
                    position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 2, padding: '0 3px',
                    fontSize: 7, fontFamily: 'var(--font-pixel)', color: 'var(--muted)',
                    lineHeight: '14px', whiteSpace: 'nowrap',
                  }}>
                    #{p.rank}
                  </div>
                )}
              </div>

              {/* Player info */}
              <div style={{ paddingLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="font-ui" style={{ fontSize: '0.95rem' }}>{p.username}</span>
                  {p.streakWeeks >= 3 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.7rem', color: 'var(--orange)' }}>
                      <Flame size={11} /> {p.streakWeeks}
                    </span>
                  )}
                  {p.isNightShaded && <span style={{ fontSize: '0.65rem' }}>👻</span>}
                </div>
                {p.topBadge && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                    {p.topBadge} · {p.achievementCount} achievements
                  </div>
                )}
              </div>

              <span className={`font-pixel ${p.rank <= 3 ? 'txt-yellow' : 'txt-pink'}`} style={{ fontSize: 11 }}>
                {p.totalPoints !== null ? p.totalPoints : '???'}
              </span>
            </button>
          ))}

          {ladder.length === 0 && (
            <div className="flex-center" style={{ padding: '2rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              No players yet.
            </div>
          )}
        </div>
      )}

      {selectedPlayer && <PlayerModal username={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  )
}
