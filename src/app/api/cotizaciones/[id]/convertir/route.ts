import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { calculateTaxIncludedTotals } from '@/lib/totals'

// POST /api/cotizaciones/[id]/convertir - Convert ACEPTADA quotation to INGRESO transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()
    const { socio } = body

    const cotizacion = await db.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: true,
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    if (cotizacion.estado !== 'ACEPTADA') {
      return NextResponse.json(
        { error: 'Solo se pueden convertir cotizaciones en estado ACEPTADA' },
        { status: 400 }
      )
    }

    const { total } = calculateTaxIncludedTotals(cotizacion.items, cotizacion.descuento, cotizacion.iva)

    // Create INGRESO transaction
    const transaccion = await db.transaccion.create({
      data: {
        tipo: 'INGRESO',
        categoria: 'VENTA',
        descripcion: `Ingreso desde cotización ${cotizacion.numero} - ${cotizacion.cliente.nombre}`,
        monto: total,
        socio: socio ?? cotizacion.socio,
        metodoPago: 'PENDIENTE',
        clienteId: cotizacion.clienteId,
        cotizacionId: cotizacion.id,
        fecha: new Date(),
      },
    })

    await registrarBitacora({
      socio: socio ?? cotizacion.socio,
      modulo: 'COTIZACIONES',
      accion: 'CONVERTIR_INGRESO',
      entidadId: id,
      detalle: `Cotización ${cotizacion.numero} convertida en ingreso por ${total}`,
    })

    return NextResponse.json(transaccion, { status: 201 })
  } catch (error) {
    console.error('Error converting cotizacion:', error)
    return NextResponse.json({ error: 'Error al convertir cotización en ingreso' }, { status: 500 })
  }
}
