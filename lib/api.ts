// lib/api.ts
// Shared helpers for API route handlers

import { NextRequest, NextResponse } from 'next/server'
import { getTokenPayload, TokenPayload } from '@/lib/auth'

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

export function getAuth(request: NextRequest): TokenPayload | null {
  return getTokenPayload(request)
}

// ─── Platform URL extractor ───────────────────────────────────────────────────
// Parses a Spotify or YouTube URL and returns the platform + track ID

export function extractPlatformInfo(url: string): {
  platform: 'SPOTIFY' | 'YOUTUBE'
  platformTrackId: string | null
} | null {
  try {
    const u = new URL(url)

    // Spotify: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
    if (u.hostname.includes('spotify.com') && u.pathname.includes('/track/')) {
      const trackId = u.pathname.split('/track/')[1]?.split('?')[0] ?? null
      return { platform: 'SPOTIFY', platformTrackId: trackId }
    }

    // YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return { platform: 'YOUTUBE', platformTrackId: u.searchParams.get('v') }
    }

    // YouTube short: https://youtu.be/dQw4w9WgXcQ
    if (u.hostname === 'youtu.be') {
      const trackId = u.pathname.slice(1).split('?')[0] || null
      return { platform: 'YOUTUBE', platformTrackId: trackId }
    }

    return null
  } catch {
    return null
  }
}
