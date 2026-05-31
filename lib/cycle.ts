// lib/cycle.ts
// Core state machine for WeekCycle
// Flow: PENDING → OPEN → CLOSED → REVEALED → ARCHIVED

import { prisma } from '@/lib/prisma'
import { CycleStatus, PointType, ConditionType, ChipEffect, ActivationStatus, Prisma } from '@prisma/client'
import { resolveChips } from '@/lib/chips'
import { resolveSongDisruptions } from '@/lib/songchips'
import { notifyRevealResults, notifyAllActive } from '@/lib/notify'

// Accepts either the base client or an interactive-transaction client
type Db = Prisma.TransactionClient | typeof prisma

// ─── Points config (Option B — streak system) ─────────────────────────────────

export const POINTS = {
  FIRST: 150,
  SECOND: 80,
  THIRD: 40,
  PARTICIPATION: 20,
  STREAK_BONUS_PER_WEEK: 5,
  STREAK_BONUS_MAX: 50,
} as const

// ─── Week helpers ─────────────────────────────────────────────────────────────

export function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7))
  const week1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week =
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 +
        ((week1.getUTCDay() + 6) % 7) -
        3) /
        7
    ) + 1
  return { week, year: d.getUTCFullYear() }
}

export function calculateStreakBonus(streakWeeks: number): number {
  return Math.min(
    streakWeeks * POINTS.STREAK_BONUS_PER_WEEK,
    POINTS.STREAK_BONUS_MAX
  )
}

// Build open/close/reveal timestamps from a Monday date (UTC)
// Builds the schedule for a cycle starting from a given Monday (all times COT = UTC-5)
// Monday:   cycle created PENDING — theme visible, submissions not open yet
// Tuesday:  submissions OPEN (00:00 COT = 05:00 UTC)
// Friday:   submissions CLOSE at 17:00 COT (22:00 UTC) — GM window starts (Sat + Sun)
// Next Mon: results REVEALED at 00:00 COT (05:00 UTC), archived, new cycle created
export function buildCycleSchedule(monday: Date) {
  // Submissions open: Tuesday 00:00 COT = Tuesday 05:00 UTC
  const opensAt = new Date(monday)
  opensAt.setUTCDate(monday.getUTCDate() + 1)
  opensAt.setUTCHours(5, 0, 0, 0)

  // Submissions close: Friday 17:00 COT = Friday 22:00 UTC
  const closesAt = new Date(monday)
  closesAt.setUTCDate(monday.getUTCDate() + 4)
  closesAt.setUTCHours(22, 0, 0, 0)

  // Reveal: next Monday 00:00 COT = next Monday 05:00 UTC
  const revealsAt = new Date(monday)
  revealsAt.setUTCDate(monday.getUTCDate() + 7)
  revealsAt.setUTCHours(5, 0, 0, 0)

  return { opensAt, closesAt, revealsAt }
}

// ─── Cycle queries ────────────────────────────────────────────────────────────

export async function getCurrentCycle() {
  return prisma.weekCycle.findFirst({
    where: { status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] } },
    orderBy: { createdAt: 'desc' },
    include: {
      gm: { select: { id: true, username: true } },
      _count: { select: { submissions: true } },
    },
  })
}

export async function getCycleById(id: number) {
  return prisma.weekCycle.findUnique({
    where: { id },
    include: {
      gm: { select: { id: true, username: true } },
      submissions: {
        include: { user: { select: { id: true, username: true } } },
      },
      cycleResults: {
        include: { submission: true },
        orderBy: { position: 'asc' },
      },
    },
  })
}

// ─── State transitions ────────────────────────────────────────────────────────

export async function createCycle({
  opensAt,
  closesAt,
  revealsAt,
}: {
  opensAt: Date
  closesAt: Date
  revealsAt: Date
}) {
  const { week, year } = getISOWeek(opensAt)
  return prisma.weekCycle.create({
    data: { weekNumber: week, year, status: CycleStatus.PENDING, opensAt, closesAt, revealsAt },
  })
}

