// app/api/auth/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { avatarSeed, avatarStyle } = await request.json()
    if (!avatarSeed) return NextResponse.json({ error: 'avatarSeed is required' }, { status: 400 })

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { avatarSeed, avatarStyle: avatarStyle ?? 'miniavs' },
      select: { id: true, avatarSeed: true, avatarStyle: true },
    })
    return NextResponse.json(user)
  } catch (err: any) {
    console.error('[PATCH /api/auth/avatar]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
