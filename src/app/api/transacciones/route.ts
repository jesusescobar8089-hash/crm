import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'
import { transaccionSchema } from '@/lib/schemas/entities.schema'
import { validationError } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const categoria = searchParams.get('categoria')
    const socio = searchParams.get('socio')
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')

    const where: Record<string, unknown> = {}

    if (tipo && tipo !== 'all') {
      where.tipo = tipo
    }
    if (categoria && categoria !== 'all') {
      where.categoria = categoria
    }
    if (socio && socio !== 'all') {
      where.socio = socio
    }
    if (mes && anio) {
      const m = Number(mes)
      const y = Number(anio)
      const startDate = new Date(y, m, 1)
      const endDate = new Date(y, m + 1, 1)
      where.fecha = { gte: startDate, lt: endDate }
    } else if (anio) {
      const y = Number(anio)
      const startDate = new Date(y, 0, 1)
      const endDate = new Date(y + 1, 0, 1)
      where.fecha = { gte: startDate, lt: endDate }
    }

    const transacciones = await db.transaccion.findMany({
      where,
      include: { cliente: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(transacciones)
  } catch (error) {
    console.error('Error listing transacciones:', error)
    return NextResponse.json({ error: 'Error al listar transacciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = transaccionSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const body = parsed.data
    const { tipo, categoria, descripcion, monto, socio, metodoPago, clienteId, cotizacionId, fecha } = body

    const [cliente, cotizacion] = await Promise.all([
      clienteId ? db.cliente.findUnique({ where: { id: clienteId }, select: { id: true } }) : Promise.resolve(null),
      cotizacionId ? db.cotizacion.findUnique({ where: { id: cotizacionId }, select: { id: true, clienteId: true } }) : Promise.resolve(null),
    ])
    if (clienteId && !cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 400 })
    if (cotizacionId && (!cotizacion || (clienteId && cotizacion.clienteId !== clienteId))) {
      return NextResponse.json({ error: 'Cotización inválida para el cliente indicado' }, { status: 400 })
    }

    const transaccion = await db.transaccion.create({
      data: {
        tipo,
        categoria,
        descripcion,
        monto: Number(monto),
        socio,
        metodoPago: metodoPago || null,
        clienteId: clienteId || null,
        cotizacionId: cotizacionId || null,
        fecha: fecha ? new Date(fecha) : new Date(),
      },
      include: { cliente: { select: { nombre: true } } },
    })

    await registrarBitacora({
      socio: socio || 'sistema',
      modulo: 'finanzas',
      accion: 'crear_transaccion',
      entidadId: transaccion.id,
      detalle: `Transacción ${tipo} creada: ${descripcion} - ${monto}`,
    })

    return NextResponse.json(transaccion, { status: 201 })
  } catch (error) {
    console.error('Error creating transaccion:', error)
    return NextResponse.json({ error: 'Error al crear transacción' }, { status: 500 })
  }
}