// PENDING → OPEN
export async function openCycle(cycleId: number) {
  const cycle = await prisma.weekCycle.findUniqueOrThrow({ where: { id: cycleId } })
  if (cycle.status !== CycleStatus.PENDING) {
    throw new Error(`Cannot open cycle — current status is ${cycle.status}`)
  }
  return prisma.weekCycle.update({
    where: { id: cycleId },
    data: { status: CycleStatus.OPEN },
  })
}

// OPEN → CLOSED (submissions locked, GM window opens)
export async function closeCycle(cycleId: number) {
  const cycle = await prisma.weekCycle.findUniqueOrThrow({ where: { id: cycleId } })
  if (cycle.status !== CycleStatus.OPEN) {
    throw new Error(`Cannot close cycle — current status is ${cycle.status}`)
  }
  // Resolve song-disruption chips now so the GM scores the final (sabotaged) songs
  await resolveSongDisruptions(cycleId)
  return prisma.weekCycle.update({
    where: { id: cycleId },
    data: { status: CycleStatus.CLOSED },
  })
}

// REVEALED → ARCHIVED
export async function archiveCycle(cycleId: number) {
  const cycle = await prisma.weekCycle.findUniqueOrThrow({ where: { id: cycleId } })
  if (cycle.status !== CycleStatus.REVEALED) {
    throw new Error(`Cannot archive cycle — current status is ${cycle.status}`)
  }
  return prisma.weekCycle.update({
    where: { id: cycleId },
    data: { status: CycleStatus.ARCHIVED, archivedAt: new Date() },
  })
}

// ─── Points helper (append-only ledger + cache update) ───────────────────────

async function awardPoints(
  {
    userId,
    cycleId,
    amount,
    type,
    description,
  }: {
    userId: number
    cycleId: number
    amount: number
    type: PointType
    description?: string
  },
  db: Db = prisma
) {
  // When `db` is an interactive-transaction client these two writes are already
  // atomic with the surrounding reveal; the explicit $transaction is only needed
  // for the standalone (non-reveal) fallback path.
  if (db === prisma) {
    await prisma.$transaction([
      prisma.pointsLedger.create({ data: { userId, cycleId, amount, type, description } }),
      prisma.user.update({ where: { id: userId }, data: { totalPoints: { increment: amount } } }),
    ])
  } else {
    await db.pointsLedger.create({ data: { userId, cycleId, amount, type, description } })
    await db.user.update({ where: { id: userId }, data: { totalPoints: { increment: amount } } })
  }
}

// ─── Achievement checker ──────────────────────────────────────────────────────

export async function checkAndAwardAchievements(userId: number, cycleId: number, db: Db = prisma) {
  const [user, allAchievements, alreadyEarned] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.achievement.findMany({ where: { conditionType: { not: ConditionType.SPECIAL } } }),
    db.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ])

  const earnedIds = new Set(alreadyEarned.map((a) => a.achievementId))

  const [submissionCount, podiumCount, top1Count, gmCount] = await Promise.all([
    db.submission.count({ where: { userId } }),
    db.cycleResult.count({ where: { userId } }),
    db.cycleResult.count({ where: { userId, position: 1 } }),
    db.weekCycle.count({ where: { gmUserId: userId } }),
  ])

  const stats: Record<string, number> = {
    SUBMISSION_COUNT: submissionCount,
    PODIUM_COUNT: podiumCount,
    TOP_1_COUNT: top1Count,
    STREAK_WEEKS: user.streakWeeks,
    GM_COUNT: gmCount,
  }

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue
    const stat = stats[achievement.conditionType]
    if (stat === undefined || stat < achievement.conditionValue) continue

    // Unlock achievement
    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id, cycleId },
    })

    // Award points bonus
    if (achievement.pointsBonus > 0) {
      await awardPoints({
        userId,
        cycleId,
        amount: achievement.pointsBonus,
        type: PointType.ACHIEVEMENT_BONUS,
        description: `Achievement: ${achievement.name}`,
      }, db)
    }

    // Award chip reward
    if (achievement.rewardChipSlug) {
      const chip = await db.chip.findUnique({ where: { slug: achievement.rewardChipSlug } })
      if (chip) {
        await db.userChip.upsert({
          where: { userId_chipId: { userId, chipId: chip.id } },
          update: { quantity: { increment: 1 }, lastAcquiredAt: new Date() },
          create: { userId, chipId: chip.id, quantity: 1, lastAcquiredAt: new Date() },
        })
      }
    }
  }
}

