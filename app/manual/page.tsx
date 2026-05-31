// app/manual/page.tsx — public game manual, SNES-booklet style. No login required.
import type { Metadata } from 'next'
import Link from 'next/link'
import { CHIP_GROUPS, ACHIEVEMENTS } from './manualData'
import ChipGrid from './ChipGrid'

export const metadata: Metadata = {
  title: 'Game Manual — Weekly Beats',
  description: 'How to play Weekly Beats: the weekly cycle, scoring, chips and achievements.',
}


function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: '2.5rem', scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        <span className="font-pixel" style={{ fontSize: 11, color: 'var(--bg)', background: 'var(--pink)', padding: '6px 9px', borderRadius: 3 }}>{n}</span>
        <h2 className="font-pixel txt-cyan" style={{ fontSize: 12 }}>{title}</h2>
      </div>
      <div style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.7 }}>{children}</div>
    </section>
  )
}

export default function ManualPage() {
  return (
    <div className="page" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* ── Cover ───────────────────────────────────────────── */}
      <div className="card corners" style={{ padding: '2rem 1.5rem', textAlign: 'center', marginTop: '1.25rem', marginBottom: '1.5rem', borderColor: 'var(--pink)' }}>
        <div className="font-pixel" style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: 3 }}>INSTRUCTION BOOKLET</div>
        <h1 className="font-pixel txt-pink anim-pulse-glow" style={{ fontSize: 22, margin: '1rem 0 0.5rem' }}>WEEKLY BEATS</h1>
        <div className="font-pixel txt-yellow" style={{ fontSize: 9 }}>★ OFFICIAL GAME MANUAL ★</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '1rem', lineHeight: 1.6 }}>
          A weekly music battle. Drop one song, score blind, climb the ladder — and bend the rules with chips.
        </p>
      </div>

      {/* ── Table of contents ───────────────────────────────── */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '2rem' }}>
        <div className="font-pixel txt-cyan" style={{ fontSize: 9, marginBottom: 10 }}>CONTENTS</div>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.9, columns: 2 }}>
          <li><a href="#overview" style={{ color: 'var(--cyan)' }}>What is Weekly Beats</a></li>
          <li><a href="#cycle" style={{ color: 'var(--cyan)' }}>The weekly cycle</a></li>
          <li><a href="#scoring" style={{ color: 'var(--cyan)' }}>Submitting & scoring</a></li>
          <li><a href="#chips" style={{ color: 'var(--cyan)' }}>The chip system</a></li>
          <li><a href="#compendium" style={{ color: 'var(--cyan)' }}>Chip compendium</a></li>
          <li><a href="#achievements" style={{ color: 'var(--cyan)' }}>Achievements</a></li>
          <li><a href="#roles" style={{ color: 'var(--cyan)' }}>Roles</a></li>
        </ol>
      </div>

      <Section id="overview" n="1" title="WHAT IS WEEKLY BEATS">
        <p>Every week the crew gets a <strong className="txt-yellow">theme</strong>. Each player submits <strong>one song</strong>.
          A rotating <strong>Game Master (GM)</strong> listens to every entry <em>anonymously</em> and crowns a podium: 🥇 1st, 🥈 2nd, 🥉 3rd.
          You earn points, build a streak, unlock achievements, and collect <strong className="txt-pink">chips</strong> — special moves that twist the game.</p>
        <p>The goal: climb the <strong>ladder</strong> and become the all-time champion.</p>
      </Section>

      <Section id="cycle" n="2" title="THE WEEKLY CYCLE">
        <p>A week flows through five stages:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '1rem 0' }}>
          {[
            ['MON 00:00', 'Reveal & new week', 'Last week’s results drop. A fresh cycle begins (theme announced).'],
            ['TUE 00:00', 'Submissions OPEN', 'Drop your song. Offensive chips can be played now (until Friday).'],
            ['FRI 17:00', 'Submissions CLOSE', 'Songs lock. The GM scores over the weekend. Defensive chips stay playable.'],
            ['SAT–SUN', 'GM scoring', 'The GM ranks the songs blind — no names shown.'],
            ['MON 00:00', 'REVEAL', 'Points awarded, chips resolved, hidden attacks revealed. Repeat!'],
          ].map(([when, title, desc]) => (
            <div key={title as string} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span className="font-pixel txt-yellow" style={{ fontSize: 8, minWidth: 78 }}>{when}</span>
              <div>
                <div className="font-ui" style={{ fontSize: '0.92rem' }}>{title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>All times are Colombia time (COT, UTC-5).</p>
      </Section>

      <Section id="scoring" n="3" title="SUBMITTING & SCORING">
        <p>Paste a <strong>Spotify or YouTube</strong> link, add the title and artist, and submit — <strong>one song per week</strong>.
          Submissions are anonymous: the GM judges the music, not the name.</p>
        <p style={{ marginTop: '1rem' }}><strong className="txt-cyan">Points</strong></p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, margin: '0.5rem 0 1rem' }}>
          {[['🥇 1st place', '150'], ['🥈 2nd place', '80'], ['🥉 3rd place', '40'], ['Participation', '20'], ['Streak bonus', '+5 / week (max 50)'], ['Achievements', 'bonus points + chips']].map(([k, v]) => (
            <div key={k} className="card" style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>{k}</span><span className="txt-yellow font-ui">{v}</span>
            </div>
          ))}
        </div>
        <p><strong className="txt-cyan">Streaks:</strong> submit every week to grow a streak. Each consecutive week adds a small bonus (up to +50). Miss a week and it resets — unless a chip saves you.</p>
      </Section>

      <Section id="chips" n="4" title="THE CHIP SYSTEM">
        <p>Chips are special moves. You hold up to <strong>5</strong> at once (max <strong>2</strong> of the same), and can play up to <strong className="txt-yellow">3 per week</strong>.</p>
        <ul style={{ paddingLeft: '1.1rem', margin: '0.75rem 0' }}>
          <li><strong className="txt-pink">Attacks (Tue–Fri):</strong> offensive and song-altering chips must be played before submissions close.</li>
          <li><strong className="txt-green">Defense (until the Monday reveal):</strong> defensive chips can be played all weekend.</li>
          <li><strong>Attacks are hidden</strong> until the reveal — you won’t see them coming. Defense is a <em>bet</em>: raise a shield on a hunch.</li>
          <li>If your shield catches an attack, you’re told it was blocked — but take no damage. <strong>Foresight</strong> is the one chip that reveals who targeted you.</li>
          <li><strong>Anti-grief:</strong> a player can be hit by at most <strong>2</strong> offensive chips per week — extra attacks fizzle.</li>
          <li><strong>How to get chips:</strong> a welcome gift, achievement rewards, and random drops every few weeks of play.</li>
        </ul>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Play your chips from the <strong>My Chips</strong> page.</p>
      </Section>

      <Section id="compendium" n="5" title="CHIP COMPENDIUM">
        <ChipGrid groups={CHIP_GROUPS} />
      </Section>

      <Section id="achievements" n="6" title="ACHIEVEMENTS">
        <p>Badges you unlock by playing. Many reward bonus points and chips.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: '0.75rem' }}>
          {ACHIEVEMENTS.map((a) => (
            <div key={a.name} className="card" style={{ padding: '0.7rem 0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span className="font-ui txt-yellow" style={{ fontSize: '0.92rem' }}>{a.name}</span>
                {a.reward && <span style={{ fontSize: '0.74rem', color: 'var(--cyan)' }}>🎁 {a.reward}</span>}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 2 }}>{a.how}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="roles" n="7" title="ROLES">
        <ul style={{ paddingLeft: '1.1rem' }}>
          <li><strong className="txt-cyan">Player</strong> — submit songs, play chips, climb the ladder.</li>
          <li><strong className="txt-purple">Game Master (GM)</strong> — scores the week’s songs blind and sets the theme. The role rotates.</li>
          <li><strong className="txt-orange">Admin</strong> — runs the cycle, assigns GMs, and keeps the game on the rails.</li>
        </ul>
      </Section>

      <div style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
        <Link href="/" style={{ color: 'var(--pink)' }}>▸ Enter the game</Link>
        <div className="font-pixel" style={{ fontSize: 7, marginTop: '1rem', color: 'var(--border)' }}>WEEKLY BEATS · PRESS START</div>
      </div>
    </div>
  )
}
