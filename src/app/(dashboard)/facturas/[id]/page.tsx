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
  CheckCircle,
  XCircle,
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
import { FacturaForm } from '@/components/facturas/factura-form'
import { formatCOP, formatFecha } from '@/lib/format'
import { useAuthStore } from '@/lib/auth-store'
import { getOperatorLabel } from '@/lib/operator'
import {
  ESTADO_FACTURA_LABELS,
  type EstadoFactura,
} from '@/types'

interface FacturaDetail {
  id: string
  numero: string
  clienteId: string
  cotizacionId: string | null
  fechaEmision: string
  fechaVencimiento: string | null
  fechaPago: string | null
  estado: EstadoFactura
  socio: string
  descuento: number
  iva: number
  moneda: string
  vendedor: string | null
  formaPago: string | null
  garantia: string | null
  condiciones: string | null
  observaciones: string | null
  notasInternas: string | null
  metodoPago: string | null
  cliente: {
    id: string
    nombre: string
    empresa: string | null
    contactoNombre: string
    telefono: string
    email: string | null
    ciudad: string
  }
  cotizacion: { id: string; numero: string } | null
  items: {
    id: string
    descripcion: string
    nombre: string | null
    descripcionLarga: string | null
    sku: string | null
    unidad: string
    cantidad: number
    precioUnit: number
    descuento: number
    ivaTipo: string
    ivaPorcentaje: number
    subtotal: number
    orden: number
  }[]
  subtotalGeneral: number
  descuentoMonto: number
  subtotalConDescuento: number
  baseGravable: number
  ivaMonto: number
  total: number
}

const estadoTransitions: Record<string, EstadoFactura[]> = {
  BORRADOR: ['PENDIENTE'],
  PENDIENTE: ['PAGADA', 'VENCIDA', 'ANULADA'],
  EMITIDA: ['PAGADA', 'VENCIDA', 'ANULADA'],
  PAGADA: [],
  VENCIDA: ['ANULADA'],
  ANULADA: [],
}

const METODO_PAGO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

