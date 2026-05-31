// app/api/cycle/current/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus, ChipEffect, ActivationStatus } from '@prisma/client'
import { getTokenPayload } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)

    const cycle = await prisma.weekCycle.findFirst({
      where: { status: { not: CycleStatus.ARCHIVED } },
      orderBy: { createdAt: 'desc' },
      include: { gm: { select: { id: true, username: true } }, _count: { select: { submissions: true } } },
    })

    if (!cycle) {
      const last = await prisma.weekCycle.findFirst({
        where: { status: CycleStatus.ARCHIVED }, orderBy: { createdAt: 'desc' },
        include: { cycleResults: { orderBy: { position: 'asc' }, include: { submission: { include: { user: { select: { username: true } } } } } } },
      })
      return NextResponse.json({ cycle: null, previousCycle: last })
    }

    const base = {
      id: cycle.id, weekNumber: cycle.weekNumber, year: cycle.year,
      theme: cycle.theme, themeDescription: cycle.themeDescription,
      status: cycle.status, opensAt: cycle.opensAt, closesAt: cycle.closesAt,
      revealsAt: cycle.revealsAt, gm: cycle.gm, submissionCount: cycle._count.submissions,
    }

    const isAdmin = payload?.role === 'ADMIN'
    const isGmRole = payload?.role === 'GM'
    const isCurrentGM = !!(payload && cycle.gmUserId && payload.userId === cycle.gmUserId)

    // Admins and ANY GM-role user see all submissions (for scoring and visibility)
    if (isAdmin || isGmRole || isCurrentGM) {
      const submissions = await prisma.submission.findMany({
        where: { cycleId: cycle.id },
        include: { user: { select: { username: true, avatarSeed: true, avatarStyle: true } } },
        orderBy: { submittedAt: 'asc' },
      })
      const mySubmission = payload ? await prisma.submission.findFirst({
        where: { userId: payload.userId, cycleId: cycle.id },
        orderBy: { slot: 'asc' },
      }) : null
      return NextResponse.json({ ...base, submissions, mySubmission })
    }

    // Player context
    let userContext = {}
    if (payload) {
      const mySubmission = await prisma.submission.findFirst({
        where: { userId: payload.userId, cycleId: cycle.id },
        orderBy: { slot: 'asc' },
      })
      // Get ALL chip activations for this user this cycle
      const myActivation = await prisma.chipActivation.findFirst({
        where: { userId: payload.userId, cycleId: cycle.id },
        include: {
          chip: true,
          targetUser: { select: { username: true } },
        },
        orderBy: { activatedAt: 'desc' },
      })
      const flashActive = myActivation?.chip?.effectType === ChipEffect.FLASH &&
        myActivation?.status === ActivationStatus.RESOLVED
      userContext = { mySubmission, flashActive: !!flashActive, myActivation }

      if (flashActive && cycle.status === CycleStatus.OPEN) {
        const allSubs = await prisma.submission.findMany({
          where: { cycleId: cycle.id }, include: { user: { select: { username: true } } },
        })
        return NextResponse.json({ ...base, ...userContext, submissions: allSubs })
      }
    }

    // Public revealed/archived
    if (cycle.status === CycleStatus.REVEALED || cycle.status === CycleStatus.ARCHIVED) {
      const [results, submissions, smokescreenActs] = await Promise.all([
        prisma.cycleResult.findMany({ where: { cycleId: cycle.id }, orderBy: { position: 'asc' }, include: { submission: { include: { user: { select: { username: true } } } } } }),
        prisma.submission.findMany({ where: { cycleId: cycle.id }, include: { user: { select: { username: true } } } }),
        prisma.chipActivation.findMany({ where: { cycleId: cycle.id, status: ActivationStatus.RESOLVED, chip: { effectType: ChipEffect.SMOKESCREEN } }, select: { userId: true } }),
      ])
      const ids = new Set(smokescreenActs.map(a => a.userId))
      return NextResponse.json({
        ...base, ...userContext,
        results: results.map(r => ({ ...r, submission: { ...r.submission, user: ids.has(r.submission.userId) ? { username: '???' } : r.submission.user } })),
        submissions: submissions.map(s => ({ ...s, user: ids.has(s.userId) ? { username: '???' } : s.user })),
      })
    }

    return NextResponse.json({ ...base, ...userContext })
  } catch (err: any) {
    console.error('[GET /api/cycle/current]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
