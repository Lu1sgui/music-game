// prisma/reset.ts
// Wipes all game data and starts a fresh cycle.
// Keeps only admin@weeklybeats.com and devin@weeklybeats.com.
// Run: npm run db:reset

import { PrismaClient, CycleStatus } from '@prisma/client'

const prisma = new PrismaClient()

const KEEP_EMAILS = ['admin@weeklybeats.com', 'devin@weeklybeats.com']

function isoWeekNumber(d: Date): number {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}

function nextWeekday(from: Date, targetDay: number): Date {
  // targetDay: 0=Sun, 1=Mon, 5=Fri
  const d = new Date(from)
  d.setDate(d.getDate() + ((targetDay - d.getDay() + 7) % 7 || 7))
  return d
}

async function main() {
  console.log('🧹 Starting DB reset...\n')

  // 1. Find keeper users
  const keepers = await prisma.user.findMany({ where: { email: { in: KEEP_EMAILS } } })
  if (keepers.length === 0) {
    console.error('❌ Could not find admin/devin accounts. Aborting.')
    process.exit(1)
  }
  const keepIds = keepers.map(u => u.id)
  console.log(`→ Keeping: ${keepers.map(u => `@${u.username}`).join(', ')}`)

  // 2. Delete all game data (order matters for FK constraints)
  console.log('→ Wiping chip activations...')
  await prisma.chipActivation.deleteMany({})

  console.log('→ Wiping cycle results...')
  await prisma.cycleResult.deleteMany({})

  console.log('→ Wiping points ledger...')
  await prisma.pointsLedger.deleteMany({})

  console.log('→ Wiping submissions...')
  await prisma.submission.deleteMany({})

  console.log('→ Wiping cycles...')
  await prisma.weekCycle.deleteMany({})

  console.log('→ Wiping user chips and achievements...')
  await prisma.userChip.deleteMany({})
  await prisma.userAchievement.deleteMany({})

  console.log('→ Wiping notifications...')
  try { await prisma.notification.deleteMany({}) } catch {}

  console.log('→ Deleting non-keeper users...')
  await prisma.user.deleteMany({ where: { email: { notIn: KEEP_EMAILS } } })

  console.log('→ Resetting keeper stats...')
  await prisma.user.updateMany({
    where: { id: { in: keepIds } },
    data: { totalPoints: 0, streakWeeks: 0, bideStored: false },
  })

  // 3. Create fresh OPEN cycle for this week
  const now = new Date()
  const weekNumber = isoWeekNumber(now)
  const year = now.getFullYear()

  // closes this coming Friday 17:00 COT (22:00 UTC)
  const closesDate = nextWeekday(now, 5)
  closesDate.setUTCHours(22, 0, 0, 0)

  // reveals next Monday 00:00 COT (05:00 UTC)
  const revealsDate = nextWeekday(closesDate, 1)
  revealsDate.setUTCHours(5, 0, 0, 0)

  console.log(`→ Creating fresh OPEN cycle: Week ${weekNumber}, ${year}`)

  const cycle = await prisma.weekCycle.create({
    data: {
      weekNumber,
      year,
      status: CycleStatus.OPEN,
      opensAt: now,
      closesAt: closesDate,
      revealsAt: revealsDate,
    },
  })

  console.log('\n✅ Reset complete!\n')
  console.log(`Accounts kept:  ${keepers.map(u => `@${u.username} (${u.role})`).join(', ')}`)
  console.log(`Active cycle:   Week ${cycle.weekNumber}, ${cycle.year} — OPEN`)
  console.log(`Closes at:      ${closesDate.toUTCString()}`)
  console.log(`Reveals at:     ${revealsDate.toUTCString()}`)
  console.log('\nReady for a new game! 🎮')
}

main()
  .catch(e => { console.error('❌ Reset failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
