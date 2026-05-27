// app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: {
        id: true, username: true, role: true,
        totalPoints: true, streakWeeks: true,
        avatarSeed: true, avatarStyle: true,
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

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get rank from ladder position
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { totalPoints: 'desc' },
      select: { id: true },
    })
    const rank = allUsers.findIndex(u => u.id === user.id) + 1

    return NextResponse.json({ ...user, rank })
  } catch (err: any) {
    console.error('[GET /api/users/[username]]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
