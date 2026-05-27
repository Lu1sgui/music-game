// lib/chips.ts
// Chip resolution engine
// Called by revealCycle — processes all PENDING chip activations in order

import { prisma } from '@/lib/prisma'
import { ChipEffect, ActivationStatus } from '@prisma/client'

// ─── Modifier map — per-user effects accumulated during resolution ─────────────

export interface ChipModifier {
  pointsMultiplier?: number   // Swords Dance: 2 (or 4 with Bide stored)
  substitute?: boolean        // Substitute: get 3rd pts if not on podium
  swiftDouble?: boolean       // Swift: double participation pts
  recover?: boolean           // Recover: streak preserved without submission
  tieredDown?: boolean        // Screech applied to this user
  isAnonymous?: boolean       // Smokescreen: name hidden after reveal
  nightShade?: boolean        // Night Shade: rank/total hidden on ladder
  megaDrainTarget?: number    // Mega Drain: userId of the target to siphon from
  skullBashTarget?: number    // Skull Bash: userId of the challenged player
}

// Chip types that can be reflected by Reflect
const REFLECTABLE = new Set([
  ChipEffect.SCREECH,
  ChipEffect.SPORE,
  ChipEffect.SKULL_BASH,
  ChipEffect.DISABLE,
])

type Activation = Awaited<ReturnType<typeof prisma.chipActivation.findMany>>[number] & {
  chip: { effectType: ChipEffect; slug: string }
  user: { id: number; bideStored: boolean }
  targetUser: { id: number } | null
}

