import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { monitoreoSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

// GET /api/monitoreos - List monitorings with cliente info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')

    const where: Record<string, unknown> = {}
    if (estado) where.estado = estado
    if (clienteId) where.clienteId = clienteId

    const monitoreos = await db.monitoreo.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true, ciudad: true } },
        mantenimientos: { orderBy: { fecha: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(monitoreos)
  } catch (error) {
    console.error('Error fetching monitoreos:', error)
    return NextResponse.json({ error: 'Error al obtener monitoreos' }, { status: 500 })
  }
}

// POST /api/monitoreos - Create monitoring
export async function POST(request: NextRequest) {
  try {
    const parsed = monitoreoSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const { clienteId, kitId, fechaInstalacion, frecuenciaMantenimiento, observaciones, socio } = body

    if (!clienteId || !fechaInstalacion || !frecuenciaMantenimiento || !socio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const cliente = await db.cliente.findUnique({ where: { id: clienteId }, select: { id: true } })
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 400 })

    // Calculate proximoMantenimiento
    const fechaInst = new Date(fechaInstalacion)
    const proximoMantenimiento = new Date(fechaInst)
    proximoMantenimiento.setDate(proximoMantenimiento.getDate() + frecuenciaMantenimiento)

    const monitoreo = await db.monitoreo.create({
      data: {
        clienteId,
        kitId: kitId ?? null,
        fechaInstalacion: fechaInst,
        frecuenciaMantenimiento,
        ultimoMantenimiento: fechaInst,
        proximoMantenimiento,
        estado: 'ACTIVO',
        observaciones: observaciones ?? null,
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
      },
    })

    await registrarBitacora({
      socio,
      modulo: 'MONITOREOS',
      accion: 'CREAR',
      entidadId: monitoreo.id,
      detalle: `Monitoreo creado para ${monitoreo.cliente.nombre}`,
    })

    return NextResponse.json(monitoreo, { status: 201 })
  } catch (error) {
    console.error('Error creating monitoreo:', error)
    return NextResponse.json({ error: 'Error al crear monitoreo' }, { status: 500 })
  }
}
