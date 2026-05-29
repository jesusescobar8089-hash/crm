import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

// GET /api/mantenimientos - List maintenances (filter by monitoreoId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monitoreoId = searchParams.get('monitoreoId')

    const where: Record<string, unknown> = {}
    if (monitoreoId) where.monitoreoId = monitoreoId

    const mantenimientos = await db.mantenimiento.findMany({
      where,
      include: {
        monitoreo: {
          select: { id: true, cliente: { select: { id: true, nombre: true } } },
        },
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(mantenimientos)
  } catch (error) {
    console.error('Error fetching mantenimientos:', error)
    return NextResponse.json({ error: 'Error al obtener mantenimientos' }, { status: 500 })
  }
}

// POST /api/mantenimientos - Create maintenance, update monitoreo's ultimoMantenimiento and proximoMantenimiento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { monitoreoId, fecha, socio, descripcion, observaciones } = body

    if (!monitoreoId || !fecha || !socio || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Get monitoreo to calculate next maintenance date
    const monitoreo = await db.monitoreo.findUnique({ where: { id: monitoreoId } })
    if (!monitoreo) {
      return NextResponse.json({ error: 'Monitoreo no encontrado' }, { status: 404 })
    }

    const mantenimiento = await db.mantenimiento.create({
      data: {
        monitoreoId,
        fecha: new Date(fecha),
        socio,
        descripcion,
        observaciones: observaciones ?? null,
      },
    })

    // Update monitoreo: ultimoMantenimiento and proximoMantenimiento
    const fechaMant = new Date(fecha)
    const proximoMantenimiento = new Date(fechaMant)
    proximoMantenimiento.setDate(proximoMantenimiento.getDate() + monitoreo.frecuenciaMantenimiento)

    await db.monitoreo.update({
      where: { id: monitoreoId },
      data: {
        ultimoMantenimiento: fechaMant,
        proximoMantenimiento,
        estado: 'ACTIVO',
      },
    })

    await registrarBitacora({
      socio,
      modulo: 'MONITOREOS',
      accion: 'REGISTRAR_MANTENIMIENTO',
      entidadId: monitoreoId,
      detalle: `Mantenimiento registrado para monitoreo`,
    })

    return NextResponse.json(mantenimiento, { status: 201 })
  } catch (error) {
    console.error('Error creating mantenimiento:', error)
    return NextResponse.json({ error: 'Error al registrar mantenimiento' }, { status: 500 })
  }
}
