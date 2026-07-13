import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { PRIMARY_OPERATOR_ID } from '@/lib/operator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const asignadoA = searchParams.get('asignadoA')
    const prioridad = searchParams.get('prioridad')
    const clienteId = searchParams.get('clienteId')

    const where: Record<string, unknown> = {}
    if (estado && estado !== 'all') {
      where.estado = estado
    }
    if (asignadoA && asignadoA !== 'all') {
      if (asignadoA === PRIMARY_OPERATOR_ID) {
        where.asignadoA = { in: [PRIMARY_OPERATOR_ID, 'socioA', 'socioB', 'ambos'] }
      } else if (asignadoA === 'ambos') {
        where.asignadoA = { in: ['socioA', 'socioB', 'ambos', PRIMARY_OPERATOR_ID] }
      } else {
        where.asignadoA = { in: [asignadoA, 'ambos'] }
      }
    }
    if (prioridad && prioridad !== 'all') {
      where.prioridad = prioridad
    }
    if (clienteId && clienteId !== 'all') {
      where.clienteId = clienteId
    }

    const tareas = await db.tarea.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tareas)
  } catch (error) {
    console.error('Error listing tareas:', error)
    return NextResponse.json({ error: 'Error al listar tareas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { titulo, descripcion, asignadoA, prioridad, fechaLimite, estado, clienteId, socio } = body

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }

    const tarea = await db.tarea.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion || null,
        asignadoA: asignadoA || PRIMARY_OPERATOR_ID,
        prioridad: prioridad || 'MEDIA',
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        estado: estado || 'PENDIENTE',
        clienteId: clienteId || null,
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
      },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'tareas',
      accion: 'crear',
      entidadId: tarea.id,
      detalle: `Tarea creada: ${titulo}`,
    })

    return NextResponse.json(tarea, { status: 201 })
  } catch (error) {
    console.error('Error creating tarea:', error)
    return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 })
  }
}
