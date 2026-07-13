import { NextRequest, NextResponse } from 'next/server'
import {
  clearSessionCookie,
  createSessionToken,
  getSession,
  SESSION_REFRESH_WINDOW_SECONDS,
  setSessionCookie,
} from '@/lib/session'
import { consumeWriteAttempt } from '@/lib/auth-rate-limit'

const publicApiPaths = new Set(['/api/auth', '/api/health'])

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (publicApiPaths.has(pathname)) return NextResponse.next()

  const session = await getSession(request)
  if (!session) {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      clearSessionCookie(response)
      return response
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    const response = NextResponse.redirect(loginUrl)
    clearSessionCookie(response)
    return response
  }

  const response = NextResponse.next()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const writeLimit = await consumeWriteAttempt(session.sub)
    if (!writeLimit.allowed) {
      return NextResponse.json(
        { error: 'Límite de escritura excedido' },
        { status: 429, headers: { 'Retry-After': String(writeLimit.retryAfter) } },
      )
    }
  }

  const now = Math.floor(Date.now() / 1000)
  if (session.exp - now <= SESSION_REFRESH_WINDOW_SECONDS) {
    setSessionCookie(response, createSessionToken({
      id: session.sub,
      nombre: session.nombre,
      email: session.email,
      tema: session.tema,
      sessionVersion: session.sv,
    }, now))
  }
  return response
}

export const config = {
  matcher: [
    '/api/:path*', '/panel/:path*', '/clientes/:path*', '/cotizaciones/:path*',
    '/facturas/:path*', '/monitoreos/:path*', '/inventario/:path*', '/finanzas/:path*',
    '/documentos/:path*', '/tareas/:path*', '/bitacora/:path*', '/configuracion/:path*',
  ],
}
