'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatFecha } from '@/lib/format'
import { TIPO_DOCUMENTO_LABELS, TIPO_DOCUMENTO_COLORS, type TipoDocumento } from '@/types'
import { useAuthStore } from '@/lib/auth-store'
import { DocumentoUploader } from '@/components/documentos/documento-uploader'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  FileIcon,
  X,
} from 'lucide-react'

interface Documento {
  id: string
  nombre: string
  tipo: string
  descripcion: string | null
  rutaArchivo: string
  mimeType: string
  tamañoBytes: number
  clienteId: string | null
  cotizacionId: string | null
  monitoreoId: string | null
  socio: string
  fechaDocumento: string | null
  tags: string | null
  createdAt: string
  cliente?: {
    id: string
    nombre: string
    empresa: string | null
  } | null
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('wordprocessingml')) return '📝'
  if (mimeType.includes('spreadsheetml')) return '📊'
  return '📎'
}

export default function DocumentosPage() {
  const { user } = useAuthStore()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [clienteFilter, setClienteFilter] = useState<string>('all')

  // Dialogs
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteDoc, setDeleteDoc] = useState<Documento | null>(null)

  // Clientes for filter dropdown
  const [clientes, setClientes] = useState<{ id: string; nombre: string; empresa: string | null }[]>([])

  const fetchDocumentos = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (tipoFilter && tipoFilter !== 'all') params.set('tipo', tipoFilter)
      if (clienteFilter && clienteFilter !== 'all') params.set('clienteId', clienteFilter)

      const res = await fetch(`/api/documentos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocumentos(data)
      }
    } catch {
      toast.error('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }, [search, tipoFilter, clienteFilter])

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/clientes')
      if (res.ok) {
        const data = await res.json()
        setClientes(data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    fetchDocumentos()
  }, [fetchDocumentos])

  const handleDelete = async () => {
    if (!deleteDoc) return
    try {
      const res = await fetch(`/api/documentos/${deleteDoc.id}?socio=${user?.nombre || 'sistema'}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Documento eliminado')
      setDeleteDialog(false)
      setDeleteDoc(null)
      fetchDocumentos()
    } catch {
      toast.error('Error al eliminar documento')
    }
  }

  const handleDownload = (doc: Documento) => {
    window.open(`/api/documentos/${doc.id}/descargar`, '_blank')
  }

  const handleRowClick = (doc: Documento) => {
    setSelectedDoc(doc)
    setDetailOpen(true)
  }

  // Summary calculations
  const totalDocs = documentos.length
  const tipoCounts = documentos.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.tipo] = (acc[doc.tipo] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Documentos</h2>
          <p className="text-muted-foreground text-sm">
            Gestión documental y archivos del proyecto
          </p>
        </div>
        <Button onClick={() => setUploaderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-sky-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalDocs}</p>
          </CardContent>
        </Card>
        {Object.entries(tipoCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tipo, count]) => (
            <Card key={tipo}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {TIPO_DOCUMENTO_LABELS[tipo as TipoDocumento] || tipo}
                  </span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          ))}
        {totalDocs > 0 && Object.keys(tipoCounts).length > 3 && (
          <Card>
            <CardContent className="p-4">
              <span className="text-sm text-muted-foreground">Otros tipos</span>
              <p className="text-2xl font-bold mt-1">
                {Object.entries(tipoCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(3)
                  .reduce((sum, [, c]) => sum + c, 0)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {(Object.entries(TIPO_DOCUMENTO_LABELS) as [TipoDocumento, string][]).map(
              ([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select value={clienteFilter} onValueChange={setClienteFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Fecha Documento</TableHead>
              <TableHead className="hidden lg:table-cell">Socio</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Tamaño</TableHead>
              <TableHead className="w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderOpen className="h-10 w-10" />
                    <p>No se encontraron documentos</p>
                    <p className="text-xs">Suba su primer documento con el botón de arriba</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documentos.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(doc)}
                >
                  <TableCell className="w-8 text-center">
                    <span className="text-lg">{getFileIcon(doc.mimeType)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{doc.nombre}</span>
                      {doc.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.split(',').slice(0, 3).map((tag, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="border-0 text-[10px] px-1.5 py-0"
                            >
                              {tag.trim()}
                            </Badge>
                          ))}
                          {doc.tags.split(',').length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{doc.tags.split(',').length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-[10px] px-1.5 ${
                        TIPO_DOCUMENTO_COLORS[doc.tipo as TipoDocumento] || ''
                      }`}
                    >
                      {TIPO_DOCUMENTO_LABELS[doc.tipo as TipoDocumento] || doc.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {doc.cliente?.nombre || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {doc.fechaDocumento ? formatFecha(doc.fechaDocumento) : '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {doc.socio}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell text-sm text-muted-foreground">
                    {formatFileSize(doc.tamañoBytes)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700"
                        onClick={() => {
                          setDeleteDoc(doc)
                          setDeleteDialog(true)
                        }}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Uploader Dialog */}
      <DocumentoUploader
        open={uploaderOpen}
        onOpenChange={setUploaderOpen}
        onSuccess={fetchDocumentos}
      />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-sky-500" />
              {selectedDoc?.nombre}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo</span>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className={`border-0 ${
                        TIPO_DOCUMENTO_COLORS[selectedDoc.tipo as TipoDocumento] || ''
                      }`}
                    >
                      {TIPO_DOCUMENTO_LABELS[selectedDoc.tipo as TipoDocumento] || selectedDoc.tipo}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamaño</span>
                  <p className="font-medium">{formatFileSize(selectedDoc.tamañoBytes)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{selectedDoc.cliente?.nombre || 'Sin asociar'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Socio</span>
                  <p className="font-medium">{selectedDoc.socio}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Documento</span>
                  <p className="font-medium">
                    {selectedDoc.fechaDocumento ? formatFecha(selectedDoc.fechaDocumento) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Carga</span>
                  <p className="font-medium">{formatFecha(selectedDoc.createdAt)}</p>
                </div>
              </div>

              {selectedDoc.descripcion && (
                <div>
                  <span className="text-muted-foreground text-sm">Descripción</span>
                  <p className="text-sm mt-1 bg-muted p-3 rounded">{selectedDoc.descripcion}</p>
                </div>
              )}

              {selectedDoc.tags && (
                <div>
                  <span className="text-muted-foreground text-sm">Tags</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedDoc.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="secondary" className="border-0 text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleDownload(selectedDoc)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false)
                    setDeleteDoc(selectedDoc)
                    setDeleteDialog(true)
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar Documento"
        description={`¿Está seguro de eliminar "${deleteDoc?.nombre}"? El archivo se eliminará permanentemente del servidor.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
