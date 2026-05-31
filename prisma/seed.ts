// prisma/seed.ts
// Run with: npm run db:seed
// Safe to run multiple times — uses upsert on unique slugs

import { PrismaClient, ChipEffect, ChipRarity, BadgeTier, ConditionType } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Chip Catalog ────────────────────────────────────────────────────────────
// 20 chips named after Generation I Pokémon moves
// Common (7) · Rare (7) · Legendary (6)

const CHIPS = [
  // ── Common ──────────────────────────────────────────────────────────────────
  {
    slug: 'flash',
    name: 'Flash',
    description: "See all other players' submitted songs during the submission phase — before Friday's reveal.",
    effectType: ChipEffect.FLASH,
    requiresTarget: false,
    rarity: ChipRarity.COMMON,
  },
  {
    slug: 'smokescreen',
    name: 'Smokescreen',
    description: "Your identity stays hidden after Friday's reveal. Your score shows as '???' to everyone.",
    effectType: ChipEffect.SMOKESCREEN,
    requiresTarget: false,
    rarity: ChipRarity.COMMON,
  },
  {
    slug: 'substitute',
    name: 'Substitute',
    description: 'Safety net: if you miss the podium this week, you automatically receive 3rd place points.',
    effectType: ChipEffect.SUBSTITUTE,
    requiresTarget: false,
    rarity: ChipRarity.COMMON,
  },
  {
    slug: 'recover',
    name: 'Recover',
    description: "Your streak is preserved this week even if you don't submit. Prevents a streak break.",
    effectType: ChipEffect.RECOVER,
    requiresTarget: false,
    rarity: ChipRarity.COMMON,
  },
  {
    slug: 'swift',
    name: 'Swift',
    description: 'Your participation points are doubled this week (20 → 40 pts). Does not affect podium points.',
    effectType: ChipEffect.SWIFT,
    requiresTarget: false,
    rarity: ChipRarity.COMMON,
  },
  {
    slug: 'haze',
    name: 'Haze',
    description: 'All chips activated this week by every player — including yours — are nullified.',
    effectType: ChipEffect.HAZE,
    requiresTarget: false,
    rarity: ChipRarity.LEGENDARY,
  },
  {
    slug: 'night-shade',
    name: 'Night Shade',
    description: 'Your rank and total points are hidden on the ladder for this week. Strategic deception.',
    effectType: ChipEffect.NIGHT_SHADE,
    requiresTarget: false,
    rarity: ChipRarity.COMMON,
  },

  // ── Rare ────────────────────────────────────────────────────────────────────
  {
    slug: 'swords-dance',
    name: 'Swords Dance',
    description: 'Your final score is doubled this week: 1st → 300 pts, 2nd → 160, 3rd → 80. Stacks with streak bonus.',
    effectType: ChipEffect.SWORDS_DANCE,
    requiresTarget: false,
    rarity: ChipRarity.RARE,
  },
  {
    slug: 'double-team',
    name: 'Double Team',
    description: 'Submit two songs this week. The GM scores both; only your best result counts toward the ladder.',
    effectType: ChipEffect.DOUBLE_TEAM,
    requiresTarget: false,
    rarity: ChipRarity.RARE,
  },
  {
    slug: 'disable',
    name: 'Disable',
    description: 'Choose a player. If they activate any chip this week, it is cancelled and returned to their inventory.',
    effectType: ChipEffect.DISABLE,
    requiresTarget: true,
    rarity: ChipRarity.RARE,
  },
  {
    slug: 'reflect',
    name: 'Reflect',
    description: 'Passive shield: if a negative chip targets you this week (Screech, Spore, Skull Bash), it reflects back to the sender.',
    effectType: ChipEffect.REFLECT,
    requiresTarget: false,
    rarity: ChipRarity.RARE,
  },
  {
    slug: 'mimic',
    name: 'Mimic',
    description: 'Copy the chip your chosen player used last week and activate it immediately for free.',
    effectType: ChipEffect.MIMIC,
    requiresTarget: true,
    rarity: ChipRarity.RARE,
  },
  {
    slug: 'confuse-ray',
    name: 'Confuse Ray',
    description: 'The GM scores all songs in randomized, anonymized order this week. Submission owners revealed only after scoring.',
    effectType: ChipEffect.CONFUSE_RAY,
    requiresTarget: false,
    rarity: ChipRarity.RARE,
  },
  {
    slug: 'leech-seed',
    name: 'Leech Seed',
    description: 'Choose a player. For the next 3 weeks, you passively earn 10% of their weekly points on top of your own. They keep theirs.',
    effectType: ChipEffect.LEECH_SEED,
    requiresTarget: true,
    rarity: ChipRarity.RARE,
  },

  // ── Legendary ───────────────────────────────────────────────────────────────
  {
    slug: 'mega-drain',
    name: 'Mega Drain',
    description: 'Choose a player. You earn 50% of their points this week added on top of your own. They lose nothing.',
    effectType: ChipEffect.MEGA_DRAIN,
    requiresTarget: true,
    rarity: ChipRarity.LEGENDARY,
  },
  {
    slug: 'screech',
    name: 'Screech',
    description: 'Choose a player. If they reach the podium this week, they score one tier down: 1st → 2nd pts, 2nd → 3rd pts, 3rd → participation.',
    effectType: ChipEffect.SCREECH,
    requiresTarget: true,
    rarity: ChipRarity.LEGENDARY,
  },
  {
    slug: 'metronome',
    name: 'Metronome',
    description: 'Activates a completely random chip from the pool. If the result needs a target, one is chosen at random. Pure chaos.',
    effectType: ChipEffect.METRONOME,
    requiresTarget: false,
    rarity: ChipRarity.LEGENDARY,
  },
  {
    slug: 'spore',
    name: 'Spore',
    description: 'Choose a player. They cannot activate any chip next week — the lockout applies to the following cycle, not this one.',
    effectType: ChipEffect.SPORE,
    requiresTarget: true,
    rarity: ChipRarity.LEGENDARY,
  },
  {
    slug: 'bide',
    name: 'Bide',
    description: 'Declare this week and skip using a chip. Your next chip activation — whenever it happens — has double effect.',
    effectType: ChipEffect.BIDE,
    requiresTarget: false,
    rarity: ChipRarity.LEGENDARY,
  },
  {
    slug: 'skull-bash',
    name: 'Skull Bash',
    description: 'Challenge a player. If you outscore them this week, steal 30 pts from their total. If they beat you, nothing happens.',
    effectType: ChipEffect.SKULL_BASH,
    requiresTarget: true,
    rarity: ChipRarity.LEGENDARY,
  },
] as const

