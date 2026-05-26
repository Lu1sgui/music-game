// app/api/admin/chips/route.ts
// Method D acquisition: Admin manually gives a chip to a player
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuth, ok, err } from '@/lib/api'

export async function POST(request: NextRequest) {
  const payload = getAuth(request)
  if (!payload) return err('Unauthorized', 401)
  if (payload.role !== 'ADMIN') return err('Forbidden', 403)

  const body = await request.json()
  const { userId, chipSlug } = body

  if (!userId || !chipSlug) return err('userId and chipSlug are required')

  const [user, chip] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.chip.findUnique({ where: { slug: chipSlug } }),
  ])

  if (!user) return err('User not found', 404)
  if (!chip) return err(`Chip "${chipSlug}" not found`, 404)

  // Check inventory limits (max 5 total, max 2 of same chip)
  const inventory = await prisma.userChip.findMany({
    where: { userId, quantity: { gt: 0 } },
  })
  const totalChips = inventory.reduce((sum, uc) => sum + uc.quantity, 0)
  if (totalChips >= 5) {
    return err(`${user.username} has a full inventory (max 5 chips)`, 409)
  }

  const existingChip = inventory.find((uc) => uc.chipId === chip.id)
  if (existingChip && existingChip.quantity >= 2) {
    return err(`${user.username} already has 2 copies of ${chip.name}`, 409)
  }

  const userChip = await prisma.userChip.upsert({
    where: { userId_chipId: { userId, chipId: chip.id } },
    update: { quantity: { increment: 1 }, lastAcquiredAt: new Date() },
    create: { userId, chipId: chip.id, quantity: 1, lastAcquiredAt: new Date() },
  })

  return ok({
    message: `${chip.name} given to ${user.username}`,
    userChip,
  })
}
