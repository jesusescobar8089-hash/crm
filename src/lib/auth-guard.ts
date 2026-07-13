import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from './session'

export class AuthenticationError extends Error {
  constructor() {
    super('No autenticado')
    this.name = 'AuthenticationError'
  }
}

export async function requireSession(request: NextRequest) {
  const session = await getSession(request)
  if (!session) throw new AuthenticationError()
  return session
}

export async function rejectUnauthenticated(request: NextRequest) {
  const session = await getSession(request)
  return session ? null : NextResponse.json({ error: 'No autenticado' }, { status: 401 })
}
