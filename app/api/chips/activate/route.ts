// app/api/chips/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CycleStatus, ChipEffect, ChipPhase, ActivationStatus } from '@prisma/client'
import { isSporeLocked } from '@/lib/chips'
import { getAuth, ok, err } from '@/lib/api'

// Activation model v2: up to 3 chip activations per player per cycle
const MAX_CHIPS_PER_CYCLE = 3
const CHIP_LIMIT_SENTINEL = 'CHIP_LIMIT_REACHED'

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
    if (!chip.enabled) return err(`${chip.name} isn't available yet — coming soon!`, 422)

    // Target required check
    if (chip.requiresTarget && !targetUserId) {
      return err(`${chip.name} requires a target player (targetUserId)`)
    }
    // Crown may target yourself (you can crown yourself the next GM)
    if (targetUserId && targetUserId === payload.userId && chip.effectType !== ChipEffect.CROWN) {
      return err('You cannot target yourself')
    }

    // Live cycle = OPEN or CLOSED. OPEN_ONLY chips (offensive / song-touching) need OPEN;
    // ANYTIME chips (defense / intel) may be played through CLOSED up to the Monday reveal.
    const cycle = await prisma.weekCycle.findFirst({
      where: { status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] } },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return err('No active cycle right now', 422)

    if (chip.phase === ChipPhase.OPEN_ONLY && cycle.status !== CycleStatus.OPEN) {
      return err(`${chip.name} can only be played while submissions are open (until Friday)`, 422)
    }

    // Check Spore lock — can't use chips if locked
    const sporeLocked = await isSporeLocked(payload.userId, cycle.id)
    if (sporeLocked) {
      return err('You are Spore-locked and cannot activate chips this week', 403)
    }

    // Max 3 activations per cycle (friendly pre-check; re-checked atomically below)
    const activationCount = await prisma.chipActivation.count({
      where: {
        userId: payload.userId,
        cycleId: cycle.id,
        status: { in: [ActivationStatus.PENDING, ActivationStatus.RESOLVED] },
      },
    })
    if (activationCount >= MAX_CHIPS_PER_CYCLE) {
      return err(`You've already played ${MAX_CHIPS_PER_CYCLE} chips this week`, 409)
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

    // METRONOME: roll a random chip. Only roll among chips that DON'T need a
    // target — Metronome has no target UI, so a targeted roll (Screech, Skull
    // Bash, Mega Drain, Disable…) would resolve to nothing. This keeps the roll
    // always useful.
    if (chip.effectType === ChipEffect.METRONOME) {
      const allChips = await prisma.chip.findMany({
        where: {
          effectType: { not: ChipEffect.METRONOME }, // can't roll another Metronome
          requiresTarget: false,                     // can't roll a chip that needs a target
          enabled: true,                             // only roll playable chips
        },
      })
      if (allChips.length === 0) return err('No chip available to roll for Metronome', 422)
      const rolled = allChips[Math.floor(Math.random() * allChips.length)]
      resolvedChipId = rolled.id
      effectData = { rolledChip: rolled.slug, rolledEffect: rolled.effectType }
    }

    // FORESIGHT: reveal who has targeted you with an offensive chip so far this week
    if (chip.effectType === ChipEffect.FORESIGHT) {
      const incoming = await prisma.chipActivation.findMany({
        where: {
          targetUserId: payload.userId,
          cycleId: cycle.id,
          status: { in: [ActivationStatus.PENDING, ActivationStatus.RESOLVED] },
          chip: { offensive: true },
        },
        include: { chip: { select: { name: true } }, user: { select: { username: true } } },
      })
      effectData = { foresight: incoming.map((a) => ({ from: a.user.username, chip: a.chip.name })) }
    }

    // INSIGHT: how many songs and chips have been played this week
    if (chip.effectType === ChipEffect.INSIGHT) {
      const [songs, chipsPlayed] = await Promise.all([
        prisma.submission.count({ where: { cycleId: cycle.id } }),
        prisma.chipActivation.count({
          where: { cycleId: cycle.id, status: { in: [ActivationStatus.PENDING, ActivationStatus.RESOLVED] } },
        }),
      ])
      effectData = { insight: { songs, chipsPlayed } }
    }

    // ── Create activation + decrement inventory ───────────────────────────────
    // Re-check the 3/cycle limit INSIDE the transaction so two racing requests
    // can't both slip past the pre-check above.
    const activation = await prisma.$transaction(async (tx) => {
      const count = await tx.chipActivation.count({
        where: {
          userId: payload.userId,
          cycleId: cycle.id,
          status: { in: [ActivationStatus.PENDING, ActivationStatus.RESOLVED] },
        },
      })
      if (count >= MAX_CHIPS_PER_CYCLE) throw new Error(CHIP_LIMIT_SENTINEL)

      const act = await tx.chipActivation.create({
        data: {
          userId: payload.userId,
          chipId: resolvedChipId,
          cycleId: cycle.id,
          targetUserId: targetUserId ?? null,
          // Informational / intel chips resolve immediately; the rest wait for reveal
          status: (
            [
              ChipEffect.FLASH,
              ChipEffect.CONFUSE_RAY,
              ChipEffect.FORESIGHT,
              ChipEffect.INSIGHT,
            ] as ChipEffect[]
          ).includes(chip.effectType)
            ? ActivationStatus.RESOLVED
            : ActivationStatus.PENDING,
          effectData: effectData ?? Prisma.JsonNull,
        },
        include: { chip: true },
      })
      await tx.userChip.update({
        where: { userId_chipId: { userId: payload.userId, chipId: chip.id } },
        data: { quantity: { decrement: 1 } },
      })
      return act
    })

    return ok({
      message: `${chip.name} activated`,
      activation,
      ...(effectData ? { details: effectData } : {}),
    }, 201)
  } catch (e: any) {
    if (e?.message === CHIP_LIMIT_SENTINEL) {
      return err(`You've already played ${MAX_CHIPS_PER_CYCLE} chips this week`, 409)
    }
    console.error('[app/api/chips/activate/route.ts]', e?.message ?? e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}