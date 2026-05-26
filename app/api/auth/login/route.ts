// app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { ok, err } from '@/lib/api'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return err('email and password are required')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return err('Invalid credentials', 401)
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    return err('Invalid credentials', 401)
  }

  const token = signToken({ userId: user.id, username: user.username, role: user.role })

  return ok({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      totalPoints: user.totalPoints,
      streakWeeks: user.streakWeeks,
    },
  })
}
