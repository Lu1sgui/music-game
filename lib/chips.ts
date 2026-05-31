// lib/chips.ts
// Chip resolution engine
// Called by revealCycle — processes all PENDING chip activations in order

import { prisma } from '@/lib/prisma'
import { ChipEffect, ActivationStatus, Prisma } from '@prisma/client'

// Accepts either the base client or an interactive-transaction client
type Db = Prisma.TransactionClient | typeof prisma

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
  // ── Expansion (self-effect chips) ──
  cushion?: boolean           // Cushion: +50% participation if NOT on podium
  spotlight?: boolean         // Spotlight: +15 bonus if ON podium
  gamble?: boolean            // Gamble: ×1.5 if on podium, −20 if not
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
  cycleId: number,
  db: Db = prisma
): Promise<Map<number, ChipModifier>> {
  const modifiers = new Map<number, ChipModifier>()
  const cancelled = new Set<number>() // activation IDs

  const mod = (userId: number): ChipModifier => {
    if (!modifiers.has(userId)) modifiers.set(userId, {})
    return modifiers.get(userId)!
  }

  // ── Step 1: HAZE / AMNESTY — nuclear option, cancel everything ────────────
  // Amnesty is the GOLDEN version of Haze: same effect, different tier.
  const wipeActivation = activations.find(
    (a) => a.chip.effectType === ChipEffect.HAZE || a.chip.effectType === ChipEffect.AMNESTY
  )
  if (wipeActivation) {
    await db.chipActivation.updateMany({
      where: { cycleId, status: ActivationStatus.PENDING },
      data: { status: ActivationStatus.CANCELLED, resolvedAt: new Date() },
    })
    console.log(`[chips] ${wipeActivation.chip.slug} by user ${wipeActivation.userId} — all chips cancelled`)
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
    await db.chipActivation.update({
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
      await db.chipActivation.update({
        where: { id: targetActivation.id },
        data: { status: ActivationStatus.CANCELLED, resolvedAt: new Date() },
      })
      // Return chip to inventory
      await db.userChip.update({
        where: { userId_chipId: { userId: activation.targetUserId, chipId: targetActivation.chipId } },
        data: { quantity: { increment: 1 } },
      })
      console.log(`[chips] Disable cancelled ${targetActivation.chip.slug} for user ${activation.targetUserId}`)
    }

    cancelled.add(activation.id)
    await db.chipActivation.update({
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
      // ── Applied at activation time, nothing to do at reveal ───────────────
      // FLASH:       lets the activator peek at all submissions while OPEN
      //              (handled in GET /api/cycle/current via flashActive).
      // DOUBLE_TEAM: unlocks a 2nd submission slot (handled in POST /submissions).
      // MIMIC:       copies the target's last chip at activation (activate route).
      // METRONOME:   rolls a random non-target chip at activation (activate route).
      // CONFUSE_RAY: currently cosmetic only — no scoring effect is implemented.
      //              TODO: define its real effect or remove the chip.
      // FORESIGHT/INSIGHT: intel chips, resolved at activation time (activate route).
      // AMNESTY: handled in step 1 (golden Haze).
      case ChipEffect.FLASH:
      case ChipEffect.CONFUSE_RAY:
      case ChipEffect.DOUBLE_TEAM:
      case ChipEffect.MIMIC:
      case ChipEffect.METRONOME:
      case ChipEffect.FORESIGHT:
      case ChipEffect.INSIGHT:
      case ChipEffect.AMNESTY:
        break

      // ── Expansion: self-effect chips ─────────────────────────────────────
      case ChipEffect.CUSHION:
        userMod.cushion = true
        break

      case ChipEffect.SPOTLIGHT:
        userMod.spotlight = true
        break

      case ChipEffect.GAMBLE:
        userMod.gamble = true
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
        await db.chipActivation.update({
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
        // Lock the target from activating chips during the NEXT cycle.
        // The next WeekCycle doesn't exist yet at reveal time (it's created AFTER
        // reveal in the Monday cron), so we don't store its id here. Instead we
        // record the plant and let isSporeLocked() resolve "the cycle right after
        // this one" at activation time. Nothing extra to persist — the RESOLVED
        // activation row with its targetUserId is enough.
        console.log(`[chips] Spore planted on user ${activation.targetUserId} — locked next cycle`)
        break
      }

      case ChipEffect.BIDE:
        // Store the flag — consumed when next chip is activated
        await db.user.update({
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
      await db.user.update({
        where: { id: activation.userId },
        data: { bideStored: false },
      })
    }

    // Mark as resolved
    if (!cancelled.has(activation.id)) {
      await db.chipActivation.update({
        where: { id: activation.id },
        data: { status: ActivationStatus.RESOLVED, resolvedAt: new Date() },
      })
    }
  }

  // Persistent Leech Seed siphon + week countdown is handled in revealCycle()
  // (it needs the cycle's points to be awarded first). See lib/cycle.ts.

  return modifiers
}

// ─── Check if a user is Spore-locked for a given cycle ───────────────────────
// A Spore planted in cycle N locks the target for cycle N+1 (the very next cycle).
// We resolve "the cycle right after the plant" at call time, because that cycle
// does not exist yet when the Spore resolves during reveal.

export async function isSporeLocked(
  userId: number,
  cycleId: number,
  db: Db = prisma
): Promise<boolean> {
  const spores = await db.chipActivation.findMany({
    where: {
      status: ActivationStatus.RESOLVED,
      chip: { effectType: ChipEffect.SPORE },
      targetUserId: userId,
    },
    select: { cycleId: true },
  })

  for (const spore of spores) {
    const nextCycle = await db.weekCycle.findFirst({
      where: { id: { gt: spore.cycleId } },
      orderBy: { id: 'asc' },
      select: { id: true },
    })
    if (nextCycle && nextCycle.id === cycleId) return true
  }
  return false
}
