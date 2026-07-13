export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

export const DOCUMENT_MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const

export const ALLOWED_DOCUMENT_MIME_TYPES = [...new Set(Object.values(DOCUMENT_MIME_BY_EXTENSION))]

export function documentExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isAllowedDocumentExtension(filename: string) {
  return documentExtension(filename) in DOCUMENT_MIME_BY_EXTENSION
}

export function matchesDetectedDocumentType(filename: string, detectedExtension: string, detectedMime: string) {
  const extension = documentExtension(filename)
  const normalizedDetected = detectedExtension === 'jpg' ? 'jpeg' : detectedExtension
  const normalizedExtension = extension === 'jpg' ? 'jpeg' : extension
  return normalizedExtension === normalizedDetected
    && DOCUMENT_MIME_BY_EXTENSION[extension as keyof typeof DOCUMENT_MIME_BY_EXTENSION] === detectedMime
}

export function sanitizeDocumentFilename(filename: string) {
  const leaf = filename.split(/[\\/]/).pop() || 'documento'
  const sanitized = leaf
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F"<>:|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return (sanitized || 'documento').slice(0, 180)
}

export function contentDisposition(filename: string, inline: boolean) {
  const clean = sanitizeDocumentFilename(filename)
  const fallback = clean
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_')
  return `${inline ? 'inline' : 'attachment'}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(clean)}`
}