export async function resolveChips(
  activations: Activation[],
  cycleId: number
): Promise<Map<number, ChipModifier>> {
  const modifiers = new Map<number, ChipModifier>()
  const cancelled = new Set<number>() // activation IDs

  const mod = (userId: number): ChipModifier => {
    if (!modifiers.has(userId)) modifiers.set(userId, {})
    return modifiers.get(userId)!
  }

  // ── Step 1: HAZE — nuclear option, cancel everything ─────────────────────
  const hazeActivation = activations.find((a) => a.chip.effectType === ChipEffect.HAZE)
  if (hazeActivation) {
    await prisma.chipActivation.updateMany({
      where: { cycleId, status: ActivationStatus.PENDING },
      data: { status: ActivationStatus.CANCELLED, resolvedAt: new Date() },
    })
    console.log(`[chips] Haze activated by user ${hazeActivation.userId} — all chips cancelled`)
    return modifiers
  }

  // ── Step 2: REFLECT — identify shielded users ─────────────────────────────
  const reflectUsers = new Set(
    activations
      .filter((a) => a.chip.effectType === ChipEffect.REFLECT)
      .map((a) => a.userId)
  )

  // Bounce negative chips targeting a Reflect user
  for (const activation of activations) {
    if (!REFLECTABLE.has(activation.chip.effectType as any)) continue
    if (!activation.targetUserId) continue
    if (!reflectUsers.has(activation.targetUserId)) continue

    cancelled.add(activation.id)
    await prisma.chipActivation.update({
      where: { id: activation.id },
      data: {
        status: ActivationStatus.CANCELLED,
        resolvedAt: new Date(),
        effectData: { reflected: true, bouncedTo: activation.userId },
      },
    })
    console.log(`[chips] ${activation.chip.slug} reflected back to user ${activation.userId}`)
  }

  // ── Step 3: DISABLE — cancel target's chip ───────────────────────────────
  for (const activation of activations) {
    if (activation.chip.effectType !== ChipEffect.DISABLE) continue
    if (cancelled.has(activation.id)) continue
    if (!activation.targetUserId) continue

    const targetActivation = activations.find(
      (a) => a.userId === activation.targetUserId && !cancelled.has(a.id)
    )

    if (targetActivation) {
      cancelled.add(targetActivation.id)
      await prisma.chipActivation.update({
        where: { id: targetActivation.id },
        data: { status: ActivationStatus.CANCELLED, resolvedAt: new Date() },
      })
      // Return chip to inventory
      await prisma.userChip.update({
        where: { userId_chipId: { userId: activation.targetUserId, chipId: targetActivation.chipId } },
        data: { quantity: { increment: 1 } },
      })
      console.log(`[chips] Disable cancelled ${targetActivation.chip.slug} for user ${activation.targetUserId}`)
    }

    cancelled.add(activation.id)
    await prisma.chipActivation.update({
      where: { id: activation.id },
      data: { status: ActivationStatus.RESOLVED, resolvedAt: new Date() },
    })
  }

  // ── Step 4: Resolve all remaining chips ──────────────────────────────────
  for (const activation of activations) {
    if (cancelled.has(activation.id)) continue

    const { effectType } = activation.chip
    const bideActive = activation.user.bideStored
    const userMod = mod(activation.userId)

    switch (effectType) {
      // ── Informational / already applied at activation time ───────────────
      case ChipEffect.FLASH:
      case ChipEffect.CONFUSE_RAY:
      case ChipEffect.DOUBLE_TEAM:
      case ChipEffect.MIMIC:
      case ChipEffect.METRONOME:
        break

      // ── Common chips ─────────────────────────────────────────────────────
      case ChipEffect.SMOKESCREEN:
        userMod.isAnonymous = true
        break

      case ChipEffect.SUBSTITUTE:
        userMod.substitute = true
        break

      case ChipEffect.RECOVER:
        userMod.recover = true
        break

      case ChipEffect.SWIFT:
        userMod.swiftDouble = true
        break

      case ChipEffect.NIGHT_SHADE:
        userMod.nightShade = true
        break

      // ── Rare chips ───────────────────────────────────────────────────────
      case ChipEffect.SWORDS_DANCE:
        // Bide stored doubles the multiplier (2× → 4×)
        userMod.pointsMultiplier = bideActive ? 4 : 2
        break

      case ChipEffect.DISABLE:
      case ChipEffect.REFLECT:
        // Already handled in steps 2-3
        break

      case ChipEffect.LEECH_SEED: {
        if (!activation.targetUserId) break
        // Persist for next 3 weeks via effectData
        await prisma.chipActivation.update({
          where: { id: activation.id },
          data: {
            effectData: { weeksRemaining: 3, targetUserId: activation.targetUserId },
          },
        })
        console.log(`[chips] Leech Seed planted on user ${activation.targetUserId} for 3 weeks`)
        break
      }

      // ── Legendary chips ──────────────────────────────────────────────────
      case ChipEffect.SCREECH: {
        if (!activation.targetUserId) break
        mod(activation.targetUserId).tieredDown = true
        break
      }

      case ChipEffect.MEGA_DRAIN: {
        if (!activation.targetUserId) break
        // Actual siphon amount calculated in revealCycle after points are awarded
        userMod.megaDrainTarget = activation.targetUserId
        break
      }

      case ChipEffect.SPORE: {
        if (!activation.targetUserId) break
        // Lock target from using chips next cycle
        const nextCycle = await prisma.weekCycle.findFirst({
          where: { id: { gt: cycleId } },
          orderBy: { id: 'asc' },
        })
        if (nextCycle) {
          await prisma.chipActivation.update({
            where: { id: activation.id },
            data: {
              effectData: { lockedCycleId: nextCycle.id, targetUserId: activation.targetUserId },
            },
          })
          console.log(`[chips] Spore: user ${activation.targetUserId} locked from chips next cycle`)
        }
        break
      }

      case ChipEffect.BIDE:
        // Store the flag — consumed when next chip is activated
        await prisma.user.update({
          where: { id: activation.userId },
          data: { bideStored: true },
        })
        console.log(`[chips] Bide stored for user ${activation.userId}`)
        break

      case ChipEffect.SKULL_BASH: {
        if (!activation.targetUserId) break
        // Outcome calculated in revealCycle after cycle results are finalized
        userMod.skullBashTarget = activation.targetUserId
        break
      }

      case ChipEffect.HAZE:
        // Already handled in step 1
        break
    }

    // If this chip consumed a stored Bide (and it wasn't Bide itself), reset the flag
    if (bideActive && effectType !== ChipEffect.BIDE) {
      await prisma.user.update({
        where: { id: activation.userId },
        data: { bideStored: false },
      })
    }

    // Mark as resolved
    if (!cancelled.has(activation.id)) {
      await prisma.chipActivation.update({
        where: { id: activation.id },
        data: { status: ActivationStatus.RESOLVED, resolvedAt: new Date() },
      })
    }
  }

  // ── Step 5: Process persistent Leech Seed from previous cycles ───────────
  const activeLeechSeeds = await prisma.chipActivation.findMany({
    where: {
      status: ActivationStatus.RESOLVED,
      chip: { effectType: ChipEffect.LEECH_SEED },
      effectData: { path: ['weeksRemaining'], gt: 0 },
    },
    include: { chip: true },
  })

  for (const seed of activeLeechSeeds) {
    const data = seed.effectData as { weeksRemaining: number; targetUserId: number } | null
    if (!data || !data.targetUserId) continue

    // Siphon is applied in revealCycle after cycle points — just flag it here
    // Decrement weeks remaining
    const newWeeks = data.weeksRemaining - 1
    await prisma.chipActivation.update({
      where: { id: seed.id },
      data: {
        effectData: { ...data, weeksRemaining: newWeeks },
        status: newWeeks <= 0 ? ActivationStatus.RESOLVED : ActivationStatus.RESOLVED,
      },
    })
  }

  return modifiers
}

// ─── Check if a user is Spore-locked for a given cycle ───────────────────────

export async function isSporeLocked(userId: number, cycleId: number): Promise<boolean> {
  const spore = await prisma.chipActivation.findFirst({
    where: {
      status: ActivationStatus.RESOLVED,
      chip: { effectType: ChipEffect.SPORE },
      effectData: { path: ['lockedCycleId'], equals: cycleId },
      targetUserId: userId,
    },
  })
  return spore !== null
}
