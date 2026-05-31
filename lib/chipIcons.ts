// lib/chipIcons.ts
// Single source of truth for chip → pixel icon, usable from both client
// components and server code (emails). Icons from shuqikhor/pixel-icons.

const RAW = 'raw.githubusercontent.com/shuqikhor/pixel-icons/main/icons'

// Chip → unique pixel icon. Pokémon-move chips use a thematic Pokémon.
export const CHIP_ICON: Record<string, string> = {
  // Common (Pokémon moves)
  'flash': 'pikachu', 'smokescreen': 'cloud', 'substitute': 'spooderman',
  'recover': 'chansey', 'swift': 'pichu', 'haze': 'wind', 'night-shade': 'ghost-blue',
  // Rare (Pokémon moves)
  'swords-dance': 'dancing-man', 'double-team': 'users', 'disable': 'lock',
  'reflect': 'surprised-pikachu', 'mimic': 'eevee', 'confuse-ray': 'psyduck', 'leech-seed': 'bulbasaur',
  // Legendary (Pokémon moves)
  'mega-drain': 'chikorita', 'screech': 'sound-high', 'metronome': 'game-controller',
  'spore': 'jigglypuff', 'bide': 'slowpoke', 'skull-bash': 't-rex',
  // Expansion: Common
  'cushion': 'koala-hug', 'spotlight': 'star', 'insight': 'magnifier', 'insurance': 'umbrella', 'donation': 'gift',
  // Expansion: Rare
  'toxic': 'frog', 'payday': 'meowth', 'protect': 'squirtle', 'gamble': 'maneki-neko',
  'pickpocket': 'scissors', 'bounty': 'ribbon', 'cleanse': 'sparkles', 'foresight': 'owl-1',
  'banker': 'credit-card', 'mute': 'sound-mute', 'usurp': 'mario-jump', 'mirror-coat': 'lapras', 'wildcard': 'pinata',
  // Expansion: Legendary
  'blackout': 'moon', 'veto': 'thumb-down', 'earthquake': 'diglett', 'time-bomb': 'clock',
  'switcheroo': 'magikarp', 'copycat': 'copy', 'curse': 'ghost-red',
  // Expansion: Golden
  'crown': 'sunglasses', 'decree': 'message', 'amnesty': 'rainbow', 'double-header': 'thumb-up', 'extra-time': 'calendar',
}

export function chipIconName(slug: string): string {
  return CHIP_ICON[slug] ?? 'surprised-pikachu'
}

// SVG (for the web UI)
export function chipIconSvgUrl(slug: string): string {
  return `https://${RAW}/${chipIconName(slug)}.svg`
}

// PNG (for emails — Gmail/Outlook don't render SVG). Rasterized via wsrv.nl.
export function chipIconPngUrl(slug: string, size = 64): string {
  return `https://wsrv.nl/?url=${RAW}/${chipIconName(slug)}.svg&output=png&w=${size}&h=${size}&fit=contain`
}
