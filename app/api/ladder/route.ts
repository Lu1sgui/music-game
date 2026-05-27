// app/api/ladder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus, ChipEffect, ActivationStatus, Role } from '@prisma/client'
import { getTokenPayload } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)

    const currentCycle = await prisma.weekCycle.findFirst({
      where: { status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] } },
      orderBy: { createdAt: 'desc' },
    })

    let nightShadedIds = new Set<number>()
    if (currentCycle) {
      const ns = await prisma.chipActivation.findMany({
        where: { cycleId: currentCycle.id, status: ActivationStatus.RESOLVED, chip: { effectType: ChipEffect.NIGHT_SHADE } },
        select: { userId: true },
      })
      nightShadedIds = new Set(ns.map(a => a.userId))
    }

    // Only PLAYER role in the ladder — ADMIN and GM are excluded
    const users = await prisma.user.findMany({
      where: { isActive: true, role: Role.PLAYER },
      orderBy: { totalPoints: 'desc' },
      select: {
        id: true, username: true, totalPoints: true, streakWeeks: true,
        role: true, avatarSeed: true, avatarStyle: true,
        userAchievements: { select: { achievement: { select: { badgeTier: true } } } },
      },
    })

    const ladder = users.map((user, index) => {
      const isNightShaded = nightShadedIds.has(user.id)
      const isMe = payload?.userId === user.id
      return {
        rank: index + 1, id: user.id, username: user.username,
        totalPoints: isNightShaded && !isMe ? null : user.totalPoints,
        streakWeeks: user.streakWeeks, role: user.role,
        avatarSeed: user.avatarSeed, avatarStyle: user.avatarStyle ?? 'miniavs',
        achievementCount: user.userAchievements.length,
        topBadge: user.userAchievements
          .map(ua => ua.achievement.badgeTier)
          .sort((a, b) => ['BRONZE','SILVER','GOLD','PLATINUM','SPECIAL'].indexOf(b) - ['BRONZE','SILVER','GOLD','PLATINUM','SPECIAL'].indexOf(a))[0] ?? null,
        isNightShaded,
      }
    })

    return NextResponse.json({ ladder, total: ladder.length })
  } catch (err: any) {
    console.error('[GET /api/ladder]', err?.message ?? err)
    return NextResponse.json({ ladder: [], total: 0 })
  }
}
