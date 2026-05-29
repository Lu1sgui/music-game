// app/api/gm/theme/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getAuth, ok, err } from '@/lib/api'

export async function PATCH(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)

    const body = await request.json()
    const { theme, themeDescription } = body

    if (!theme?.trim()) return err('theme is required')

    // Theme can be set during PENDING or OPEN
    const cycle = await prisma.weekCycle.findFirst({
      where: { status: { in: [CycleStatus.PENDING, CycleStatus.OPEN] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!cycle) return err('No cycle available for theme update', 422)

    const isAdmin = payload.role === 'ADMIN'
    const isGM = payload.role === 'GM' || cycle.gmUserId === payload.userId
    if (!isAdmin && !isGM) {
      return err('Only the assigned Game Master can set the theme', 403)
    }

    const updated = await prisma.weekCycle.update({
      where: { id: cycle.id },
      data: { theme: theme.trim(), themeDescription: themeDescription?.trim() ?? null },
    })

    return ok(updated)
  } catch (err: any) {
    console.error('[app/api/gm/theme/route.ts]', (err as any)?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
