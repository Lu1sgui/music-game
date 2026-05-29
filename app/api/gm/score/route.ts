// app/api/gm/score/route.ts
// Only the assigned GM of the current CLOSED cycle can score
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CycleStatus } from '@prisma/client'
import { getAuth, ok, err } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)

    const body = await request.json()
    const { results } = body
    // Expected: results = [{ submissionId, position, gmNotes? }, ...]

    if (!Array.isArray(results) || results.length === 0) {
      return err('results must be a non-empty array')
    }

    // Get current closed cycle
    const cycle = await prisma.weekCycle.findFirst({
      where: { status: CycleStatus.CLOSED },
      orderBy: { createdAt: 'desc' },
      include: { submissions: true },
    })

    if (!cycle) return err('No cycle is currently in scoring phase', 422)

    // Verify requester is the assigned GM
    const isAdmin = payload.role === 'ADMIN'
    const isGM = payload.role === 'GM' || cycle.gmUserId === payload.userId
    if (!isAdmin && !isGM) {
      return err('Only the assigned Game Master can score this cycle', 403)
    }

    // Validate positions
    const positions = results.map((r: { position: number }) => r.position)
    if (positions.some((p: number) => ![1, 2, 3].includes(p))) {
      return err('Positions must be 1, 2, or 3')
    }
    if (new Set(positions).size !== positions.length) {
      return err('Each position must be unique')
    }

    // Validate submission IDs belong to this cycle
    const cycleSubmissionIds = new Set(cycle.submissions.map((s) => s.id))
    for (const r of results) {
      if (!cycleSubmissionIds.has(r.submissionId)) {
        return err(`Submission ${r.submissionId} does not belong to this cycle`)
      }
    }

    // Upsert results (GM can re-score before Monday)
    const saved = await prisma.$transaction(
      results.map((r: { submissionId: number; position: number; gmNotes?: string }) => {
        const submission = cycle.submissions.find((s) => s.id === r.submissionId)!
        return prisma.cycleResult.upsert({
          where: { submissionId: r.submissionId },
          update: { position: r.position, gmNotes: r.gmNotes ?? null },
          create: {
            cycleId: cycle.id,
            submissionId: r.submissionId,
            userId: submission.userId,
            position: r.position,
            gmNotes: r.gmNotes ?? null,
          },
        })
      })
    )

    return ok({ saved, cycleId: cycle.id })
  } catch (err: any) {
    console.error('[app/api/gm/score/route.ts]', (err as any)?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
