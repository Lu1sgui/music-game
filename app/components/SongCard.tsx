'use client'
// app/components/SongCard.tsx
// Song card with OG/thumbnail image on the left
import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface SongCardProps {
  songTitle: string
  songArtist: string
  platform: string
  url: string
  username?: string
  position?: number     // 1, 2, 3 for podium
  gmNotes?: string
  extra?: React.ReactNode
}

function getPlatformColor(platform: string) {
  return platform === 'SPOTIFY' ? '#1DB954' : '#FF0000'
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  const id = match?.[1]
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

const POSITION_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function SongCard({
  songTitle, songArtist, platform, url, username, position, gmNotes, extra,
}: SongCardProps) {
  const [thumb, setThumb] = useState<string | null>(null)
  const [thumbLoaded, setThumbLoaded] = useState(false)

  useEffect(() => {
    if (platform === 'YOUTUBE') {
      setThumb(getYouTubeThumbnail(url))
      return
    }
    // Spotify — fetch via server API
    if (platform === 'SPOTIFY') {
      fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
        .then(async r => {
          const text = await r.text()
          if (!text) return
          const data = JSON.parse(text)
          if (data.image) setThumb(data.image)
        })
        .catch(() => {})
    }
  }, [url, platform])

  return (
    <div className="card" style={{ display: 'flex', overflow: 'hidden', minHeight: 72 }}>
      {/* Thumbnail */}
      <div style={{
        width: 72, flexShrink: 0, position: 'relative',
        background: 'var(--bg-hi)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {thumb ? (
          <img
            src={thumb}
            alt=""
            onLoad={() => setThumbLoaded(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: thumbLoaded ? 1 : 0,
              transition: 'opacity 0.2s',
              position: 'absolute', inset: 0,
            }}
          />
        ) : null}
        {/* Platform icon fallback */}
        {(!thumb || !thumbLoaded) && (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: getPlatformColor(platform),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>
            {platform === 'SPOTIFY' ? '♫' : '▶'}
          </div>
        )}
        {/* Platform badge */}
        <div style={{
          position: 'absolute', bottom: 3, right: 3,
          background: getPlatformColor(platform),
          borderRadius: 2, padding: '1px 4px',
          fontSize: 8, color: '#fff', fontWeight: 700,
          fontFamily: 'var(--font-ui)',
        }}>
          {platform === 'SPOTIFY' ? 'SP' : 'YT'}
        </div>
        {/* Position medal overlay */}
        {position && POSITION_MEDAL[position] && (
          <div style={{
            position: 'absolute', top: 3, left: 3,
            fontSize: 18, lineHeight: 1,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
          }}>
            {POSITION_MEDAL[position]}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '0.625rem 0.75rem', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            {username && (
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 2, fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                @{username}
              </div>
            )}
            <div className="font-ui" style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>{songTitle}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{songArtist}</div>
            {gmNotes && (
              <div style={{ fontSize: '0.72rem', color: 'var(--purple)', marginTop: 4, fontStyle: 'italic' }}>
                "{gmNotes}"
              </div>
            )}
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }}>
            <ExternalLink size={14} />
          </a>
        </div>
        {extra}
      </div>
    </div>
  )
}
