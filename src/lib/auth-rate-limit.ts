import { createHash } from 'node:crypto'
import { db } from './db'

const WINDOW_MS = 15 * 60 * 1000
const BLOCK_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export function authRateLimitKey(ip: string, email: string) {
  return createHash('sha256').update(`${ip.toLowerCase()}|${email.toLowerCase()}`).digest('hex')
}

async function consumeAttempt(
  key: string,
  maxAttempts: number,
  windowMs: number,
  blockMs: number,
  now = new Date(),
) {
  return db.$transaction(async (tx) => {
    const current = await tx.authRateLimit.findUnique({ where: { key } })
    if (current?.blockedUntil && current.blockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((current.blockedUntil.getTime() - now.getTime()) / 1000) }
    }

    const expired = !current || now.getTime() - current.windowStart.getTime() >= windowMs
    const count = expired ? 1 : current.count + 1
    const blockedUntil = count > maxAttempts ? new Date(now.getTime() + blockMs) : null

    await tx.authRateLimit.upsert({
      where: { key },
      create: { key, count, windowStart: now, blockedUntil },
      update: {
        count,
        windowStart: expired ? now : current.windowStart,
        blockedUntil,
      },
    })

    return {
      allowed: !blockedUntil,
      retryAfter: blockedUntil ? Math.ceil(blockMs / 1000) : 0,
    }
  })
}

export function consumeAuthAttempt(key: string, now = new Date()) {
  return consumeAttempt(key, MAX_ATTEMPTS, WINDOW_MS, BLOCK_MS, now)
}

export function consumeWriteAttempt(userId: string, now = new Date()) {
  return consumeAttempt(`write:${userId}`, 120, 60_000, 60_000, now)
}

export async function clearAuthAttempts(key: string) {
  await db.authRateLimit.deleteMany({ where: { key } })
}
