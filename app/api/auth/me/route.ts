// app/api/auth/me/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth, ok, err } from '@/lib/api'

export async function GET(request: NextRequest) {
  const payload = getAuth(request)
  if (!payload) return err('Unauthorized', 401)

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      totalPoints: true,
      streakWeeks: true,
      createdAt: true,
      userChips: {
        where: { quantity: { gt: 0 } },
        include: { chip: true },
      },
      userAchievements: {
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' },
      },
    },
  })

  if (!user) return err('User not found', 404)

  return ok(user)
}
