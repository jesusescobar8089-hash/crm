import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documento = await db.documento.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nombre: true, empresa: true },
        },
        cotizacion: {
          select: { id: true, numero: true, estado: true },
        },
        monitoreo: {
          select: { id: true, kitId: true, estado: true },
        },
      },
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(documento)
  } catch (error) {
    console.error('Error getting documento:', error)
    return NextResponse.json({ error: 'Error al obtener documento' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const socio = request.nextUrl.searchParams.get('socio') || 'sistema'

    const documento = await db.documento.findUnique({ where: { id } })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Remove file from disk
    const absolutePath = path.join(process.cwd(), 'public', documento.rutaArchivo)
    if (existsSync(absolutePath)) {
      try {
        await unlink(absolutePath)
      } catch (err) {
        console.error('Error deleting file from disk:', err)
        // Continue even if file deletion fails
      }
    }

    // Delete DB record
    await db.documento.delete({ where: { id } })

    // Registrar en bitácora
    await registrarBitacora({
      socio,
      modulo: 'documentos',
      accion: 'eliminar',
      entidadId: id,
      detalle: `Documento "${documento.nombre}" eliminado`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting documento:', error)
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 })
  }
}
