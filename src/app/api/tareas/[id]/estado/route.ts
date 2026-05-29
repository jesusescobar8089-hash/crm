import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import type { EstadoTarea } from '@/types'

const VALID_ESTADOS: EstadoTarea[] = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { estado, socio } = body

    if (!estado || !VALID_ESTADOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const existing = await db.tarea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const tarea = await db.tarea.update({
      where: { id },
      data: { estado },
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
      },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'tareas',
      accion: 'cambiar_estado',
      entidadId: tarea.id,
      detalle: `Tarea "${tarea.titulo}" cambió de ${existing.estado} a ${estado}`,
    })

    return NextResponse.json(tarea)
  } catch (error) {
    console.error('Error changing tarea estado:', error)
    return NextResponse.json({ error: 'Error al cambiar estado de tarea' }, { status: 500 })
  }
}
