// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, username: true, email: true, role: true,
        totalPoints: true, streakWeeks: true,
        avatarSeed: true, avatarStyle: true,
        mustChangePassword: true,   // ← these were missing
        createdAt: true,
        userChips: { where: { quantity: { gt: 0 } }, include: { chip: true } },
        userAchievements: { include: { achievement: true }, orderBy: { earnedAt: 'desc' } },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err: any) {
    console.error('[GET /api/auth/me]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
