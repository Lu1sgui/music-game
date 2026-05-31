// prisma/preview-emails.ts
// Sends one sample of every email template to a recipient, for review.
//   npx tsx prisma/preview-emails.ts [recipient@example.com]
import { readFileSync } from 'fs'

// Load .env into process.env (tsx doesn't do this automatically)
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
} catch {}

import { sendEmail, passwordResetEmail, tempPasswordEmail, resultsEmail, broadcastEmail, chipHitEmail, gmChosenEmail, achievementEmail } from '../lib/email'

const to = process.argv[2] || 'luisgui.83@gmail.com'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://devinsmusic.reviews'

const cases: { label: string; subject: string; html: string }[] = [
  {
    label: 'Password reset',
    subject: '[PREVIEW] ⚡ Reset your Weekly Beats password',
    html: passwordResetEmail('luisgui', `${appUrl}/reset-password/sample-token-abc123`),
  },
  {
    label: 'Temporary password (admin reset)',
    subject: '[PREVIEW] ⚡ Your Weekly Beats password was reset',
    html: tempPasswordEmail('luisgui', 'Kp7mQ2xZ9nRt'),
  },
  {
    label: 'Weekly results — 1st place',
    subject: '[PREVIEW] ⚡ Week 23 results — Weekly Beats',
    html: resultsEmail('luisgui', 23, 1, 215, 'Synthwave Night'),
  },
  {
    label: 'Weekly results — participation',
    subject: '[PREVIEW] ⚡ Week 23 results — Weekly Beats',
    html: resultsEmail('luisgui', 23, null, 20, 'Synthwave Night'),
  },
  {
    label: 'Admin broadcast',
    subject: '[PREVIEW] 📢 A new season starts Monday',
    html: broadcastEmail('luisgui', 'A new season starts Monday', "We're kicking off a fresh season of Weekly Beats!\n\nNew chips have arrived — check the manual. Submissions open Tuesday. Good luck out there."),
  },
  {
    label: 'Chip played on you (offensive)',
    subject: '[PREVIEW] ⚔️ A chip was played on you',
    html: chipHitEmail('luisgui', 'devin', 'devin', 'miniavs', 'toxic', 'Toxic', 'You lost 30% of the points you earned this week.'),
  },
  {
    label: 'Chip played on you (utility)',
    subject: '[PREVIEW] 🔍 A chip was played on you',
    html: chipHitEmail('luisgui', 'mariana', 'mariana', 'miniavs', 'switcheroo', 'Switcheroo', 'Your song was secretly swapped before the GM scored it!'),
  },
  {
    label: 'Chosen as Game Master',
    subject: '[PREVIEW] 👑 You are this week\'s Game Master',
    html: gmChosenEmail('luisgui', 24, 'One-hit wonders'),
  },
  {
    label: 'Achievement unlocked',
    subject: '[PREVIEW] 🏆 Achievement unlocked',
    html: achievementEmail('luisgui', 'High Roller', 'Win 1st place twice.', 'Gamble chip + 50 pts'),
  },
]

async function main() {
  console.log(`Sending ${cases.length} preview emails to ${to} ...`)
  for (const c of cases) {
    const ok = await sendEmail({ to, subject: c.subject, html: c.html })
    console.log(`  ${ok ? '✓' : '✗'}  ${c.label}`)
  }
  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
