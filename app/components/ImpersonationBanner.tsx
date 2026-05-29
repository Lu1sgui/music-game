'use client'
// app/components/ImpersonationBanner.tsx
import { useAuth } from '../context/AuthContext'

export default function ImpersonationBanner() {
  const { isImpersonating, user, returnToAdmin } = useAuth()
  if (!isImpersonating || !user) return null

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 150,
      background: 'linear-gradient(90deg, var(--pink), var(--purple))',
      color: '#fff', padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: '0.82rem', fontFamily: 'var(--font-ui)', fontWeight: 600,
      boxShadow: '0 2px 8px rgba(0,0,0,.3)',
    }}>
      <span>👁 Impersonating <strong>@{user.username}</strong></span>
      <button onClick={returnToAdmin}
        style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)',
                 color: '#fff', padding: '3px 12px', borderRadius: 3, cursor: 'pointer',
                 fontSize: '0.78rem', fontFamily: 'var(--font-ui)', fontWeight: 700,
                 textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        ← Return to admin
      </button>
    </div>
  )
}
