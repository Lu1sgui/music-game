'use client'
// app/archive/[id]/page.tsx
import LoadingScreen from '../../components/LoadingScreen'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SongCard from '../../components/SongCard'
import PlayerModal from '../../components/PlayerModal'

export default function ArchiveCyclePage() {
  const router = useRouter()
  const params = useParams()
  const [cycle, setCycle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/archive/${params.id}`)
      .then(async r => { const t = await r.text(); if (t) try { setCycle(JSON.parse(t)) } catch {} setLoading(false) })
      .catch(() => setLoading(false))
  }, [params?.id])

  if (loading) return (
    <div className="page flex-center" style={{ minHeight:'80dvh' }}>
      <span className="font-pixel txt-pink" style={{ fontSize:9 }}>LOADING<span className="anim-blink">_</span></span>
    </div>
  )
  if (!cycle || cycle.error) return (
    <div className="page flex-center" style={{ minHeight:'80dvh', flexDirection:'column', gap:12 }}>
      <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={() => router.push('/archive')}>← Archive</button>
    </div>
  )

  const MEDALS = ['🥇','🥈','🥉']

  return (
    <div className="page">
      <div style={{ paddingTop:'1.25rem', marginBottom:'1rem' }}>
        <button onClick={() => router.push('/archive')}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--cyan)',
                   display:'flex', alignItems:'center', gap:4, marginBottom:12,
                   fontFamily:'var(--font-ui)', fontWeight:600, fontSize:'0.85rem' }}>
          <ArrowLeft size={14} /> ARCHIVE
        </button>
        <div className="flex-between">
          <div>
            <h1 className="font-pixel txt-yellow" style={{ fontSize:11 }}>WEEK {cycle.weekNumber}</h1>
            {cycle.theme && <p style={{ marginTop:4, color:'var(--muted)', fontSize:'0.85rem' }}>{cycle.theme}</p>}
          </div>
          <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>GM: {cycle.gm?.username ?? '—'}</span>
        </div>
      </div>

      {/* Podium — medals 2x bigger */}
      {cycle.cycleResults?.length > 0 && (
        <div style={{ marginBottom:'1.5rem' }}>
          <div className="font-pixel txt-yellow" style={{ fontSize:8, marginBottom:'0.5rem' }}>★ HIGH SCORE</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {cycle.cycleResults.map((r: any) => (
              <div key={r.id} style={{ display:'flex', alignItems:'stretch', gap:0, overflow:'hidden', borderRadius:4, border:'1px solid var(--border)', background:'var(--bg-card)' }}>
                {/* Medal column — 2x bigger */}
                <div style={{ width:52, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
                              justifyContent:'center', background:'var(--bg-hi)', fontSize:36, lineHeight:1, padding:'8px 4px' }}>
                  {MEDALS[r.position - 1]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <SongCard
                    songTitle={r.submission?.songTitle ?? ''}
                    songArtist={r.submission?.songArtist ?? ''}
                    platform={r.submission?.platform ?? ''}
                    url={r.submission?.url ?? ''}
                    gmNotes={r.gmNotes}
                    extra={
                      r.submission?.user?.username ? (
                        <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>
                          @{r.submission.user.username}
                        </div>
                      ) : null
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All submissions */}
      {cycle.submissions?.length > 0 && (
        <div>
          <div className="font-pixel" style={{ fontSize:8, color:'var(--muted)', marginBottom:'0.5rem' }}>
            ALL SONGS ({cycle.submissions.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {cycle.submissions.map((sub: any) => {
              const result = cycle.cycleResults?.find((r: any) => r.submissionId === sub.id)
              return (
                <div key={sub.id} style={{ display:'flex', gap:0, overflow:'hidden', borderRadius:4 }}>
                  {result && (
                    <div style={{ width:40, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                                  background:'var(--bg-hi)', fontSize:24, border:'1px solid var(--border)', borderRight:'none', borderRadius:'4px 0 0 4px' }}>
                      {MEDALS[result.position - 1]}
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <SongCard
                      songTitle={sub.songTitle} songArtist={sub.songArtist}
                      platform={sub.platform} url={sub.url}
                      extra={sub.user?.username ? <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>@{sub.user.username}</div> : null}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedPlayer && <PlayerModal username={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  )
}
