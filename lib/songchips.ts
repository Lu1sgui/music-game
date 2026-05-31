// lib/songchips.ts
// Song-disruption chips (Switcheroo / Copycat / Mute).
//
// These are activated while OPEN (hidden), but they change what the GM SEES when
// scoring over the weekend — so they're resolved at CLOSE, not at the reveal.
// The victim doesn't see the change until the reveal. Countered by Insurance
// (played before close). Point-effect defenses (Protect/Cleanse) don't apply here.

import { prisma } from './prisma'
import { ChipEffect, ActivationStatus, Prisma } from '@prisma/client'

type Db = Prisma.TransactionClient | typeof prisma

const SONG_CHIPS = [ChipEffect.SWITCHEROO, ChipEffect.COPYCAT, ChipEffect.MUTE]

export interface SongSwap {
  songTitle: string
  songArtist: string
  url: string
}

// Called by closeCycle. Promotes pending song-disruption chips to display
// overrides, honouring Insurance and a 1-disruption-per-target cap.
export async function resolveSongDisruptions(cycleId: number, db: Db = prisma): Promise<void> {
  const acts = await db.chipActivation.findMany({
    where: {
      cycleId,
      status: ActivationStatus.PENDING,
      chip: { effectType: { in: SONG_CHIPS } },
      targetUserId: { not: null },
    },
    include: { chip: true },
    orderBy: { id: 'asc' }, // earliest activation wins the per-target slot
  })
  if (acts.length === 0) return

  // Un-consumed Insurance chips, grouped by the player who played them
  const insurances = await db.chipActivation.findMany({
    where: { cycleId, status: ActivationStatus.PENDING, chip: { effectType: ChipEffect.INSURANCE } },
  })
  const insByUser = new Map<number, typeof insurances>()
  for (const ins of insurances) {
    if ((ins.effectData as any)?.consumed) continue
    const list = insByUser.get(ins.userId) ?? []
    list.push(ins)
    insByUser.set(ins.userId, list)
  }

  const applied = new Set<number>() // victims already disrupted this cycle

  for (const a of acts) {
    const victim = a.targetUserId as number
    const now = new Date()

    // Insurance blocks the disruption (and is consumed)
    const ins = (insByUser.get(victim) ?? []).find((i) => !(i.effectData as any)?.consumed)
    if (ins) {
      await db.chipActivation.update({
        where: { id: ins.id },
        data: { effectData: { ...((ins.effectData as any) ?? {}), consumed: true, usedOn: a.chip.slug } },
      })
      ;(ins.effectData as any) = { ...((ins.effectData as any) ?? {}), consumed: true }
      await db.chipActivation.update({
        where: { id: a.id },
        data: {
          status: ActivationStatus.CANCELLED,
          resolvedAt: now,
          effectData: { blockedBy: 'insurance', defenderId: victim, casterId: a.userId, chip: a.chip.slug },
        },
      })
      console.log(`[songchips] ${a.chip.slug} on user ${victim} blocked by Insurance`)
      continue
    }

    // One disruption per target — extras fizzle and are refunded
    if (applied.has(victim)) {
      await db.chipActivation.update({
        where: { id: a.id },
        data: { status: ActivationStatus.CANCELLED, resolvedAt: now, effectData: { fizzled: 'song_cap', targetUserId: victim } },
      })
      await db.userChip.update({
        where: { userId_chipId: { userId: a.userId, chipId: a.chipId } },
        data: { quantity: { increment: 1 } },
      })
      continue
    }

    // Apply — store the override and mark resolved
    applied.add(victim)
    const ed = (a.effectData as any) ?? {}
    const override = a.chip.effectType === ChipEffect.MUTE ? { mute: true } : { swap: ed.swap ?? null }
    await db.chipActivation.update({
      where: { id: a.id },
      data: { status: ActivationStatus.RESOLVED, resolvedAt: now, effectData: { ...ed, override } },
    })
    console.log(`[songchips] ${a.chip.slug} applied to user ${victim}`)
  }
}

type Submission = { userId: number; songTitle: string; songArtist: string; url: string; [k: string]: any }

// Apply resolved song overrides to a submissions list for a given viewer.
// - revealed=false (GM scoring during CLOSED): hide the override from the victim's own view.
// - revealed=true (public reveal): show swaps to everyone; Mute reverts to the real song.
export async function applySongOverrides<T extends Submission>(
  submissions: T[],
  cycleId: number,
  opts: { viewerUserId?: number; revealed: boolean },
  db: Db = prisma
): Promise<T[]> {
  const acts = await db.chipActivation.findMany({
    where: { cycleId, status: ActivationStatus.RESOLVED, chip: { effectType: { in: SONG_CHIPS } }, targetUserId: { not: null } },
    include: { chip: true },
  })
  if (acts.length === 0) return submissions

  const byTarget = new Map<number, { type: ChipEffect; data: any }>()
  for (const a of acts) byTarget.set(a.targetUserId as number, { type: a.chip.effectType, data: a.effectData })

  return submissions.map((s) => {
    const o = byTarget.get(s.userId)
    if (!o) return s
    if (!opts.revealed && opts.viewerUserId === s.userId) return s // victim doesn't see it yet

    if (o.type === ChipEffect.MUTE) {
      if (opts.revealed) return s // mute only hampers GM scoring; real song shows at reveal
      return { ...s, songTitle: '???', songArtist: '???' }
    }
    const swap: SongSwap | null = o.data?.override?.swap ?? o.data?.swap ?? null
    if (swap) return { ...s, songTitle: swap.songTitle, songArtist: swap.songArtist, url: swap.url }
    return s
  })
}
