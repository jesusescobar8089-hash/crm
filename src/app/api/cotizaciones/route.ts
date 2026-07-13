import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { calculateTaxIncludedTotals } from '@/lib/totals'
import { normalizeCommercialItem, type CommercialItemInput } from '@/lib/commercial-docs'

// GET /api/cotizaciones - List all quotations with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (estado) where.estado = estado
    if (clienteId) where.clienteId = clienteId
    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { cliente: { nombre: { contains: search } } },
      ]
    }

    const cotizaciones = await db.cotizacion.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
        items: { orderBy: { orden: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = cotizaciones.map((cot) => {
      return { ...cot, ...calculateTaxIncludedTotals(cot.items, cot.descuento, cot.iva) }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching cotizaciones:', error)
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

// POST /api/cotizaciones - Create a new quotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      fechaEmision,
      fechaVencimiento,
      socio,
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

    if (!clienteId || !fechaEmision || !socio || !items?.length) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Auto-generate numero: COT-YYYY-NNN
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

    const cotizacion = await db.cotizacion.create({
      data: {
        numero,
        clienteId,
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        socio,
        descuento: descuento ?? 0,
        iva: iva ?? 0,
        moneda: moneda ?? 'COP',
        vendedor: vendedor ?? null,
        formaPago: formaPago ?? null,
        tiempoEntrega: tiempoEntrega ?? null,
        garantia: garantia ?? null,
        condiciones: condiciones ?? null,
        aceptacionCliente: aceptacionCliente ?? null,
        legalJson: legalJson ?? null,
        observaciones: observaciones ?? null,
        notasInternas: notasInternas ?? null,
        items: {
          create: items.map((item: CommercialItemInput, idx: number) => normalizeCommercialItem(item, idx, iva ?? 0)),
        },
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        items: true,
      },
    })

    await registrarBitacora({
      socio,
      modulo: 'COTIZACIONES',
      accion: 'CREAR',
      entidadId: cotizacion.id,
      detalle: `Cotización ${numero} creada para ${cotizacion.cliente.nombre}`,
    })

    return NextResponse.json(cotizacion, { status: 201 })
  } catch (error) {
    console.error('Error creating cotizacion:', error)
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
