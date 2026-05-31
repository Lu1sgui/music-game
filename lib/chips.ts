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
  // ── Expansion (offensive, applied at reveal) ──
  toxic?: boolean             // Toxic (on target): lose 30% of cycle earnings
  curse?: boolean             // Curse (on target): lose streak if you podium
  cannotPodium?: boolean      // Earthquake caster: can't take a podium slot this week
  earthquake?: boolean        // Earthquake caster: every other player loses 15
  paydayTarget?: number       // Payday (on activator): steal 25 if target podiums
  bountyTarget?: number       // Bounty (on activator): 20-pt bounty on target
  usurpTarget?: number        // Usurp (on activator): swap podium positions if both podium
  // ── Expansion (defensive) ──
  insurance?: boolean         // Insurance: blocks one disruptive chip (Veto/Switcheroo/etc.)
  vetoed?: boolean            // Veto (on target): can't take a podium slot, participation only
}

// Chip types that can be reflected by Reflect
const REFLECTABLE = new Set([
  ChipEffect.SCREECH,
  ChipEffect.SPORE,
  ChipEffect.SKULL_BASH,
  ChipEffect.DISABLE,
])

type Activation = Awaited<ReturnType<typeof prisma.chipActivation.findMany>>[number] & {
  chip: { effectType: ChipEffect; slug: string; offensive: boolean }
  user: { id: number; bideStored: boolean }
  targetUser: { id: number } | null
}

// Point-draining chips that Mirror Coat reacts to
const DRAIN_CHIPS = new Set([ChipEffect.TOXIC, ChipEffect.MEGA_DRAIN, ChipEffect.LEECH_SEED])

