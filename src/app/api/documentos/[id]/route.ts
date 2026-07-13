import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationError, requireSession } from '@/lib/auth-guard'
import { registrarBitacora } from '@/lib/bitacora'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(request)
    const { id } = await params
    const documento = await db.documento.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
        cotizacion: { select: { id: true, numero: true, estado: true } },
        monitoreo: { select: { id: true, kitId: true, estado: true } },
      },
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }
    return NextResponse.json(documento)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error getting documento:', error)
    return NextResponse.json({ error: 'Error al obtener documento' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(request)
    const { id } = await params
    const documento = await db.documento.findUnique({ where: { id } })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    if (documento.rutaArchivo.startsWith('https://')) {
      await del(documento.rutaArchivo)
    }
    await db.documento.delete({ where: { id } })
    await registrarBitacora({
      socio: session.nombre,
      modulo: 'documentos',
      accion: 'eliminar',
      entidadId: id,
      detalle: `Documento "${documento.nombre}" eliminado`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error deleting documento:', error)
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 })
  }
}
