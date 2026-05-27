// app/api/og-image/route.ts
// Server-side thumbnail fetcher — avoids CORS issues with Spotify oEmbed
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')
    if (!url) return NextResponse.json({ image: null })

    // YouTube — compute directly, no fetch needed
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      const videoId = match?.[1]
      const image = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
      return NextResponse.json({ image }, { headers: { 'Cache-Control': 'public, max-age=86400' } })
    }

    // Spotify — fetch oEmbed server-side
    if (url.includes('spotify.com')) {
      const oembed = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } }
      )
      if (oembed.ok) {
        const data = await oembed.json()
        return NextResponse.json(
          { image: data.thumbnail_url ?? null },
          { headers: { 'Cache-Control': 'public, max-age=86400' } }
        )
      }
    }

    return NextResponse.json({ image: null })
  } catch (err: any) {
    return NextResponse.json({ image: null })
  }
}
