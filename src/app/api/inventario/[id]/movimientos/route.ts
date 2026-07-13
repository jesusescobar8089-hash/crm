import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(_request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const movimientos = await db.movimientoStock.findMany({
      where: { itemId: id },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    console.error('Error listing movimientos:', error)
    return NextResponse.json({ error: 'Error al listar movimientos' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()
    const { tipo, cantidad, costo, proveedor, clienteId, descripcion, socio, fecha } = body

    const cantidadNum = Number(cantidad)

    // Get current item
    const item = await db.inventarioItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })
    }

    let newStock = item.stockActual
    let newCostoUnitario = item.costoUnitario

    switch (tipo) {
      case 'ENTRADA': {
        newStock += cantidadNum
        // Weighted average cost
        const costoEntrada = Number(costo) || 0
        if (newStock > 0 && costoEntrada > 0) {
          newCostoUnitario = (item.stockActual * item.costoUnitario + cantidadNum * costoEntrada) / newStock
        }
        break
      }
      case 'SALIDA_INSTALACION':
      case 'SALIDA_VENTA': {
        newStock -= cantidadNum
        if (newStock < 0) newStock = 0
        break
      }
      case 'AJUSTE': {
        // cantidad can be positive or negative for AJUSTE
        newStock += cantidadNum
        if (newStock < 0) newStock = 0
        break
      }
    }

    // Create movement and update item in a transaction
    const [movimiento] = await db.$transaction([
      db.movimientoStock.create({
        data: {
          itemId: id,
          tipo,
          cantidad: cantidadNum,
          costo: costo ? Number(costo) : null,
          proveedor: proveedor || null,
          clienteId: clienteId || null,
          descripcion,
          socio: socio || 'sistema',
          fecha: fecha ? new Date(fecha) : new Date(),
        },
      }),
      db.inventarioItem.update({
        where: { id },
        data: {
          stockActual: newStock,
          costoUnitario: newCostoUnitario,
        },
      }),
    ])

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'inventario',
      accion: 'movimiento',
      entidadId: id,
      detalle: `Movimiento ${tipo}: ${cantidadNum} unidades de ${item.nombre}`,
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error('Error creating movimiento:', error)
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 })
  }
}
