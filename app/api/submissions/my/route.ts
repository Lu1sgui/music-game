// app/api/submissions/my/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getAuth, ok, err } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)

    const cycle = await prisma.weekCycle.findFirst({
      where: { status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED, CycleStatus.PENDING] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!cycle) return ok({ submission: null, cycle: null })

    const submissions = await prisma.submission.findMany({
      where: { userId: payload.userId, cycleId: cycle.id },
    })

    return ok({
      cycle: { id: cycle.id, weekNumber: cycle.weekNumber, status: cycle.status },
      submissions, // can be 1 or 2 (with Double Team chip)
    })
  } catch (err: any) {
    console.error('[app/api/submissions/my/route.ts]', (err as any)?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
