// app/api/archive/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cycleId = parseInt(params.id)
    if (isNaN(cycleId)) return NextResponse.json({ error: 'Invalid cycle ID' }, { status: 400 })

    const cycle = await prisma.weekCycle.findUnique({
      where: { id: cycleId },
      include: {
        gm: { select: { username: true } },
        cycleResults: {
          orderBy: { position: 'asc' },
          include: { submission: { include: { user: { select: { username: true } } } } },
        },
        submissions: {
          include: { user: { select: { username: true } } },
          orderBy: { submittedAt: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    })

    if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })

    if (cycle.status !== CycleStatus.REVEALED && cycle.status !== CycleStatus.ARCHIVED) {
      return NextResponse.json({ error: 'This cycle is not yet public' }, { status: 403 })
    }

    return NextResponse.json(cycle)
  } catch (err: any) {
    console.error('[GET /api/archive/[id]]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
