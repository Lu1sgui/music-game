// app/api/cycle/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getAuth } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cycleId = parseInt(params.id)
    if (isNaN(cycleId)) return NextResponse.json({ error: 'Invalid cycle ID' }, { status: 400 })

    const payload = getAuth(request)

    const cycle = await prisma.weekCycle.findUnique({
      where: { id: cycleId },
      include: {
        gm: { select: { id: true, username: true } },
        cycleResults: {
          orderBy: { position: 'asc' },
          include: { submission: { include: { user: { select: { username: true } } } } },
        },
        submissions: { include: { user: { select: { username: true } } } },
        _count: { select: { submissions: true } },
      },
    })

    if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })

    const isPublic = cycle.status === CycleStatus.REVEALED || cycle.status === CycleStatus.ARCHIVED
    if (!isPublic && !payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canSeeAll = isPublic || payload?.role === 'ADMIN' || payload?.userId === cycle.gmUserId

    return NextResponse.json({
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
  } catch (err: any) {
    console.error('[GET /api/cycle/[id]]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
