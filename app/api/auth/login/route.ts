// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password)
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
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
      },
    })
  } catch (err: any) {
    console.error('[POST /api/auth/login]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
