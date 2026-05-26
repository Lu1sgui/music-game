// app/api/cycle/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getAuth, ok, err } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cycleId = parseInt(params.id)
  if (isNaN(cycleId)) return err('Invalid cycle ID')

  const payload = getAuth(request)

  const cycle = await prisma.weekCycle.findUnique({
    where: { id: cycleId },
    include: {
      gm: { select: { id: true, username: true } },
      cycleResults: {
        orderBy: { position: 'asc' },
        include: {
          submission: { include: { user: { select: { username: true } } } },
        },
      },
      submissions: {
        include: { user: { select: { username: true } } },
      },
      _count: { select: { submissions: true } },
    },
  })

  if (!cycle) return err('Cycle not found', 404)

  // Non-public cycles require auth
  const isPublic = cycle.status === CycleStatus.REVEALED || cycle.status === CycleStatus.ARCHIVED
  if (!isPublic && !payload) return err('Unauthorized', 401)

  // Non-admin/gm users can't see submissions details during OPEN/CLOSED
  const canSeeAll =
    isPublic ||
    payload?.role === 'ADMIN' ||
    payload?.userId === cycle.gmUserId

  return ok({
    id: cycle.id,
    weekNumber: cycle.weekNumber,
    year: cycle.year,
    theme: cycle.theme,
    themeDescription: cycle.themeDescription,
    status: cycle.status,
    gm: cycle.gm,
    opensAt: cycle.opensAt,
    closesAt: cycle.closesAt,
    revealsAt: cycle.revealsAt,
    archivedAt: cycle.archivedAt,
    submissionCount: cycle._count.submissions,
    results: isPublic ? cycle.cycleResults : [],
    submissions: canSeeAll ? cycle.submissions : [],
  })
}
