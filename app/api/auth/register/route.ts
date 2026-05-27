// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { notifyUser } from '@/lib/notify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, avatarSeed, avatarStyle } = body

    if (!username || !email || !password)
      return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 })
    if (username.length < 3 || username.length > 30)
      return NextResponse.json({ error: 'Username must be 3–30 characters' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (existing)
      return NextResponse.json(
        { error: existing.email === email ? 'Email already in use' : 'Username already taken' },
        { status: 409 }
      )

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username, email, passwordHash,
        avatarSeed: avatarSeed ?? username,
        avatarStyle: avatarStyle ?? 'miniavs',
      },
    })

    // 🎁 Welcome gift: random common chip
    try {
      const commonChips = await prisma.chip.findMany({ where: { rarity: 'COMMON' } })
      if (commonChips.length > 0) {
        const gift = commonChips[Math.floor(Math.random() * commonChips.length)]
        await prisma.userChip.create({
          data: { userId: user.id, chipId: gift.id, quantity: 1, lastAcquiredAt: new Date() },
        })
        await notifyUser(user.id, `🎁 Welcome to the game! You've received a **${gift.name}** chip as a welcome gift. Use it wisely!`)
      }
    } catch {}

    const token = signToken({ userId: user.id, username: user.username, role: user.role })
    return NextResponse.json({
      token,
      user: {
        id: user.id, username: user.username, role: user.role,
        totalPoints: user.totalPoints, streakWeeks: user.streakWeeks,
        avatarSeed: user.avatarSeed, avatarStyle: user.avatarStyle,
      },
    }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/auth/register]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