// ─── Participation drop (Method B) ────────────────────────────────────────────
// Called at the end of revealCycle for every 4th week of consecutive participation

async function processParticipationDrop(userId: number, streakWeeks: number, db: Db = prisma) {
  if (streakWeeks % 4 !== 0) return

  // Weighted random: 60% Common, 30% Rare, 10% Legendary
  const roll = Math.random()
  const rarity = roll < 0.6 ? 'COMMON' : roll < 0.9 ? 'RARE' : 'LEGENDARY'

  const chips = await db.chip.findMany({ where: { rarity, enabled: true } })
  if (chips.length === 0) return

  const chip = chips[Math.floor(Math.random() * chips.length)]

  // Check inventory cap (max 5 total chips)
  const inventory = await db.userChip.findMany({
    where: { userId, quantity: { gt: 0 } },
  })
  const totalChips = inventory.reduce((sum, uc) => sum + uc.quantity, 0)
  if (totalChips >= 5) return

  // Check per-chip cap (max 2 of same chip)
  const existing = inventory.find((uc) => uc.chipId === chip.id)
  if (existing && existing.quantity >= 2) return

  await db.userChip.upsert({
    where: { userId_chipId: { userId, chipId: chip.id } },
    update: { quantity: { increment: 1 }, lastAcquiredAt: new Date() },
    create: { userId, chipId: chip.id, quantity: 1, lastAcquiredAt: new Date() },
  })
}

// ─── REVEAL CYCLE — the main event ───────────────────────────────────────────
// CLOSED → REVEALED
// Order: resolve chips → award podium → award participation → streak bonuses
// → cross-user chip effects → check achievements → update status

