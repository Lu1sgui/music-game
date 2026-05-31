// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail, passwordResetEmail } from '@/lib/email'
import { rateLimit, clientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const normalizedEmail = String(email).toLowerCase().trim()

    // Throttle reset-email flooding: 3 / hour per email, 10 / hour per IP
    const byEmail = rateLimit(`forgot:${normalizedEmail}`, 3, 60 * 60 * 1000)
    const byIp = rateLimit(`forgot-ip:${clientIp(request)}`, 10, 60 * 60 * 1000)
    if (!byEmail.ok || !byIp.ok) {
      // Still return the generic success message so we don't leak rate-limit state
      return NextResponse.json({
        message: 'If an account exists with that email, a password reset link has been sent.',
      })
    }

    // Always return success — don't reveal whether email exists
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    if (user) {
      // Invalidate any old unused tokens for this user
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      })

      // Generate token (sent in URL, hashed in DB)
      const token = randomBytes(32).toString('base64url')
      const tokenHash = createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.passwordReset.create({
        data: { userId: user.id, tokenHash, expiresAt },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://devinsmusic.reviews'
      const resetUrl = `${appUrl}/reset-password/${token}`

      await sendEmail({
        to: user.email,
        subject: '⚡ Reset your Weekly Beats password',
        html: passwordResetEmail(user.username, resetUrl),
      })
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    })
  } catch (err: any) {
    console.error('[POST /api/auth/forgot-password]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
