import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { registrarBitacora } from '@/lib/bitacora'

export async function POST(request: NextRequest) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Se requiere FormData con archivo' }, { status: 400 })
    }
    const file = formData.get('file') as File | null
    const nombre = formData.get('nombre') as string
    const tipo = formData.get('tipo') as string
    const descripcion = formData.get('descripcion') as string | null
    const socio = formData.get('socio') as string
    const fechaDocumento = formData.get('fechaDocumento') as string | null
    const tags = formData.get('tags') as string | null
    const clienteId = formData.get('clienteId') as string | null
    const cotizacionId = formData.get('cotizacionId') as string | null
    const monitoreoId = formData.get('monitoreoId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }
    if (!nombre || !tipo || !socio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede 20MB' }, { status: 400 })
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx']
    if (!ext || !validExts.includes(ext)) {
      return NextResponse.json({ error: 'Formato no permitido' }, { status: 400 })
    }

    // Save file with UUID prefix to avoid collisions
    const uuid = randomUUID()
    const safeName = `${uuid}-${file.name}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadsDir, safeName)

    // Ensure uploads directory exists
    const { mkdir } = await import('fs/promises')
    await mkdir(uploadsDir, { recursive: true })

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record in DB
    const documento = await db.documento.create({
      data: {
        nombre,
        tipo,
        descripcion: descripcion || null,
        rutaArchivo: `/uploads/${safeName}`,
        mimeType: file.type || 'application/octet-stream',
        tamañoBytes: file.size,
        clienteId: clienteId || undefined,
        cotizacionId: cotizacionId || undefined,
        monitoreoId: monitoreoId || undefined,
        socio,
        fechaDocumento: fechaDocumento ? new Date(fechaDocumento) : null,
        tags: tags || null,
      },
      include: {
        cliente: { select: { id: true, nombre: true, empresa: true } },
      },
    })

    await registrarBitacora({
      socio,
      modulo: 'documentos',
      accion: 'subir',
      entidadId: documento.id,
      detalle: `Documento "${nombre}" subido`,
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    console.error('Error uploading documento:', error)
    return NextResponse.json({ error: 'Error al subir documento' }, { status: 500 })
  }
}
