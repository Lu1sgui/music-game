// app/manual/manualData.ts
// Static content for the public game manual (SNES-booklet style).
// Kept self-contained so the manual is complete even before the chip catalog is seeded.

export type ManualChip = {
  name: string
  effect: string
  kind: 'Self' | 'Offensive' | 'Defense' | 'Utility' | 'Meta'
  when: 'Tue–Fri' | 'Until reveal'
  counters?: string
}

export const CHIP_GROUPS: { rarity: string; color: string; chips: ManualChip[] }[] = [
  {
    rarity: 'COMMON', color: '#9A9A8E',
    chips: [
      { name: 'Flash', effect: 'Peek at every song submitted this week while the round is open.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Smokescreen', effect: 'Your name is hidden on the results after the reveal.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Substitute', effect: "If you don't reach the podium, you still earn 3rd-place points.", kind: 'Self', when: 'Tue–Fri' },
      { name: 'Recover', effect: 'Keep your participation streak even if you skip a submission this week.', kind: 'Self', when: 'Tue–Fri' },
      { name: 'Swift', effect: 'Double your participation points.', kind: 'Self', when: 'Tue–Fri' },
      { name: 'Haze', effect: 'Cancels ALL chips in play this cycle — yours included. The reset button.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Night Shade', effect: 'Your rank and total are hidden on the ladder this week.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Cushion', effect: "If you don't make the podium, your participation points are +50%.", kind: 'Self', when: 'Tue–Fri' },
      { name: 'Spotlight', effect: 'If you reach the podium, gain +15 bonus points.', kind: 'Self', when: 'Tue–Fri' },
      { name: 'Insight', effect: 'Reveals how many songs and chips have been played this week.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Insurance', effect: 'Blocks one disrupting chip (Veto / Switcheroo / Copycat / Blackout / Mute) aimed at you.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Donation', effect: 'Gift one of your other chips to another player.', kind: 'Utility', when: 'Tue–Fri' },
    ],
  },
  {
    rarity: 'RARE', color: '#7F77DD',
    chips: [
      { name: 'Swords Dance', effect: '×2 your points if you make the podium (×4 if you stored Bide).', kind: 'Self', when: 'Tue–Fri' },
      { name: 'Double Team', effect: 'Submit a SECOND song this week.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Disable', effect: "Cancel a target player's chip.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Reflect' },
      { name: 'Reflect', effect: 'Bounce reflectable chips (Screech, Spore, Skull Bash, Disable) back at the caster.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Mimic', effect: 'Copy the chip your target used last week.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Confuse Ray', effect: 'A feint — appears among the played chips to rattle rivals (no scoring effect).', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Leech Seed', effect: "Drain 25% of the target's weekly earnings to you for 3 cycles.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Mirror Coat, Cleanse, Protect, Reflect' },
      { name: 'Toxic', effect: 'The target loses 30% of the points they earn this week.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Mirror Coat, Cleanse, Protect' },
      { name: 'Payday', effect: 'If the target reaches the podium, you steal 25 points from them.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse, Protect' },
      { name: 'Protect', effect: 'Blocks one negative chip aimed at you this week.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Gamble', effect: '×1.5 your points if you reach the podium — but −20 if you miss it.', kind: 'Self', when: 'Tue–Fri' },
      { name: 'Pickpocket', effect: "Steal a random chip from the target's inventory.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse, Protect' },
      { name: 'Bounty', effect: 'Put a 20-point bounty on a rival — whoever outscores them splits it.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse, Protect' },
      { name: 'Cleanse', effect: 'Removes every negative chip aimed at you this week.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Foresight', effect: 'Reveals who has targeted you with a chip — the only way to see attacks coming.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Banker', effect: "Bank this week's points to earn them ×2 next week — lost if you skip next week.", kind: 'Self', when: 'Tue–Fri' },
      { name: 'Mute', effect: 'The GM scores the target without seeing the song title or artist — just the link.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Insurance, Cleanse' },
      { name: 'Usurp', effect: 'If you and the target both reach the podium, you swap positions.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse, Protect' },
      { name: 'Mirror Coat', effect: 'Bounces point-draining chips (Toxic, Mega Drain, Leech) back at the caster.', kind: 'Defense', when: 'Until reveal' },
      { name: 'Wildcard', effect: 'Counts as any Common chip you name when you play it.', kind: 'Utility', when: 'Tue–Fri' },
    ],
  },
  {
    rarity: 'LEGENDARY', color: '#FFD700',
    chips: [
      { name: 'Mega Drain', effect: "Siphon 50% of the target's earnings this cycle to yourself.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Mirror Coat, Cleanse, Protect, Reflect' },
      { name: 'Screech', effect: 'Knock the target down one podium tier (1st→2nd, etc.).', kind: 'Offensive', when: 'Tue–Fri', counters: 'Reflect, Cleanse, Protect' },
      { name: 'Metronome', effect: 'Play a random chip — you never know what you get.', kind: 'Utility', when: 'Tue–Fri' },
      { name: 'Spore', effect: "Locks the target out of playing chips next cycle.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Reflect, Cleanse, Protect' },
      { name: 'Bide', effect: 'Store power — your NEXT chip hits twice as hard (e.g. Swords Dance ×4).', kind: 'Self', when: 'Tue–Fri' },
      { name: 'Skull Bash', effect: 'Challenge a rival — steal 30 points if you outrank them.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Reflect, Cleanse, Protect' },
      { name: 'Blackout', effect: 'The target cannot submit a song next cycle.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Insurance, Cleanse, Protect, Reflect' },
      { name: 'Veto', effect: "The target's song can't make the podium — participation points only.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Insurance, Cleanse, Protect' },
      { name: 'Earthquake', effect: 'Every OTHER player loses 15 points — but you forfeit the podium this week.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse, Protect (per target)' },
      { name: 'Time Bomb', effect: 'The target loses 50 points at the reveal TWO cycles from now.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse' },
      { name: 'Switcheroo', effect: "Secretly replace the target's song with one you pick — they won't know until the reveal.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Insurance, Cleanse' },
      { name: 'Copycat', effect: "Force the target's entry to become a duplicate of YOUR song.", kind: 'Offensive', when: 'Tue–Fri', counters: 'Insurance, Cleanse' },
      { name: 'Curse', effect: 'If the target reaches the podium, they lose their streak.', kind: 'Offensive', when: 'Tue–Fri', counters: 'Cleanse, Protect' },
    ],
  },
  {
    rarity: 'GOLDEN', color: '#FF8A00',
    chips: [
      { name: 'Crown', effect: 'You choose the Game Master for the next cycle (yourself included).', kind: 'Meta', when: 'Tue–Fri' },
      { name: 'Decree', effect: "You set next week's theme.", kind: 'Meta', when: 'Tue–Fri' },
      { name: 'Amnesty', effect: 'A pardon: cancels every OFFENSIVE chip in play this cycle and refunds it. Buffs and defenses still resolve (unlike Haze, which wipes everything).', kind: 'Defense', when: 'Until reveal' },
      { name: 'Double Header', effect: 'The next cycle crowns TWO winners (two 1st places).', kind: 'Meta', when: 'Tue–Fri' },
      { name: 'Extra Time', effect: 'Extends the submission window 24 hours for everyone.', kind: 'Meta', when: 'Tue–Fri' },
    ],
  },
]

export const ACHIEVEMENTS: { name: string; how: string; reward?: string }[] = [
  { name: 'Aggressor', how: 'Reach the podium 3 times.', reward: 'Toxic chip + 30 pts' },
  { name: 'High Roller', how: 'Win 1st place twice.', reward: 'Gamble chip + 50 pts' },
  { name: 'Survivor', how: 'Keep a 6-week streak.', reward: 'Protect chip + 40 pts' },
  { name: 'Collector', how: 'Submit 15 songs.', reward: 'Cleanse chip + 35 pts' },
  { name: 'Saboteur', how: 'Reach the podium 8 times.', reward: 'Switcheroo chip + 70 pts' },
  { name: 'Kingmaker', how: 'Serve as Game Master twice.', reward: 'Crown chip + 60 pts' },
  { name: '…and more', how: 'Submission, podium, win, streak and GM milestones unlock badges as you play. Check your profile to track them.' },
]
