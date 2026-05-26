// instrumentation.ts
// Next.js runs this file exactly once when the server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCron } = await import('@/lib/cron')
    initCron()
  }
}
