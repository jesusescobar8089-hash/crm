import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const socio = searchParams.get('socio')
    const modulo = searchParams.get('modulo')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (socio && socio !== 'all') {
      where.socio = socio
    }

    if (modulo && modulo !== 'all') {
      where.modulo = modulo
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {
        ...(fechaDesde && { gte: new Date(fechaDesde) }),
        ...(fechaHasta && { lte: new Date(new Date(fechaHasta).setHours(23, 59, 59, 999)) }),
      }
    }

    if (search) {
      where.detalle = { contains: search }
    }

    const [data, total] = await Promise.all([
      db.bitacoraEvento.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.bitacoraEvento.count({ where }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Error fetching bitacora:', error)
    return NextResponse.json({ error: 'Error al obtener bitácora' }, { status: 500 })
  }
}
