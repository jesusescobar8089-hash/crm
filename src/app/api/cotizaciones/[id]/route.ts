import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

// GET /api/cotizaciones/[id] - Get quotation with cliente and items
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cotizacion = await db.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: { orderBy: { orden: 'asc' } },
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Calculate totals
    const subtotalGeneral = cotizacion.items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentoMonto = subtotalGeneral * (cotizacion.descuento / 100)
    const subtotalConDescuento = subtotalGeneral - descuentoMonto
    const ivaMonto = subtotalConDescuento * (cotizacion.iva / 100)
    const total = subtotalConDescuento + ivaMonto

    return NextResponse.json({
      ...cotizacion,
      subtotalGeneral,
      descuentoMonto,
      subtotalConDescuento,
      ivaMonto,
      total,
    })
  } catch (error) {
    console.error('Error fetching cotizacion:', error)
    return NextResponse.json({ error: 'Error al obtener cotización' }, { status: 500 })
  }
}

// PATCH /api/cotizaciones/[id] - Update quotation (only if BORRADOR)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { socio, clienteId, fechaEmision, fechaVencimiento, descuento, iva, observaciones, notasInternas, items } = body

    const existing = await db.cotizacion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    if (existing.estado !== 'BORRADOR') {
      return NextResponse.json(
        { error: 'Solo se pueden editar cotizaciones en estado BORRADOR' },
        { status: 400 }
      )
    }

    // If items are provided, delete existing and recreate
    if (items) {
      await db.cotizacionItem.deleteMany({ where: { cotizacionId: id } })
    }

    const updateData: Record<string, unknown> = {}
    if (clienteId !== undefined) updateData.clienteId = clienteId
    if (fechaEmision !== undefined) updateData.fechaEmision = new Date(fechaEmision)
    if (fechaVencimiento !== undefined) updateData.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null
    if (descuento !== undefined) updateData.descuento = descuento
    if (iva !== undefined) updateData.iva = iva
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (notasInternas !== undefined) updateData.notasInternas = notasInternas

    if (items) {
      updateData.items = {
        create: items.map((item: { descripcion: string; cantidad: number; precioUnit: number }, idx: number) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnit: item.precioUnit,
          subtotal: item.cantidad * item.precioUnit,
          orden: idx,
        })),
      }
    }

    const cotizacion = await db.cotizacion.update({
      where: { id },
      data: updateData,
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: { orderBy: { orden: 'asc' } },
      },
    })

    await registrarBitacora({
      socio: socio ?? 'Sistema',
      modulo: 'COTIZACIONES',
      accion: 'EDITAR',
      entidadId: id,
      detalle: `Cotización ${existing.numero} editada`,
    })

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error updating cotizacion:', error)
    return NextResponse.json({ error: 'Error al actualizar cotización' }, { status: 500 })
  }
}

// DELETE /api/cotizaciones/[id] - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio') ?? 'Sistema'

    const existing = await db.cotizacion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    await db.cotizacionItem.deleteMany({ where: { cotizacionId: id } })
    await db.cotizacion.delete({ where: { id } })

    await registrarBitacora({
      socio,
      modulo: 'COTIZACIONES',
      accion: 'ELIMINAR',
      entidadId: id,
      detalle: `Cotización ${existing.numero} eliminada`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cotizacion:', error)
    return NextResponse.json({ error: 'Error al eliminar cotización' }, { status: 500 })
  }
}
