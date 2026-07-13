import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { calculateTaxIncludedTotals } from '@/lib/totals'
import { normalizeCommercialItem, type CommercialItemInput } from '@/lib/commercial-docs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const factura = await db.factura.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: { orderBy: { orden: 'asc' } },
        cotizacion: { select: { id: true, numero: true } },
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      ...factura,
      ...calculateTaxIncludedTotals(factura.items, factura.descuento, factura.iva),
    })
  } catch (error) {
    console.error('Error fetching factura:', error)
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      socio,
      clienteId,
      fechaEmision,
      fechaVencimiento,
      fechaPago,
      descuento,
      iva,
      observaciones,
      notasInternas,
      metodoPago,
      formaPago,
      moneda,
      vendedor,
      garantia,
      condiciones,
      legalJson,
      items,
    } = body

    const existing = await db.factura.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (existing.estado !== 'BORRADOR') {
      return NextResponse.json(
        { error: 'Solo se pueden editar facturas en estado BORRADOR' },
        { status: 400 }
      )
    }

    if (items) {
      await db.facturaItem.deleteMany({ where: { facturaId: id } })
    }

    const updateData: Record<string, unknown> = {}
    if (clienteId !== undefined) updateData.clienteId = clienteId
    if (fechaEmision !== undefined) updateData.fechaEmision = new Date(fechaEmision)
    if (fechaVencimiento !== undefined) updateData.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null
    if (fechaPago !== undefined) updateData.fechaPago = fechaPago ? new Date(fechaPago) : null
    if (descuento !== undefined) updateData.descuento = descuento
    if (iva !== undefined) updateData.iva = iva
    if (moneda !== undefined) updateData.moneda = moneda
    if (vendedor !== undefined) updateData.vendedor = vendedor
    if (formaPago !== undefined) updateData.formaPago = formaPago
    if (garantia !== undefined) updateData.garantia = garantia
    if (condiciones !== undefined) updateData.condiciones = condiciones
    if (legalJson !== undefined) updateData.legalJson = legalJson
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (notasInternas !== undefined) updateData.notasInternas = notasInternas
    if (metodoPago !== undefined) updateData.metodoPago = metodoPago

    if (items) {
      updateData.items = {
        create: items.map((item: CommercialItemInput, idx: number) => normalizeCommercialItem(item, idx, iva ?? existing.iva)),
      }
    }

    const factura = await db.factura.update({
      where: { id },
      data: updateData,
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: { orderBy: { orden: 'asc' } },
      },
    })

    await registrarBitacora({
      socio: socio ?? 'Sistema',
      modulo: 'FACTURAS',
      accion: 'EDITAR',
      entidadId: id,
      detalle: `Factura ${existing.numero} editada`,
    })

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error updating factura:', error)
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio') ?? 'Sistema'

    const existing = await db.factura.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    await db.facturaItem.deleteMany({ where: { facturaId: id } })
    await db.factura.delete({ where: { id } })

    await registrarBitacora({
      socio,
      modulo: 'FACTURAS',
      accion: 'ELIMINAR',
      entidadId: id,
      detalle: `Factura ${existing.numero} eliminada`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting factura:', error)
    return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 })
  }
}
