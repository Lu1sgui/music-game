// prisma/expansion-seed.ts
// Seeds the EXPANSION chip catalog (Activation model v2).
// Idempotent: upserts by slug, so it's safe to re-run on every deploy.
//
// Run:  npx tsx prisma/expansion-seed.ts
//
// `enabled: false` means the chip is in the catalog but not yet playable — its
// effect lands in a later step, then we flip it to true here and re-run.

import { PrismaClient, ChipEffect, ChipRarity, ChipPhase, BadgeTier, ConditionType } from '@prisma/client'

const prisma = new PrismaClient()

// New achievements that reward expansion chips. They use EXISTING condition types,
// so the achievement checker handles them with no code change.
const ACHIEVEMENTS = [
  { slug: 'aggressor',   name: 'Aggressor',   description: 'Reach the podium 3 times.',  badgeTier: BadgeTier.SILVER, conditionType: ConditionType.PODIUM_COUNT,     conditionValue: 3,  pointsBonus: 30, rewardChipSlug: 'toxic' },
  { slug: 'high-roller', name: 'High Roller', description: 'Win 1st place twice.',       badgeTier: BadgeTier.GOLD,   conditionType: ConditionType.TOP_1_COUNT,      conditionValue: 2,  pointsBonus: 50, rewardChipSlug: 'gamble' },
  { slug: 'survivor',    name: 'Survivor',    description: 'Keep a 6-week streak.',      badgeTier: BadgeTier.SILVER, conditionType: ConditionType.STREAK_WEEKS,     conditionValue: 6,  pointsBonus: 40, rewardChipSlug: 'protect' },
  { slug: 'collector',   name: 'Collector',   description: 'Submit 15 songs.',           badgeTier: BadgeTier.SILVER, conditionType: ConditionType.SUBMISSION_COUNT, conditionValue: 15, pointsBonus: 35, rewardChipSlug: 'cleanse' },
  { slug: 'saboteur',    name: 'Saboteur',    description: 'Reach the podium 8 times.',  badgeTier: BadgeTier.GOLD,   conditionType: ConditionType.PODIUM_COUNT,     conditionValue: 8,  pointsBonus: 70, rewardChipSlug: 'switcheroo' },
  { slug: 'kingmaker',   name: 'Kingmaker',   description: 'Serve as Game Master twice.',badgeTier: BadgeTier.GOLD,   conditionType: ConditionType.GM_COUNT,         conditionValue: 2,  pointsBonus: 60, rewardChipSlug: 'crown' },
]

type ChipSeed = {
  slug: string
  name: string
  description: string
  effectType: ChipEffect
  rarity: ChipRarity
  requiresTarget: boolean
  phase: ChipPhase
  offensive: boolean
  enabled: boolean
}

