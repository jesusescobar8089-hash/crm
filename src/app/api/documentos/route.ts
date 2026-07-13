import { del, get } from '@vercel/blob'
import { fileTypeFromStream } from 'file-type'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthenticationError, requireSession } from '@/lib/auth-guard'
import { registrarBitacora } from '@/lib/bitacora'
import { db } from '@/lib/db'
import {
  isAllowedDocumentExtension,
  matchesDetectedDocumentType,
  MAX_DOCUMENT_BYTES,
  sanitizeDocumentFilename,
} from '@/lib/document-files'

const optionalId = z.string().trim().min(1).max(100).optional().nullable()
const registrationSchema = z.object({
  blobUrl: z.string().url().max(2_048),
  originalName: z.string().trim().min(1).max(255),
  nombre: z.string().trim().min(1).max(200),
  tipo: z.string().trim().min(1).max(80),
  descripcion: z.string().trim().max(2_000).optional().nullable(),
  fechaDocumento: z.string().trim().max(40).optional().nullable().refine(
    (value) => !value || !Number.isNaN(Date.parse(value)),
    'Fecha de documento invalida',
  ),
  tags: z.string().trim().max(500).optional().nullable(),
  clienteId: optionalId,
  cotizacionId: optionalId,
  monitoreoId: optionalId,
  facturaId: optionalId,
})

export async function GET(request: NextRequest) {
  try {
    await requireSession(request)
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const clienteId = searchParams.get('clienteId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (tipo) where.tipo = tipo
    if (clienteId) where.clienteId = clienteId
    if (search) where.nombre = { contains: search }

    const documentos = await db.documento.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documentos)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error listing documentos:', error)
    return NextResponse.json({ error: 'Error al listar documentos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let uploadedBlobUrl: string | null = null
  try {
    const session = await requireSession(request)
    const parsed = registrationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos del documento invalidos' }, { status: 400 })
    }

    const data = parsed.data
    uploadedBlobUrl = data.blobUrl
    const originalName = sanitizeDocumentFilename(data.originalName)
    if (!isAllowedDocumentExtension(originalName)) {
      await del(data.blobUrl)
      return NextResponse.json({ error: 'Formato no permitido' }, { status: 400 })
    }

    const blobResult = await get(data.blobUrl, { access: 'private', useCache: false })
    if (!blobResult || blobResult.statusCode !== 200 || !blobResult.blob.pathname.startsWith('documentos/')) {
      return NextResponse.json({ error: 'Archivo privado no encontrado' }, { status: 400 })
    }
    if (blobResult.blob.size > MAX_DOCUMENT_BYTES) {
      await del(data.blobUrl)
      return NextResponse.json({ error: 'El archivo excede 20MB' }, { status: 400 })
    }

    const detected = await fileTypeFromStream(blobResult.stream)
    if (!detected || !matchesDetectedDocumentType(originalName, detected.ext, detected.mime)) {
      await del(data.blobUrl)
      return NextResponse.json({ error: 'El contenido real del archivo no coincide con su extension' }, { status: 400 })
    }

    const existing = await db.documento.findFirst({ where: { rutaArchivo: data.blobUrl } })
    if (existing) return NextResponse.json(existing)

    const documento = await db.documento.create({
      data: {
        nombre: data.nombre,
        nombreArchivo: originalName,
        tipo: data.tipo,
        descripcion: data.descripcion || null,
        rutaArchivo: data.blobUrl,
        mimeType: detected.mime,
        tamañoBytes: blobResult.blob.size,
        clienteId: data.clienteId || undefined,
        cotizacionId: data.cotizacionId || undefined,
        monitoreoId: data.monitoreoId || undefined,
        facturaId: data.facturaId || undefined,
        socio: session.nombre,
        fechaDocumento: data.fechaDocumento ? new Date(data.fechaDocumento) : null,
        tags: data.tags || null,
      },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
      },
    })

    await registrarBitacora({
      socio: session.nombre,
      modulo: 'documentos',
      accion: 'subir',
      entidadId: documento.id,
      detalle: `Documento "${data.nombre}" subido a almacenamiento privado`,
    })

    uploadedBlobUrl = null
    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    if (uploadedBlobUrl) {
      try { await del(uploadedBlobUrl) } catch { /* best-effort rollback */ }
    }
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error registering documento:', error)
    return NextResponse.json({ error: 'Error al registrar documento' }, { status: 500 })
  }
}
