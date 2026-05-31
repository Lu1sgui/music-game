// app/api/admin/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'
import { getTokenPayload, hashPassword } from '@/lib/auth'
import { sendEmail, tempPasswordEmail } from '@/lib/email'
import { notifyUser } from '@/lib/notify'

function generateTempPassword(): string {
  // Memorable: avoid 0/O/1/l/I confusion. Uses a CSPRNG (crypto.randomInt),
  // not Math.random(), so the temporary password is not predictable.
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let pwd = ''
  for (let i = 0; i < 12; i++) pwd += chars[randomInt(chars.length)]
  return pwd
}

export async function POST(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: true },
    })

    // Send email + notification
    await sendEmail({
      to: user.email,
      subject: '⚡ Your Weekly Beats password was reset',
      html: tempPasswordEmail(user.username, tempPassword),
    })
    await notifyUser(user.id, `🔑 Your password was reset by an admin. Check your email for the temporary password.`)

    // Return temp password to admin so they can share it directly if needed
    return NextResponse.json({
      message: `Password reset for @${user.username}`,
      tempPassword,
      emailSentTo: user.email,
    })
  } catch (err: any) {
    console.error('[POST /api/admin/reset-password]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
