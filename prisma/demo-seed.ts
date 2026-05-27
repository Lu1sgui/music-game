// prisma/demo-seed.ts
// Creates a full demo dataset for development and testing
// All demo users have password: demo1234
// Run with: npm run db:demo

import { PrismaClient, Role, CycleStatus, Platform, PointType, BadgeTier, ConditionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function award(
  userId: number,
  cycleId: number,
  amount: number,
  type: PointType,
  description: string
) {
  await prisma.pointsLedger.create({ data: { userId, cycleId, amount, type, description } })
  await prisma.user.update({ where: { id: userId }, data: { totalPoints: { increment: amount } } })
}

async function giveAchievement(userId: number, slug: string, cycleId: number) {
  const achievement = await prisma.achievement.findUnique({ where: { slug } })
  if (!achievement) return
  const already = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  })
  if (already) return
  await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id, cycleId } })
  if (achievement.pointsBonus > 0) {
    await award(userId, cycleId, achievement.pointsBonus, PointType.ACHIEVEMENT_BONUS, `Achievement: ${achievement.name}`)
  }
}

async function giveChip(userId: number, chipSlug: string, quantity = 1) {
  const chip = await prisma.chip.findUnique({ where: { slug: chipSlug } })
  if (!chip) return
  await prisma.userChip.upsert({
    where: { userId_chipId: { userId, chipId: chip.id } },
    update: { quantity: { increment: quantity }, lastAcquiredAt: new Date() },
    create: { userId, chipId: chip.id, quantity, lastAcquiredAt: new Date() },
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎮 Seeding demo data...\n')
  const hash = await bcrypt.hash('demo1234', 10)

  // ── 1. Users ───────────────────────────────────────────────────────────────
  console.log('→ Creating users...')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@weeklybeats.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@weeklybeats.com',
      passwordHash: hash,
      role: Role.ADMIN,
      avatarSeed: 'admin-2026',
      avatarStyle: 'miniavs',
    },
  })

  const gm = await prisma.user.upsert({
    where: { email: 'devin@weeklybeats.com' },
    update: {},
    create: {
      username: 'devin',
      email: 'devin@weeklybeats.com',
      passwordHash: hash,
      role: Role.GM,
      avatarSeed: 'devin-gm',
      avatarStyle: 'miniavs',
    },
  })

  const sonic = await prisma.user.upsert({
    where: { email: 'sonic@weeklybeats.com' },
    update: {},
    create: {
      username: 'sonic_exe',
      email: 'sonic@weeklybeats.com',
      passwordHash: hash,
      role: Role.PLAYER,
      streakWeeks: 4,
      avatarSeed: 'sonic-pixel',
      avatarStyle: 'miniavs',
    },
  })

  const beat = await prisma.user.upsert({
    where: { email: 'beat@weeklybeats.com' },
    update: {},
    create: {
      username: 'beat_factory',
      email: 'beat@weeklybeats.com',
      passwordHash: hash,
      role: Role.PLAYER,
      streakWeeks: 3,
      avatarSeed: 'beat-factory',
      avatarStyle: 'miniavs',
    },
  })

  const analog = await prisma.user.upsert({
    where: { email: 'analog@weeklybeats.com' },
    update: {},
    create: {
      username: 'analog_kid',
      email: 'analog@weeklybeats.com',
      passwordHash: hash,
      role: Role.PLAYER,
      streakWeeks: 2,
      avatarSeed: 'analog-kid-33',
      avatarStyle: 'miniavs',
    },
  })

  const wave = await prisma.user.upsert({
    where: { email: 'wave@weeklybeats.com' },
    update: {},
    create: {
      username: 'wave_rider',
      email: 'wave@weeklybeats.com',
      passwordHash: hash,
      role: Role.PLAYER,
      streakWeeks: 1,
      avatarSeed: 'wave-rider-88',
      avatarStyle: 'miniavs',
    },
  })

  const neon = await prisma.user.upsert({
    where: { email: 'neon@weeklybeats.com' },
    update: {},
    create: {
      username: 'neon_owl',
      email: 'neon@weeklybeats.com',
      passwordHash: hash,
      role: Role.PLAYER,
      streakWeeks: 0,
      avatarSeed: 'neon-owl-night',
      avatarStyle: 'miniavs',
    },
  })

  const players = [sonic, beat, analog, wave, neon]
  console.log(`  ✓ 7 users created (password: demo1234)`)

  // ── 2. Cycle 1 — ARCHIVED (week 19 · "90s Nostalgia") ──────────────────────
  console.log('→ Creating archived cycle 1 (week 19)...')
  const c1 = await prisma.weekCycle.upsert({
    where: { weekNumber_year: { weekNumber: 19, year: 2026 } },
    update: {},
    create: {
      weekNumber: 19,
      year: 2026,
      theme: '90s Nostalgia',
      themeDescription: 'Take us back to the golden decade. Grunge, pop, hip-hop, britpop — anything that defined the 90s.',
      gmUserId: gm.id,
      status: CycleStatus.ARCHIVED,
      opensAt: new Date('2026-05-05T05:00:00Z'),
      closesAt: new Date('2026-05-09T22:00:00Z'),
      revealsAt: new Date('2026-05-11T05:00:00Z'),
      archivedAt: new Date('2026-05-18T05:00:00Z'),
    },
  })

  // Submissions for cycle 1
  const c1songs = [
    { user: sonic,  title: 'Smells Like Teen Spirit', artist: 'Nirvana',     platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/5ghIJDpPoe3CfHMGu71E6T' },
    { user: beat,   title: 'Losing My Religion',       artist: 'R.E.M.',      platform: Platform.YOUTUBE, url: 'https://www.youtube.com/watch?v=xwtdhWltSIg' },
    { user: analog, title: 'No Scrubs',                artist: 'TLC',         platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/1ynDdMJpegWKHGFWCHLGvp' },
    { user: wave,   title: 'Wonderwall',               artist: 'Oasis',       platform: Platform.YOUTUBE, url: 'https://www.youtube.com/watch?v=bx1Bh8ZvH84' },
    { user: neon,   title: 'Karma Police',             artist: 'Radiohead',   platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/63OQupATfueTdZMWTxW03A' },
  ]
  const c1subs: Record<string, number> = {}
  for (const s of c1songs) {
    const existing = await prisma.submission.findUnique({
      where: { userId_cycleId: { userId: s.user.id, cycleId: c1.id } },
    })
    const sub = existing ?? await prisma.submission.create({
      data: { userId: s.user.id, cycleId: c1.id, songTitle: s.title, songArtist: s.artist, platform: s.platform, url: s.url },
    })
    c1subs[s.user.username] = sub.id
  }

  // Results — positions
  const c1results = [
    { user: sonic,  sub: c1subs['sonic_exe'],   position: 1, notes: 'Classic choice, perfect energy. No contest.' },
    { user: beat,   sub: c1subs['beat_factory'], position: 2, notes: 'Beautiful and nostalgic.' },
    { user: analog, sub: c1subs['analog_kid'],  position: 3, notes: 'The 90s queens. Solid pick.' },
  ]
  for (const r of c1results) {
    await prisma.cycleResult.upsert({
      where: { submissionId: r.sub },
      update: {},
      create: { cycleId: c1.id, submissionId: r.sub, userId: r.user.id, position: r.position, gmNotes: r.notes },
    })
  }

  // Points for cycle 1
  if (!(await prisma.pointsLedger.findFirst({ where: { cycleId: c1.id } }))) {
    await award(sonic.id, c1.id, 150, PointType.PODIUM_1ST,    'Week 19 — 1st place')
    await award(beat.id,  c1.id,  80, PointType.PODIUM_2ND,    'Week 19 — 2nd place')
    await award(analog.id,c1.id,  40, PointType.PODIUM_3RD,    'Week 19 — 3rd place')
    await award(wave.id,  c1.id,  20, PointType.PARTICIPATION, 'Week 19 — participation')
    await award(neon.id,  c1.id,  20, PointType.PARTICIPATION, 'Week 19 — participation')
  }

  // ── 3. Cycle 2 — ARCHIVED (week 20 · "Electronic Dreams") ─────────────────
  console.log('→ Creating archived cycle 2 (week 20)...')
  const c2 = await prisma.weekCycle.upsert({
    where: { weekNumber_year: { weekNumber: 20, year: 2026 } },
    update: {},
    create: {
      weekNumber: 20,
      year: 2026,
      theme: 'Electronic Dreams',
      themeDescription: 'Synths, beats, and the future. Techno, house, trance, breakbeat — anything born from machines.',
      gmUserId: gm.id,
      status: CycleStatus.ARCHIVED,
      opensAt: new Date('2026-05-12T05:00:00Z'),
      closesAt: new Date('2026-05-16T22:00:00Z'),
      revealsAt: new Date('2026-05-18T05:00:00Z'),
      archivedAt: new Date('2026-05-25T05:00:00Z'),
    },
  })

  const c2songs = [
    { user: sonic,  title: 'One More Time',      artist: 'Daft Punk',   platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/0DiWol3AO6WpXZgp0goxAV' },
    { user: beat,   title: 'Blue (Da Ba Dee)',   artist: 'Eiffel 65',   platform: Platform.YOUTUBE, url: 'https://www.youtube.com/watch?v=zA52uNzx7Y4' },
    { user: analog, title: 'Sandstorm',          artist: 'Darude',      platform: Platform.YOUTUBE, url: 'https://www.youtube.com/watch?v=y6120QOlsfU' },
    { user: wave,   title: 'Breathe',            artist: 'Faithless',   platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/2nRDsMnYGpU1oZXLPDTDLr' },
    { user: neon,   title: 'Insomnia',           artist: 'Faithless',   platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/0jjSMiyJIYVlAlFikAMsW2' },
  ]
  const c2subs: Record<string, number> = {}
  for (const s of c2songs) {
    const existing = await prisma.submission.findUnique({
      where: { userId_cycleId: { userId: s.user.id, cycleId: c2.id } },
    })
    const sub = existing ?? await prisma.submission.create({
      data: { userId: s.user.id, cycleId: c2.id, songTitle: s.title, songArtist: s.artist, platform: s.platform, url: s.url },
    })
    c2subs[s.user.username] = sub.id
  }

  const c2results = [
    { user: beat,  sub: c2subs['beat_factory'], position: 1, notes: 'Eiffel 65 was the move. Iconic.' },
    { user: wave,  sub: c2subs['wave_rider'],   position: 2, notes: 'Faithless is always a W.' },
    { user: sonic, sub: c2subs['sonic_exe'],    position: 3, notes: 'Safe pick, but Daft Punk never misses.' },
  ]
  for (const r of c2results) {
    await prisma.cycleResult.upsert({
      where: { submissionId: r.sub },
      update: {},
      create: { cycleId: c2.id, submissionId: r.sub, userId: r.user.id, position: r.position, gmNotes: r.notes },
    })
  }

  if (!(await prisma.pointsLedger.findFirst({ where: { cycleId: c2.id } }))) {
    await award(beat.id,  c2.id, 150, PointType.PODIUM_1ST,    'Week 20 — 1st place')
    await award(wave.id,  c2.id,  80, PointType.PODIUM_2ND,    'Week 20 — 2nd place')
    await award(sonic.id, c2.id,  40, PointType.PODIUM_3RD,    'Week 20 — 3rd place')
    await award(analog.id,c2.id,  20, PointType.PARTICIPATION, 'Week 20 — participation')
    await award(neon.id,  c2.id,  20, PointType.PARTICIPATION, 'Week 20 — participation')
    // Streak bonuses (week 2 = +5 each)
    for (const p of players) {
      await award(p.id, c2.id, 5, PointType.STREAK_BONUS, 'Week 20 — streak bonus (2 weeks)')
    }
  }

  // ── 4. Cycle 3 — OPEN (week 21 · "Latin Vibes") ───────────────────────────
  console.log('→ Creating current open cycle (week 21)...')
  const c3 = await prisma.weekCycle.upsert({
    where: { weekNumber_year: { weekNumber: 21, year: 2026 } },
    update: {},
    create: {
      weekNumber: 21,
      year: 2026,
      theme: 'Latin Vibes',
      themeDescription: 'Reggaeton, salsa, cumbia, Latin pop — anything with that groove. Show us your best Latin track.',
      gmUserId: gm.id,
      status: CycleStatus.OPEN,
      opensAt: new Date('2026-05-26T05:00:00Z'),
      closesAt: new Date('2026-05-30T22:00:00Z'),
      revealsAt: new Date('2026-06-01T05:00:00Z'),
    },
  })

  // Partial submissions (not all players submitted yet)
  const c3songs = [
    { user: sonic,  title: 'Con Calma',     artist: 'Daddy Yankee', platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/5lHkZiNqxXiCJ7YiEYHi1H' },
    { user: beat,   title: 'Despacito',     artist: 'Luis Fonsi',   platform: Platform.YOUTUBE, url: 'https://www.youtube.com/watch?v=kTJczUoc26U' },
    { user: analog, title: 'Gasolina',      artist: 'Daddy Yankee', platform: Platform.SPOTIFY, url: 'https://open.spotify.com/track/21jGcNKet2qwijlDFuLiTY' },
  ]
  for (const s of c3songs) {
    const existing = await prisma.submission.findUnique({
      where: { userId_cycleId: { userId: s.user.id, cycleId: c3.id } },
    })
    if (!existing) {
      await prisma.submission.create({
        data: { userId: s.user.id, cycleId: c3.id, songTitle: s.title, songArtist: s.artist, platform: s.platform, url: s.url },
      })
    }
  }

  // ── 5. Achievements ────────────────────────────────────────────────────────
  console.log('→ Awarding achievements...')

  // sonic_exe: veteran submitter + podium regular + 1st place winner
  await giveAchievement(sonic.id, 'first-note',   c1.id)
  await giveAchievement(sonic.id, 'regular',       c1.id)
  await giveAchievement(sonic.id, 'on-a-roll',     c2.id)
  await giveAchievement(sonic.id, 'chart-entry',   c1.id)
  await giveAchievement(sonic.id, 'chart-climber', c2.id)
  await giveAchievement(sonic.id, 'gold-standard', c1.id)

  // beat_factory: first place last week
  await giveAchievement(beat.id, 'first-note',   c1.id)
  await giveAchievement(beat.id, 'regular',       c1.id)
  await giveAchievement(beat.id, 'on-a-roll',     c2.id)
  await giveAchievement(beat.id, 'chart-entry',   c1.id)
  await giveAchievement(beat.id, 'gold-standard', c2.id)

  // analog_kid
  await giveAchievement(analog.id, 'first-note', c1.id)
  await giveAchievement(analog.id, 'regular',    c1.id)
  await giveAchievement(analog.id, 'chart-entry',c1.id)

  // wave_rider
  await giveAchievement(wave.id, 'first-note', c1.id)
  await giveAchievement(wave.id, 'regular',    c1.id)
  await giveAchievement(wave.id, 'chart-entry',c2.id)

  // neon_owl: just started
  await giveAchievement(neon.id, 'first-note', c1.id)

  // devin (GM)
  await giveAchievement(gm.id, 'behind-the-mic', c1.id)

  // ── 6. Chips ───────────────────────────────────────────────────────────────
  console.log('→ Giving chips...')

  await giveChip(sonic.id, 'swords-dance')     // Rare — earned from achievements
  await giveChip(sonic.id, 'flash')             // Common

  await giveChip(beat.id, 'mega-drain')         // Legendary — 1st place reward
  await giveChip(beat.id, 'double-team')        // Rare
  await giveChip(beat.id, 'smokescreen')        // Common

  await giveChip(analog.id, 'substitute')       // Common
  await giveChip(analog.id, 'disable')          // Rare

  await giveChip(wave.id, 'recover')            // Common
  await giveChip(wave.id, 'reflect')            // Rare

  await giveChip(neon.id, 'flash')              // Common — just started

  // ── 7. Fix streak bonuses already awarded in cycle 1 ──────────────────────
  // Add missing streak bonus for cycle 1 (week 1 = no streak bonus, only from week 2+)

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n✅ Demo data created!\n')
  console.log('Demo accounts (password: demo1234)')
  console.log('─────────────────────────────────────')
  console.log('admin@weeklybeats.com   → Admin')
  console.log('devin@weeklybeats.com   → Game Master')
  console.log('sonic@weeklybeats.com   → Player (rank ~1)')
  console.log('beat@weeklybeats.com    → Player (rank ~2)')
  console.log('analog@weeklybeats.com  → Player')
  console.log('wave@weeklybeats.com    → Player')
  console.log('neon@weeklybeats.com    → Player')
  console.log('─────────────────────────────────────')
  console.log('\nCycles created:')
  console.log('  Week 19 — ARCHIVED  (90s Nostalgia)')
  console.log('  Week 20 — ARCHIVED  (Electronic Dreams)')
  console.log('  Week 21 — OPEN      (Latin Vibes) ← current')
}

main()
  .catch((e) => { console.error('❌ Demo seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
