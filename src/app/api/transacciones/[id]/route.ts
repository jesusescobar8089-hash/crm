import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { transaccionUpdateSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaccion = await db.transaccion.findUnique({
      where: { id },
      include: { cliente: { select: { nombre: true } } },
    })

    if (!transaccion) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    return NextResponse.json(transaccion)
  } catch (error) {
    console.error('Error getting transaccion:', error)
    return NextResponse.json({ error: 'Error al obtener transacción' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsed = transaccionUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const { tipo, categoria, descripcion, monto, socio, metodoPago, clienteId, cotizacionId, fecha } = body

    const transaccion = await db.transaccion.update({
      where: { id },
      data: {
        tipo,
        categoria,
        descripcion,
        monto: monto !== undefined ? Number(monto) : undefined,
        socio,
        metodoPago: metodoPago || null,
        clienteId: clienteId || null,
        cotizacionId: cotizacionId || null,
        fecha: fecha ? new Date(fecha) : undefined,
      },
      include: { cliente: { select: { nombre: true } } },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'finanzas',
      accion: 'actualizar_transaccion',
      entidadId: id,
      detalle: `Transacción actualizada: ${descripcion}`,
    })

    return NextResponse.json(transaccion)
  } catch (error) {
    console.error('Error updating transaccion:', error)
    return NextResponse.json({ error: 'Error al actualizar transacción' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio') || 'sistema'

    const transaccion = await db.transaccion.delete({
      where: { id },
    })

    await registrarBitacora({
      socio,
      modulo: 'finanzas',
      accion: 'eliminar_transaccion',
      entidadId: id,
      detalle: `Transacción eliminada: ${transaccion.descripcion}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaccion:', error)
    return NextResponse.json({ error: 'Error al eliminar transacción' }, { status: 500 })
  }
}
