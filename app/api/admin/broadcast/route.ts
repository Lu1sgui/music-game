// app/api/admin/broadcast/route.ts
// Admin-only: send a message to all active players (in-app, optionally email).
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenPayload } from '@/lib/auth'
import { sendEmail, broadcastEmail } from '@/lib/email'
import { notifyAllActive } from '@/lib/notify'

export async function POST(request: NextRequest) {
  try {
    const payload = getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { message, email, subject } = await request.json()
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }
    const text = message.trim()

    // In-app to everyone active
    await notifyAllActive(`📢 ${text}`)

    // Optional email — only to opted-in players (conservative scope)
    let emailed = 0
    if (email) {
      const subj = (typeof subject === 'string' && subject.trim()) || 'A message from Weekly Beats'
      const recipients = await prisma.user.findMany({
        where: { isActive: true, emailOptIn: true },
        select: { username: true, email: true },
      })
      for (const r of recipients) {
        const ok = await sendEmail({
          to: r.email,
          subject: `📢 ${subj}`,
          html: broadcastEmail(r.username, subj, text),
        })
        if (ok) emailed++
      }
    }

    return NextResponse.json({ message: 'Broadcast sent', emailed })
  } catch (err: any) {
    console.error('[POST /api/admin/broadcast]', err?.message ?? err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
