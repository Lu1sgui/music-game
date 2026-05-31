'use client'
// app/gm/page.tsx
// Submissions shown WITHOUT usernames — GM scores blind
import LoadingScreen from '../components/LoadingScreen'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Trophy, Save } from 'lucide-react'
import { safeFetch, authHeaders } from '../../lib/fetch'
import { useAuth, useApi } from '../context/AuthContext'

export default function GMPage() {
  const { user, token } = useAuth()
  const api = useApi()
  const router = useRouter()

  const [cycle, setCycle] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [positions, setPositions] = useState<Record<number, number>>({}) // submissionId → position
  const [notes, setNotes] = useState<Record<number, string>>({}) // submissionId → GM note
  const [theme, setTheme] = useState('')
  const [themeDesc, setThemeDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'GM' && user.role !== 'ADMIN') { router.push('/'); return }
    fetch('/api/cycle/current', { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { const t = await r.text(); if (!t) return {}; try { return JSON.parse(t) } catch { return {} } }).then(data => {
        setCycle(data)
        setTheme(data.theme ?? '')
        setThemeDesc(data.themeDescription ?? '')
        if (data.submissions) setSubmissions(data.submissions)
        setLoading(false)
      })
  }, [user])

  const setPos = (submissionId: number, pos: number) => {
    setPositions(prev => {
      const updated = { ...prev }
      // Remove if another submission already has this position
      Object.keys(updated).forEach(k => {
        if (updated[Number(k)] === pos && Number(k) !== submissionId) delete updated[Number(k)]
      })
      if (updated[submissionId] === pos) { delete updated[submissionId]; return updated }
      updated[submissionId] = pos
      return updated
    })
  }

  const saveScores = async () => {
    const results = Object.entries(positions).map(([submissionId, position]) => ({
      submissionId: Number(submissionId), position,
      gmNotes: notes[Number(submissionId)]?.trim() || undefined,
    }))
    if (results.length === 0) { setMsg('Select at least one position'); return }
    setSaving(true)
    const res = await api.post('/api/gm/score', { results })
    setSaving(false)
    setMsg(res.error ? `Error: ${res.error}` : '✓ Scores saved!')
  }

  const saveTheme = async () => {
    if (!theme.trim()) return
    setSavingTheme(true)
    const res = await api.patch('/api/gm/theme', { theme: theme.trim(), themeDescription: themeDesc.trim() })
    setSavingTheme(false)
    setMsg(res.error ? `Error: ${res.error}` : '✓ Theme saved!')
  }

  if (loading) return (
    <div className="page flex-center" style={{ minHeight:'80dvh' }}>
      <span className="font-pixel txt-pink" style={{ fontSize:9 }}>LOADING<span className="anim-blink">_</span></span>
    </div>
  )

  const isClosed = cycle?.status === 'CLOSED'

  return (
    <div className="page">
      <div style={{ paddingTop:'1.25rem', marginBottom:'1rem' }}>
        <h1 className="font-pixel txt-purple" style={{ fontSize:11, color:'var(--purple)' }}>GM PANEL</h1>
        <p style={{ marginTop:4, color:'var(--muted)', fontSize:'0.8rem' }}>
          Week {cycle?.weekNumber} · {cycle?.status}
        </p>
      </div>

      {/* ── Set theme ───────────────────────────────────── */}
      <div className="card corners" style={{ padding:'1.25rem', marginBottom:'1rem', borderColor:'var(--purple)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.75rem' }}>
          <span className="font-ui" style={{ color:'var(--purple)' }}>SET WEEKLY THEME</span>
        </div>
        <label className="label">Theme name</label>
        <input className="input" placeholder="e.g. 90s nostalgia" value={theme}
          onChange={e => setTheme(e.target.value)} style={{ marginBottom:'0.5rem' }} />
        <label className="label">Description (optional)</label>
        <textarea className="input" rows={2} placeholder="Describe the theme..."
          value={themeDesc} onChange={e => setThemeDesc(e.target.value)}
          style={{ resize:'none', marginBottom:'0.75rem' }} />
        <button className="btn btn-cyan btn-sm" style={{ width:'auto' }} onClick={saveTheme} disabled={savingTheme}>
          {savingTheme ? 'SAVING...' : <><Save size={13} /> SAVE THEME</>}
        </button>
      </div>

      {/* ── Score submissions ────────────────────────────── */}
      {!isClosed ? (
        <div className="card" style={{ padding:'1.25rem', textAlign:'center', color:'var(--muted)' }}>
          <p style={{ fontSize:'0.85rem', lineHeight:1.6 }}>
            Scoring is available when the cycle is <span className="txt-orange">CLOSED</span>.<br />
            Submissions close Friday at 17:00.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem' }}>
            <Trophy size={13} style={{ color:'var(--yellow)' }} />
            <span className="font-pixel" style={{ fontSize:8, color:'var(--muted)' }}>
              ASSIGN PODIUM — {submissions.length} SONGS
            </span>
          </div>
          <p style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:'0.75rem' }}>
            Submissions are anonymous. Listen before scoring.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:'1rem' }}>
            {submissions.map((sub: any, i: number) => {
              const myPos = positions[sub.id]
              return (
                <div key={sub.id} className="card card-hi" style={{ padding:'0.875rem 1rem' }}>
                  <div className="flex-between" style={{ marginBottom:6 }}>
                    <div>
                      <div className="font-ui" style={{ fontSize:'0.95rem' }}>{sub.songTitle}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{sub.songArtist}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'0.7rem', padding:'2px 6px', background:'rgba(0,229,255,.1)',
                                     color:'var(--cyan)', border:'1px solid var(--cyan)', borderRadius:2 }}>
                        {sub.platform}
                      </span>
                      <a href={sub.url} target="_blank" rel="noopener noreferrer"
                         style={{ color:'var(--cyan)' }}>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  {/* Position selector */}
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3].map(pos => (
                      <button key={pos} onClick={() => setPos(sub.id, pos)}
                        style={{
                          flex:1, padding:'6px', border:'1px solid',
                          borderRadius:4, cursor:'pointer', fontFamily:'Rajdhani', fontWeight:700,
                          fontSize:'0.85rem', transition:'all .15s',
                          borderColor: myPos === pos ? (pos===1 ? 'var(--yellow)' : pos===2 ? '#C0C0D0' : '#CD9060') : 'var(--border)',
                          background: myPos === pos ? (pos===1 ? 'rgba(255,215,0,.15)' : pos===2 ? 'rgba(192,192,208,.15)' : 'rgba(205,144,96,.15)') : 'transparent',
                          color: myPos === pos ? (pos===1 ? 'var(--yellow)' : pos===2 ? '#C0C0D0' : '#CD9060') : 'var(--muted)',
                        }}>
                        {pos === 1 ? '🥇 1ST' : pos === 2 ? '🥈 2ND' : '🥉 3RD'}
                      </button>
                    ))}
                  </div>
                  {/* GM note — only shown once a podium position is picked */}
                  {myPos && (
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Optional note for this pick (shown after reveal)..."
                      value={notes[sub.id] ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      style={{ resize:'none', marginTop:8, fontSize:'0.82rem' }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {msg && (
            <div style={{ marginBottom:'0.75rem', padding:'8px 12px',
                          background: msg.startsWith('✓') ? 'rgba(57,255,20,.1)' : 'rgba(255,45,135,.1)',
                          border: `1px solid ${msg.startsWith('✓') ? 'var(--green)' : 'var(--pink)'}`,
                          borderRadius:4, fontSize:'0.85rem',
                          color: msg.startsWith('✓') ? 'var(--green)' : 'var(--pink)' }}>
              {msg}
            </div>
          )}

          <button className="btn btn-pink" onClick={saveScores} disabled={saving}>
            {saving ? 'SAVING...' : <><Trophy size={15} /> SUBMIT SCORES</>}
          </button>
        </div>
      )}
    </div>
  )
}
