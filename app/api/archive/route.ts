// app/api/archive/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { ok } from '@/lib/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const [cycles, total] = await Promise.all([
    prisma.weekCycle.findMany({
      where: { status: { in: [CycleStatus.ARCHIVED, CycleStatus.REVEALED] } },
      orderBy: { weekNumber: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        gm: { select: { username: true } },
        cycleResults: {
          orderBy: { position: 'asc' },
          take: 3,
          include: {
            submission: {
              include: { user: { select: { username: true } } },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.weekCycle.count({
      where: { status: { in: [CycleStatus.ARCHIVED, CycleStatus.REVEALED] } },
    }),
  ])

  return ok({ cycles, total, page, pages: Math.ceil(total / limit) })
}
