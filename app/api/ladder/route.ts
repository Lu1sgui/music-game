// app/api/ladder/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus, ChipEffect, ActivationStatus } from '@prisma/client'
import { getAuth, ok } from '@/lib/api'

export async function GET(request: NextRequest) {
  const payload = getAuth(request)

  // Users with Night Shade active this cycle have hidden rank/total
  const currentCycle = await prisma.weekCycle.findFirst({
    where: { status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] } },
    orderBy: { createdAt: 'desc' },
  })

  let nightShadedIds = new Set<number>()
  if (currentCycle) {
    const nightShadeActivations = await prisma.chipActivation.findMany({
      where: {
        cycleId: currentCycle.id,
        status: ActivationStatus.RESOLVED,
        chip: { effectType: ChipEffect.NIGHT_SHADE },
      },
      select: { userId: true },
    })
    nightShadedIds = new Set(nightShadeActivations.map((a) => a.userId))
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { totalPoints: 'desc' },
    select: {
      id: true,
      username: true,
      totalPoints: true,
      streakWeeks: true,
      role: true,
      userAchievements: {
        select: { achievement: { select: { badgeTier: true } } },
      },
    },
  })

  const ladder = users.map((user, index) => {
    const isNightShaded = nightShadedIds.has(user.id)
    const isMe = payload?.userId === user.id

    return {
      rank: index + 1,
      username: user.username,
      // Night Shade hides rank + points from others (but not from yourself)
      totalPoints: isNightShaded && !isMe ? null : user.totalPoints,
      streakWeeks: user.streakWeeks,
      role: user.role,
      achievementCount: user.userAchievements.length,
      topBadge: user.userAchievements
        .map((ua) => ua.achievement.badgeTier)
        .sort((a, b) => ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'SPECIAL'].indexOf(b) - ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'SPECIAL'].indexOf(a))[0] ?? null,
      isNightShaded,
    }
  })

  return ok({ ladder, total: ladder.length })
}
