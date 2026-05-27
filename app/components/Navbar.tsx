'use client'
// app/components/Navbar.tsx
// Mobile bottom navigation only — hidden on desktop via CSS
import { usePathname, useRouter } from 'next/navigation'
import { Home, Trophy, Music, Archive, User } from 'lucide-react'

const TABS = [
  { path: '/',        label: 'Home',    Icon: Home },
  { path: '/ladder',  label: 'Ladder',  Icon: Trophy },
  { path: '/submit',  label: 'Submit',  Icon: Music, center: true },
  { path: '/archive', label: 'Archive', Icon: Archive },
  { path: '/profile', label: 'Profile', Icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav className="mobile-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(8,11,20,0.97)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid #1E2550',
    }}>
      <div style={{ display: 'flex', height: 60, maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {TABS.map(({ path, label, Icon, center }) => {
          const active = pathname === path

          if (center) return (
            <button key={path} onClick={() => router.push(path)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column',
                       alignItems: 'center', justifyContent: 'center',
                       background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', background: 'var(--pink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(255,45,135,.55)', marginBottom: 4,
              }}>
                <Icon size={20} color="#fff" />
              </div>
            </button>
          )

          return (
            <button key={path} onClick={() => router.push(path)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column',
                       alignItems: 'center', justifyContent: 'center', gap: 3,
                       background: 'none', border: 'none', cursor: 'pointer',
                       color: active ? 'var(--pink)' : 'var(--muted)',
                       transition: 'color .15s', position: 'relative' }}>
              <Icon size={17} />
              <span style={{ fontSize: 9, fontFamily: 'var(--font-ui, Rajdhani)', fontWeight: 600,
                             letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label}
              </span>
              {active && (
                <div style={{ position: 'absolute', bottom: 0, width: 24, height: 2,
                              background: 'var(--pink)', borderRadius: 1 }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
