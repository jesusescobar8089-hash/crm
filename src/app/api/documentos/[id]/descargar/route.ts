import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const documento = await db.documento.findUnique({ where: { id } })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const absolutePath = path.join(process.cwd(), 'public', documento.rutaArchivo)

    if (!existsSync(absolutePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado en disco' }, { status: 404 })
    }

    const fileBuffer = await readFile(absolutePath)
    const fileStat = await stat(absolutePath)

    // Determine content type based on extension
    const ext = path.extname(documento.rutaArchivo).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }

    const contentType = contentTypes[ext] || documento.mimeType || 'application/octet-stream'

    // Get original filename (after the uuid- prefix)
    const fileNameParts = documento.rutaArchivo.split('/')
    const storedName = fileNameParts[fileNameParts.length - 1]
    // Remove uuid prefix to get original name
    const originalName = storedName.replace(/^[a-f0-9-]{36}-/, '')

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`)
    headers.set('Content-Length', fileStat.size.toString())

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error('Error downloading documento:', error)
    return NextResponse.json({ error: 'Error al descargar documento' }, { status: 500 })
  }
}
