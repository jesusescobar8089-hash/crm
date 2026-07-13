import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/lib/session'

beforeAll(() => {
  process.env.SESSION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
})

const user = {
  id: 'user-1',
  nombre: 'Usuario Seguro',
  email: 'seguro@example.com',
  tema: 'dark',
  sessionVersion: 3,
}

describe('sesiones firmadas', () => {
  it('crea y valida un token vigente', () => {
    const token = createSessionToken(user, 1_000)
    expect(verifySessionToken(token, 1_001)).toMatchObject({ sub: user.id, sv: 3 })
  })

  it('rechaza un token alterado', () => {
    const token = createSessionToken(user, 1_000)
    expect(verifySessionToken(`${token}x`, 1_001)).toBeNull()
  })

  it('rechaza un token vencido', () => {
    const token = createSessionToken(user, 1_000)
    expect(verifySessionToken(token, 1_000 + 86_401)).toBeNull()
  })
})
