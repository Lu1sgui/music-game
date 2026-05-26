// app/api/auth/register/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { ok, err } from '@/lib/api'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, email, password } = body

  // Validate
  if (!username || !email || !password) {
    return err('username, email and password are required')
  }
  if (username.length < 3 || username.length > 30) {
    return err('Username must be between 3 and 30 characters')
  }
  if (password.length < 8) {
    return err('Password must be at least 8 characters')
  }

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    return err(
      existing.email === email ? 'Email already in use' : 'Username already taken',
      409
    )
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  })

  const token = signToken({ userId: user.id, username: user.username, role: user.role })

  return ok({ token, user: { id: user.id, username: user.username, role: user.role } }, 201)
}
