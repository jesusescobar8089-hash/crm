import { describe, expect, it } from 'vitest'
import {
  contentDisposition,
  matchesDetectedDocumentType,
  sanitizeDocumentFilename,
} from '@/lib/document-files'

describe('archivos de documentos', () => {
  it('limpia rutas y caracteres peligrosos del nombre', () => {
    expect(sanitizeDocumentFilename('../factura\u0000final.pdf')).toBe('factura_final.pdf')
  })

  it('genera Content-Disposition compatible con nombres Unicode', () => {
    const header = contentDisposition('Cotizacion Ni\u00f1o.pdf', false)
    expect(header).toContain('attachment;')
    expect(header).toContain("filename*=UTF-8''Cotizacion%20Ni%C3%B1o.pdf")
    expect(header).not.toContain('\r')
    expect(header).not.toContain('\n')
  })

  it('acepta solo cuando extension y magic bytes detectados coinciden', () => {
    expect(matchesDetectedDocumentType('soporte.pdf', 'pdf', 'application/pdf')).toBe(true)
    expect(matchesDetectedDocumentType('soporte.pdf', 'png', 'image/png')).toBe(false)
  })
})
