// app/api/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus, ChipEffect, ActivationStatus } from '@prisma/client'
import { getAuth, ok, err, extractPlatformInfo } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)

    const body = await request.json()
    const { songTitle, songArtist, url } = body

    if (!songTitle || !songArtist || !url) {
      return err('songTitle, songArtist and url are required')
    }

    // Validate URL and detect platform
    const platformInfo = extractPlatformInfo(url)
    if (!platformInfo) {
      return err('URL must be a valid Spotify track or YouTube video link')
    }

    // Get current open cycle
    const cycle = await prisma.weekCycle.findFirst({
      where: { status: CycleStatus.OPEN },
      orderBy: { createdAt: 'desc' },
    })

    if (!cycle) return err('No cycle is currently open for submissions', 422)

    // Check if user already submitted this cycle
    const existing = await prisma.submission.findUnique({
      where: { userId_cycleId: { userId: payload.userId, cycleId: cycle.id } },
    })

    if (existing) {
      // Double Team chip allows a second submission
      const doubleTeam = await prisma.chipActivation.findFirst({
        where: {
          userId: payload.userId,
          cycleId: cycle.id,
          status: ActivationStatus.RESOLVED,
          chip: { effectType: ChipEffect.DOUBLE_TEAM },
        },
      })

      if (!doubleTeam) {
        return err('You have already submitted a song this week', 409)
      }

      // Count their submissions — Double Team allows max 2
      const submissionCount = await prisma.submission.count({
        where: { userId: payload.userId, cycleId: cycle.id },
      })
      if (submissionCount >= 2) {
        return err('Double Team allows a maximum of 2 submissions', 409)
      }
    }

    const submission = await prisma.submission.create({
      data: {
        userId: payload.userId,
        cycleId: cycle.id,
        songTitle,
        songArtist,
        platform: platformInfo.platform,
        url,
        platformTrackId: platformInfo.platformTrackId,
      },
    })

    return ok(submission, 201)
  } catch (err: any) {
    console.error('[app/api/submissions/route.ts]', (err as any)?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
