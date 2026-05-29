'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { TIPO_DOCUMENTO_LABELS, type TipoDocumento } from '@/types'
import { useAuthStore } from '@/lib/auth-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, X, FileIcon, Loader2 } from 'lucide-react'

interface ClienteOption {
  id: string
  nombre: string
  empresa: string | null
}

interface CotizacionOption {
  id: string
  numero: string
  estado: string
  clienteId: string
}

interface MonitoreoOption {
  id: string
  kitId: string | null
  estado: string
  clienteId: string
}

interface DocumentoUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function DocumentoUploader({ open, onOpenChange, onSuccess }: DocumentoUploaderProps) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<string>('')
  const [descripcion, setDescripcion] = useState('')
  const [clienteId, setClienteId] = useState<string>('')
  const [cotizacionId, setCotizacionId] = useState<string>('')
  const [monitoreoId, setMonitoreoId] = useState<string>('')
  const [fechaDocumento, setFechaDocumento] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [tags, setTags] = useState('')

  // Options
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [cotizaciones, setCotizaciones] = useState<CotizacionOption[]>([])
  const [monitoreos, setMonitoreos] = useState<MonitoreoOption[]>([])

  // Fetch clientes
  useEffect(() => {
    if (open) {
      fetch('/api/clientes')
        .then((res) => res.json())
        .then((data) => setClientes(data))
        .catch(() => toast.error('Error al cargar clientes'))
    }
  }, [open])

  // Fetch cotizaciones filtered by cliente
  const fetchCotizaciones = useCallback(async (cId: string) => {
    if (!cId) {
      setCotizaciones([])
      return
    }
    try {
      const res = await fetch(`/api/cotizaciones?clienteId=${cId}`)
      if (res.ok) {
        const data = await res.json()
        setCotizaciones(data)
      }
    } catch {
      setCotizaciones([])
    }
  }, [])

  // Fetch monitoreos filtered by cliente
  const fetchMonitoreos = useCallback(async (cId: string) => {
    if (!cId) {
      setMonitoreos([])
      return
    }
    try {
      const res = await fetch(`/api/monitoreos?clienteId=${cId}`)
      if (res.ok) {
        const data = await res.json()
        setMonitoreos(data)
      }
    } catch {
      setMonitoreos([])
    }
  }, [])

  // When cliente changes, filter cotizaciones and monitoreos
  useEffect(() => {
    if (clienteId) {
      fetchCotizaciones(clienteId)
      fetchMonitoreos(clienteId)
    } else {
      setCotizaciones([])
      setMonitoreos([])
    }
    setCotizacionId('')
    setMonitoreoId('')
  }, [clienteId, fetchCotizaciones, fetchMonitoreos])

  // Auto-fill nombre from file name
  useEffect(() => {
    if (file && !nombre) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setNombre(nameWithoutExt)
    }
  }, [file, nombre])

  const resetForm = () => {
    setFile(null)
    setNombre('')
    setTipo('')
    setDescripcion('')
    setClienteId('')
    setCotizacionId('')
    setMonitoreoId('')
    setFechaDocumento(new Date().toISOString().split('T')[0])
    setTags('')
    setCotizaciones([])
    setMonitoreos([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Validate size
    if (selected.size > MAX_FILE_SIZE) {
      toast.error('El archivo excede el tamaño máximo de 20MB')
      return
    }

    // Validate extension
    const ext = selected.name.split('.').pop()?.toLowerCase()
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx']
    if (!ext || !validExts.includes(ext)) {
      toast.error('Formato no permitido. Use PDF, JPG, PNG, DOCX o XLSX')
      return
    }

    setFile(selected)
  }

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Seleccione un archivo')
      return
    }
    if (!nombre.trim()) {
      toast.error('Ingrese el nombre del documento')
      return
    }
    if (!tipo) {
      toast.error('Seleccione el tipo de documento')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('nombre', nombre.trim())
      formData.append('tipo', tipo)
      formData.append('descripcion', descripcion.trim())
      formData.append('socio', user?.nombre || 'sistema')
      formData.append('fechaDocumento', fechaDocumento)
      formData.append('tags', tags.trim())

      if (clienteId) formData.append('clienteId', clienteId)
      if (cotizacionId) formData.append('cotizacionId', cotizacionId)
      if (monitoreoId) formData.append('monitoreoId', monitoreoId)

      const res = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al subir documento')
      }

      toast.success('Documento subido exitosamente')
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir documento')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div className="space-y-2">
            <Label>Archivo *</Label>
            {!file ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Haga clic para seleccionar archivo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG, DOCX, XLSX — Máximo 20MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileIcon className="h-8 w-8 text-sky-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre / Título *</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre descriptivo del documento"
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TIPO_DOCUMENTO_LABELS) as [TipoDocumento, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción / Notas</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas o descripción del documento"
              rows={3}
            />
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente Asociado</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}{c.empresa ? ` — ${c.empresa}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cotización (filtered by cliente) */}
          {clienteId && cotizaciones.length > 0 && (
            <div className="space-y-2">
              <Label>Cotización Asociada</Label>
              <Select value={cotizacionId} onValueChange={setCotizacionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cotización (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {cotizaciones.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero} — {c.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Monitoreo (filtered by cliente) */}
          {clienteId && monitoreos.length > 0 && (
            <div className="space-y-2">
              <Label>Monitoreo Asociado</Label>
              <Select value={monitoreoId} onValueChange={setMonitoreoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione monitoreo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {monitoreos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      Kit {m.kitId || 'S/N'} — {m.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fecha del documento */}
          <div className="space-y-2">
            <Label>Fecha del Documento</Label>
            <Input
              type="date"
              value={fechaDocumento}
              onChange={(e) => setFechaDocumento(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Etiquetas separadas por coma (ej: contrato, 2024, piloto)"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => { resetForm(); onOpenChange(false) }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || !file}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
