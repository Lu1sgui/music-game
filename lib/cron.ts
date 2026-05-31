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
  revealCycle,
  archiveCycle,
  createCycle,
  buildCycleSchedule,
  getCurrentCycle,
} from '@/lib/cycle'
import {
  notifyAllActive,
  notifyManyUsers,
  notifyRevealResults,
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
  // 1. Reveal previous cycle (award points, resolve chips)
  // 2. Archive it
  // 3. Create new cycle as PENDING (theme visible, submissions not open yet)
  cron.schedule(process.env.CYCLE_REVEAL_CRON ?? '0 5 * * 1', async () => {
    console.log('[cron] Monday: revealing + archiving + creating new cycle')
    try {
      // Reveal the closed cycle (GM scored during Sat + Sun)
      const closed = await prisma.weekCycle.findFirst({
        where: { status: CycleStatus.CLOSED },
        orderBy: { createdAt: 'desc' },
      })

      if (closed) {
        const resultCount = await prisma.cycleResult.count({ where: { cycleId: closed.id } })
        if (resultCount === 0) {
          console.warn(`[cron] Cycle ${closed.id} has no GM results — revealing with participation only`)
        }
        await revealCycle(closed.id)
        console.log(`[cron] Cycle ${closed.id} REVEALED`)

        // Notify players of their results (in-app + opt-in results email)
        await notifyRevealResults(closed.id)
        console.log(`[cron] Cycle ${closed.id} result notifications sent`)

        await archiveCycle(closed.id)
        console.log(`[cron] Cycle ${closed.id} ARCHIVED`)
      } else {
        console.warn('[cron] No CLOSED cycle found to reveal')
      }

      // Create new cycle starting this Monday (submissions open Tuesday)
      const now = new Date()
      const schedule = buildCycleSchedule(now)
      const newCycle = await createCycle(schedule)
      console.log(`[cron] New cycle ${newCycle.id} created (PENDING) — week ${newCycle.weekNumber}`)
      console.log(`[cron] Submissions open: ${schedule.opensAt.toISOString()}`)
      console.log(`[cron] Submissions close: ${schedule.closesAt.toISOString()}`)

      // Announce the new week (in-app only — conservative email scope)
      await notifyAllActive(
        `🎵 A new week has begun! Submissions open Tuesday at 00:00. Get your song ready.`
      )
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

  // ── Friday 17:00 COT (22:00 UTC) ─────────────────────────────────────────
  // Close submissions — OPEN → CLOSED — GM window starts (Sat + Sun)
  cron.schedule(process.env.CYCLE_CLOSE_CRON ?? '0 22 * * 5', async () => {
    console.log('[cron] Friday 17:00: closing submissions')
    try {
      const current = await getCurrentCycle()

      if (!current) {
        console.warn('[cron] No active cycle to close')
        return
      }
      if (current.status !== CycleStatus.OPEN) {
        console.warn(`[cron] Cycle ${current.id} is ${current.status}, expected OPEN`)
        return
      }

      await closeCycle(current.id)
      console.log(`[cron] Cycle ${current.id} is now CLOSED — GM can score (Sat + Sun)`)

      // Players: results on Monday. GMs/admins: time to score.
      await notifyAllActive('🔒 Submissions are closed! Results drop Monday. Defensive chips can still be played all weekend.')
      const judges = await prisma.user.findMany({
        where: { isActive: true, role: { in: [Role.GM, Role.ADMIN] } },
        select: { id: true },
      })
      await notifyManyUsers(judges.map((u) => u.id), '⚖️ Submissions are in — time to score this week\'s songs!')
    } catch (err) {
      console.error('[cron] Friday trigger failed:', err)
    }
  })

  console.log('[cron] Scheduler initialized ✓')
  console.log(`[cron] Reveal + archive + create:  ${process.env.CYCLE_REVEAL_CRON ?? '0 5 * * 1'}  (Mon 00:00 COT)`)
  console.log(`[cron] Open submissions:            ${process.env.CYCLE_OPEN_CRON ?? '0 5 * * 2'}  (Tue 00:00 COT)`)
  console.log(`[cron] Submission reminder:         ${process.env.CYCLE_REMINDER_CRON ?? '0 22 * * 4'} (Thu 17:00 COT)`)
  console.log(`[cron] Close submissions:           ${process.env.CYCLE_CLOSE_CRON ?? '0 22 * * 5'} (Fri 17:00 COT)`)
}