export async function revealCycle(cycleId: number) {
  const cycle = await prisma.weekCycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: {
      submissions: true,
      cycleResults: { orderBy: { position: 'asc' } },
      chipActivations: {
        where: { status: 'PENDING' },
        include: { chip: true, user: true, targetUser: true },
      },
    },
  })

  if (cycle.status !== CycleStatus.CLOSED) {
    throw new Error(`Cannot reveal cycle — current status is ${cycle.status}`)
  }

  const submitterIds = cycle.submissions.map((s) => s.userId)
  const podiumUserIds = new Set(cycle.cycleResults.map((r) => r.userId))

  // Everything below runs inside ONE interactive transaction so a mid-reveal
  // failure rolls back cleanly (the points ledger is append-only — partial
  // awards would be unrecoverable). The status re-check inside the transaction
  // makes a concurrent/double reveal a no-op instead of duplicating points.
  return prisma.$transaction(
    async (tx) => {
      const fresh = await tx.weekCycle.findUniqueOrThrow({ where: { id: cycleId }, select: { status: true } })
      if (fresh.status !== CycleStatus.CLOSED) {
        throw new Error(`Cannot reveal cycle — current status is ${fresh.status}`)
      }

      // ── 1. Resolve all chips — returns per-user modifier map ─────────────────
      const modifiers = await resolveChips(cycle.chipActivations, cycleId, tx)

      // ── 2. Award podium points ────────────────────────────────────────────────
      // Double Header crowns two winners: 1st and 2nd both score FIRST, 3rd is bumped up.
      const basePoints: Record<number, number> = cycle.doubleHeader
        ? { 1: POINTS.FIRST, 2: POINTS.FIRST, 3: POINTS.SECOND }
        : { 1: POINTS.FIRST, 2: POINTS.SECOND, 3: POINTS.THIRD }
      const pointTypes: Record<number, PointType> = {
        1: PointType.PODIUM_1ST,
        2: PointType.PODIUM_2ND,
        3: PointType.PODIUM_3RD,
      }

      // Usurp — if both the caster and target made the podium, swap their positions
      const positionOverride = new Map<number, number>()
      for (const [aId, m] of Array.from(modifiers.entries())) {
        if (!m.usurpTarget) continue
        const aRes = cycle.cycleResults.find((r) => r.userId === aId)
        const bRes = cycle.cycleResults.find((r) => r.userId === m.usurpTarget)
        if (aRes && bRes) {
          positionOverride.set(aId, bRes.position)
          positionOverride.set(m.usurpTarget, aRes.position)
        }
      }

      for (const result of cycle.cycleResults) {
        const mod = modifiers.get(result.userId)
        let position = positionOverride.get(result.userId) ?? result.position

        // Earthquake caster — forfeits the podium, gets participation instead
        if (mod?.cannotPodium) {
          await awardPoints({
            userId: result.userId,
            cycleId,
            amount: POINTS.PARTICIPATION,
            type: PointType.PARTICIPATION,
            description: `Week ${cycle.weekNumber} — participation (Earthquake forfeit)`,
          }, tx)
          continue
        }

        // Veto — the target's song can't make the podium; participation only
        if (mod?.vetoed) {
          await awardPoints({
            userId: result.userId,
            cycleId,
            amount: POINTS.PARTICIPATION,
            type: PointType.PARTICIPATION,
            description: `Week ${cycle.weekNumber} — participation (Vetoed)`,
          }, tx)
          continue
        }

        // Screech — score one tier lower
        if (mod?.tieredDown) {
          if (position < 3) {
            position++
          } else {
            // 3rd → participation only
            await awardPoints({
              userId: result.userId,
              cycleId,
              amount: POINTS.PARTICIPATION,
              type: PointType.PARTICIPATION,
              description: `Week ${cycle.weekNumber} — 3rd place (Screeched down)`,
            }, tx)
            continue
          }
        }

        let pts = basePoints[position]

        // Swords Dance — multiply (Bide doubles the multiplier again)
        if (mod?.pointsMultiplier) {
          pts = Math.round(pts * mod.pointsMultiplier)
        }

        // Gamble — ×1.5 when you reach the podium
        if (mod?.gamble) {
          pts = Math.round(pts * 1.5)
        }

        // Spotlight — flat +15 bonus on the podium
        if (mod?.spotlight) {
          pts += 15
        }

        await awardPoints({
          userId: result.userId,
          cycleId,
          amount: pts,
          type: pointTypes[position] ?? PointType.PARTICIPATION,
          description: `Week ${cycle.weekNumber} — position ${result.position}`,
        }, tx)
      }

      // ── 3. Award participation points ─────────────────────────────────────────
      for (const userId of submitterIds) {
        if (podiumUserIds.has(userId)) continue

        const mod = modifiers.get(userId)

        // Substitute — non-podium player gets 3rd place points
        if (mod?.substitute) {
          await awardPoints({
            userId,
            cycleId,
            amount: POINTS.THIRD,
            type: PointType.PARTICIPATION,
            description: `Week ${cycle.weekNumber} — participation (Substitute)`,
          }, tx)
          continue
        }

        // Swift — double participation points
        let pts = mod?.swiftDouble ? POINTS.PARTICIPATION * 2 : POINTS.PARTICIPATION

        // Cushion — +50% participation when you DON'T reach the podium
        if (mod?.cushion) {
          pts = Math.round(pts * 1.5)
        }

        await awardPoints({
          userId,
          cycleId,
          amount: pts,
          type: PointType.PARTICIPATION,
          description: `Week ${cycle.weekNumber} — participation`,
        }, tx)

        // Gamble — −20 penalty when you bet and miss the podium
        if (mod?.gamble) {
          await awardPoints({
            userId,
            cycleId,
            amount: -20,
            type: PointType.CHIP_PENALTY,
            description: `Week ${cycle.weekNumber} — Gamble lost`,
          }, tx)
        }
      }

      // ── 4. Streak bonuses + streak counter updates ───────────────────────────
      const allActiveUsers = await tx.user.findMany({ where: { isActive: true } })

      for (const user of allActiveUsers) {
        const participated = submitterIds.includes(user.id)
        const hasRecover = modifiers.get(user.id)?.recover

        if (participated || hasRecover) {
          const newStreak = user.streakWeeks + 1
          await tx.user.update({ where: { id: user.id }, data: { streakWeeks: newStreak } })

          // Only award streak bonus if they actually submitted (Recover preserves streak, not bonus)
          if (participated && newStreak > 1) {
            const bonus = calculateStreakBonus(newStreak)
            if (bonus > 0) {
              await awardPoints({
                userId: user.id,
                cycleId,
                amount: bonus,
                type: PointType.STREAK_BONUS,
                description: `Week ${cycle.weekNumber} — streak bonus (${newStreak} weeks)`,
              }, tx)
            }
          }

          // Participation drop every 4 weeks (Method B)
          await processParticipationDrop(user.id, participated ? user.streakWeeks + 1 : user.streakWeeks, tx)
        } else {
          // Reset streak
          await tx.user.update({ where: { id: user.id }, data: { streakWeeks: 0 } })
        }
      }

      // ── 5. Cross-user chip effects (need points to be awarded first) ─────────

      // Mega Drain — siphon 50% of target's cycle earnings
      for (const [userId, mod] of Array.from(modifiers.entries())) {
        if (!mod.megaDrainTarget) continue

        const targetEarned = await tx.pointsLedger.aggregate({
          where: { userId: mod.megaDrainTarget, cycleId },
          _sum: { amount: true },
        })
        const siphoned = Math.floor((targetEarned._sum.amount ?? 0) * 0.5)
        if (siphoned > 0) {
          await awardPoints({
            userId,
            cycleId,
            amount: siphoned,
            type: PointType.CHIP_BONUS,
            description: `Week ${cycle.weekNumber} — Mega Drain`,
          }, tx)
        }
      }

      // Skull Bash — steal 30 pts if activator outranked the target
      for (const [userId, mod] of Array.from(modifiers.entries())) {
        if (!mod.skullBashTarget) continue

        const [myResult, targetResult] = await Promise.all([
          tx.cycleResult.findFirst({ where: { userId, cycleId } }),
          tx.cycleResult.findFirst({ where: { userId: mod.skullBashTarget, cycleId } }),
        ])

        const myPos = myResult?.position ?? 999
        const targetPos = targetResult?.position ?? 999

        if (myPos < targetPos) {
          await awardPoints({ userId, cycleId, amount: 30, type: PointType.CHIP_BONUS, description: `Skull Bash win` }, tx)
          await awardPoints({ userId: mod.skullBashTarget, cycleId, amount: -30, type: PointType.CHIP_PENALTY, description: `Skull Bash loss` }, tx)
        }
      }

      // Leech Seed — siphon 25% of the victim's positive cycle earnings to the
      // planter, for up to 3 cycles after it was planted. Only seeds planted in a
      // PREVIOUS cycle act this week (a fresh plant starts draining next cycle).
      const activeLeechSeeds = await tx.chipActivation.findMany({
        where: {
          status: ActivationStatus.RESOLVED,
          chip: { effectType: ChipEffect.LEECH_SEED },
          cycleId: { lt: cycleId },
          effectData: { path: ['weeksRemaining'], gt: 0 },
        },
      })

      for (const seed of activeLeechSeeds) {
        const data = seed.effectData as { weeksRemaining: number; targetUserId: number } | null
        if (!data || !data.targetUserId) continue

        const victimEarned = await tx.pointsLedger.aggregate({
          where: { userId: data.targetUserId, cycleId, amount: { gt: 0 } },
          _sum: { amount: true },
        })
        const siphon = Math.floor((victimEarned._sum.amount ?? 0) * 0.25)
        if (siphon > 0) {
          await awardPoints({ userId: seed.userId, cycleId, amount: siphon, type: PointType.CHIP_BONUS, description: `Week ${cycle.weekNumber} — Leech Seed drain` }, tx)
          await awardPoints({ userId: data.targetUserId, cycleId, amount: -siphon, type: PointType.CHIP_PENALTY, description: `Week ${cycle.weekNumber} — Leech Seed drained` }, tx)
        }

        // Count down the seed's remaining weeks
        await tx.chipActivation.update({
          where: { id: seed.id },
          data: { effectData: { ...data, weeksRemaining: data.weeksRemaining - 1 } },
        })
      }

      // Payday — steal 25 from the target if they reached the podium
      for (const [userId, mod] of Array.from(modifiers.entries())) {
        if (!mod.paydayTarget) continue
        const targetPodium = await tx.cycleResult.findFirst({ where: { userId: mod.paydayTarget, cycleId } })
        if (targetPodium) {
          await awardPoints({ userId, cycleId, amount: 25, type: PointType.CHIP_BONUS, description: `Week ${cycle.weekNumber} — Payday` }, tx)
          await awardPoints({ userId: mod.paydayTarget, cycleId, amount: -25, type: PointType.CHIP_PENALTY, description: `Week ${cycle.weekNumber} — Payday stolen` }, tx)
        }
      }

      // Earthquake — every other submitter loses 15 points
      for (const [casterId, mod] of Array.from(modifiers.entries())) {
        if (!mod.earthquake) continue
        for (const uid of submitterIds) {
          if (uid === casterId) continue
          await awardPoints({ userId: uid, cycleId, amount: -15, type: PointType.CHIP_PENALTY, description: `Week ${cycle.weekNumber} — Earthquake` }, tx)
        }
      }

      // Toxic — the target loses 30% of the points they earned this week
      for (const [userId, mod] of Array.from(modifiers.entries())) {
        if (!mod.toxic) continue
        const earned = await tx.pointsLedger.aggregate({
          where: { userId, cycleId, amount: { gt: 0 } },
          _sum: { amount: true },
        })
        const loss = Math.floor((earned._sum.amount ?? 0) * 0.3)
        if (loss > 0) {
          await awardPoints({ userId, cycleId, amount: -loss, type: PointType.CHIP_PENALTY, description: `Week ${cycle.weekNumber} — Toxic` }, tx)
        }
      }

      // Bounty — split 20 points among everyone who outscored the bounty target
      for (const [placerId, mod] of Array.from(modifiers.entries())) {
        if (!mod.bountyTarget) continue
        const sums = await tx.pointsLedger.groupBy({
          by: ['userId'],
          where: { cycleId, userId: { in: submitterIds } },
          _sum: { amount: true },
        })
        const ptsByUser = new Map(sums.map((s) => [s.userId, s._sum.amount ?? 0]))
        const targetPts = ptsByUser.get(mod.bountyTarget) ?? 0
        const winners = submitterIds.filter((uid) => uid !== mod.bountyTarget && (ptsByUser.get(uid) ?? 0) > targetPts)
        if (winners.length > 0) {
          const share = Math.floor(20 / winners.length)
          if (share > 0) {
            for (const w of winners) {
              await awardPoints({ userId: w, cycleId, amount: share, type: PointType.CHIP_BONUS, description: `Week ${cycle.weekNumber} — Bounty claimed` }, tx)
            }
          }
        }
      }

      // Curse — the target loses their streak if they made the podium
      for (const [userId, mod] of Array.from(modifiers.entries())) {
        if (!mod.curse) continue
        if (!podiumUserIds.has(userId)) continue
        await tx.user.update({ where: { id: userId }, data: { streakWeeks: 0 } })
      }

      // Time Bomb — detonates two reveals after it was planted (−50 to the target)
      const activeBombs = await tx.chipActivation.findMany({
        where: {
          status: ActivationStatus.RESOLVED,
          chip: { effectType: ChipEffect.TIME_BOMB },
          cycleId: { lt: cycleId },
          effectData: { path: ['cyclesRemaining'], gt: 0 },
        },
      })
      for (const bomb of activeBombs) {
        const data = bomb.effectData as { cyclesRemaining: number; targetUserId: number } | null
        if (!data || !data.targetUserId) continue
        const remaining = data.cyclesRemaining - 1
        if (remaining <= 0) {
          await awardPoints({ userId: data.targetUserId, cycleId, amount: -50, type: PointType.CHIP_PENALTY, description: `Week ${cycle.weekNumber} — Time Bomb detonated` }, tx)
        }
        await tx.chipActivation.update({
          where: { id: bomb.id },
          data: { effectData: { ...data, cyclesRemaining: remaining } },
        })
      }

      // Banker — bank this cycle's earnings (removed now), returned ×2 next cycle
      const newBankers = await tx.chipActivation.findMany({
        where: { cycleId, status: ActivationStatus.RESOLVED, chip: { effectType: ChipEffect.BANKER } },
      })
      for (const b of newBankers) {
        if ((b.effectData as any)?.banked != null) continue // already processed
        const earned = await tx.pointsLedger.aggregate({
          where: { userId: b.userId, cycleId, amount: { gt: 0 } },
          _sum: { amount: true },
        })
        const banked = earned._sum.amount ?? 0
        if (banked > 0) {
          await awardPoints({ userId: b.userId, cycleId, amount: -banked, type: PointType.CHIP_PENALTY, description: `Week ${cycle.weekNumber} — Banked` }, tx)
        }
        await tx.chipActivation.update({ where: { id: b.id }, data: { effectData: { banked, settled: false } } })
      }
      // Banker payout — settle bankers from a previous cycle (×2 if they participated)
      const dueBankers = await tx.chipActivation.findMany({
        where: {
          status: ActivationStatus.RESOLVED,
          chip: { effectType: ChipEffect.BANKER },
          cycleId: { lt: cycleId },
          effectData: { path: ['settled'], equals: false },
        },
      })
      for (const b of dueBankers) {
        const data = b.effectData as { banked?: number; settled?: boolean } | null
        const banked = data?.banked ?? 0
        if (banked > 0 && submitterIds.includes(b.userId)) {
          await awardPoints({ userId: b.userId, cycleId, amount: banked * 2, type: PointType.CHIP_BONUS, description: `Week ${cycle.weekNumber} — Banker payout` }, tx)
        }
        await tx.chipActivation.update({ where: { id: b.id }, data: { effectData: { ...(data ?? {}), settled: true } } })
      }

      // ── 6. Check achievements for all participants ────────────────────────────
      for (const userId of submitterIds) {
        await checkAndAwardAchievements(userId, cycleId, tx)
      }

      // ── 7. Update cycle status ────────────────────────────────────────────────
      return tx.weekCycle.update({
        where: { id: cycleId },
        data: { status: CycleStatus.REVEALED },
      })
    },
    { timeout: 120_000, maxWait: 15_000 }
  )
}

