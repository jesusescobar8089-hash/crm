import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

export async function GET(request: NextRequest) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    const where: Record<string, unknown> = {}
    if (clienteId) {
      where.clienteId = clienteId
    }

    const interacciones = await db.interaccion.findMany({
      where,
      include: { cliente: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(interacciones)
  } catch (error) {
    console.error('Error al obtener interacciones:', error)
    return NextResponse.json({ error: 'Error al obtener interacciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const {
      clienteId,
      tipo,
      descripcion,
      fecha,
      socio,
      proximaAccion,
      fechaProxima,
    } = body

    if (!clienteId || !tipo || !descripcion || !fecha || !socio) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 })
    }

    const interaccion = await db.interaccion.create({
      data: {
        clienteId,
        tipo,
        descripcion,
        fecha: new Date(fecha),
        socio,
        proximaAccion: proximaAccion || null,
        fechaProxima: fechaProxima ? new Date(fechaProxima) : null,
      },
    })

    await registrarBitacora({
      socio,
      modulo: 'interacciones',
      accion: 'crear',
      entidadId: interaccion.id,
      detalle: `Interacción registrada: ${tipo} - ${descripcion.slice(0, 50)}`,
    })

    return NextResponse.json(interaccion, { status: 201 })
  } catch (error) {
    console.error('Error al crear interacción:', error)
    return NextResponse.json({ error: 'Error al crear interacción' }, { status: 500 })
  }
}
