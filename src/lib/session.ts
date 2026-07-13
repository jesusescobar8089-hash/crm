import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { db } from './db'

export const SESSION_COOKIE = 'agroeve_session'
export const SESSION_MAX_AGE_SECONDS = Number(process.env.SESSION_MAX_AGE_SECONDS ?? 86_400)
export const SESSION_REFRESH_WINDOW_SECONDS = 7_200

export interface SessionPayload {
  sub: string
  nombre: string
  email: string
  tema: string
  sv: number
  iat: number
  exp: number
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres')
  }
  return secret
}

function sign(encodedPayload: string) {
  return createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url')
}

export function createSessionToken(
  user: { id: string; nombre: string; email: string; tema: string; sessionVersion: number },
  now = Math.floor(Date.now() / 1000),
) {
  const payload: SessionPayload = {
    sub: user.id,
    nombre: user.nombre,
    email: user.email,
    tema: user.tema,
    sv: user.sessionVersion,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function verifySessionToken(token: string | undefined, now = Math.floor(Date.now() / 1000)) {
  if (!token) return null
  const [encodedPayload, signature, extra] = token.split('.')
  if (!encodedPayload || !signature || extra) return null

  const expected = Buffer.from(sign(encodedPayload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.sub || !payload.email || !Number.isInteger(payload.sv) || payload.exp <= now) return null
    return payload
  } catch {
    return null
  }
}

export async function getSession(request: NextRequest, validateVersion = true) {
  const payload = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!payload || !validateVersion) return payload

  const user = await db.usuario.findUnique({
    where: { id: payload.sub },
    select: { activo: true, sessionVersion: true },
  })
  return user?.activo && user.sessionVersion === payload.sv ? payload : null
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}
