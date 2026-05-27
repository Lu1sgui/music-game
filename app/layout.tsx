// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Press_Start_2P, Rajdhani, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

// ── Fonts loaded by Next.js (no FOUT, no serif fallback flash) ──
const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

const rajdhani = Rajdhani({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Weekly Beats',
  description: 'Weekly anonymous music battle — submit, compete, win chips',
}

export const viewport: Viewport = {
  themeColor: '#080B14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixelFont.variable} ${rajdhani.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="shell-content">
              {children}
            </div>
          </div>
          <Navbar />
        </AuthProvider>
      </body>
    </html>
  )
}
