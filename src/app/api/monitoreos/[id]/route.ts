import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { monitoreoUpdateSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

// GET /api/monitoreos/[id] - Get monitoring with mantenimientos and cliente
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(_request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const monitoreo = await db.monitoreo.findUnique({
      where: { id },
      include: {
        cliente: true,
        mantenimientos: { orderBy: { fecha: 'desc' } },
      },
    })

    if (!monitoreo) {
      return NextResponse.json({ error: 'Monitoreo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(monitoreo)
  } catch (error) {
    console.error('Error fetching monitoreo:', error)
    return NextResponse.json({ error: 'Error al obtener monitoreo' }, { status: 500 })
  }
}

// PATCH /api/monitoreos/[id] - Update monitoring
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const parsed = monitoreoUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const { socio, clienteId, kitId, fechaInstalacion, frecuenciaMantenimiento, estado, observaciones } = body

    const existing = await db.monitoreo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Monitoreo no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (clienteId !== undefined) updateData.clienteId = clienteId
    if (kitId !== undefined) updateData.kitId = kitId
    if (fechaInstalacion !== undefined) updateData.fechaInstalacion = new Date(fechaInstalacion)
    if (frecuenciaMantenimiento !== undefined) updateData.frecuenciaMantenimiento = frecuenciaMantenimiento
    if (estado !== undefined) updateData.estado = estado
    if (observaciones !== undefined) updateData.observaciones = observaciones

    // If frecuencia changed, recalculate proximoMantenimiento
    if (frecuenciaMantenimiento !== undefined && existing.ultimoMantenimiento) {
      const proximo = new Date(existing.ultimoMantenimiento)
      proximo.setDate(proximo.getDate() + frecuenciaMantenimiento)
      updateData.proximoMantenimiento = proximo
    }

    const monitoreo = await db.monitoreo.update({
      where: { id },
      data: updateData,
      include: {
        cliente: { select: { id: true, nombre: true } },
        mantenimientos: { orderBy: { fecha: 'desc' } },
      },
    })

    await registrarBitacora({
      socio: socio ?? 'Sistema',
      modulo: 'MONITOREOS',
      accion: 'EDITAR',
      entidadId: id,
      detalle: `Monitoreo de ${monitoreo.cliente.nombre} editado`,
    })

    return NextResponse.json(monitoreo)
  } catch (error) {
    console.error('Error updating monitoreo:', error)
    return NextResponse.json({ error: 'Error al actualizar monitoreo' }, { status: 500 })
  }
}

// DELETE /api/monitoreos/[id] - Delete monitoring
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio') ?? 'Sistema'

    const existing = await db.monitoreo.findUnique({
      where: { id },
      include: { cliente: { select: { nombre: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Monitoreo no encontrado' }, { status: 404 })
    }

    await db.mantenimiento.deleteMany({ where: { monitoreoId: id } })
    await db.monitoreo.delete({ where: { id } })

    await registrarBitacora({
      socio,
      modulo: 'MONITOREOS',
      accion: 'ELIMINAR',
      entidadId: id,
      detalle: `Monitoreo de ${existing.cliente.nombre} eliminado`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting monitoreo:', error)
    return NextResponse.json({ error: 'Error al eliminar monitoreo' }, { status: 500 })
  }
}
