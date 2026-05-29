// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password)
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const reset = await prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    })

    if (!reset) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Password updated. You can now log in.' })
  } catch (err: any) {
    console.error('[POST /api/auth/reset-password]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
