'use client'
// app/archive/page.tsx
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ChevronRight } from 'lucide-react'

export default function ArchivePage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/archive')
      .then(async r => {
        const text = await r.text()
        if (!text) return { cycles: [] }
        try { return JSON.parse(text) } catch { return { cycles: [] } }
      })
      .then(data => {
        setCycles(data.cycles ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div style={{ paddingTop:'1.25rem', marginBottom:'1rem' }}>
        <h1 className="font-pixel txt-cyan" style={{ fontSize:11 }}>
          <Archive size={14} style={{ display:'inline', marginRight:6 }} />
          ARCHIVE
        </h1>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height:200 }}>
          <span className="font-pixel txt-pink" style={{ fontSize:9 }}>LOADING<span className="anim-blink">_</span></span>
        </div>
      ) : cycles.length === 0 ? (
        <div className="card" style={{ padding:'2rem', textAlign:'center', color:'var(--muted)' }}>
          No past cycles yet. Check back after the first Monday reveal!
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {cycles.map((c: any) => {
            const winner = c.cycleResults?.[0]
            return (
              <button key={c.id} onClick={() => router.push(`/archive/${c.id}`)}
                className="card corners-cyan"
                style={{ padding:'1rem', width:'100%', textAlign:'left', background:'var(--bg-card)',
                         border:'1px solid var(--border)', borderRadius:4, cursor:'pointer',
                         display:'flex', alignItems:'center', justifyContent:'space-between',
                         transition:'all .15s' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span className="font-pixel txt-yellow" style={{ fontSize:9 }}>
                      WEEK {c.weekNumber}
                    </span>
                    {c.theme && (
                      <span style={{ fontSize:'0.78rem', color:'var(--muted)' }}>· {c.theme}</span>
                    )}
                  </div>
                  {winner ? (
                    <div style={{ fontSize:'0.82rem' }}>
                      🥇 {winner.submission?.user?.username ?? '???'} —{' '}
                      <span style={{ color:'var(--muted)' }}>{winner.submission?.songTitle}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize:'0.82rem', color:'var(--muted)' }}>No results</div>
                  )}
                  <div style={{ fontSize:'0.72rem', color:'var(--dim)', marginTop:2 }}>
                    {c._count?.submissions ?? 0} songs submitted
                  </div>
                </div>
                <ChevronRight size={16} style={{ color:'var(--cyan)' }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