export default function FacturaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const id = params.id as string

  const [factura, setFactura] = useState<FacturaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchFactura = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/facturas/${id}`)
      if (res.ok) {
        const data = await res.json()
        setFactura(data)
      } else {
        toast.error('Factura no encontrada')
        router.push('/facturas')
      }
    } catch {
      toast.error('Error al cargar factura')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchFactura()
  }, [fetchFactura])

  const handleChangeEstado = async (nuevoEstado: EstadoFactura) => {
    if (!factura) return
    setActionLoading(true)
    try {
      const body: Record<string, unknown> = { estado: nuevoEstado, socio: user?.nombre ?? 'Sistema' }
      if (nuevoEstado === 'PAGADA') {
        body.fechaPago = new Date().toISOString()
      }
      const res = await fetch(`/api/facturas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cambiar estado')
      }
      toast.success(`Estado cambiado a ${ESTADO_FACTURA_LABELS[nuevoEstado]}`)
      fetchFactura()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/facturas/${id}?socio=${user?.nombre ?? 'Sistema'}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Factura eliminada')
      router.push('/facturas')
    } catch {
      toast.error('Error al eliminar factura')
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

  if (!factura) return null

  const availableTransitions = estadoTransitions[factura.estado] ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/facturas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{factura.numero}</h2>
            <StatusBadge type="factura" value={factura.estado} />
          </div>
          <p className="text-muted-foreground">
            {factura.cliente.nombre} {factura.cliente.empresa ? `— ${factura.cliente.empresa}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Change Estado */}
          {availableTransitions.length > 0 && (
            <Select onValueChange={(val) => handleChangeEstado(val as EstadoFactura)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Cambiar estado..." />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((est) => (
                  <SelectItem key={est} value={est}>
                    {ESTADO_FACTURA_LABELS[est]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Quick actions */}
          {(factura.estado === 'PENDIENTE' || factura.estado === 'EMITIDA') && (
            <Button
              onClick={() => handleChangeEstado('PAGADA')}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={actionLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {factura.estado === 'BORRADOR' && (
                <DropdownMenuItem onClick={() => setEditFormOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => window.open(`/api/facturas/${id}/pdf?preview=1`, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Previsualizar PDF
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Factura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Número</p>
                  <p className="font-mono font-medium">{factura.numero}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{factura.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contacto</p>
                  <p>{factura.cliente.contactoNombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha Emisión</p>
                  <p>{formatFecha(factura.fechaEmision)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p>{factura.fechaVencimiento ? formatFecha(factura.fechaVencimiento) : 'Sin vencimiento'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Socio</p>
                  <p>{getOperatorLabel(factura.socio)}</p>
                </div>
                {factura.metodoPago && (
                  <div>
                    <p className="text-xs text-muted-foreground">Método de Pago</p>
                    <p>{METODO_PAGO_LABELS[factura.metodoPago] || factura.metodoPago}</p>
                  </div>
                )}
                {factura.fechaPago && (
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Pago</p>
                    <p className="text-emerald-600 font-medium">{formatFecha(factura.fechaPago)}</p>
                  </div>
                )}
                {factura.cotizacion && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cotización</p>
                    <p className="font-mono text-sm">{factura.cotizacion.numero}</p>
                  </div>
                )}
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
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factura.items.map((item) => (
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

              <div className="space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCOP(factura.subtotalGeneral)}</span>
                </div>
                {factura.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento ({factura.descuento}%)</span>
                    <span className="text-red-500">-{formatCOP(factura.descuentoMonto)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span>{formatCOP(factura.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge type="factura" value={factura.estado} className="text-sm" />
                </div>
                {availableTransitions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Cambiar a:</p>
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
                          {ESTADO_FACTURA_LABELS[est]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {(factura.estado === 'PENDIENTE' || factura.estado === 'EMITIDA') && (
                  <div className="pt-2">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleChangeEstado('PAGADA')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registrar Pago
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(factura.observaciones || factura.notasInternas) && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {factura.observaciones && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Observaciones</p>
                    <p className="text-sm whitespace-pre-wrap">{factura.observaciones}</p>
                  </div>
                )}
                {factura.notasInternas && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Notas Internas</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{factura.notasInternas}</p>
                    </div>
                    <Badge variant="secondary" className="mt-1 text-[10px]">Solo interno</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {factura.estado === 'BORRADOR' && (
                <Button variant="outline" className="w-full justify-start" onClick={() => setEditFormOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Factura
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`/api/facturas/${id}/pdf?preview=1`, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Previsualizar PDF
              </Button>
              {(factura.estado === 'PENDIENTE' || factura.estado === 'EMITIDA') && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleChangeEstado('ANULADA')}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Anular Factura
                </Button>
              )}
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

      {factura && (
        <FacturaForm
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          factura={{
            id: factura.id,
            clienteId: factura.clienteId,
            fechaEmision: factura.fechaEmision,
            fechaVencimiento: factura.fechaVencimiento,
            descuento: factura.descuento,
            iva: factura.iva,
            moneda: factura.moneda,
            vendedor: factura.vendedor,
            formaPago: factura.formaPago,
            observaciones: factura.observaciones,
            garantia: factura.garantia,
            condiciones: factura.condiciones,
            notasInternas: factura.notasInternas,
            metodoPago: factura.metodoPago,
            items: factura.items.map((i) => ({
              nombre: i.nombre || i.descripcion,
              descripcion: i.descripcion,
              descripcionLarga: i.descripcionLarga || '',
              sku: i.sku || '',
              unidad: i.unidad || 'unidad',
              cantidad: i.cantidad,
              precioUnit: i.precioUnit,
              descuento: i.descuento || 0,
              ivaTipo: 'NO_RESPONSABLE',
              ivaPorcentaje: 0,
            })),
          }}
          onSuccess={fetchFactura}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Factura"
        description="¿Está seguro de eliminar esta factura? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
