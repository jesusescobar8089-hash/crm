import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.interaccion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Interacción no encontrada' }, { status: 404 })
    }

    const interaccion = await db.interaccion.update({
      where: { id },
      data: {
        ...(body.tipo !== undefined && { tipo: body.tipo }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
        ...(body.fecha !== undefined && { fecha: new Date(body.fecha) }),
        ...(body.proximaAccion !== undefined && { proximaAccion: body.proximaAccion || null }),
        ...(body.fechaProxima !== undefined && { fechaProxima: body.fechaProxima ? new Date(body.fechaProxima) : null }),
      },
    })

    return NextResponse.json(interaccion)
  } catch (error) {
    console.error('Error al actualizar interacción:', error)
    return NextResponse.json({ error: 'Error al actualizar interacción' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.interaccion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Interacción no encontrada' }, { status: 404 })
    }

    await db.interaccion.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar interacción:', error)
    return NextResponse.json({ error: 'Error al eliminar interacción' }, { status: 500 })
  }
}
