// lib/email.ts
// Resend integration — uses REST API directly, no SDK needed

import { chipIconPngUrl } from './chipIcons'

const RESEND_API = 'https://api.resend.com/emails'

// DiceBear PNG avatar (SVG isn't rendered by Gmail/Outlook)
function avatarPngUrl(seed?: string | null, style = 'miniavs', size = 80): string {
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(seed ?? 'default')}&backgroundColor=0e1228&size=${size}`
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Weekly Beats <onboarding@resend.dev>'

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send')
    return false
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('[email] Resend error:', res.status, error)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] Send failed:', err)
    return false
  }
}

// ─── Email templates ─────────────────────────────────────────────────────────

export function passwordResetEmail(username: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    <h2 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h2>
    <p style="line-height: 1.6; margin: 0 0 24px; color: #B0B5CC;">
      Hi <strong>@${username}</strong>, we received a request to reset your password.
      Click the button below to set a new one. This link expires in <strong>1 hour</strong>.
    </p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; padding: 14px 32px; background: #FF2D87; color: #fff;
                text-decoration: none; border-radius: 4px; font-weight: 700;
                font-family: -apple-system, sans-serif; letter-spacing: 0.5px;">
        RESET PASSWORD
      </a>
    </p>
    <p style="font-size: 13px; color: #888; line-height: 1.6;">
      Or paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #00E5FF; word-break: break-all;">${resetUrl}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #2A2F50; margin: 32px 0;">
    <p style="font-size: 12px; color: #666; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  </div>
</body>
</html>
  `.trim()
}

// Shared shell so all game emails look consistent
function emailShell(inner: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    ${inner}
    <hr style="border: none; border-top: 1px solid #2A2F50; margin: 32px 0;">
    <p style="font-size: 12px; color: #666; line-height: 1.5;">
      You're receiving this because you opted in to Weekly Beats emails.
      You can turn these off anytime from your profile.
    </p>
  </div>
</body>
</html>`.trim()
}

// Personalized weekly results email (sent at the Monday reveal)
export function resultsEmail(
  username: string,
  weekNumber: number,
  place: number | null,
  points: number,
  theme?: string | null
): string {
  const medal = place === 1 ? '🥇 1st place' : place === 2 ? '🥈 2nd place' : place === 3 ? '🥉 3rd place' : null
  const headline = medal
    ? `You finished <strong style="color:#FFD700;">${medal}</strong>!`
    : `Here's how your week went.`
  return emailShell(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${weekNumber} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${username}</strong>, ${headline}
    </p>
    ${theme ? `<p style="color:#888; margin:0 0 16px;">Theme: <em>${theme}</em></p>` : ''}
    <div style="background:#0E1228; border:2px solid #00E5FF; border-radius:4px; padding:16px; text-align:center; margin:24px 0;">
      <span style="font-size:14px; color:#888;">Points this week</span><br>
      <span style="font-family:'Courier New',monospace; font-size:28px; color:#00E5FF;">${points >= 0 ? '+' : ''}${points}</span>
    </div>
    <p style="text-align:center; margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://devinsmusic.reviews'}"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE THE LADDER
      </a>
    </p>
  `)
}

// Admin broadcast — a free-form message to all players
export function broadcastEmail(username: string, subject: string, body: string): string {
  return emailShell(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${subject}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${username},

${body}</p>
  `)
}

