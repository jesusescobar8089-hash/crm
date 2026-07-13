import bcrypt from 'bcryptjs'
import { db } from './db'

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.usuario.findUnique({ where: { email } })
  if (!user || !user.activo) return null

  const valid = await verifyPassword(password, user.password)
  if (!valid) return null

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    tema: user.tema,
    sessionVersion: user.sessionVersion,
  }
}

export interface SessionUser {
  id: string
  nombre: string
  email: string
  tema: string
  sessionVersion: number
}
