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
        nit: true,
        direccion: true,
        contactoNombre: true,
        telefono: true,
        email: true,
        ciudad: true,
        departamento: true,
        pais: true,
        tipoNegocio: true,
        estado: true,
        socioResponsable: true,
        notas: true,
        createdAt: true,
        updatedAt: true,
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
      nit,
      direccion,
      contactoNombre,
      telefono,
      email,
      ciudad,
      departamento,
      pais,
      tipoNegocio,
      estado,
      socioResponsable,
      notas,
    } = body

    if (!nombre || !ciudad || !departamento || !tipoNegocio || !estado || !socioResponsable) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const cliente = await db.cliente.create({
      data: {
        nombre,
        empresa: empresa || null,
        nit: nit || null,
        direccion: direccion || null,
        contactoNombre: contactoNombre || '',
        telefono: telefono || '',
        email: email || null,
        ciudad,
        departamento,
        pais: pais || 'Colombia',
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
