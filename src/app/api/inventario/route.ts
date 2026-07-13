import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { inventarioSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (categoria && categoria !== 'all') {
      where.categoria = categoria
    }
    if (search) {
      where.nombre = { contains: search }
    }

    const items = await db.inventarioItem.findMany({
      where,
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error listing inventario:', error)
    return NextResponse.json({ error: 'Error al listar inventario' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = inventarioSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const { nombre, categoria, unidad, stockActual, stockMinimo, costoUnitario, proveedor, notas, socio } = body

    const item = await db.inventarioItem.create({
      data: {
        nombre,
        categoria,
        unidad,
        stockActual: Number(stockActual) || 0,
        stockMinimo: Number(stockMinimo) || 0,
        costoUnitario: Number(costoUnitario) || 0,
        proveedor: proveedor || null,
        notas: notas || null,
      },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'inventario',
      accion: 'crear',
      entidadId: item.id,
      detalle: `Ítem creado: ${nombre}`,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventario item:', error)
    return NextResponse.json({ error: 'Error al crear ítem de inventario' }, { status: 500 })
  }
}
