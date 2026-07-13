import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { authRateLimitKey, clearAuthAttempts, consumeAuthAttempt } from '@/lib/auth-rate-limit'
import { loginSchema } from '@/lib/schemas/auth.schema'
import { clearSessionCookie, createSessionToken, getSession, setSessionCookie } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: session.sub,
      nombre: session.nombre,
      email: session.email,
      tema: session.tema,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de acceso inválidos', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const { email, password } = parsed.data
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'
    const limitKey = authRateLimitKey(ip, email)
    const rateLimit = await consumeAuthAttempt(limitKey)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta nuevamente más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }

    const user = await authenticateUser(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    await clearAuthAttempts(limitKey)
    const response = NextResponse.json({
      user: { id: user.id, nombre: user.nombre, email: user.email, tema: user.tema },
    })
    setSessionCookie(response, createSessionToken(user))
    return response
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Sesión cerrada' })
  clearSessionCookie(response)
  return response
}
