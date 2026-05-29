import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const clienteId = searchParams.get('clienteId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (tipo) {
      where.tipo = tipo
    }
    if (clienteId) {
      where.clienteId = clienteId
    }
    if (search) {
      where.nombre = { contains: search }
    }

    const documentos = await db.documento.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documentos)
  } catch (error) {
    console.error('Error listing documentos:', error)
    return NextResponse.json({ error: 'Error al listar documentos' }, { status: 500 })
  }
}
