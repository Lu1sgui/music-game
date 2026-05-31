// app/api/chips/mine/route.ts
// Returns the player's chip activations for the current live cycle (for the /chips UI).
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus, ActivationStatus } from '@prisma/client'
import { getAuth, ok, err } from '@/lib/api'
import { isSporeLocked } from '@/lib/chips'

const MAX_CHIPS_PER_CYCLE = 3

export async function GET(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)

    const cycle = await prisma.weekCycle.findFirst({
      where: { status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, weekNumber: true },
    })
    if (!cycle) return ok({ cycle: null, activations: [], played: 0, limit: MAX_CHIPS_PER_CYCLE, sporeLocked: false })

    const activations = await prisma.chipActivation.findMany({
      where: {
        userId: payload.userId,
        cycleId: cycle.id,
        status: { in: [ActivationStatus.PENDING, ActivationStatus.RESOLVED] },
      },
      include: {
        chip: { select: { name: true, slug: true, rarity: true } },
        targetUser: { select: { username: true } },
      },
      orderBy: { activatedAt: 'asc' },
    })

    const sporeLocked = await isSporeLocked(payload.userId, cycle.id)

    return ok({
      cycle,
      activations: activations.map((a) => ({
        chipName: a.chip.name,
        chipSlug: a.chip.slug,
        rarity: a.chip.rarity,
        target: a.targetUser?.username ?? null,
        status: a.status,
        // Offensive chips stay secret to the activator's victims, but the activator
        // sees what they played; details are kept minimal.
      })),
      played: activations.length,
      limit: MAX_CHIPS_PER_CYCLE,
      sporeLocked,
    })
  } catch (e: any) {
    console.error('[GET /api/chips/mine]', e?.message ?? e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
