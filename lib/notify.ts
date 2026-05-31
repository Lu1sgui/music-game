// lib/notify.ts
import { prisma } from './prisma'
import { sendEmail, resultsEmail } from './email'

// ─── In-app notifications ──────────────────────────────────────────────────────

export async function notifyUser(userId: number, message: string): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, message } })
  } catch (err) {
    console.warn('[notify] Failed:', err)
  }
}

export async function notifyManyUsers(userIds: number[], message: string): Promise<void> {
  if (userIds.length === 0) return
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, message })),
    })
  } catch (err) {
    console.warn('[notify] Bulk failed:', err)
  }
}

// Notify every active player (optionally excluding some ids)
export async function notifyAllActive(message: string, exclude: number[] = []): Promise<void> {
  const users = await prisma.user.findMany({
    where: { isActive: true, id: { notIn: exclude } },
    select: { id: true },
  })
  await notifyManyUsers(users.map((u) => u.id), message)
}

// ─── Email (opt-in respected) ──────────────────────────────────────────────────

// Sends an email only if the user has emailOptIn = true. Returns false if skipped.
export async function emailOptedInUser(
  userId: number,
  subject: string,
  html: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailOptIn: true },
  })
  if (!user || !user.emailOptIn) return false
  return sendEmail({ to: user.email, subject, html })
}

// ─── Lifecycle events ──────────────────────────────────────────────────────────

// Reminder to active players who haven't submitted yet in the given cycle (in-app only)
export async function notifySubmissionReminder(cycleId: number): Promise<number> {
  const [activeUsers, submissions] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, select: { id: true } }),
    prisma.submission.findMany({ where: { cycleId }, select: { userId: true } }),
  ])
  const submitted = new Set(submissions.map((s) => s.userId))
  const slackers = activeUsers.filter((u) => !submitted.has(u.id)).map((u) => u.id)
  await notifyManyUsers(
    slackers,
    "⏰ Last call! Submissions close Friday at 17:00 — drop your song before it's too late."
  )
  return slackers.length
}

// At the Monday reveal: tell every submitter how they did (in-app + results email).
// Also surfaces any offensive chips that landed on them this cycle.
export async function notifyRevealResults(cycleId: number): Promise<void> {
  const cycle = await prisma.weekCycle.findUnique({
    where: { id: cycleId },
    select: { weekNumber: true, theme: true },
  })
  if (!cycle) return

  const [results, submissions, ledger] = await Promise.all([
    prisma.cycleResult.findMany({ where: { cycleId }, select: { userId: true, position: true } }),
    prisma.submission.findMany({
      where: { cycleId },
      select: { userId: true, user: { select: { username: true } } },
    }),
    prisma.pointsLedger.groupBy({ by: ['userId'], where: { cycleId }, _sum: { amount: true } }),
  ])

  const placeByUser = new Map(results.map((r) => [r.userId, r.position]))
  const pointsByUser = new Map(ledger.map((l) => [l.userId, l._sum.amount ?? 0]))
  const nameByUser = new Map(submissions.map((s) => [s.userId, s.user.username]))
  const submitterIds = Array.from(new Set(submissions.map((s) => s.userId)))

  for (const userId of submitterIds) {
    const place = placeByUser.get(userId) ?? null
    const points = pointsByUser.get(userId) ?? 0
    const placeText =
      place === 1 ? '🥇 1st place' : place === 2 ? '🥈 2nd place' : place === 3 ? '🥉 3rd place' : 'participation'
    await notifyUser(
      userId,
      `✦ Week ${cycle.weekNumber} revealed — you earned **${points >= 0 ? '+' : ''}${points}** points (${placeText}).`
    )
    // Conservative email scope: results email goes out (opt-in respected)
    await emailOptedInUser(
      userId,
      `⚡ Week ${cycle.weekNumber} results — Weekly Beats`,
      resultsEmail(nameByUser.get(userId) ?? 'player', cycle.weekNumber, place, points, cycle.theme)
    )
  }

  // Surface offensive chips that landed (hidden until now)
  const hits = await prisma.chipActivation.findMany({
    where: { cycleId, status: 'RESOLVED', targetUserId: { not: null }, chip: { offensive: true } },
    include: { chip: { select: { name: true } }, user: { select: { username: true } } },
  })
  for (const hit of hits) {
    if (!hit.targetUserId) continue
    await notifyUser(
      hit.targetUserId,
      `⚔️ You were hit by **${hit.chip.name}** (from @${hit.user.username}) this week.`
    )
  }
}
