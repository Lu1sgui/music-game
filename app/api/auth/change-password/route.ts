// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload, comparePassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, newPassword } = await request.json()
    if (!newPassword || newPassword.length < 8)
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // If user is in mustChangePassword state, skip current password check
    if (!user.mustChangePassword) {
      if (!currentPassword)
        return NextResponse.json({ error: 'Current password required' }, { status: 400 })
      const valid = await comparePassword(currentPassword, user.passwordHash)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    })

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (err: any) {
    console.error('[POST /api/auth/change-password]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
