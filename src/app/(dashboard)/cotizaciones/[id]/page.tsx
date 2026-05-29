'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Copy,
  Download,
  Edit,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CotizacionForm } from '@/components/cotizaciones/cotizacion-form'
import { formatCOP, formatFecha } from '@/lib/format'
import { useAuthStore } from '@/lib/auth-store'
import {
  ESTADO_COTIZACION_LABELS,
  type EstadoCotizacion,
} from '@/types'

interface CotizacionDetail {
  id: string
  numero: string
  clienteId: string
  fechaEmision: string
  fechaVencimiento: string | null
  estado: EstadoCotizacion
  socio: string
  descuento: number
  iva: number
  observaciones: string | null
  notasInternas: string | null
  cliente: {
    id: string
    nombre: string
    empresa: string | null
    contactoNombre: string
    telefono: string
    email: string | null
    ciudad: string
  }
  items: {
    id: string
    descripcion: string
    cantidad: number
    precioUnit: number
    subtotal: number
    orden: number
  }[]
  subtotalGeneral: number
  descuentoMonto: number
  subtotalConDescuento: number
  ivaMonto: number
  total: number
}

const estadoTransitions: Record<string, EstadoCotizacion[]> = {
  BORRADOR: ['ENVIADA'],
  ENVIADA: ['EN_REVISION', 'ACEPTADA', 'RECHAZADA'],
  EN_REVISION: ['ACEPTADA', 'RECHAZADA', 'ENVIADA'],
  ACEPTADA: [],
  RECHAZADA: ['BORRADOR'],
  VENCIDA: ['BORRADOR'],
}

export default function CotizacionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const id = params.id as string

  const [cotizacion, setCotizacion] = useState<CotizacionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCotizacion = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cotizaciones/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCotizacion(data)
      } else {
        toast.error('Cotización no encontrada')
        router.push('/cotizaciones')
      }
    } catch {
      toast.error('Error al cargar cotización')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchCotizacion()
  }, [fetchCotizacion])

  const handleChangeEstado = async (nuevoEstado: EstadoCotizacion) => {
    if (!cotizacion) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/cotizaciones/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, socio: user?.nombre ?? 'Sistema' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cambiar estado')
      }
      toast.success(`Estado cambiado a ${ESTADO_COTIZACION_LABELS[nuevoEstado]}`)
      fetchCotizacion()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDuplicar = async () => {
    if (!cotizacion) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/cotizaciones/${id}/duplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socio: user?.nombre ?? 'Sistema' }),
      })
      if (!res.ok) throw new Error('Error al duplicar')
      const nueva = await res.json()
      toast.success(`Cotización duplicada como ${nueva.numero}`)
      router.push(`/cotizaciones/${nueva.id}`)
    } catch {
      toast.error('Error al duplicar cotización')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvertir = async () => {
    if (!cotizacion) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/cotizaciones/${id}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socio: user?.nombre ?? 'Sistema' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al convertir')
      }
      toast.success('Cotización convertida en ingreso exitosamente')
      setConvertOpen(false)
      fetchCotizacion()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al convertir')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/cotizaciones/${id}?socio=${user?.nombre ?? 'Sistema'}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Cotización eliminada')
      router.push('/cotizaciones')
    } catch {
      toast.error('Error al eliminar cotización')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cotizacion) return null

  const availableTransitions = estadoTransitions[cotizacion.estado] ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/cotizaciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{cotizacion.numero}</h2>
            <StatusBadge type="cotizacion" value={cotizacion.estado} />
          </div>
          <p className="text-muted-foreground">
            {cotizacion.cliente.nombre} {cotizacion.cliente.empresa ? `— ${cotizacion.cliente.empresa}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Change Estado */}
          {availableTransitions.length > 0 && (
            <Select onValueChange={(val) => handleChangeEstado(val as EstadoCotizacion)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Cambiar estado..." />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((est) => (
                  <SelectItem key={est} value={est}>
                    {ESTADO_COTIZACION_LABELS[est]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Convertir en Ingreso */}
          {cotizacion.estado === 'ACEPTADA' && (
            <Button
              onClick={() => setConvertOpen(true)}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Convertir en Ingreso
            </Button>
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={actionLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {cotizacion.estado === 'BORRADOR' && (
                <DropdownMenuItem onClick={() => setEditFormOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicar} disabled={actionLoading}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/api/cotizaciones/${id}/pdf`, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Quotation Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Número</p>
                  <p className="font-mono font-medium">{cotizacion.numero}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{cotizacion.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contacto</p>
                  <p>{cotizacion.cliente.contactoNombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha Emisión</p>
                  <p>{formatFecha(cotizacion.fechaEmision)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p>{cotizacion.fechaVencimiento ? formatFecha(cotizacion.fechaVencimiento) : 'Sin vencimiento'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Socio</p>
                  <p>{cotizacion.socio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacion.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.descripcion}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCOP(item.precioUnit)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCOP(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              {/* Summary */}
              <div className="space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCOP(cotizacion.subtotalGeneral)}</span>
                </div>
                {cotizacion.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento ({cotizacion.descuento}%)</span>
                    <span className="text-red-500">-{formatCOP(cotizacion.descuentoMonto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA ({cotizacion.iva}%)</span>
                  <span>{formatCOP(cotizacion.ivaMonto)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span>{formatCOP(cotizacion.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge type="cotizacion" value={cotizacion.estado} className="text-sm" />
                </div>
                {availableTransitions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Transiciones disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((est) => (
                        <Button
                          key={est}
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeEstado(est)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          {ESTADO_COTIZACION_LABELS[est]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {cotizacion.estado === 'ACEPTADA' && (
                  <div className="pt-2">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setConvertOpen(true)}
                      disabled={actionLoading}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Convertir en Ingreso
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {(cotizacion.observaciones || cotizacion.notasInternas) && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cotizacion.observaciones && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Observaciones</p>
                    <p className="text-sm whitespace-pre-wrap">{cotizacion.observaciones}</p>
                  </div>
                )}
                {cotizacion.notasInternas && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Notas Internas</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{cotizacion.notasInternas}</p>
                    </div>
                    <Badge variant="secondary" className="mt-1 text-[10px]">Solo interno</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cotizacion.estado === 'BORRADOR' && (
                <Button variant="outline" className="w-full justify-start" onClick={() => setEditFormOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Cotización
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" onClick={handleDuplicar} disabled={actionLoading}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`/api/cotizaciones/${id}/pdf`, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Dialog */}
      {cotizacion && (
        <CotizacionForm
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          cotizacion={{
            id: cotizacion.id,
            clienteId: cotizacion.clienteId,
            fechaEmision: cotizacion.fechaEmision,
            fechaVencimiento: cotizacion.fechaVencimiento,
            descuento: cotizacion.descuento,
            iva: cotizacion.iva,
            observaciones: cotizacion.observaciones,
            notasInternas: cotizacion.notasInternas,
            items: cotizacion.items.map((i) => ({
              descripcion: i.descripcion,
              cantidad: i.cantidad,
              precioUnit: i.precioUnit,
            })),
          }}
          onSuccess={fetchCotizacion}
        />
      )}

      {/* Convert Confirmation */}
      <ConfirmDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        title="Convertir en Ingreso"
        description={`¿Desea convertir la cotización ${cotizacion.numero} en un ingreso por ${formatCOP(cotizacion.total)}? Se creará una transacción de tipo INGRESO.`}
        confirmText="Convertir"
        onConfirm={handleConvertir}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Cotización"
        description="¿Está seguro de eliminar esta cotización? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
