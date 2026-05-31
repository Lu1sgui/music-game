// app/api/auth/email-prefs/route.ts
// Lets a logged-in player opt in/out of non-transactional emails.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { emailOptIn } = await request.json()
    if (typeof emailOptIn !== 'boolean') {
      return NextResponse.json({ error: 'emailOptIn (boolean) is required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { emailOptIn },
      select: { emailOptIn: true },
    })
    return NextResponse.json({ emailOptIn: user.emailOptIn })
  } catch (err: any) {
    console.error('[PATCH /api/auth/email-prefs]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