// A chip was played on you — shows the action, the chip icon, and who did it
export function chipHitEmail(
  username: string,
  actorName: string,
  actorSeed: string | null | undefined,
  actorStyle: string | undefined,
  chipSlug: string,
  chipName: string,
  effectText: string
): string {
  const avatar = avatarPngUrl(actorSeed, actorStyle ?? 'miniavs', 96)
  const chipImg = chipIconPngUrl(chipSlug, 96)
  return emailShell(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">A chip was played on you</h2>
    <p style="line-height: 1.6; margin: 0 0 20px; color: #B0B5CC;">Hi <strong>@${username}</strong> — it's all out in the open now:</p>
    <div style="background:#0E1228; border:1px solid #2A2F50; border-radius:8px; padding:20px; text-align:center;">
      <table role="presentation" align="center" cellpadding="0" cellspacing="0"><tr>
        <td style="text-align:center; padding:0 14px;">
          <img src="${avatar}" width="64" height="64" alt="" style="border-radius:50%; border:2px solid #2A2F50; display:block; margin:0 auto;">
          <div style="font-size:13px; color:#B0B5CC; margin-top:6px;">@${actorName}</div>
        </td>
        <td style="text-align:center; font-size:22px; color:#FF2D87; padding:0 6px;">➜</td>
        <td style="text-align:center; padding:0 14px;">
          <img src="${chipImg}" width="56" height="56" alt="${chipName}" style="display:block; margin:0 auto; image-rendering:pixelated;">
          <div style="font-size:13px; color:#FFD700; margin-top:6px;">${chipName}</div>
        </td>
      </tr></table>
      <p style="color:#E0E3F0; font-size:15px; margin:18px 0 0;">
        <strong>@${actorName}</strong> used <strong style="color:#FFD700;">${chipName}</strong> on you.
      </p>
      <p style="color:#B0B5CC; font-size:13px; line-height:1.5; margin:8px 0 0;">${effectText}</p>
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://devinsmusic.reviews'}/chips"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        PLAY YOUR CHIPS
      </a>
    </p>
  `)
}

// You were chosen as Game Master
export function gmChosenEmail(username: string, weekNumber: number, theme?: string | null): string {
  return emailShell(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">👑 You're this week's Game Master!</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${username}</strong>, you've been chosen to host <strong>Week ${weekNumber}</strong>.
    </p>
    ${theme ? `<p style="color:#888; margin:0 0 16px;">Theme: <em>${theme}</em></p>` : ''}
    <div style="background:#0E1228; border:1px solid #2A2F50; border-radius:8px; padding:16px 18px; color:#D0D4E8; font-size:14px; line-height:1.7;">
      As GM you'll:
      <ul style="margin:8px 0 0; padding-left:18px;">
        <li>Set this week's theme (optional)</li>
        <li>Listen to every submission <strong>anonymously</strong> after Friday's close</li>
        <li>Pick the podium — 🥇 1st, 🥈 2nd, 🥉 3rd — before Monday</li>
      </ul>
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://devinsmusic.reviews'}/gm"
         style="display:inline-block; padding:12px 28px; background:#9B59B6; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        OPEN THE GM PANEL
      </a>
    </p>
  `)
}

// Achievement unlocked
export function achievementEmail(username: string, name: string, description: string, reward?: string | null): string {
  return emailShell(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">🏆 Achievement unlocked!</h2>
    <p style="line-height: 1.6; margin: 0 0 20px; color: #B0B5CC;">Nice one, <strong>@${username}</strong> — you earned:</p>
    <div style="background:#0E1228; border:2px solid #FFD700; border-radius:8px; padding:18px; text-align:center;">
      <div style="font-family:'Courier New',monospace; font-size:22px; color:#FFD700;">${name}</div>
      <p style="color:#B0B5CC; font-size:14px; line-height:1.5; margin:10px 0 0;">${description}</p>
      ${reward ? `<div style="margin-top:14px; display:inline-block; background:rgba(0,229,255,.1); border:1px solid #00E5FF; color:#00E5FF; border-radius:4px; padding:6px 12px; font-size:13px;">🎁 ${reward}</div>` : ''}
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://devinsmusic.reviews'}/profile"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE YOUR BADGES
      </a>
    </p>
  `)
}

export function tempPasswordEmail(username: string, tempPassword: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your temporary password</title></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    <h2 style="font-size: 20px; margin: 0 0 16px;">Your password was reset</h2>
    <p style="line-height: 1.6; margin: 0 0 24px; color: #B0B5CC;">
      Hi <strong>@${username}</strong>, an administrator has reset your password. Your temporary password is:
    </p>
    <div style="background: #0E1228; border: 2px solid #FFD700; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
      <code style="font-family: 'Courier New', monospace; font-size: 22px; color: #FFD700; letter-spacing: 2px;">${tempPassword}</code>
    </div>
    <p style="line-height: 1.6; color: #B0B5CC;">
      You'll be asked to set a new password the next time you log in.
    </p>
  </div>
</body>
</html>
  `.trim()
}
