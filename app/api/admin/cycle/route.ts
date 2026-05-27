// app/api/admin/cycle/route.ts
// Admin can manually transition cycle states
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getTokenPayload } from '@/lib/auth'
import { openCycle, closeCycle, revealCycle, archiveCycle, createCycle, buildCycleSchedule, forceReset, getCurrentCycle } from '@/lib/cycle'

export async function POST(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { action, cycleId } = await request.json()

    switch (action) {
      case 'open': {
        const c = cycleId
          ? await prisma.weekCycle.findUniqueOrThrow({ where: { id: cycleId } })
          : await prisma.weekCycle.findFirst({ where: { status: CycleStatus.PENDING }, orderBy: { createdAt: 'desc' } })
        if (!c) return NextResponse.json({ error: 'No PENDING cycle found' }, { status: 422 })
        await openCycle(c.id)
        return NextResponse.json({ message: `Cycle ${c.id} opened`, cycleId: c.id })
      }
      case 'close': {
        const c = await getCurrentCycle()
        if (!c || c.status !== CycleStatus.OPEN) return NextResponse.json({ error: 'No OPEN cycle' }, { status: 422 })
        await closeCycle(c.id)
        return NextResponse.json({ message: `Cycle ${c.id} closed` })
      }
      case 'reveal': {
        const c = await prisma.weekCycle.findFirst({ where: { status: CycleStatus.CLOSED }, orderBy: { createdAt: 'desc' } })
        if (!c) return NextResponse.json({ error: 'No CLOSED cycle' }, { status: 422 })
        await revealCycle(c.id)
        return NextResponse.json({ message: `Cycle ${c.id} revealed` })
      }
      case 'archive': {
        const c = await prisma.weekCycle.findFirst({ where: { status: CycleStatus.REVEALED }, orderBy: { createdAt: 'desc' } })
        if (!c) return NextResponse.json({ error: 'No REVEALED cycle' }, { status: 422 })
        await archiveCycle(c.id)
        return NextResponse.json({ message: `Cycle ${c.id} archived` })
      }
      case 'new': {
        const schedule = buildCycleSchedule(new Date())
        const nc = await createCycle(schedule)
        return NextResponse.json({ message: `New cycle ${nc.id} created (PENDING)`, cycle: nc })
      }
      case 'reset': {
        const nc = await forceReset()
        return NextResponse.json({ message: 'Cycle reset, new cycle opened', cycle: nc })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[POST /api/admin/cycle]', err?.message ?? err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
