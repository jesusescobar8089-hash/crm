import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { clienteUpdateSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cliente = await db.cliente.findUnique({
      where: { id },
      include: {
        interacciones: { orderBy: { fecha: 'desc' } },
        monitoreos: {
          include: { mantenimientos: { orderBy: { fecha: 'desc' } } },
          orderBy: { createdAt: 'desc' },
        },
        cotizaciones: {
          include: { items: { orderBy: { orden: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        transacciones: { orderBy: { fecha: 'desc' } },
        tareas: { orderBy: { createdAt: 'desc' } },
        documentos: { orderBy: { createdAt: 'desc' } },
        movimientosInventario: {
          where: { tipo: { in: ['SALIDA_INSTALACION', 'SALIDA_VENTA'] } },
          include: { item: { select: { id: true, nombre: true, categoria: true, unidad: true, costoUnitario: true } } },
          orderBy: { fecha: 'desc' },
        },
        facturas: {
          include: { items: { orderBy: { orden: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsed = clienteUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data

    const existing = await db.cliente.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const cliente = await db.cliente.update({
      where: { id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.empresa !== undefined && { empresa: body.empresa || null }),
        ...(body.nit !== undefined && { nit: body.nit || null }),
        ...(body.direccion !== undefined && { direccion: body.direccion || null }),
        ...(body.contactoNombre !== undefined && { contactoNombre: body.contactoNombre || '' }),
        ...(body.telefono !== undefined && { telefono: body.telefono || '' }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.ciudad !== undefined && { ciudad: body.ciudad }),
        ...(body.departamento !== undefined && { departamento: body.departamento }),
        ...(body.pais !== undefined && { pais: body.pais || 'Colombia' }),
        ...(body.tipoNegocio !== undefined && { tipoNegocio: body.tipoNegocio }),
        ...(body.estado !== undefined && { estado: body.estado }),
        ...(body.socioResponsable !== undefined && { socioResponsable: body.socioResponsable }),
        ...(body.notas !== undefined && { notas: body.notas || null }),
      },
    })

    const socio = body.socioResponsable || existing.socioResponsable
    await registrarBitacora({
      socio,
      modulo: 'clientes',
      accion: 'actualizar',
      entidadId: id,
      detalle: `Cliente actualizado: ${cliente.nombre}`,
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.cliente.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    await db.cliente.delete({ where: { id } })

    await registrarBitacora({
      socio: existing.socioResponsable,
      modulo: 'clientes',
      accion: 'eliminar',
      entidadId: id,
      detalle: `Cliente eliminado: ${existing.nombre}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}