// Submission/song-disrupting chips that Insurance reacts to
const DISRUPTIVE_CHIPS = new Set([
  ChipEffect.VETO,
  ChipEffect.SWITCHEROO,
  ChipEffect.COPYCAT,
  ChipEffect.BLACKOUT,
  ChipEffect.MUTE,
])

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

  // Cancel an activation. refund=true returns the chip to the caster's inventory
  // (used when a chip fizzles through no fault — e.g. over the anti-grief cap).
  // Defense blocks do NOT refund: attacking a shielded player wastes your chip.
  const cancel = async (a: Activation, effectData: any, refund: boolean) => {
    if (cancelled.has(a.id)) return
    cancelled.add(a.id)
    await db.chipActivation.update({
      where: { id: a.id },
      data: { status: ActivationStatus.CANCELLED, resolvedAt: new Date(), effectData },
    })
    if (refund) {
      await db.userChip.update({
        where: { userId_chipId: { userId: a.userId, chipId: a.chipId } },
        data: { quantity: { increment: 1 } },
      })
    }
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

  // ── Step 1.5: ANTI-GRIEF CAP — a target takes at most 2 offensive chips ────
  // Excess offensive chips (3rd+ on the same target) fizzle and are refunded.
  const offensiveByTarget = new Map<number, Activation[]>()
  for (const a of activations) {
    if (!a.chip.offensive || !a.targetUserId) continue
    const list = offensiveByTarget.get(a.targetUserId) ?? []
    list.push(a)
    offensiveByTarget.set(a.targetUserId, list)
  }
  for (const [targetId, list] of Array.from(offensiveByTarget.entries())) {
    if (list.length <= 2) continue
    const sorted = list.slice().sort((x, y) => x.id - y.id) // keep the earliest 2
    for (const extra of sorted.slice(2)) {
      await cancel(extra, { fizzled: 'over_target_cap', targetUserId: targetId }, true)
      console.log(`[chips] ${extra.chip.slug} fizzled — user ${targetId} already at the 2-chip cap`)
    }
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

  // ── Step 2.5: DEFENSES — Cleanse / Mirror Coat / Protect ──────────────────
  // Applied to offensive chips still targeting a defender. Order of strength:
  //   Cleanse (blocks all) → Mirror Coat (blocks drains, reflects Toxic) → Protect (blocks one)
  const cleanseUsers = new Set(
    activations.filter((a) => a.chip.effectType === ChipEffect.CLEANSE && !cancelled.has(a.id)).map((a) => a.userId)
  )
  const mirrorUsers = new Set(
    activations.filter((a) => a.chip.effectType === ChipEffect.MIRROR_COAT && !cancelled.has(a.id)).map((a) => a.userId)
  )
  const protectBlocks = new Map<number, number>() // protector → blocks available (Protects stack)
  for (const a of activations) {
    if (a.chip.effectType === ChipEffect.PROTECT && !cancelled.has(a.id)) {
      protectBlocks.set(a.userId, (protectBlocks.get(a.userId) ?? 0) + 1)
    }
  }
  const insuranceBlocks = new Map<number, number>() // insured → disruptive blocks available
  for (const a of activations) {
    // Skip Insurance already spent at CLOSE on a song-disruption chip
    if (a.chip.effectType === ChipEffect.INSURANCE && !cancelled.has(a.id) && !(a.effectData as any)?.consumed) {
      insuranceBlocks.set(a.userId, (insuranceBlocks.get(a.userId) ?? 0) + 1)
    }
  }

  for (const a of activations) {
    if (cancelled.has(a.id)) continue
    if (!a.chip.offensive || !a.targetUserId) continue
    const tgt = a.targetUserId

    // Cleanse — immune to everything
    if (cleanseUsers.has(tgt)) {
      await cancel(a, { blockedBy: 'cleanse', defenderId: tgt, casterId: a.userId, chip: a.chip.slug }, false)
      console.log(`[chips] ${a.chip.slug} on user ${tgt} blocked by Cleanse`)
      continue
    }
    // Insurance — blocks one disruptive (song/submission) chip
    if (DISRUPTIVE_CHIPS.has(a.chip.effectType as any) && (insuranceBlocks.get(tgt) ?? 0) > 0) {
      insuranceBlocks.set(tgt, (insuranceBlocks.get(tgt) ?? 0) - 1)
      await cancel(a, { blockedBy: 'insurance', defenderId: tgt, casterId: a.userId, chip: a.chip.slug }, false)
      console.log(`[chips] ${a.chip.slug} on user ${tgt} blocked by Insurance`)
      continue
    }
    // Mirror Coat — blocks drains; Toxic is reflected onto the caster
    if (mirrorUsers.has(tgt) && DRAIN_CHIPS.has(a.chip.effectType as any)) {
      if (a.chip.effectType === ChipEffect.TOXIC) mod(a.userId).toxic = true
      await cancel(a, { blockedBy: 'mirror_coat', defenderId: tgt, casterId: a.userId, chip: a.chip.slug }, false)
      console.log(`[chips] ${a.chip.slug} on user ${tgt} blocked by Mirror Coat`)
      continue
    }
    // Protect — blocks a single incoming offensive chip
    const blocks = protectBlocks.get(tgt) ?? 0
    if (blocks > 0) {
      protectBlocks.set(tgt, blocks - 1)
      await cancel(a, { blockedBy: 'protect', defenderId: tgt, casterId: a.userId, chip: a.chip.slug }, false)
      console.log(`[chips] ${a.chip.slug} on user ${tgt} blocked by Protect`)
      continue
    }
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

      case ChipEffect.INSURANCE:
        userMod.insurance = true
        break

      // Defensive chips — their blocking happened in step 2.5; nothing more here
      case ChipEffect.PROTECT:
      case ChipEffect.CLEANSE:
      case ChipEffect.MIRROR_COAT:
        break

      // Song-disruption chips are resolved at CLOSE (see lib/songchips.ts); if one
      // is somehow still pending at reveal, do nothing here.
      case ChipEffect.SWITCHEROO:
      case ChipEffect.COPYCAT:
      case ChipEffect.MUTE:
      case ChipEffect.INSURANCE:
        break

      // ── Expansion: offensive chips (point math runs in revealCycle) ──────
      case ChipEffect.TOXIC:
        if (activation.targetUserId) mod(activation.targetUserId).toxic = true
        break

      case ChipEffect.CURSE:
        if (activation.targetUserId) mod(activation.targetUserId).curse = true
        break

      case ChipEffect.PAYDAY:
        if (activation.targetUserId) userMod.paydayTarget = activation.targetUserId
        break

      case ChipEffect.BOUNTY:
        if (activation.targetUserId) userMod.bountyTarget = activation.targetUserId
        break

      case ChipEffect.USURP:
        if (activation.targetUserId) userMod.usurpTarget = activation.targetUserId
        break

      case ChipEffect.EARTHQUAKE:
        userMod.earthquake = true
        userMod.cannotPodium = true
        break

      case ChipEffect.VETO:
        if (activation.targetUserId) mod(activation.targetUserId).vetoed = true
        break

      // BLACKOUT: like Spore but blocks SUBMISSION next cycle. The RESOLVED row
      // (with targetUserId) is the record; isBlackedOut() reads it at submit time.
      case ChipEffect.BLACKOUT:
        if (activation.targetUserId) {
          console.log(`[chips] Blackout on user ${activation.targetUserId} — can't submit next cycle`)
        }
        break

      // CROWN / DECREE: golden meta chips. The RESOLVED row carries the choice
      // (target GM / theme in effectData); applied when the next cycle is created
      // (see applyMetaChipsToNewCycle).
      case ChipEffect.CROWN:
      case ChipEffect.DECREE:
        console.log(`[chips] ${activation.chip.slug} by user ${activation.userId} — applied to next cycle`)
        break

      case ChipEffect.PICKPOCKET: {
        if (!activation.targetUserId) break
        // Steal a random chip from the target — resolved now but stays hidden
        // (the victim only learns at the reveal). Respects the activator's caps.
        const victimChips = await db.userChip.findMany({
          where: { userId: activation.targetUserId, quantity: { gt: 0 } },
        })
        if (victimChips.length === 0) break
        const stolen = victimChips[Math.floor(Math.random() * victimChips.length)]

        const activatorInv = await db.userChip.findMany({
          where: { userId: activation.userId, quantity: { gt: 0 } },
        })
        const total = activatorInv.reduce((s, uc) => s + uc.quantity, 0)
        const existing = activatorInv.find((uc) => uc.chipId === stolen.chipId)
        if (total >= 5 || (existing && existing.quantity >= 2)) break // can't hold it — theft fizzles

        await db.userChip.update({ where: { id: stolen.id }, data: { quantity: { decrement: 1 } } })
        await db.userChip.upsert({
          where: { userId_chipId: { userId: activation.userId, chipId: stolen.chipId } },
          update: { quantity: { increment: 1 }, lastAcquiredAt: new Date() },
          create: { userId: activation.userId, chipId: stolen.chipId, quantity: 1, lastAcquiredAt: new Date() },
        })
        await db.chipActivation.update({
          where: { id: activation.id },
          data: { effectData: { stolenChipId: stolen.chipId } },
        })
        console.log(`[chips] Pickpocket: user ${activation.userId} stole chip ${stolen.chipId} from ${activation.targetUserId}`)
        break
      }

      case ChipEffect.TIME_BOMB: {
        if (!activation.targetUserId) break
        // Detonates two reveals from now — persisted like Leech Seed
        await db.chipActivation.update({
          where: { id: activation.id },
          data: { effectData: { cyclesRemaining: 2, targetUserId: activation.targetUserId } },
        })
        console.log(`[chips] Time Bomb planted on user ${activation.targetUserId} (2 cycles)`)
        break
      }

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

// ─── Check if a user is Blacked-out (can't submit) for a given cycle ─────────
// Same "next cycle after the plant" semantics as Spore, but blocks SUBMISSION.
export async function isBlackedOut(
  userId: number,
  cycleId: number,
  db: Db = prisma
): Promise<boolean> {
  const blackouts = await db.chipActivation.findMany({
    where: {
      status: ActivationStatus.RESOLVED,
      chip: { effectType: ChipEffect.BLACKOUT },
      targetUserId: userId,
    },
    select: { cycleId: true },
  })

  for (const b of blackouts) {
    const nextCycle = await db.weekCycle.findFirst({
      where: { id: { gt: b.cycleId } },
      orderBy: { id: 'asc' },
      select: { id: true },
    })
    if (nextCycle && nextCycle.id === cycleId) return true
  }
  return false
}
