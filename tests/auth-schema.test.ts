import { describe, expect, it } from 'vitest'
import { changePasswordSchema, loginSchema } from '@/lib/schemas/auth.schema'

describe('validación de autenticación', () => {
  it('normaliza un correo válido', () => {
    const result = loginSchema.parse({ email: ' USER@Example.COM ', password: 'secret' })
    expect(result.email).toBe('user@example.com')
  })

  it('rechaza correos inválidos y campos inesperados', () => {
    expect(loginSchema.safeParse({ email: 'no-es-email', password: 'x' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x', role: 'admin' }).success).toBe(false)
  })

  it('exige una contraseña fuerte al cambiarla', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'débil' }).success).toBe(false)
    expect(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'NuevaClave9' }).success).toBe(true)
  })
})
