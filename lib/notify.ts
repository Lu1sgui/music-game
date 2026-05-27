// lib/notify.ts
import { prisma } from './prisma'

export async function notifyUser(userId: number, message: string): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, message } })
  } catch (err) {
    console.warn('[notify] Failed:', err)
  }
}
