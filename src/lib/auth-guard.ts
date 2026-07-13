import type { NextRequest } from 'next/server'
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
