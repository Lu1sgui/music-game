'use client'
// app/components/ChipIcon.tsx
// Meme/pokemon pixel icons from shuqikhor/pixel-icons
// Raw GitHub CDN — colorful, no color filters applied (they're memes!)

const MEME_BASE = 'https://raw.githubusercontent.com/shuqikhor/pixel-icons/main/icons'
const ICON_BASE = 'https://sqkhor.com/pixel-icons/icons'  // fallback for non-meme icons

// Chip → pixel icon mapping. Every chip has a UNIQUE icon; chips named after
// Pokémon moves use a thematically-matched Pokémon where one fits.
const CHIP_ICON: Record<string, string> = {
  // ── Common (Pokémon moves) ──
  'flash':         'pikachu',           // ⚡ electric flash
  'smokescreen':   'cloud',             // 💨 a screen of smoke
  'substitute':    'spooderman',        // 🕸️ pointing at your double
  'recover':       'chansey',           // 💗 Chansey heals (Softboiled)
  'swift':         'pichu',             // ⚡ small and fast
  'haze':          'wind',              // 🌫️ blows the field clean
  'night-shade':   'ghost-blue',        // 👻 a dark shade
  // ── Rare (Pokémon moves) ──
  'swords-dance':  'dancing-man',       // 🕺 a dance that boosts attack
  'double-team':   'users',            // 👥 copies of you
  'disable':       'lock',              // 🔒 move locked
  'reflect':       'surprised-pikachu', // 😮 bounced back!
  'mimic':         'eevee',             // 🦊 Eevee adapts / copies
  'confuse-ray':   'psyduck',           // 🦆 Psyduck = pure confusion
  'leech-seed':    'bulbasaur',         // 🌱 Bulbasaur's signature seed
  // ── Legendary (Pokémon moves) ──
  'mega-drain':    'chikorita',         // 🌿 grass-type drain
  'screech':       'sound-high',        // 📢 an ear-splitting screech
  'metronome':     'game-controller',   // 🎮 random move roulette
  'spore':         'jigglypuff',        // 😴 puts you to sleep
  'bide':          'slowpoke',          // 🐢 waits… then strikes
  'skull-bash':    't-rex',             // 🦖 a charging headbutt
  // ── Expansion: Common ──
  'cushion':       'koala-hug',         // 🐨 a soft landing
  'spotlight':     'star',              // ⭐ podium shine
  'insight':       'magnifier',         // 🔍 look closer
  'insurance':     'umbrella',          // ☂️ covered
  'donation':      'gift',              // 🎁 a present
  // ── Expansion: Rare ──
  'toxic':         'frog',              // 🐸 poison-dart frog
  'payday':        'meowth',            // 😼 Meowth's signature Pay Day
  'protect':       'squirtle',          // 🐢 Squirtle withdraws into its shell
  'gamble':        'maneki-neko',       // 🐱 lucky cat
  'pickpocket':    'scissors',          // ✂️ cuts your purse
  'bounty':        'ribbon',            // 🎗️ a prize on their head
  'cleanse':       'sparkles',          // ✨ wiped clean
  'foresight':     'owl-1',             // 🦉 sees in the dark
  'banker':        'credit-card',       // 💳 bank it
  'mute':          'sound-mute',        // 🔇 silenced
  'usurp':         'mario-jump',        // 🍄 leap over them
  'mirror-coat':   'lapras',            // 🐉 Lapras learns Mirror Coat
  'wildcard':      'pinata',            // 🪅 random surprise
  // ── Expansion: Legendary ──
  'blackout':      'moon',              // 🌑 lights out
  'veto':          'thumb-down',        // 👎 denied
  'earthquake':    'diglett',           // ⛰️ Diglett digs / quakes the ground
  'time-bomb':     'clock',             // ⏰ ticking
  'switcheroo':    'magikarp',          // 🐟 swapped for a flop
  'copycat':       'copy',              // 📋 exact copy
  'curse':         'ghost-red',         // 👻 a haunting curse
  // ── Expansion: Golden ──
  'crown':         'sunglasses',        // 😎 you're the boss
  'decree':        'message',           // 📣 proclamation
  'amnesty':       'rainbow',           // 🌈 a full pardon
  'double-header': 'thumb-up',          // 👍 two winners
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
