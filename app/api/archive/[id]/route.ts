// app/api/archive/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { ok, err } from '@/lib/api'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cycleId = parseInt(params.id)
  if (isNaN(cycleId)) return err('Invalid cycle ID')

  const cycle = await prisma.weekCycle.findUnique({
    where: { id: cycleId },
    include: {
      gm: { select: { username: true } },
      cycleResults: {
        orderBy: { position: 'asc' },
        include: {
          submission: {
            include: { user: { select: { username: true } } },
          },
        },
      },
      submissions: {
        include: { user: { select: { username: true } } },
        orderBy: { submittedAt: 'asc' },
      },
      _count: { select: { submissions: true } },
    },
  })

  if (!cycle) return err('Cycle not found', 404)

  // Only public for revealed/archived
  if (
    cycle.status !== CycleStatus.REVEALED &&
    cycle.status !== CycleStatus.ARCHIVED
  ) {
    return err('This cycle is not yet public', 403)
  }

  return ok(cycle)
}
