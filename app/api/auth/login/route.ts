// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password)
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })

    // Throttle brute force: 10 attempts / 15 min per IP+email
    const normalizedEmail = String(email).toLowerCase().trim()
    const limit = rateLimit(`login:${clientIp(request)}:${normalizedEmail}`, 10, 15 * 60 * 1000)
    if (!limit.ok)
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${limit.retryAfter}s.` },
        { status: 429 }
      )

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })
    if (!user || !user.isActive)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = signToken({ userId: user.id, username: user.username, role: user.role })
    return NextResponse.json({
      token,
      user: {
        id: user.id, username: user.username, role: user.role,
        totalPoints: user.totalPoints, streakWeeks: user.streakWeeks,
        avatarSeed: user.avatarSeed, avatarStyle: user.avatarStyle,
        mustChangePassword: user.mustChangePassword,
      },
    })
  } catch (err: any) {
    console.error('[POST /api/auth/login]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
