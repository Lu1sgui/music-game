// app/api/admin/reset/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { forceReset } from '@/lib/cycle'
import { getAuth, ok, err } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request)
    if (!payload) return err('Unauthorized', 401)
    if (payload.role !== 'ADMIN') return err('Forbidden', 403)

    const newCycle = await forceReset()
    return ok({ message: 'Cycle reset successfully', newCycle })
  } catch (err: any) {
    console.error('[app/api/admin/reset/route.ts]', (err as any)?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