// ─── Meta chips applied when the next cycle is created ───────────────────────
// Crown: the chosen player becomes GM of the new cycle. (Decree/theme will hook
// in here too once it ships.)
export async function applyMetaChipsToNewCycle(prevCycleId: number, newCycleId: number) {
  const crown = await prisma.chipActivation.findFirst({
    where: {
      cycleId: prevCycleId,
      status: ActivationStatus.RESOLVED,
      chip: { effectType: ChipEffect.CROWN },
      targetUserId: { not: null },
    },
    orderBy: { activatedAt: 'desc' },
  })
  if (crown?.targetUserId) {
    await prisma.weekCycle.update({
      where: { id: newCycleId },
      data: { gmUserId: crown.targetUserId },
    })
    console.log(`[meta] Crown: user ${crown.targetUserId} set as GM of cycle ${newCycleId}`)
  }

  // Decree — the chosen theme carries to the new cycle
  const decree = await prisma.chipActivation.findFirst({
    where: {
      cycleId: prevCycleId,
      status: ActivationStatus.RESOLVED,
      chip: { effectType: ChipEffect.DECREE },
    },
    orderBy: { activatedAt: 'desc' },
  })
  const decreeData = decree?.effectData as { theme?: string; themeDescription?: string | null } | null
  if (decreeData?.theme) {
    await prisma.weekCycle.update({
      where: { id: newCycleId },
      data: { theme: decreeData.theme, themeDescription: decreeData.themeDescription ?? null },
    })
    console.log(`[meta] Decree: theme "${decreeData.theme}" set on cycle ${newCycleId}`)
  }

  // Double Header — the new cycle crowns two winners
  const doubleHeader = await prisma.chipActivation.findFirst({
    where: { cycleId: prevCycleId, status: ActivationStatus.RESOLVED, chip: { effectType: ChipEffect.DOUBLE_HEADER } },
  })
  if (doubleHeader) {
    await prisma.weekCycle.update({ where: { id: newCycleId }, data: { doubleHeader: true } })
    console.log(`[meta] Double Header: cycle ${newCycleId} will crown two winners`)
  }
}

