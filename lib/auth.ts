// lib/auth.ts
// JWT and password utilities used by API routes and middleware

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET!
const SALT_ROUNDS = 12

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// ─── Token Payload ────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: number
  username: string
  role: Role
}

// ─── Password helpers ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash)
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

// Extract token from Authorization header ("Bearer <token>") or cookie string
export function extractToken(
  authHeader?: string | null,
  cookieHeader?: string | null
): string | null {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
    return match ? match[1] : null
  }
  return null
}

// Parse and verify token from an incoming Request — returns null if invalid
export function getTokenPayload(request: Request): TokenPayload | null {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  const token = extractToken(authHeader, cookieHeader)
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

// ─── Role guards ──────────────────────────────────────────────────────────────

export function requireAuth(payload: TokenPayload | null): asserts payload is TokenPayload {
  if (!payload) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export function requireRole(payload: TokenPayload | null, ...roles: Role[]): asserts payload is TokenPayload {
  requireAuth(payload)
  if (!roles.includes(payload.role)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
