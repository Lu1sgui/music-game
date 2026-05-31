'use client'
// app/components/Sidebar.tsx
// Visible only on desktop (CSS: .sidebar { display: none } → display: flex on ≥768px)
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Home, Trophy, Music, Archive, User, Zap, LogOut, Gamepad2 } from 'lucide-react'
import Avatar from './Avatar'

const NAV = [
  { path: '/',        label: 'Home',       Icon: Home },
  { path: '/ladder',  label: 'Ranking',    Icon: Trophy },
  { path: '/submit',  label: 'Submit Song',Icon: Music },
  { path: '/chips',   label: 'My Chips',   Icon: Zap },
  { path: '/archive', label: 'Archive',    Icon: Archive },
  { path: '/profile', label: 'Profile',    Icon: User },
]

function NavBtn({
  path, label, Icon, color,
}: {
  path: string; label: string; Icon: React.ElementType; color?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const active = pathname === path
  const accent = color ?? 'var(--pink)'

  return (
    <button onClick={() => router.push(path)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '0.75rem 1.25rem', background: active ? `${accent}14` : 'transparent',
      border: 'none', borderLeft: `3px solid ${active ? accent : 'transparent'}`,
      cursor: 'pointer', color: active ? accent : 'var(--muted)',
      fontFamily: 'var(--font-ui, Rajdhani, sans-serif)', fontWeight: 600,
      fontSize: '0.88rem', letterSpacing: '0.06em', textTransform: 'uppercase',
      textAlign: 'left', transition: 'all 0.15s',
    }}>
      <Icon size={16} />
      {label}
    </button>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <aside className="sidebar">
      {/* App title */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Gamepad2 size={18} style={{ color: 'var(--pink)' }} />
        </div>
        <img src="/devinslogo.webp" alt="Devin's Music Reviews"
          style={{ width: '100%', maxWidth: 160, height: 'auto', display: 'block', margin: '0 auto' }}
        />
      </div>

      {/* User card */}
      {user ? (
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-hi)',
                         display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar seed={(user as any).avatarSeed} style={(user as any).avatarStyle} size={36} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>
              {user.role}
            </div>
            <div className="font-ui" style={{ fontSize: '0.9rem' }}>@{user.username}</div>
            <div className="font-pixel txt-yellow" style={{ fontSize: 8, marginTop: 2 }}>
              {user.totalPoints} PTS
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <button className="btn btn-pink btn-sm" style={{ width: '100%' }}
            onClick={() => router.push('/login')}>
            LOGIN
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
        {NAV.map(item => <NavBtn key={item.path} {...item} />)}

        {/* Privileged routes */}
        {user && (user.role === 'GM' || user.role === 'ADMIN') && (
          <>
            <div style={{ padding: '0.75rem 1.25rem 0.25rem', marginTop: '0.25rem',
                          borderTop: '1px solid var(--border)' }}>
              <span className="label" style={{ marginBottom: 0, fontSize: '0.65rem' }}>PRIVILEGED</span>
            </div>
            <NavBtn path="/gm" label="GM Panel" Icon={Trophy} color="var(--purple)" />
            {user.role === 'ADMIN' && (
              <NavBtn path="/admin" label="Admin" Icon={Zap} color="var(--orange)" />
            )}
          </>
        )}
      </nav>

      {/* Logout */}
      {user && (
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => { logout(); router.push('/') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                     background: 'none', border: 'none', cursor: 'pointer',
                     color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 600,
                     fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      )}
    </aside>
  )
}
