# Weekly Beats — Expansion Design

Draft design for: (1) new aggressive/meta chips, (2) more achievements, (3) richer
notifications (in-app + email). Goal: make the game **more dynamic and interactive**.

This is a SPEC to review and iterate on before implementing. Numbers are proposals,
tuned against the current economy.

## Current system (baseline)

- **Points:** 1st = 150, 2nd = 80, 3rd = 40, participation = 20, streak = +5/week (max 50).
- **Rarities:** COMMON, RARE, LEGENDARY. **+ GOLDEN (confirmed — new top tier).**
- **Inventory caps:** max 2 of the same chip, max 5 total.
- **Activation:** 1 chip per player per week, only while the cycle is OPEN.
- **Existing counters:** HAZE (cancel all), REFLECT (bounce SCREECH/SPORE/SKULL_BASH/DISABLE),
  DISABLE (cancel a target's chip), Spore-lock (prevents activation next cycle).
- **Acquisition today:** welcome gift (random common), participation drop every 4 weeks
  (60% common / 30% rare / 10% legendary), achievement rewards (`rewardChipSlug`).
- **Lifecycle:** Mon reveal+archive+create, Tue open, Fri close (GM scores Sat/Sun).

Implementation tiers used below:
- **T1** — fits the existing point-modifier engine (`ChipModifier` map). Low risk.
- **T2** — needs a new subsystem (submission guard, GM assignment, inventory steal, scheduling).

---

# 0. Activation model v2 (NEW DIRECTION)

The game shifts from "1 chip, set-and-forget" to a **week-long tactical duel**: you can
play **multiple chips across the week**, you can **see most attacks coming**, and you get a
window to **dodge or retaliate**.

## 0.1 Rules

- **Up to 3 chip activations per player per cycle** (was 1). **3 total, any mix** — attack,
  defend, or both, in whatever combination you like (within the windows below).
- **Anti-grief still caps a TARGET at 2 negative chips per cycle** (decided earlier).
- **Two activation windows** (per-chip, see `phase` column):
  - **ATTACK / OPEN window — Tue 00:00 → Fri 17:00:** all *offensive* chips and anything that
    touches a song/submission (Switcheroo, Veto, Copycat, Double Team, Toxic, Payday, Screech,
    Skull Bash, Mega Drain, Bounty, Blackout, Spore, Leech…). Deadline = submissions close.
  - **DEFENSE window — Tue 00:00 → Mon reveal:** defensive chips (Protect, Reflect, Cleanse,
    Haze, Disable) stay playable all weekend. Since attacks are hidden, defense is a **bet**.
- **Everything offensive is HIDDEN until the reveal.** No one sees an attack coming during the
  week — there is NO "you were attacked" alert at cast time. The whole week is a bluff/prediction
  game. (This supersedes the earlier visible/hidden split.)
- **Defense is pre-emptive (a gamble):** you raise a shield *on a hunch*. At the reveal:
  - If you guessed right and had a protective chip active, the incoming attack is **blocked** and
    you're notified **"🛡️ Your Protect blocked @rival's Toxic"** — you learn it happened, but took
    no damage.
  - If you guessed wrong, the shield is simply wasted (and the attack lands, revealed Monday).
- **Foresight is the ONLY intel tool:** the one chip that reveals who has targeted you *before*
  the reveal — the deliberate way to turn the bluff game into informed defense. Makes it valuable.
- **Resolution stays a single pass at reveal** (the engine we hardened). Defenses resolve in the
  same batch regardless of when they were cast.

## 0.2 What this changes vs what we just shipped

- ⚠️ **Reverts the `@@unique([userId, cycleId])` we added to `ChipActivation`** (that enforced
  1/week). Replace with: **app-enforced max 3/week**, counted inside a transaction at activate
  time to stay race-safe. Keep an index on `(userId, cycleId)` for the count query.
- `activate` route: allow `CLOSED` (not just `OPEN`) for DEFENSE-phase chips; keep `OPEN`-only
  for ATTACK-phase chips. Reject by phase with a clear error.
- New per-chip metadata: **`phase` (OPEN_ONLY | ANYTIME)** and **`visibility` (VISIBLE | HIDDEN)**.
  Store on the `Chip` catalog row.
- New notifications: "you were targeted by X" (visible chips) → drives the reaction loop.
- Spore-lock still blocks ALL your activations for its cycle.

## 0.3 Decisions (LOCKED)

A. **Defense window ends at the Monday reveal.** ✅
B. **3 activations per cycle, no restriction** on attack/defense mix. ✅
C. **All offensive chips are hidden until reveal.** Defense is pre-emptive; a successful block
   notifies the target ("your shield blocked X") but deals no damage. **Foresight** is the only
   chip that grants advance intel. ✅

> Design note: this makes the week a **bluff/prediction game** rather than a reactive duel —
> you defend on hunches, and the reveal is the big unveil of who hit whom and what got blocked.
> Counterplay lives in (a) pre-emptive shields and (b) the Foresight intel chip.


---

# 1. Chips

## 1.1 New COMMON (filler / defensive)

| Chip | Effect | Target | Counters | Tier |
|------|--------|--------|----------|------|
| **Cushion** | If you do NOT podium, your participation points are +50% (30 instead of 20). Anti-variance safety net. | self | Haze | T1 |
| **Spotlight** | If you DO podium, +15 flat bonus. Pro-variance. | self | Haze | T1 |
| **Insight** | See the current submission **count** + how many players have used a chip this week (light intel). | self | — | T1 (cosmetic) |

## 1.2 New RARE (aggressive, point-based)

| Chip | Effect | Target | Counters | Tier |
|------|--------|--------|----------|------|
| **Toxic** | Target loses **30%** of their positive cycle earnings (pure denial — drains to no one). | rival | Reflect, Haze, Disable | T1 |
| **Payday** | If the target podiums, you **steal 25 pts** from them. If they don't, nothing. (renamed from "Trick" to free the name for the song-swap) | rival | Reflect, Haze | T1 |
| **Protect** | Negate **one** negative chip targeting you this week (does not bounce it back, unlike Reflect). Defensive. | self | Haze | T1 |
| **Gamble** | ×1.5 your points if you podium; **−20** if you don't. High risk/reward. | self | Haze | T1 |
| **Pickpocket** | Steal **1 random chip** from the target's inventory (respects caps; fails silently if empty/cap hit). | rival | Reflect, Haze, Disable | **T2** (inventory) |

## 1.3 New LEGENDARY (swingy / disruptive)

| Chip | Effect | Target | Counters | Tier |
|------|--------|--------|----------|------|
| **Blackout** | Target **cannot submit a song next cycle** (stronger Spore — blocks participation, not just chips). | rival | Reflect, Haze | **T2** (submission guard + next-cycle timing) |
| **Veto** | Target's submission is **removed from the podium** this cycle — they keep only the 20 participation points (can't place 1st/2nd/3rd). *(softened per decision: participation-only, not 0)* | rival | Reflect, Haze, Disable | **T2** (scoring exclusion) |
| **Switcheroo** ⭐ | **Secretly replace the target's song** with one YOU pick (title/artist/url). The target doesn't know until the reveal — the GM scores your sabotage entry blind. Activated while OPEN against a player who has already submitted. | rival | Reflect, Haze, Disable | **T2** (submission swap + restore log) |
| **Earthquake** | Every OTHER player loses **15 pts** this cycle — but you **cannot podium** this week. Chaotic AoE. | all | Haze | T1 |
| **Time Bomb** | Target loses **50 pts** at the reveal **two cycles** from now (delayed, sneaky). | rival | Reflect (at plant), Haze | T1 (reuses Leech-style persistence) |

