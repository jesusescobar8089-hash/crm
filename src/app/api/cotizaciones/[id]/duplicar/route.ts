import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

// POST /api/cotizaciones/[id]/duplicar - Duplicate quotation as BORRADOR
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Auto-generate new numero
    const year = new Date().getFullYear()
    const lastCot = await db.cotizacion.findFirst({
      where: { numero: { startsWith: `COT-${year}-` } },
      orderBy: { numero: 'desc' },
    })
    let nextNum = 1
    if (lastCot) {
      const parts = lastCot.numero.split('-')
      nextNum = parseInt(parts[2], 10) + 1
    }
    const numero = `COT-${year}-${String(nextNum).padStart(3, '0')}`

    const nueva = await db.cotizacion.create({
      data: {
        numero,
        clienteId: cotizacion.clienteId,
        fechaEmision: new Date(),
        fechaVencimiento: null,
        estado: 'BORRADOR',
        socio: socio ?? cotizacion.socio,
        descuento: cotizacion.descuento,
        iva: cotizacion.iva,
        observaciones: cotizacion.observaciones,
        notasInternas: cotizacion.notasInternas,
        items: {
          create: cotizacion.items.map((item, idx) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnit: item.precioUnit,
            subtotal: item.subtotal,
            orden: idx,
          })),
        },
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: { orderBy: { orden: 'asc' } },
      },
    })

    await registrarBitacora({
      socio: socio ?? cotizacion.socio,
      modulo: 'COTIZACIONES',
      accion: 'DUPLICAR',
      entidadId: nueva.id,
      detalle: `Cotización ${cotizacion.numero} duplicada como ${numero}`,
    })

    return NextResponse.json(nueva, { status: 201 })
  } catch (error) {
    console.error('Error duplicating cotizacion:', error)
    return NextResponse.json({ error: 'Error al duplicar cotización' }, { status: 500 })
  }
}
