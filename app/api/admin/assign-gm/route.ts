// app/api/admin/assign-gm/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getAuth, ok, err } from '@/lib/api'

export async function PATCH(request: NextRequest) {
  const payload = getAuth(request)
  if (!payload) return err('Unauthorized', 401)
  if (payload.role !== 'ADMIN') return err('Forbidden', 403)

  const body = await request.json()
  const { userId, cycleId } = body

  if (!userId) return err('userId is required')

  // Default to current cycle if no cycleId provided
  let cycle
  if (cycleId) {
    cycle = await prisma.weekCycle.findUnique({ where: { id: cycleId } })
  } else {
    cycle = await prisma.weekCycle.findFirst({
      where: { status: { in: [CycleStatus.PENDING, CycleStatus.OPEN] } },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (!cycle) return err('No active cycle found', 422)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return err('User not found', 404)

  const updated = await prisma.weekCycle.update({
    where: { id: cycle.id },
    data: { gmUserId: userId },
    include: { gm: { select: { id: true, username: true } } },
  })

  return ok({ cycle: updated, message: `${user.username} assigned as GM for week ${cycle.weekNumber}` })
}
