import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { inventarioUpdateSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.inventarioItem.findUnique({
      where: { id },
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error getting inventario item:', error)
    return NextResponse.json({ error: 'Error al obtener ítem' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsed = inventarioUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const { nombre, categoria, unidad, stockMinimo, costoUnitario, proveedor, notas, socio } = body

    const item = await db.inventarioItem.update({
      where: { id },
      data: {
        nombre,
        categoria,
        unidad,
        stockMinimo: stockMinimo !== undefined ? Number(stockMinimo) : undefined,
        costoUnitario: costoUnitario !== undefined ? Number(costoUnitario) : undefined,
        proveedor: proveedor || null,
        notas: notas || null,
      },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'inventario',
      accion: 'actualizar',
      entidadId: item.id,
      detalle: `Ítem actualizado: ${nombre}`,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating inventario item:', error)
    return NextResponse.json({ error: 'Error al actualizar ítem' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio') || 'sistema'

    const item = await db.inventarioItem.delete({
      where: { id },
    })

    await registrarBitacora({
      socio,
      modulo: 'inventario',
      accion: 'eliminar',
      entidadId: id,
      detalle: `Ítem eliminado: ${item.nombre}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventario item:', error)
    return NextResponse.json({ error: 'Error al eliminar ítem' }, { status: 500 })
  }
}
