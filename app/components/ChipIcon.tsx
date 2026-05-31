'use client'
// app/components/ChipIcon.tsx
// Meme/pokemon pixel icons from shuqikhor/pixel-icons
// Raw GitHub CDN — colorful, no color filters applied (they're memes!)

const MEME_BASE = 'https://raw.githubusercontent.com/shuqikhor/pixel-icons/main/icons'
const ICON_BASE = 'https://sqkhor.com/pixel-icons/icons'  // fallback for non-meme icons

// Chip → pixel icon mapping (thematic pairings). Every chip has a real icon.
const CHIP_ICON: Record<string, string> = {
  // ── Common ──
  'flash':         'surprised-pikachu', // ⚡ PIKACHU IS SHOCKED
  'smokescreen':   'this-is-fine',      // 🔥 this is fine (can't see)
  'substitute':    'spooderman',        // 👥 pointing at your copy
  'recover':       'take-my-money',     // 💊 I'll pay anything to heal
  'swift':         'nyan-cat',          // 🌈 nyan at full speed
  'haze':          'sad-pepe',          // 😢 confused in the haze
  'night-shade':   'rickroll',          // 🌙 nobody expects it
  // ── Rare ──
  'swords-dance':  'stonks',            // 📈 attack going STONKS
  'double-team':   'spooderman',        // 👥 two of you now
  'disable':       'sad-pepe',          // 😢 your move is disabled
  'reflect':       'surprised-pikachu', // 😮 bounced back! surprise!
  'mimic':         'nyan-cat',          // 🎵 copying your whole vibe
  'confuse-ray':   'sacabambaspis',     // 🐟 this fish confuses EVERYONE
  'leech-seed':    'this-is-fine',      // 🌱 slowly draining, this is fine
  // ── Legendary ──
  'mega-drain':    'stonks',            // 📈 reverse stonks for you
  'screech':       'rickroll',          // 🎤 unexpected screech attack
  'metronome':     'sacabambaspis',     // 🎲 chaotic prehistoric randomness
  'spore':         'sad-pepe',          // 😴 sleepy sad pepe energy
  'bide':          'take-my-money',     // 💰 saving up, investing energy
  'skull-bash':    'nyan-cat',          // 💀 nyan of destruction

  // ── Expansion: Common ──
  'cushion':       'koala-hug',         // 🛋️ soft hug
  'spotlight':     'star',              // ⭐ podium shine
  'insight':       'magnifier',         // 🔍 look closer
  'insurance':     'umbrella',          // ☂️ covered
  'donation':      'gift',              // 🎁 a present
  // ── Expansion: Rare ──
  'toxic':         'frog',              // 🐸 poison-dart frog
  'payday':        'stonks',            // 📈 money up
  'protect':       'tortoise',          // 🐢 hard shell
  'gamble':        'maneki-neko',       // 🐱 lucky cat
  'pickpocket':    'meowth',            // 😼 steals your coins
  'bounty':        'ribbon',            // 🎗️ prize on their head
  'cleanse':       'sparkles',          // ✨ wiped clean
  'foresight':     'owl-1',             // 🦉 sees in the dark
  'banker':        'credit-card',       // 💳 bank it
  'mute':          'sound-mute',        // 🔇 silenced
  'usurp':         'mario-jump',        // 🍄 leap over them
  'mirror-coat':   'mirror-ball',       // 🪩 reflect
  'wildcard':      'pinata',            // 🪅 random surprise
  // ── Expansion: Legendary ──
  'blackout':      'moon',              // 🌑 lights out
  'veto':          'thumb-down',        // 👎 denied
  'earthquake':    't-rex',             // 🦖 ground-shaking stomp
  'time-bomb':     'clock',             // ⏰ ticking
  'switcheroo':    'magikarp',          // 🐟 swapped for a flop
  'copycat':       'copy',              // 📋 exact copy
  'curse':         'ghost',             // 👻 haunted
  // ── Expansion: Golden ──
  'crown':         'sunglasses',        // 😎 you're the boss
  'decree':        'message',           // 📣 proclamation
  'amnesty':       'rainbow',           // 🌈 all is forgiven
  'double-header': 'users',             // 👥 two winners
  'extra-time':    'calendar',          // 📅 more time
}

// Achievement icons (classic pixel icons with tier coloring)
const ACHIEVEMENT_ICON: Record<string, string> = {
  'first-note':     'music', 'regular': 'star', 'dedicated': 'heart',
  'veteran':        'shield', 'legend': 'crown', 'on-a-roll': 'fire',
  'hot-streak':     'lightning', 'unstoppable': 'dragon',
  'chart-entry':    'trophy', 'chart-climber': 'chart', 'music-authority': 'diamond',
  'hall-of-fame':   'crown', 'gold-standard': 'star', 'champion': 'trophy',
  'undisputed':     'gem', 'behind-the-mic': 'microphone',
  'maestro':        'music', 'dark-horse': 'ghost',
  'comeback-kid':   'rocket', 'trend-surfer': 'wave',
}

const RARITY_GLOW: Record<string, string> = {
  COMMON:    'none',
  RARE:      'drop-shadow(0 0 5px #7F77DD)',
  LEGENDARY: 'drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 3px #FFD700)',
  GOLDEN:    'drop-shadow(0 0 9px #FF8A00) drop-shadow(0 0 4px #FF8A00)',
}

const TIER_FILTER: Record<string, string> = {
  BRONZE:   'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(10deg) opacity(0.85)',
  SILVER:   'brightness(0) invert(1) opacity(0.65)',
  GOLD:     'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(10deg)',
  PLATINUM: 'brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(220deg)',
  SPECIAL:  'brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(140deg)',
}

// Basic chip icon (no glow, natural colors)
export default function ChipIcon({ slug, size = 20 }: { slug: string; size?: number }) {
  const name = CHIP_ICON[slug] ?? 'surprised-pikachu'
  return (
    <img src={`${MEME_BASE}/${name}.svg`} width={size} height={size} alt={slug}
      style={{ imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0 }}
      onError={e => { (e.target as HTMLImageElement).src = `${MEME_BASE}/sad-pepe.svg` }}
    />
  )
}

// Chip icon with rarity glow (natural colors preserved)
export function ChipIconGlowing({ slug, rarity, size = 24 }: { slug: string; rarity: string; size?: number }) {
  const name = CHIP_ICON[slug] ?? 'surprised-pikachu'
  const glow = RARITY_GLOW[rarity] ?? 'none'
  return (
    <img src={`${MEME_BASE}/${name}.svg`} width={size} height={size} alt={slug}
      style={{ imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0,
               filter: glow !== 'none' ? glow : undefined }}
      onError={e => { (e.target as HTMLImageElement).src = `${MEME_BASE}/sad-pepe.svg` }}
    />
  )
}

// Achievement icon (tier-colored)
export function AchievementIcon({ slug, size = 18, tier }: { slug: string; size?: number; tier?: string }) {
  const name = ACHIEVEMENT_ICON[slug] ?? 'star'
  return (
    <img src={`${ICON_BASE}/${name}.svg`} width={size} height={size} alt={slug}
      style={{ imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0,
               filter: TIER_FILTER[tier ?? ''] ?? 'brightness(0) invert(1) opacity(0.7)' }}
      onError={e => { (e.target as HTMLImageElement).src = `${ICON_BASE}/star.svg` }}
    />
  )
}
