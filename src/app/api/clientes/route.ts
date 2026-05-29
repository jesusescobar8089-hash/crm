import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
