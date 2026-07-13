import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationError, requireSession } from '@/lib/auth-guard'
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  isAllowedDocumentExtension,
  MAX_DOCUMENT_BYTES,
} from '@/lib/document-files'

export async function POST(request: NextRequest) {
  try {
    await requireSession(request)
    const body = await request.json() as HandleUploadBody
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('documentos/') || !isAllowedDocumentExtension(pathname)) {
          throw new Error('Nombre o formato de archivo no permitido')
        }

        return {
          allowedContentTypes: ALLOWED_DOCUMENT_MIME_TYPES,
          maximumSizeInBytes: MAX_DOCUMENT_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
        }
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.error('Error authorizing documento upload:', error)
    return NextResponse.json({ error: 'No se pudo autorizar la subida' }, { status: 400 })
  }
}
