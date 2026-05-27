'use client'
// app/components/CountdownTimer.tsx
import { useState, useEffect } from 'react'

export default function CountdownTimer({ target, label }: { target: string; label?: string }) {
  const [display, setDisplay] = useState('--:--:--')

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) { setDisplay('CLOSED'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (d > 0) setDisplay(`${d}D ${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M`)
      else setDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return (
    <div style={{ textAlign:'center' }}>
      {label && <div className="label" style={{ marginBottom:4 }}>{label}</div>}
      <span className="font-pixel txt-cyan" style={{ fontSize:11 }}>{display}</span>
    </div>
  )
}