// ─── Weekly advance (reveal → archive → new cycle) ───────────────────────────
// Shared by the Monday cron and the admin "advance" action.
// requireGmResults=true: if the GM hasn't scored, do NOTHING and wait (the auto
// reveal must not fire). The admin can then advance manually (requireGmResults=false).
export async function advanceWeek(
  { requireGmResults }: { requireGmResults: boolean }
): Promise<{ revealed: boolean; reason?: 'no_closed_cycle' | 'gm_not_scored'; closedId?: number; newCycleId?: number }> {
  const closed = await prisma.weekCycle.findFirst({
    where: { status: CycleStatus.CLOSED },
    orderBy: { createdAt: 'desc' },
  })
  if (!closed) return { revealed: false, reason: 'no_closed_cycle' }

  const resultCount = await prisma.cycleResult.count({ where: { cycleId: closed.id } })
  if (requireGmResults && resultCount === 0) {
    return { revealed: false, reason: 'gm_not_scored', closedId: closed.id }
  }

  await revealCycle(closed.id)
  await notifyRevealResults(closed.id)
  await archiveCycle(closed.id)

  const schedule = buildCycleSchedule(new Date())
  const newCycle = await createCycle(schedule)
  await applyMetaChipsToNewCycle(closed.id, newCycle.id)

  // Auto-assign the first GM-role user if a Crown didn't already set one
  const fresh = await prisma.weekCycle.findUniqueOrThrow({ where: { id: newCycle.id }, select: { gmUserId: true } })
  if (!fresh.gmUserId) {
    const gm = await prisma.user.findFirst({ where: { role: 'GM' } })
    if (gm) await prisma.weekCycle.update({ where: { id: newCycle.id }, data: { gmUserId: gm.id } })
  }

  await notifyAllActive('🎵 A new week has begun! Submissions open Tuesday at 00:00. Get your song ready.')
  return { revealed: true, closedId: closed.id, newCycleId: newCycle.id }
}

// ─── Admin force reset ────────────────────────────────────────────────────────

export async function forceReset() {
  const current = await getCurrentCycle()
  const prevCycleId = current?.id ?? null

  if (current) {
    let status = current.status

    if (status === CycleStatus.OPEN) {
      await closeCycle(current.id)
      status = CycleStatus.CLOSED
    }

    if (status === CycleStatus.CLOSED) {
      const hasResults = await prisma.cycleResult.count({ where: { cycleId: current.id } })
      if (hasResults > 0) {
        await revealCycle(current.id)
        await archiveCycle(current.id)
      } else {
        // No GM scoring done — skip reveal and archive directly
        await prisma.weekCycle.update({
          where: { id: current.id },
          data: { status: CycleStatus.ARCHIVED, archivedAt: new Date() },
        })
      }
    } else if (status === CycleStatus.REVEALED) {
      await archiveCycle(current.id)
    }
  }

  // Create and open a new cycle starting now
  const schedule = buildCycleSchedule(new Date())
  const newCycle = await createCycle(schedule)
  if (prevCycleId) await applyMetaChipsToNewCycle(prevCycleId, newCycle.id)
  await openCycle(newCycle.id)
  return newCycle
}