// phase: OPEN_ONLY = Tue–Fri (offensive + song-touching); ANYTIME = until Mon reveal (defense/intel)
// offensive: counts toward a target's anti-grief cap (max 2/cycle) and is hidden until reveal
const CHIPS: ChipSeed[] = [
  // ── New COMMON ──────────────────────────────────────────────────────────
  { slug: 'cushion',   name: 'Cushion',   description: "If you don't make the podium, your participation points are increased by 50%.", effectType: ChipEffect.CUSHION,   rarity: ChipRarity.COMMON, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'spotlight', name: 'Spotlight', description: 'If you make the podium this week, gain +15 bonus points.',                    effectType: ChipEffect.SPOTLIGHT, rarity: ChipRarity.COMMON, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'insight',   name: 'Insight',   description: 'Reveals how many songs and chips have been played this week.',              effectType: ChipEffect.INSIGHT,   rarity: ChipRarity.COMMON, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'insurance', name: 'Insurance', description: 'If you are Vetoed, Blacked-out or Switcheroo\'d, you still keep participation points and your streak.', effectType: ChipEffect.INSURANCE, rarity: ChipRarity.COMMON, requiresTarget: false, phase: ChipPhase.ANYTIME, offensive: false, enabled: true },
  { slug: 'donation',  name: 'Donation',  description: 'Gift one of your other chips to another player.',                            effectType: ChipEffect.DONATION,  rarity: ChipRarity.COMMON, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },

  // ── New RARE ────────────────────────────────────────────────────────────
  { slug: 'toxic',       name: 'Toxic',       description: 'The target loses 30% of the points they earn this week.',                  effectType: ChipEffect.TOXIC,       rarity: ChipRarity.RARE, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'payday',      name: 'Payday',      description: 'If the target makes the podium, you steal 25 points from them.',           effectType: ChipEffect.PAYDAY,      rarity: ChipRarity.RARE, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'protect',     name: 'Protect',     description: 'Blocks one negative chip targeting you this week.',                        effectType: ChipEffect.PROTECT,     rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.ANYTIME,   offensive: false, enabled: true },
  { slug: 'gamble',      name: 'Gamble',      description: 'If you make the podium, your points are multiplied by 1.5 — if not, you lose 20.', effectType: ChipEffect.GAMBLE, rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'pickpocket',  name: 'Pickpocket',  description: 'Steal a random chip from the target\'s inventory.',                        effectType: ChipEffect.PICKPOCKET,  rarity: ChipRarity.RARE, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'bounty',      name: 'Bounty',      description: 'Place a 20-point bounty on a rival — whoever outscores them this week splits it.', effectType: ChipEffect.BOUNTY, rarity: ChipRarity.RARE, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'cleanse',     name: 'Cleanse',     description: 'Removes all negative effects on you this week, including lingering ones.', effectType: ChipEffect.CLEANSE,     rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.ANYTIME,   offensive: false, enabled: true },
  { slug: 'foresight',   name: 'Foresight',   description: 'Reveals who has targeted you with a chip this week before the reveal.',    effectType: ChipEffect.FORESIGHT,   rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.ANYTIME,   offensive: false, enabled: true },
  { slug: 'banker',      name: 'Banker',      description: 'Bank this week\'s points to earn them x2 next week — lost if you skip next week.', effectType: ChipEffect.BANKER, rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'mute',        name: 'Mute',        description: 'The GM sees the target\'s song without title or artist — just the link.',  effectType: ChipEffect.MUTE,        rarity: ChipRarity.RARE, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'usurp',       name: 'Usurp',       description: 'If you and the target both make the podium, you swap positions with them.', effectType: ChipEffect.USURP,       rarity: ChipRarity.RARE, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'mirror-coat', name: 'Mirror Coat', description: 'Bounces point-draining chips (Toxic, Mega Drain, Leech) back at the caster.', effectType: ChipEffect.MIRROR_COAT, rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.ANYTIME,   offensive: false, enabled: true },
  { slug: 'wildcard',    name: 'Wildcard',    description: 'Counts as any Common chip you name when you play it.',                     effectType: ChipEffect.WILDCARD,    rarity: ChipRarity.RARE, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },

  // ── New LEGENDARY ───────────────────────────────────────────────────────
  { slug: 'blackout',   name: 'Blackout',   description: 'The target cannot submit a song next cycle.',                               effectType: ChipEffect.BLACKOUT,   rarity: ChipRarity.LEGENDARY, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'veto',       name: 'Veto',       description: "The target's song can't make the podium this week — they keep only participation points.", effectType: ChipEffect.VETO, rarity: ChipRarity.LEGENDARY, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'earthquake', name: 'Earthquake', description: 'Every other player loses 15 points this week — but you cannot make the podium.', effectType: ChipEffect.EARTHQUAKE, rarity: ChipRarity.LEGENDARY, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'time-bomb',  name: 'Time Bomb',  description: 'The target loses 50 points at the reveal two cycles from now.',             effectType: ChipEffect.TIME_BOMB,  rarity: ChipRarity.LEGENDARY, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'switcheroo', name: 'Switcheroo', description: "Secretly replace the target's song with one you pick — they won't know until the reveal.", effectType: ChipEffect.SWITCHEROO, rarity: ChipRarity.LEGENDARY, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'copycat',    name: 'Copycat',    description: "Forces the target's entry to become a duplicate of your song.",            effectType: ChipEffect.COPYCAT,    rarity: ChipRarity.LEGENDARY, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },
  { slug: 'curse',      name: 'Curse',      description: 'If the target makes the podium this week, they lose their streak.',         effectType: ChipEffect.CURSE,      rarity: ChipRarity.LEGENDARY, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: true,  enabled: true },

  // ── New GOLDEN (meta) ───────────────────────────────────────────────────
  { slug: 'crown',         name: 'Crown',         description: 'You choose the Game Master for the next cycle.',                       effectType: ChipEffect.CROWN,         rarity: ChipRarity.GOLDEN, requiresTarget: true,  phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'decree',        name: 'Decree',        description: "You set next week's theme.",                                           effectType: ChipEffect.DECREE,        rarity: ChipRarity.GOLDEN, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'amnesty',       name: 'Amnesty',       description: 'A pardon: cancels every OFFENSIVE chip in play this cycle and refunds it. Buffs and defenses still work.', effectType: ChipEffect.AMNESTY, rarity: ChipRarity.GOLDEN, requiresTarget: false, phase: ChipPhase.ANYTIME, offensive: false, enabled: true },
  { slug: 'extra-time',    name: 'Extra Time',    description: 'Extends the submission window by 24 hours for everyone.',               effectType: ChipEffect.EXTRA_TIME,    rarity: ChipRarity.GOLDEN, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
  { slug: 'double-header', name: 'Double Header', description: 'The next cycle crowns two winners (two 1st places).',                  effectType: ChipEffect.DOUBLE_HEADER, rarity: ChipRarity.GOLDEN, requiresTarget: false, phase: ChipPhase.OPEN_ONLY, offensive: false, enabled: true },
]

async function main() {
  let created = 0
  let updated = 0
  for (const c of CHIPS) {
    const existing = await prisma.chip.findUnique({ where: { slug: c.slug } })
    await prisma.chip.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name, description: c.description, effectType: c.effectType, rarity: c.rarity,
        requiresTarget: c.requiresTarget, phase: c.phase, offensive: c.offensive, enabled: c.enabled,
      },
      create: c,
    })
    existing ? updated++ : created++
  }
  console.log(`[expansion-seed] ${CHIPS.length} chips processed — ${created} created, ${updated} updated`)

  let achCreated = 0
  for (const a of ACHIEVEMENTS) {
    const existing = await prisma.achievement.findUnique({ where: { slug: a.slug } })
    await prisma.achievement.upsert({ where: { slug: a.slug }, update: a, create: a })
    if (!existing) achCreated++
  }
  console.log(`[expansion-seed] ${ACHIEVEMENTS.length} achievements processed — ${achCreated} created`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
