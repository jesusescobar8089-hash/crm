import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { registrarBitacora } from '@/lib/bitacora'
import { AuthenticationError, requireSession } from '@/lib/auth-guard'
import { changePasswordSchema } from '@/lib/schemas/auth.schema'
import { clearSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request)
    const parsed = changePasswordSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const { currentPassword, newPassword } = parsed.data
    const user = await db.usuario.findUnique({ where: { id: session.sub } })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (!await verifyPassword(currentPassword, user.password)) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 })
    }

    await db.usuario.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(newPassword),
        sessionVersion: { increment: 1 },
      },
    })

    await registrarBitacora({
      socio: user.nombre,
      modulo: 'usuarios',
      accion: 'CAMBIO_PASSWORD',
      entidadId: user.id,
      detalle: 'Cambio de contraseña e invalidación de sesiones',
    })

    const response = NextResponse.json({
      message: 'Contraseña actualizada. Inicia sesión de nuevo.',
    })
    clearSessionCookie(response)
    return response
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 })
  }
}
