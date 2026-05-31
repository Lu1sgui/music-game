// lib/cron.ts
// Weekly cycle scheduler — 3 cron jobs, all times COT (UTC-5)
//
// Monday   00:00 COT → reveal last week's results, archive, create new cycle (PENDING)
// Tuesday  00:00 COT → open submissions (PENDING → OPEN)
// Friday   17:00 COT → close submissions (OPEN → CLOSED), GM window starts (Sat + Sun)
//
// Initialized once at server startup via instrumentation.ts

import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { CycleStatus, Role } from '@prisma/client'
import {
  openCycle,
  closeCycle,
  advanceWeek,
} from '@/lib/cycle'
import {
  notifyAllActive,
  notifyManyUsers,
  notifySubmissionReminder,
} from '@/lib/notify'

let initialized = false

export function initCron() {
  if (initialized) {
    console.log('[cron] Already initialized — skipping')
    return
  }
  initialized = true

  // ── Monday 00:00 COT (05:00 UTC) ─────────────────────────────────────────
  // Reveal previous cycle → archive → create new cycle (PENDING).
  // BUT: if the GM hasn't scored, the auto-reveal does NOT fire — it waits and
  // notifies the admins, who reveal manually from the panel ("Advance week").
  cron.schedule(process.env.CYCLE_REVEAL_CRON ?? '0 5 * * 1', async () => {
    console.log('[cron] Monday: advancing the week')
    try {
      const result = await advanceWeek({ requireGmResults: true })

      if (result.revealed) {
        console.log(`[cron] Cycle ${result.closedId} revealed + archived; new cycle ${result.newCycleId} created`)
      } else if (result.reason === 'gm_not_scored') {
        console.warn(`[cron] Cycle ${result.closedId} has NO GM results — auto-reveal skipped, waiting for manual reveal`)
        const admins = await prisma.user.findMany({
          where: { isActive: true, role: { in: [Role.ADMIN, Role.GM] } },
          select: { id: true },
        })
        await notifyManyUsers(
          admins.map((u) => u.id),
          "⚠️ This week wasn't scored — the auto-reveal was held. Score the songs, then Advance the week from the admin panel."
        )
      } else {
        console.warn('[cron] No CLOSED cycle to reveal — nothing to do')
      }
    } catch (err) {
      console.error('[cron] Monday trigger failed:', err)
    }
  })

  // ── Tuesday 00:00 COT (05:00 UTC) ────────────────────────────────────────
  // Open submissions — PENDING → OPEN
  cron.schedule(process.env.CYCLE_OPEN_CRON ?? '0 5 * * 2', async () => {
    console.log('[cron] Tuesday: opening submissions')
    try {
      const pending = await prisma.weekCycle.findFirst({
        where: { status: CycleStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      })

      if (!pending) {
        console.warn('[cron] No PENDING cycle to open')
        return
      }

      await openCycle(pending.id)
      console.log(`[cron] Cycle ${pending.id} is now OPEN — submissions accepted`)

      await notifyAllActive(
        `🎶 Submissions are OPEN! Drop your song before Friday 17:00. You can also play up to 3 chips this week.`
      )
    } catch (err) {
      console.error('[cron] Tuesday trigger failed:', err)
    }
  })

  // ── Thursday 17:00 COT (22:00 UTC) ───────────────────────────────────────
  // Remind active players who haven't submitted yet (in-app only)
  cron.schedule(process.env.CYCLE_REMINDER_CRON ?? '0 22 * * 4', async () => {
    console.log('[cron] Thursday: sending submission reminders')
    try {
      const open = await prisma.weekCycle.findFirst({
        where: { status: CycleStatus.OPEN },
        orderBy: { createdAt: 'desc' },
      })
      if (!open) {
        console.warn('[cron] No OPEN cycle for reminders')
        return
      }
      const reminded = await notifySubmissionReminder(open.id)
      console.log(`[cron] Reminders sent to ${reminded} players who haven't submitted`)
    } catch (err) {
      console.error('[cron] Thursday trigger failed:', err)
    }
  })

  // Close the OPEN cycle if its (possibly Extra-Time-extended) deadline has passed.
  const closeIfDue = async (label: string) => {
    const current = await prisma.weekCycle.findFirst({
      where: { status: CycleStatus.OPEN },
      orderBy: { createdAt: 'desc' },
    })
    if (!current) {
      console.warn(`[cron] ${label}: no OPEN cycle to close`)
      return
    }
    // Respect Extra Time — don't close until closesAt (2-min tolerance for cron jitter)
    if (Date.now() + 120_000 < new Date(current.closesAt).getTime()) {
      console.log(`[cron] ${label}: cycle ${current.id} extended (Extra Time) — closes at ${current.closesAt.toISOString()}`)
      return
    }

    await closeCycle(current.id)
    console.log(`[cron] ${label}: cycle ${current.id} is now CLOSED — GM can score`)

    await notifyAllActive('🔒 Submissions are closed! Results drop Monday. Defensive chips can still be played all weekend.')
    const judges = await prisma.user.findMany({
      where: { isActive: true, role: { in: [Role.GM, Role.ADMIN] } },
      select: { id: true },
    })
    await notifyManyUsers(judges.map((u) => u.id), '⚖️ Submissions are in — time to score this week\'s songs!')
  }

  // ── Friday 17:00 COT (22:00 UTC) ─────────────────────────────────────────
  // Close submissions — OPEN → CLOSED — GM window starts (Sat + Sun)
  cron.schedule(process.env.CYCLE_CLOSE_CRON ?? '0 22 * * 5', async () => {
    console.log('[cron] Friday 17:00: closing submissions')
    try { await closeIfDue('Friday') } catch (err) { console.error('[cron] Friday trigger failed:', err) }
  })

  // ── Saturday 17:00 COT (22:00 UTC) ───────────────────────────────────────
  // Catch cycles whose deadline was pushed by Extra Time
  cron.schedule(process.env.CYCLE_CLOSE_EXTENDED_CRON ?? '0 22 * * 6', async () => {
    console.log('[cron] Saturday: closing Extra-Time-extended cycles')
    try { await closeIfDue('Saturday') } catch (err) { console.error('[cron] Saturday trigger failed:', err) }
  })

  console.log('[cron] Scheduler initialized ✓')
  console.log(`[cron] Reveal + archive + create:  ${process.env.CYCLE_REVEAL_CRON ?? '0 5 * * 1'}  (Mon 00:00 COT)`)
  console.log(`[cron] Open submissions:            ${process.env.CYCLE_OPEN_CRON ?? '0 5 * * 2'}  (Tue 00:00 COT)`)
  console.log(`[cron] Submission reminder:         ${process.env.CYCLE_REMINDER_CRON ?? '0 22 * * 4'} (Thu 17:00 COT)`)
  console.log(`[cron] Close submissions:           ${process.env.CYCLE_CLOSE_CRON ?? '0 22 * * 5'} (Fri 17:00 COT)`)
  console.log(`[cron] Close extended (Extra Time): ${process.env.CYCLE_CLOSE_EXTENDED_CRON ?? '0 22 * * 6'} (Sat 17:00 COT)`)
}
