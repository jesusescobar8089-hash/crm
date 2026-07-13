import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { calculateTaxIncludedTotals } from '@/lib/totals'
import { normalizeCommercialItem, type CommercialItemInput } from '@/lib/commercial-docs'

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

    const facturas = await db.factura.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
        items: { orderBy: { orden: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = facturas.map((fac) => {
      return { ...fac, ...calculateTaxIncludedTotals(fac.items, fac.descuento, fac.iva) }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching facturas:', error)
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      cotizacionId,
      fechaEmision,
      fechaVencimiento,
      socio,
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

    if (!clienteId || !fechaEmision || !socio || !items?.length) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const year = new Date().getFullYear()
    const lastFac = await db.factura.findFirst({
      where: { numero: { startsWith: `FAC-${year}-` } },
      orderBy: { numero: 'desc' },
    })
    let nextNum = 1
    if (lastFac) {
      const parts = lastFac.numero.split('-')
      nextNum = parseInt(parts[2], 10) + 1
    }
    const numero = `FAC-${year}-${String(nextNum).padStart(3, '0')}`

    const factura = await db.factura.create({
      data: {
        numero,
        clienteId,
        cotizacionId: cotizacionId ?? null,
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        socio,
        descuento: descuento ?? 0,
        iva: iva ?? 0,
        moneda: moneda ?? 'COP',
        vendedor: vendedor ?? null,
        formaPago: formaPago ?? null,
        garantia: garantia ?? null,
        condiciones: condiciones ?? null,
        legalJson: legalJson ?? null,
        observaciones: observaciones ?? null,
        notasInternas: notasInternas ?? null,
        metodoPago: metodoPago ?? null,
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
      modulo: 'FACTURAS',
      accion: 'CREAR',
      entidadId: factura.id,
      detalle: `Factura ${numero} creada para ${factura.cliente.nombre}`,
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    console.error('Error creating factura:', error)
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 })
  }
}
