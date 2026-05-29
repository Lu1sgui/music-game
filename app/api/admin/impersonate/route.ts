// app/api/admin/impersonate/route.ts
// Admin can generate a JWT for any user to "log in as" them
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    console.log(`[impersonate] Admin #${payload.userId} (@${payload.username}) → impersonating #${target.id} (@${target.username})`)

    const token = signToken({ userId: target.id, username: target.username, role: target.role })
    return NextResponse.json({
      token,
      user: {
        id: target.id, username: target.username, role: target.role,
        totalPoints: target.totalPoints, streakWeeks: target.streakWeeks,
        avatarSeed: target.avatarSeed, avatarStyle: target.avatarStyle,
      },
    })
  } catch (err: any) {
    console.error('[POST /api/admin/impersonate]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
