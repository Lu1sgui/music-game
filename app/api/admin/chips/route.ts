// app/api/admin/chips/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload } from '@/lib/auth'
import { notifyUser } from '@/lib/notify'

export async function POST(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, chipSlug } = await request.json()
    if (!userId || !chipSlug) return NextResponse.json({ error: 'userId and chipSlug required' }, { status: 400 })

    const chip = await prisma.chip.findUnique({ where: { slug: chipSlug } })
    if (!chip) return NextResponse.json({ error: `Chip "${chipSlug}" not found` }, { status: 404 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.userChip.upsert({
      where: { userId_chipId: { userId, chipId: chip.id } },
      update: { quantity: { increment: 1 }, lastAcquiredAt: new Date() },
      create: { userId, chipId: chip.id, quantity: 1, lastAcquiredAt: new Date() },
    })

    // Notify the player
    await notifyUser(userId, `⚡ Admin has gifted you a **${chip.name}** chip (${chip.rarity})! Check your profile to see it.`)

    return NextResponse.json({ message: `${chip.name} given to @${user.username}` })
  } catch (err: any) {
    console.error('[POST /api/admin/chips]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
