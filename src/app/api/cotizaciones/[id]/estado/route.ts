import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

// PATCH /api/cotizaciones/[id]/estado - Change quotation estado
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()
    const { estado, socio } = body

    const validEstados = ['BORRADOR', 'ENVIADA', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA', 'VENCIDA']
    if (!estado || !validEstados.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const existing = await db.cotizacion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    const cotizacion = await db.cotizacion.update({
      where: { id },
      data: { estado },
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: { orderBy: { orden: 'asc' } },
      },
    })

    await registrarBitacora({
      socio: socio ?? 'Sistema',
      modulo: 'COTIZACIONES',
      accion: 'CAMBIAR_ESTADO',
      entidadId: id,
      detalle: `Cotización ${existing.numero} cambió de ${existing.estado} a ${estado}`,
    })

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error changing cotizacion estado:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
