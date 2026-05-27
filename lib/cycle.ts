// lib/cycle.ts
// Core state machine for WeekCycle
// Flow: PENDING → OPEN → CLOSED → REVEALED → ARCHIVED

import { prisma } from '@/lib/prisma'
import { CycleStatus, PointType, ConditionType } from '@prisma/client'
import { resolveChips } from '@/lib/chips'

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

async function awardPoints({
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
}) {
  await prisma.$transaction([
    prisma.pointsLedger.create({
      data: { userId, cycleId, amount, type, description },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: amount } },
    }),
  ])
}

// ─── Achievement checker ──────────────────────────────────────────────────────

export async function checkAndAwardAchievements(userId: number, cycleId: number) {
  const [user, allAchievements, alreadyEarned] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.achievement.findMany({ where: { conditionType: { not: ConditionType.SPECIAL } } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ])

  const earnedIds = new Set(alreadyEarned.map((a) => a.achievementId))

  const [submissionCount, podiumCount, top1Count, gmCount] = await Promise.all([
    prisma.submission.count({ where: { userId } }),
    prisma.cycleResult.count({ where: { userId } }),
    prisma.cycleResult.count({ where: { userId, position: 1 } }),
    prisma.weekCycle.count({ where: { gmUserId: userId } }),
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
    await prisma.userAchievement.create({
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
      })
    }

    // Award chip reward
    if (achievement.rewardChipSlug) {
      const chip = await prisma.chip.findUnique({ where: { slug: achievement.rewardChipSlug } })
      if (chip) {
        await prisma.userChip.upsert({
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

async function processParticipationDrop(userId: number, streakWeeks: number) {
  if (streakWeeks % 4 !== 0) return

  // Weighted random: 60% Common, 30% Rare, 10% Legendary
  const roll = Math.random()
  const rarity = roll < 0.6 ? 'COMMON' : roll < 0.9 ? 'RARE' : 'LEGENDARY'

  const chips = await prisma.chip.findMany({ where: { rarity } })
  if (chips.length === 0) return

  const chip = chips[Math.floor(Math.random() * chips.length)]

  // Check inventory cap (max 5 total chips)
  const inventory = await prisma.userChip.findMany({
    where: { userId, quantity: { gt: 0 } },
  })
  const totalChips = inventory.reduce((sum, uc) => sum + uc.quantity, 0)
  if (totalChips >= 5) return

  // Check per-chip cap (max 2 of same chip)
  const existing = inventory.find((uc) => uc.chipId === chip.id)
  if (existing && existing.quantity >= 2) return

  await prisma.userChip.upsert({
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

  // ── 1. Resolve all chips — returns per-user modifier map ─────────────────
  const modifiers = await resolveChips(cycle.chipActivations, cycleId)

  // ── 2. Award podium points ────────────────────────────────────────────────
  const basePoints: Record<number, number> = { 1: POINTS.FIRST, 2: POINTS.SECOND, 3: POINTS.THIRD }
  const pointTypes: Record<number, PointType> = {
    1: PointType.PODIUM_1ST,
    2: PointType.PODIUM_2ND,
    3: PointType.PODIUM_3RD,
  }

  for (const result of cycle.cycleResults) {
    const mod = modifiers.get(result.userId)
    let position = result.position

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
        })
        continue
      }
    }

    let pts = basePoints[position]

    // Swords Dance — multiply (Bide doubles the multiplier again)
    if (mod?.pointsMultiplier) {
      pts = Math.round(pts * mod.pointsMultiplier)
    }

    await awardPoints({
      userId: result.userId,
      cycleId,
      amount: pts,
      type: pointTypes[position],
      description: `Week ${cycle.weekNumber} — position ${result.position}`,
    })
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
      })
      continue
    }

    // Swift — double participation points
    const pts = mod?.swiftDouble ? POINTS.PARTICIPATION * 2 : POINTS.PARTICIPATION

    await awardPoints({
      userId,
      cycleId,
      amount: pts,
      type: PointType.PARTICIPATION,
      description: `Week ${cycle.weekNumber} — participation`,
    })
  }

  // ── 4. Streak bonuses + streak counter updates ───────────────────────────
  const allActiveUsers = await prisma.user.findMany({ where: { isActive: true } })

  for (const user of allActiveUsers) {
    const participated = submitterIds.includes(user.id)
    const hasRecover = modifiers.get(user.id)?.recover

    if (participated || hasRecover) {
      const newStreak = user.streakWeeks + 1
      await prisma.user.update({ where: { id: user.id }, data: { streakWeeks: newStreak } })

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
          })
        }
      }

      // Participation drop every 4 weeks (Method B)
      await processParticipationDrop(user.id, participated ? user.streakWeeks + 1 : user.streakWeeks)
    } else {
      // Reset streak
      await prisma.user.update({ where: { id: user.id }, data: { streakWeeks: 0 } })
    }
  }

  // ── 5. Cross-user chip effects (need points to be awarded first) ─────────

  // Mega Drain — siphon 50% of target's cycle earnings
  for (const [userId, mod] of Array.from(modifiers.entries())) {
    if (!mod.megaDrainTarget) continue

    const targetEarned = await prisma.pointsLedger.aggregate({
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
      })
    }
  }

  // Skull Bash — steal 30 pts if activator outranked the target
  for (const [userId, mod] of Array.from(modifiers.entries())) {
    if (!mod.skullBashTarget) continue

    const [myResult, targetResult] = await Promise.all([
      prisma.cycleResult.findFirst({ where: { userId, cycleId } }),
      prisma.cycleResult.findFirst({ where: { userId: mod.skullBashTarget, cycleId } }),
    ])

    const myPos = myResult?.position ?? 999
    const targetPos = targetResult?.position ?? 999

    if (myPos < targetPos) {
      await Promise.all([
        awardPoints({ userId, cycleId, amount: 30, type: PointType.CHIP_BONUS, description: `Skull Bash win` }),
        awardPoints({ userId: mod.skullBashTarget, cycleId, amount: -30, type: PointType.CHIP_PENALTY, description: `Skull Bash loss` }),
      ])
    }
  }

  // ── 6. Check achievements for all participants ────────────────────────────
  for (const userId of submitterIds) {
    await checkAndAwardAchievements(userId, cycleId)
  }

  // ── 7. Update cycle status ────────────────────────────────────────────────
  return prisma.weekCycle.update({
    where: { id: cycleId },
    data: { status: CycleStatus.REVEALED },
  })
}

// ─── Admin force reset ────────────────────────────────────────────────────────

export async function forceReset() {
  const current = await getCurrentCycle()

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
  await openCycle(newCycle.id)
  return newCycle
}