// ─── Achievement Catalog ─────────────────────────────────────────────────────
// 20 achievements across 6 tracks
// Each lists the chip rewarded on unlock (in addition to the points bonus)

const ACHIEVEMENTS = [
  // ── Participation track (5) ──────────────────────────────────────────────
  {
    slug: 'first-note',
    name: 'First Note',
    description: 'Submit your very first song.',
    badgeTier: BadgeTier.BRONZE,
    conditionType: ConditionType.SUBMISSION_COUNT,
    conditionValue: 1,
    pointsBonus: 0,
    rewardChipSlug: 'flash',
    isHidden: false,
  },
  {
    slug: 'regular',
    name: 'Regular',
    description: 'Submit 5 songs in total.',
    badgeTier: BadgeTier.BRONZE,
    conditionType: ConditionType.SUBMISSION_COUNT,
    conditionValue: 5,
    pointsBonus: 15,
    rewardChipSlug: 'swift',
    isHidden: false,
  },
  {
    slug: 'dedicated',
    name: 'Dedicated',
    description: 'Submit 15 songs in total.',
    badgeTier: BadgeTier.SILVER,
    conditionType: ConditionType.SUBMISSION_COUNT,
    conditionValue: 15,
    pointsBonus: 30,
    rewardChipSlug: 'smokescreen',
    isHidden: false,
  },
  {
    slug: 'veteran',
    name: 'Veteran',
    description: 'Submit 30 songs in total.',
    badgeTier: BadgeTier.GOLD,
    conditionType: ConditionType.SUBMISSION_COUNT,
    conditionValue: 30,
    pointsBonus: 50,
    rewardChipSlug: 'substitute',
    isHidden: false,
  },
  {
    slug: 'legend',
    name: 'Legend',
    description: 'Submit 52 songs — a full year of music.',
    badgeTier: BadgeTier.PLATINUM,
    conditionType: ConditionType.SUBMISSION_COUNT,
    conditionValue: 52,
    pointsBonus: 100,
    rewardChipSlug: 'double-team',
    isHidden: false,
  },

  // ── Streak track (3) ─────────────────────────────────────────────────────
  {
    slug: 'on-a-roll',
    name: 'On a Roll',
    description: 'Submit songs 3 weeks in a row.',
    badgeTier: BadgeTier.BRONZE,
    conditionType: ConditionType.STREAK_WEEKS,
    conditionValue: 3,
    pointsBonus: 15,
    rewardChipSlug: 'recover',
    isHidden: false,
  },
  {
    slug: 'hot-streak',
    name: 'Hot Streak',
    description: 'Submit songs 6 weeks in a row.',
    badgeTier: BadgeTier.SILVER,
    conditionType: ConditionType.STREAK_WEEKS,
    conditionValue: 6,
    pointsBonus: 35,
    rewardChipSlug: 'reflect',
    isHidden: false,
  },
  {
    slug: 'unstoppable',
    name: 'Unstoppable',
    description: 'Submit songs 12 weeks in a row.',
    badgeTier: BadgeTier.GOLD,
    conditionType: ConditionType.STREAK_WEEKS,
    conditionValue: 12,
    pointsBonus: 75,
    rewardChipSlug: 'swords-dance',
    isHidden: false,
  },

  // ── Podium track (4) ─────────────────────────────────────────────────────
  {
    slug: 'chart-entry',
    name: 'Chart Entry',
    description: 'Reach the top 3 for the first time.',
    badgeTier: BadgeTier.BRONZE,
    conditionType: ConditionType.PODIUM_COUNT,
    conditionValue: 1,
    pointsBonus: 20,
    rewardChipSlug: 'night-shade',
    isHidden: false,
  },
  {
    slug: 'chart-climber',
    name: 'Chart Climber',
    description: 'Reach the top 3 three times.',
    badgeTier: BadgeTier.SILVER,
    conditionType: ConditionType.PODIUM_COUNT,
    conditionValue: 3,
    pointsBonus: 50,
    rewardChipSlug: 'leech-seed',
    isHidden: false,
  },
  {
    slug: 'music-authority',
    name: 'Music Authority',
    description: 'Reach the top 3 five times.',
    badgeTier: BadgeTier.GOLD,
    conditionType: ConditionType.PODIUM_COUNT,
    conditionValue: 5,
    pointsBonus: 100,
    rewardChipSlug: 'disable',
    isHidden: false,
  },
  {
    slug: 'hall-of-fame',
    name: 'Hall of Fame',
    description: 'Reach the top 3 ten times.',
    badgeTier: BadgeTier.PLATINUM,
    conditionType: ConditionType.PODIUM_COUNT,
    conditionValue: 10,
    pointsBonus: 200,
    rewardChipSlug: 'skull-bash',
    isHidden: false,
  },

  // ── First place track (3) ────────────────────────────────────────────────
  {
    slug: 'gold-standard',
    name: 'Gold Standard',
    description: 'Win 1st place for the first time.',
    badgeTier: BadgeTier.SILVER,
    conditionType: ConditionType.TOP_1_COUNT,
    conditionValue: 1,
    pointsBonus: 50,
    rewardChipSlug: 'confuse-ray',
    isHidden: false,
  },
  {
    slug: 'champion',
    name: 'Champion',
    description: 'Win 1st place three times.',
    badgeTier: BadgeTier.GOLD,
    conditionType: ConditionType.TOP_1_COUNT,
    conditionValue: 3,
    pointsBonus: 100,
    rewardChipSlug: 'screech',
    isHidden: false,
  },
  {
    slug: 'undisputed',
    name: 'Undisputed',
    description: 'Win 1st place five times.',
    badgeTier: BadgeTier.PLATINUM,
    conditionType: ConditionType.TOP_1_COUNT,
    conditionValue: 5,
    pointsBonus: 250,
    rewardChipSlug: 'mega-drain',
    isHidden: false,
  },

  // ── Game Master track (2) ────────────────────────────────────────────────
  {
    slug: 'behind-the-mic',
    name: 'Behind the Mic',
    description: 'Serve as Game Master for the first time.',
    badgeTier: BadgeTier.BRONZE,
    conditionType: ConditionType.GM_COUNT,
    conditionValue: 1,
    pointsBonus: 20,
    rewardChipSlug: 'flash',
    isHidden: false,
  },
  {
    slug: 'maestro',
    name: 'Maestro',
    description: 'Serve as Game Master three times.',
    badgeTier: BadgeTier.SILVER,
    conditionType: ConditionType.GM_COUNT,
    conditionValue: 3,
    pointsBonus: 60,
    rewardChipSlug: 'mimic',
    isHidden: false,
  },

  // ── Hidden / Special track (3) ───────────────────────────────────────────
  {
    slug: 'dark-horse',
    name: 'Dark Horse',
    description: 'Win 1st place after submitting in the last hour of the cycle.',
    badgeTier: BadgeTier.SPECIAL,
    conditionType: ConditionType.SPECIAL,
    conditionValue: 1,
    pointsBonus: 30,
    rewardChipSlug: 'metronome',
    isHidden: true,
  },
  {
    slug: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Reach the top 3 after being away for 3 or more consecutive weeks.',
    badgeTier: BadgeTier.SPECIAL,
    conditionType: ConditionType.SPECIAL,
    conditionValue: 2,
    pointsBonus: 25,
    rewardChipSlug: 'bide',
    isHidden: true,
  },
  {
    slug: 'trend-surfer',
    name: 'Trend Surfer',
    description: 'Win 1st place during a themed week.',
    badgeTier: BadgeTier.BRONZE,
    conditionType: ConditionType.SPECIAL,
    conditionValue: 3,
    pointsBonus: 15,
    rewardChipSlug: 'haze',
    isHidden: true,
  },
] as const

// ─── Seed Runner ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🎮 Seeding music game database...\n')

  // Seed chips
  console.log('→ Seeding chips...')
  for (const chip of CHIPS) {
    await prisma.chip.upsert({
      where: { slug: chip.slug },
      update: { description: chip.description },
      create: chip,
    })
  }
  console.log(`  ✓ ${CHIPS.length} chips seeded`)

  // Seed achievements
  console.log('→ Seeding achievements...')
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {
        description: achievement.description,
        pointsBonus: achievement.pointsBonus,
        rewardChipSlug: achievement.rewardChipSlug,
      },
      create: achievement,
    })
  }
  console.log(`  ✓ ${ACHIEVEMENTS.length} achievements seeded`)

  console.log('\n✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
