import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { calculateTaxIncludedTotals } from '@/lib/totals'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()
    const { estado, socio, fechaPago } = body

    const existing = await db.factura.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (!estado || !socio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const validStates = ['BORRADOR', 'PENDIENTE', 'EMITIDA', 'PAGADA', 'VENCIDA', 'ANULADA']
    if (!validStates.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { estado }
    if (fechaPago) {
      updateData.fechaPago = new Date(fechaPago)
    }

    await db.factura.update({
      where: { id },
      data: updateData,
    })

    // If factura is paid and linked to a cotizacion, auto-create an income transaction
    if (estado === 'PAGADA' && existing.cotizacionId) {
      const total = await db.facturaItem.findMany({
        where: { facturaId: id },
      }).then((items) => {
        return calculateTaxIncludedTotals(items, existing.descuento, existing.iva).total
      })

      await db.transaccion.create({
        data: {
          tipo: 'INGRESO',
          categoria: 'venta_kit',
          descripcion: `Pago factura ${existing.numero}`,
          monto: total,
          socio: socio,
          metodoPago: existing.metodoPago || 'transferencia',
          clienteId: existing.clienteId,
          cotizacionId: existing.cotizacionId,
          fecha: new Date(),
        },
      })
    }

    await registrarBitacora({
      socio,
      modulo: 'FACTURAS',
      accion: 'cambiar_estado',
      entidadId: id,
      detalle: `Factura ${existing.numero} cambiada a ${estado}`,
    })

    return NextResponse.json({ success: true, estado })
  } catch (error) {
    console.error('Error changing factura estado:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
