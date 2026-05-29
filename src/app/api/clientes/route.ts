import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.nombre = { contains: search }
    }

    const clientes = await db.cliente.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        empresa: true,
        estado: true,
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error listing clientes:', error)
    return NextResponse.json({ error: 'Error al listar clientes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      empresa,
      contactoNombre,
      telefono,
      email,
      ciudad,
      departamento,
      tipoNegocio,
      estado,
      socioResponsable,
      notas,
    } = body

    if (!nombre || !contactoNombre || !telefono || !ciudad || !departamento || !tipoNegocio || !estado || !socioResponsable) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const cliente = await db.cliente.create({
      data: {
        nombre,
        empresa: empresa || null,
        contactoNombre,
        telefono,
        email: email || null,
        ciudad,
        departamento,
        tipoNegocio,
        estado,
        socioResponsable,
        notas: notas || null,
      },
    })

    await registrarBitacora({
      socio: socioResponsable,
      modulo: 'clientes',
      accion: 'crear',
      entidadId: cliente.id,
      detalle: `Cliente creado: ${cliente.nombre}`,
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
