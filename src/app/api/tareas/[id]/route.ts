import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(_request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const tarea = await db.tarea.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
      },
    })

    if (!tarea) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    return NextResponse.json(tarea)
  } catch (error) {
    console.error('Error getting tarea:', error)
    return NextResponse.json({ error: 'Error al obtener tarea' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()
    const { titulo, descripcion, asignadoA, prioridad, fechaLimite, estado, clienteId, socio } = body

    const existing = await db.tarea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (titulo !== undefined) data.titulo = titulo.trim()
    if (descripcion !== undefined) data.descripcion = descripcion || null
    if (asignadoA !== undefined) data.asignadoA = asignadoA
    if (prioridad !== undefined) data.prioridad = prioridad
    if (fechaLimite !== undefined) data.fechaLimite = fechaLimite ? new Date(fechaLimite) : null
    if (estado !== undefined) data.estado = estado
    if (clienteId !== undefined) data.clienteId = clienteId || null

    const tarea = await db.tarea.update({
      where: { id },
      data,
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
      },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'tareas',
      accion: 'actualizar',
      entidadId: tarea.id,
      detalle: `Tarea actualizada: ${tarea.titulo}`,
    })

    return NextResponse.json(tarea)
  } catch (error) {
    console.error('Error updating tarea:', error)
    return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio') || 'sistema'

    const existing = await db.tarea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    await db.tarea.delete({ where: { id } })

    await registrarBitacora({
      socio,
      modulo: 'tareas',
      accion: 'eliminar',
      entidadId: id,
      detalle: `Tarea eliminada: ${existing.titulo}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tarea:', error)
    return NextResponse.json({ error: 'Error al eliminar tarea' }, { status: 500 })
  }
}
