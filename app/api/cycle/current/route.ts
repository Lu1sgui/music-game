// app/api/cycle/current/route.ts
// Returns the current cycle with different data depending on status:
// PENDING/OPEN/CLOSED → theme + count (submissions anonymous)
// REVEALED/ARCHIVED   → full results + all submissions revealed

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus, ChipEffect, ActivationStatus } from '@prisma/client'
import { getAuth, ok } from '@/lib/api'

export async function GET(request: NextRequest) {
  const payload = getAuth(request)

  // Get current active cycle (any non-archived status)
  const cycle = await prisma.weekCycle.findFirst({
    where: { status: { not: CycleStatus.ARCHIVED } },
    orderBy: { createdAt: 'desc' },
    include: {
      gm: { select: { id: true, username: true } },
      _count: { select: { submissions: true } },
    },
  })

  if (!cycle) {
    // No active cycle — return last archived for reference
    const last = await prisma.weekCycle.findFirst({
      where: { status: CycleStatus.ARCHIVED },
      orderBy: { createdAt: 'desc' },
      include: {
        cycleResults: {
          orderBy: { position: 'asc' },
          include: {
            submission: { include: { user: { select: { username: true } } } },
          },
        },
      },
    })
    return ok({ cycle: null, previousCycle: last })
  }

  // Base response — always safe to return
  const base = {
    id: cycle.id,
    weekNumber: cycle.weekNumber,
    year: cycle.year,
    theme: cycle.theme,
    themeDescription: cycle.themeDescription,
    status: cycle.status,
    opensAt: cycle.opensAt,
    closesAt: cycle.closesAt,
    revealsAt: cycle.revealsAt,
    gm: cycle.gm,
    submissionCount: cycle._count.submissions,
  }

  // Add authenticated user context
  let userContext = {}
  if (payload) {
    const mySubmission = await prisma.submission.findUnique({
      where: { userId_cycleId: { userId: payload.userId, cycleId: cycle.id } },
    })

    // Check if user has Flash chip active this cycle
    const flashActive = await prisma.chipActivation.findFirst({
      where: {
        userId: payload.userId,
        cycleId: cycle.id,
        status: ActivationStatus.RESOLVED,
        chip: { effectType: ChipEffect.FLASH },
      },
    })

    // Check active Leech Seed draining from this user
    const leechSeedsOnMe = await prisma.chipActivation.findMany({
      where: {
        targetUserId: payload.userId,
        status: ActivationStatus.RESOLVED,
        chip: { effectType: ChipEffect.LEECH_SEED },
      },
      include: { user: { select: { username: true } } },
    })

    userContext = {
      mySubmission,
      flashActive: !!flashActive,
      leechSeedsOnMe: leechSeedsOnMe.map((s) => ({
        from: s.user.username,
        data: s.effectData,
      })),
    }

    // Flash reveals all submissions for this user
    if (flashActive && cycle.status === CycleStatus.OPEN) {
      const allSubmissions = await prisma.submission.findMany({
        where: { cycleId: cycle.id },
        include: { user: { select: { username: true } } },
      })
      return ok({ ...base, ...userContext, submissions: allSubmissions })
    }
  }

  // REVEALED or ARCHIVED — return full public results
  if (
    cycle.status === CycleStatus.REVEALED ||
    cycle.status === CycleStatus.ARCHIVED
  ) {
    const [results, submissions, activations] = await Promise.all([
      prisma.cycleResult.findMany({
        where: { cycleId: cycle.id },
        orderBy: { position: 'asc' },
        include: {
          submission: { include: { user: { select: { username: true } } } },
        },
      }),
      prisma.submission.findMany({
        where: { cycleId: cycle.id },
        include: { user: { select: { username: true } } },
      }),
      // Smokescreen — hide identity for users who activated it
      prisma.chipActivation.findMany({
        where: {
          cycleId: cycle.id,
          status: ActivationStatus.RESOLVED,
          chip: { effectType: ChipEffect.SMOKESCREEN },
        },
        select: { userId: true },
      }),
    ])

    const smokescreenedIds = new Set(activations.map((a) => a.userId))

    // Mask identity for Smokescreen users
    const maskedResults = results.map((r) => ({
      ...r,
      submission: {
        ...r.submission,
        user: smokescreenedIds.has(r.submission.userId)
          ? { username: '???' }
          : r.submission.user,
      },
    }))

    const maskedSubmissions = submissions.map((s) => ({
      ...s,
      user: smokescreenedIds.has(s.userId) ? { username: '???' } : s.user,
    }))

    return ok({ ...base, ...userContext, results: maskedResults, submissions: maskedSubmissions })
  }

  return ok({ ...base, ...userContext })
}