## 1.4 New GOLDEN (ultra-rare META) — proposes a new rarity tier

These change **game flow**, not just points. Extremely rare; see acquisition.

| Chip | Effect | Target | Counters | Tier |
|------|--------|--------|----------|------|
| **Crown** 👑 | You **choose the GM** for the next cycle (sets next cycle's `gmUserId`). | pick player | Haze only | **T2** (GM assignment + next-cycle timing) |
| **Decree** | You **set next week's theme** (name + description). | self | Haze only | **T2** (theme pre-set) |

> Open question: make GOLDEN a real `ChipRarity` enum value (cleaner, schema change) or
> tag them LEGENDARY with a special acquisition. Recommendation: **add GOLDEN**.

## 1.5 Balance & anti-grief rules (apply to all offensive chips)

- **One offensive hit cap (CONFIRMED = 2):** a player can be the *target* of at most **2 negative
  chips per cycle**; extra ones fizzle (logged, chip refunded). Prevents pile-ons that make someone quit.
  - Resolution order matters: process offensive chips deterministically (e.g. by activation time);
    the 3rd+ negative chip on the same target is cancelled and the chip returned to inventory.
  - Switcheroo + Veto + Blackout all count toward this cap.
- **Reflect/Protect/Haze** remain the universal answers — every new offensive chip lists its counters above.
- **Caps unchanged:** max 2 per chip, 5 total inventory.
- **No self-harm targeting** (already enforced: can't target yourself).
- **GOLDEN chips never come from random drops** (see acquisition) so they stay special.

## 1.7 Idea menu — extra chips to evaluate (not yet decided)

Pick which to include. ✅ = my recommendation for a dynamic-but-balanced game.

### Aggressive / sneaky
- ✅ **Switcheroo** — secretly swap a rival's song (already promoted to §1.3).
- ✅ **Copycat** — force the target's entry to become a **duplicate of your song**; the GM sees two identical songs and usually penalizes both → mind-game. (Legendary)
- **Mute** — the GM sees the target's title/artist as "???" (no metadata, just the link). Mild disadvantage. (Rare)
- ✅ **Bounty** — put a 20-pt bounty on a rival: whoever outscores them this week splits it. Turns the lobby against one player. (Rare, multiplayer dynamic)
- **Curse** — if the target podiums, they **lose their streak**. Punishes only winners. (Legendary)
- **Usurp** — if you AND the target both podium, you **swap positions** with them. (Rare)

### Defensive / counter
- ✅ **Cleanse** — remove ALL negative effects on you this week, including persistent ones (Leech Seed, Time Bomb). The hard counter to drains. (Rare)
- **Mirror Coat** — like Reflect but specifically bounces point-**drain** chips (Toxic, Mega Drain, Leech). (Rare)
- ✅ **Foresight** — see **who has targeted you** this week before the reveal → real counterplay. (Common/Rare, intel)
- **Insurance** — if you're Vetoed/Blacked-out/Switcheroo'd, you still get participation + keep your streak. (Common)

### Economy / co-op / meta
- ✅ **Banker** — bank this week's points to earn them **×2 next week** — but you lose them if you don't participate next week. Risk/reward. (Rare)
- **Donation** — gift a chip to another player (co-op, builds alliances). (Common)
- **Wildcard / Joker** — counts as any COMMON chip you name at activation. (Rare)

### Golden (flow-changing, ultra-rare)
- ✅ **Crown** 👑 — choose next GM (already in §1.4).
- ✅ **Decree** — set next week's theme (already in §1.4).
- **Amnesty** — super-Haze: wipe ALL chips in play this cycle (yours included). (Golden)
- **Extra Time** — extend the submission window 24h for everyone. (Golden)
- **Double Header** — next cycle crowns **two winners** (two 1st places). (Golden, big swing)

## 1.6 Acquisition tuning

- Keep welcome gift = random COMMON.
- Participation drop weights → add a 4th tier: 58% common / 30% rare / 11% legendary / **1% golden**
  (golden only on milestone weeks, e.g. streak multiple of 8). Tunable.
- Several new chips become **achievement rewards** (below), giving a progression path.

---

# 2. Achievements

## 2.1 Data-only (existing condition types — ZERO new code, just seed rows)

`conditionType` already supported: SUBMISSION_COUNT, PODIUM_COUNT, TOP_1_COUNT, STREAK_WEEKS, GM_COUNT.

| Slug | Name | Condition | Tier | Bonus | Reward chip |
|------|------|-----------|------|-------|-------------|
| first-drop | First Drop | SUBMISSION_COUNT ≥ 1 | BRONZE | 10 | — |
| regular | Regular | SUBMISSION_COUNT ≥ 10 | SILVER | 30 | cushion |
| veteran | Veteran | SUBMISSION_COUNT ≥ 25 | GOLD | 60 | toxic |
| centurion | Centurion | SUBMISSION_COUNT ≥ 50 | PLATINUM | 150 | — |
| first-blood | First Blood | PODIUM_COUNT ≥ 1 | BRONZE | 15 | — |
| contender | Contender | PODIUM_COUNT ≥ 5 | SILVER | 40 | gamble |
| podium-regular | Podium Regular | PODIUM_COUNT ≥ 10 | GOLD | 80 | — |
| champion | Champion | TOP_1_COUNT ≥ 1 | SILVER | 25 | — |
| dominator | Dominator | TOP_1_COUNT ≥ 5 | GOLD | 100 | screech |
| legend | Legend | TOP_1_COUNT ≥ 10 | PLATINUM | 200 | crown (golden) |
| consistent | Consistent | STREAK_WEEKS ≥ 4 | BRONZE | 20 | — |
| dedicated | Dedicated | STREAK_WEEKS ≥ 8 | SILVER | 50 | — |
| unstoppable | Unstoppable | STREAK_WEEKS ≥ 12 | GOLD | 100 | mega-drain |
| ironclad | Ironclad | STREAK_WEEKS ≥ 26 | PLATINUM | 250 | — |
| host | Host | GM_COUNT ≥ 1 | BRONZE | 20 | — |
| curator | Curator | GM_COUNT ≥ 5 | GOLD | 100 | decree (golden) |

## 2.2 New condition types (need checker code — Phase 2)

Add to `ConditionType` enum + `checkAndAwardAchievements`:

- **POINTS_TOTAL** — lifetime points milestones (500 / 1000 / 5000).
- **CHIP_USED_COUNT** — total chips activated (tactician path).
- **CHIP_LANDED_COUNT** — offensive chips that successfully hit (aggressor path).
- **COMEBACK** (SPECIAL) — go from non-podium to 1st in consecutive weeks.
- **PERFECT_MONTH** (SPECIAL) — podium 4 weeks in a row.

---

# 3. Notifications (in-app + email)

Infra exists: `notifyUser(userId, msg)` (in-app) and `sendEmail({to,subject,html})` (Resend).
Work = wiring triggers + templates + preferences. **Most triggers are in-app only;**
email is reserved for the high-value moments to avoid spam.

## 3.1 Trigger map

**Email scope: CONSERVATIVE (per decision)** — email only for **Results** and **Admin broadcast**.
Everything else is in-app only, to keep email volume low and deliverability high.

| Event | When | In-app | Email | Notes |
|-------|------|:------:|:-----:|-------|
| New week / theme set | Mon (cycle PENDING) | ✅ | — | "Next theme: X" |
| Submissions open | Tue | ✅ | — | in-app only |
| **Submission reminder** | Thu (24h before close) | ✅ | — | only players who haven't submitted — **needs a new cron** |
| Submissions closed | Fri | ✅ | — | players: "results Monday"; GM: "time to score!" |
| **Results revealed** | Mon | ✅ | ✅ | personalized: your place + points |
| Chip received (drop/achv) | on grant | ✅ | — | partly done already |
| Chip used against you | at reveal | ✅ | — | "You were hit by Switcheroo!" |
| Achievement earned | at reveal | ✅ | — | in-app only |
| **Admin broadcast** | manual | ✅ | ✅ (opt-in respected) | new admin feature: message all players |

## 3.2 Supporting work

- **Email preferences:** add opt-out per category (e.g., `emailOptIn` boolean on `User`, or a
  small prefs table). Every marketing-ish email gets an unsubscribe link. Transactional
  (password reset) always sends.
- **Batch sending:** reveal/open emails loop over all players — respect Resend rate limits
  (send in small batches; tolerate partial failures, already non-fatal).
- **New email templates:** weekly-open, reminder, results (personalized), achievement, broadcast.
- **Reminder cron:** add a Thursday job to `lib/cron.ts` (e.g., `0 22 * * 4`).

---

# 4. Schema changes summary (for whoever implements)

- `ChipRarity` += `GOLDEN` (if adopted).
- `ChipEffect` += new effect enum values (one per new chip).
- `ConditionType` += POINTS_TOTAL, CHIP_USED_COUNT, CHIP_LANDED_COUNT (Phase 2).
- `User` += `emailOptIn Boolean @default(true)` (notifications).
- Possibly `Submission` += `excludedFromScoring Boolean` (Veto) — or handle via a flag/relation.
- New chips/achievements are **seed rows** (Chip + Achievement tables).
- Each schema change ships via `prisma db push` (session-pooler, per deploy.sh).

# 5. Proposed phasing

1. **Phase A (low risk, high visibility):** notifications wiring + data-only achievements
   (§2.1) + the T1 chips (§1.1–1.3 excluding Pickpocket/Blackout/Veto).
2. **Phase B:** T2 aggressive chips — Blackout, Veto, Pickpocket — with anti-grief cap (§1.5).
3. **Phase C:** GOLDEN tier + Crown/Decree (meta) + Phase-2 achievement condition types.

---

## Open decisions (need your call)

1. **GOLDEN rarity:** add it as a real tier? (recommended yes)
2. **Anti-grief cap:** max 2 negative chips per target per cycle — agree on the number?
3. **Email scope:** which events truly warrant email vs in-app only? (proposed: open, reminder,
   results, high-tier achievements, broadcast)
4. **Email opt-out:** simple `emailOptIn` flag, ok?
5. **Veto severity:** 0 points (harsh) vs participation-only — which feels right?
6. **Earthquake:** AoE −15 to everyone — too swingy for the group size?
7. Any chips here you DON'T want, or extra ideas to add?
