// app/api/chips/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CycleStatus, ChipEffect, ActivationStatus } from '@prisma/client'
import { isSporeLocked } from '@/lib/chips'
import { getAuth, ok, err } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)

    const body = await request.json()
    const { chipSlug, targetUserId } = body

    if (!chipSlug) return err('chipSlug is required')

    // Get chip from catalog
    const chip = await prisma.chip.findUnique({ where: { slug: chipSlug } })
    if (!chip) return err(`Chip "${chipSlug}" not found`, 404)

    // Target required check
    if (chip.requiresTarget && !targetUserId) {
      return err(`${chip.name} requires a target player (targetUserId)`)
    }
    if (targetUserId && targetUserId === payload.userId) {
      return err('You cannot target yourself')
    }

    // Get current open cycle
    const cycle = await prisma.weekCycle.findFirst({
      where: { status: CycleStatus.OPEN },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return err('No cycle is currently open', 422)

    // Check Spore lock — can't use chips if locked
    const sporeLocked = await isSporeLocked(payload.userId, cycle.id)
    if (sporeLocked) {
      return err('You are Spore-locked and cannot activate chips this week', 403)
    }

    // Check user hasn't already activated a chip this cycle (max 1 per week)
    const alreadyActivated = await prisma.chipActivation.findFirst({
      where: {
        userId: payload.userId,
        cycleId: cycle.id,
        status: { in: [ActivationStatus.PENDING, ActivationStatus.RESOLVED] },
      },
    })
    if (alreadyActivated) {
      return err('You have already activated a chip this week', 409)
    }

    // Check user owns the chip
    const userChip = await prisma.userChip.findUnique({
      where: { userId_chipId: { userId: payload.userId, chipId: chip.id } },
    })
    if (!userChip || userChip.quantity < 1) {
      return err(`You don't have a ${chip.name} chip`, 404)
    }

    // Validate target exists if provided
    if (targetUserId) {
      const target = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!target) return err('Target player not found', 404)
    }

    // ── Special chip resolution at activation time ────────────────────────────

    let effectData = null
    let resolvedChipId = chip.id

    // MIMIC: copy target's chip from last week
    if (chip.effectType === ChipEffect.MIMIC) {
      if (!targetUserId) return err('Mimic requires a target')

      const prevCycle = await prisma.weekCycle.findFirst({
        where: { id: { lt: cycle.id }, status: CycleStatus.ARCHIVED },
        orderBy: { id: 'desc' },
      })

      if (!prevCycle) return err('No previous cycle found to Mimic from')

      const lastActivation = await prisma.chipActivation.findFirst({
        where: {
          userId: targetUserId,
          cycleId: prevCycle.id,
          status: ActivationStatus.RESOLVED,
        },
        include: { chip: true },
      })

      if (!lastActivation) {
        return err('Target did not activate a chip last week — nothing to Mimic')
      }

      resolvedChipId = lastActivation.chipId
      effectData = { mimickedChip: lastActivation.chip.slug, originalChipId: chip.id }
    }

    // METRONOME: roll a random chip
    if (chip.effectType === ChipEffect.METRONOME) {
      const allChips = await prisma.chip.findMany({
        where: { effectType: { not: ChipEffect.METRONOME } }, // can't roll another Metronome
      })
      const rolled = allChips[Math.floor(Math.random() * allChips.length)]
      resolvedChipId = rolled.id
      effectData = { rolledChip: rolled.slug, rolledEffect: rolled.effectType }
    }

    // ── Create activation + decrement inventory ───────────────────────────────

    const [activation] = await prisma.$transaction([
      prisma.chipActivation.create({
        data: {
          userId: payload.userId,
          chipId: resolvedChipId,
          cycleId: cycle.id,
          targetUserId: targetUserId ?? null,
          // Flash and Confuse Ray are informational — mark resolved immediately
          status:
            chip.effectType === ChipEffect.FLASH ||
            chip.effectType === ChipEffect.CONFUSE_RAY
              ? ActivationStatus.RESOLVED
              : ActivationStatus.PENDING,
          effectData: effectData ?? Prisma.JsonNull,
        },
        include: { chip: true },
      }),
      prisma.userChip.update({
        where: { userId_chipId: { userId: payload.userId, chipId: chip.id } },
        data: { quantity: { decrement: 1 } },
      }),
    ])

    return ok({
      message: `${chip.name} activated`,
      activation,
      ...(effectData ? { details: effectData } : {}),
    }, 201)
  } catch (err: any) {
    console.error('[app/api/chips/activate/route.ts]', (err as any)?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}