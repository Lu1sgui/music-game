// lib/notify.ts
import { prisma } from './prisma'
import { ChipEffect } from '@prisma/client'
import { sendEmail, resultsEmail, chipHitEmail, achievementEmail, gmChosenEmail } from './email'

// Deception chips — their effect is revealed at reveal, but we don't EMAIL the
// victim about them (knowing who did it spoils the whodunit). In-app still shows.
const SECRET_CHIPS = new Set<ChipEffect>([ChipEffect.SWITCHEROO, ChipEffect.COPYCAT, ChipEffect.MUTE])

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

  // Surface offensive chips that landed (hidden until now) — in-app + email
  const hits = await prisma.chipActivation.findMany({
    where: { cycleId, status: 'RESOLVED', targetUserId: { not: null }, chip: { offensive: true } },
    include: {
      chip: { select: { name: true, slug: true, description: true, effectType: true } },
      user: { select: { username: true, avatarSeed: true, avatarStyle: true } },
      targetUser: { select: { id: true, username: true, email: true, emailOptIn: true } },
    },
  })
  for (const hit of hits) {
    if (!hit.targetUserId || !hit.targetUser) continue
    await notifyUser(
      hit.targetUserId,
      `⚔️ You were hit by **${hit.chip.name}** (from @${hit.user.username}) this week.`
    )
    // Email the victim — opt-in respected, and NOT for deception/secret chips
    if (hit.targetUser.emailOptIn && !SECRET_CHIPS.has(hit.chip.effectType)) {
      await sendEmail({
        to: hit.targetUser.email,
        subject: `⚔️ ${hit.chip.name} was played on you — Weekly Beats`,
        html: chipHitEmail(
          hit.targetUser.username, hit.user.username, hit.user.avatarSeed, hit.user.avatarStyle,
          hit.chip.slug, hit.chip.name, hit.chip.description
        ),
      })
    }
  }

  // Achievements unlocked this reveal — in-app + email
  const earned = await prisma.userAchievement.findMany({
    where: { cycleId },
    include: {
      achievement: { select: { name: true, description: true, pointsBonus: true, rewardChipSlug: true } },
      user: { select: { email: true, emailOptIn: true, username: true } },
    },
  })
  for (const ua of earned) {
    await notifyUser(ua.userId, `🏆 Achievement unlocked: **${ua.achievement.name}**!`)
    if (ua.user.emailOptIn) {
      const reward = [
        ua.achievement.pointsBonus ? `+${ua.achievement.pointsBonus} pts` : null,
        ua.achievement.rewardChipSlug ? `${ua.achievement.rewardChipSlug} chip` : null,
      ].filter(Boolean).join(' + ') || null
      await sendEmail({
        to: ua.user.email,
        subject: `🏆 Achievement unlocked — Weekly Beats`,
        html: achievementEmail(ua.user.username, ua.achievement.name, ua.achievement.description, reward),
      })
    }
  }

  // Tell defenders when a pre-emptive shield blocked an incoming attack
  const blocked = await prisma.chipActivation.findMany({
    where: { cycleId, status: 'CANCELLED', chip: { offensive: true } },
    include: { chip: { select: { name: true } }, user: { select: { username: true } } },
  })
  const blockLabel: Record<string, string> = {
    cleanse: 'Cleanse',
    mirror_coat: 'Mirror Coat',
    protect: 'Protect',
  }
  for (const b of blocked) {
    const data = b.effectData as { blockedBy?: string; defenderId?: number } | null
    if (!data?.blockedBy || !data?.defenderId) continue
    const how = blockLabel[data.blockedBy] ?? 'Your defense'
    await notifyUser(
      data.defenderId,
      `🛡️ Your ${how} blocked **${b.chip.name}** from @${b.user.username}!`
    )
  }
}

// Tell a player they're the Game Master (in-app + opt-in email)
export async function notifyGmAssigned(userId: number, weekNumber: number, theme?: string | null): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true, emailOptIn: true },
  })
  if (!u) return
  await notifyUser(userId, `👑 You're the Game Master for week ${weekNumber}! Set the theme and score the songs.`)
  if (u.emailOptIn) {
    await sendEmail({
      to: u.email,
      subject: `👑 You're this week's Game Master — Weekly Beats`,
      html: gmChosenEmail(u.username, weekNumber, theme),
    })
  }
}
