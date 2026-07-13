import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationError, requireSession } from '@/lib/auth-guard'
import { contentDisposition, sanitizeDocumentFilename } from '@/lib/document-files'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(request)
    const { id } = await params
    const preview = request.nextUrl.searchParams.get('preview') === '1'
    const documento = await db.documento.findUnique({ where: { id } })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }
    if (!documento.rutaArchivo.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Este archivo es anterior al almacenamiento privado y debe volver a subirse' },
        { status: 410 },
      )
    }

    const result = await get(documento.rutaArchivo, { access: 'private' })
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    const fallbackName = result.blob.pathname.split('/').pop()?.replace(/-[A-Za-z0-9]{20,}(?=\.)/, '') || documento.nombre
    const originalName = sanitizeDocumentFilename(documento.nombreArchivo || fallbackName)
    const headers = new Headers()
    headers.set('Content-Type', documento.mimeType || result.blob.contentType || 'application/octet-stream')
    headers.set('Content-Disposition', contentDisposition(originalName, preview))
    headers.set('Content-Length', String(result.blob.size))
    headers.set('Cache-Control', 'private, no-store')
    headers.set('X-Content-Type-Options', 'nosniff')

    return new NextResponse(result.stream, { headers })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error downloading documento:', error)
    return NextResponse.json({ error: 'Error al descargar documento' }, { status: 500 })
  }
}
