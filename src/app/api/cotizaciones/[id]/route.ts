import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { calculateTaxIncludedTotals } from '@/lib/totals'
import { normalizeCommercialItem, type CommercialItemInput } from '@/lib/commercial-docs'
import { cotizacionUpdateSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

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

    return NextResponse.json({
      ...cotizacion,
      ...calculateTaxIncludedTotals(cotizacion.items, cotizacion.descuento, cotizacion.iva),
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
    const parsed = cotizacionUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const {
      socio,
      clienteId,
      fechaEmision,
      fechaVencimiento,
      descuento,
      iva,
      observaciones,
      notasInternas,
      moneda,
      vendedor,
      formaPago,
      tiempoEntrega,
      garantia,
      condiciones,
      aceptacionCliente,
      legalJson,
      items,
    } = body

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
    if (moneda !== undefined) updateData.moneda = moneda
    if (vendedor !== undefined) updateData.vendedor = vendedor
    if (formaPago !== undefined) updateData.formaPago = formaPago
    if (tiempoEntrega !== undefined) updateData.tiempoEntrega = tiempoEntrega
    if (garantia !== undefined) updateData.garantia = garantia
    if (condiciones !== undefined) updateData.condiciones = condiciones
    if (aceptacionCliente !== undefined) updateData.aceptacionCliente = aceptacionCliente
    if (legalJson !== undefined) updateData.legalJson = legalJson
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (notasInternas !== undefined) updateData.notasInternas = notasInternas

    if (items) {
      updateData.items = {
        create: items.map((item: CommercialItemInput, idx: number) => normalizeCommercialItem(item, idx, iva ?? existing.iva)),
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
