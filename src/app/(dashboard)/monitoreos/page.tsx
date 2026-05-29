'use client'

import { useState, useEffect, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  Wrench,
  Loader2,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { MonitoreoForm } from '@/components/monitoreos/monitoreo-form'
import { MantenimientoForm } from '@/components/monitoreos/mantenimiento-form'
import { formatFecha } from '@/lib/format'
import { ESTADO_MONITOREO_LABELS, type EstadoMonitoreo } from '@/types'

interface MonitoreoRow {
  id: string
  cliente: { id: string; nombre: string; empresa: string | null; ciudad: string }
  kitId: string | null
  fechaInstalacion: string
  frecuenciaMantenimiento: number
  ultimoMantenimiento: string | null
  proximoMantenimiento: string | null
  estado: string
  observaciones: string | null
  mantenimientos: {
    id: string
    fecha: string
    socio: string
    descripcion: string
    observaciones: string | null
  }[]
}

interface MonitoreoDetail extends MonitoreoRow {
  cliente: {
    id: string
    nombre: string
    empresa: string | null
    ciudad: string
    contactoNombre: string
    telefono: string
    email: string | null
  }
}

const estadoOptions = Object.entries(ESTADO_MONITOREO_LABELS).map(([value, label]) => ({
  value,
  label,
}))

function isOverdue(proximoMantenimiento: string | null): boolean {
  if (!proximoMantenimiento) return false
  return new Date(proximoMantenimiento) < new Date()
}

function isWithinDays(proximoMantenimiento: string | null, days: number): boolean {
  if (!proximoMantenimiento) return false
  const target = new Date(proximoMantenimiento)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  const diffDays = diff / (1000 * 60 * 60 * 24)
  return diffDays > 0 && diffDays <= days
}

function getMaintenanceStatusColor(proximoMantenimiento: string | null): string | null {
  if (isOverdue(proximoMantenimiento)) return 'text-red-600 dark:text-red-400'
  if (isWithinDays(proximoMantenimiento, 7)) return 'text-amber-600 dark:text-amber-400'
  return null
}

function getMaintenanceStatusBg(proximoMantenimiento: string | null): string {
  if (isOverdue(proximoMantenimiento)) return 'bg-red-50 dark:bg-red-950/20'
  if (isWithinDays(proximoMantenimiento, 7)) return 'bg-amber-50 dark:bg-amber-950/20'
  return ''
}

export default function MonitoreosPage() {
  const [data, setData] = useState<MonitoreoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editMonitoreo, setEditMonitoreo] = useState<MonitoreoRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<MonitoreoDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [mantFormOpen, setMantFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/monitoreos')
      if (res.ok) {
        const monitoreos = await res.json()
        setData(monitoreos)
      }
    } catch {
      toast.error('Error al cargar monitoreos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openDetail = async (monitoreoId: string) => {
    setSelectedId(monitoreoId)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/monitoreos/${monitoreoId}`)
      if (res.ok) {
        const data = await res.json()
        setDetailData(data)
      }
    } catch {
      toast.error('Error al cargar detalle')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/monitoreos/${deleteId}?socio=Sistema`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Monitoreo eliminado')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Error al eliminar monitoreo')
    }
  }

  const columns: ColumnDef<MonitoreoRow>[] = [
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const cliente = row.original.cliente
        return (
          <div>
            <div className="font-medium">{cliente.nombre}</div>
            {cliente.empresa && (
              <div className="text-xs text-muted-foreground">{cliente.empresa}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'fechaInstalacion',
      header: 'Fecha Instalación',
      cell: ({ row }) => formatFecha(row.getValue('fechaInstalacion')),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge type="monitoreo" value={row.getValue('estado') as EstadoMonitoreo} />,
      filterFn: (row, _columnId, filterValue) => {
        return row.getValue('estado') === filterValue
      },
    },
    {
      accessorKey: 'frecuenciaMantenimiento',
      header: 'Frec. Mant.',
      cell: ({ row }) => `${row.getValue('frecuenciaMantenimiento')} días`,
    },
    {
      accessorKey: 'proximoMantenimiento',
      header: 'Próx. Mantenimiento',
      cell: ({ row }) => {
        const prox = row.original.proximoMantenimiento
        const colorClass = getMaintenanceStatusColor(prox)
        const bgClass = getMaintenanceStatusBg(prox)
        return (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${bgClass}`}>
            {(isOverdue(prox) || isWithinDays(prox, 7)) && (
              <AlertTriangle className={`h-3.5 w-3.5 ${colorClass}`} />
            )}
            <span className={colorClass ?? ''}>
              {prox ? formatFecha(prox) : 'N/A'}
            </span>
            {isOverdue(prox) && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1 py-0">
                Vencido
              </Badge>
            )}
            {!isOverdue(prox) && isWithinDays(prox, 7) && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1 py-0">
                Próximo
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openDetail(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Monitoreos</h2>
              <p className="text-sm text-muted-foreground">
                Instalaciones activas, mantenimientos y alertas operativas.
              </p>
            </div>
          </div>
          <Button onClick={() => { setEditMonitoreo(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Monitoreo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-md shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-2 text-2xl font-semibold">{data.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{data.filter((m) => m.estado === 'ACTIVO').length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Próximos 7 días</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{data.filter((m) => isWithinDays(m.proximoMantenimiento, 7)).length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">{data.filter((m) => isOverdue(m.proximoMantenimiento)).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alerts */}
      {data.filter((m) => isOverdue(m.proximoMantenimiento)).length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">
                {data.filter((m) => isOverdue(m.proximoMantenimiento)).length} monitoreo(s) con mantenimiento vencido
              </p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70">
                Revise los monitoreos y programe los mantenimientos pendientes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
          <Wrench className="h-12 w-12" />
          <p>No hay monitoreos registrados</p>
          <Button variant="outline" onClick={() => { setEditMonitoreo(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primer monitoreo
          </Button>
        </div>
      ) : (
        <Card className="rounded-md shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Listado de Monitoreos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data}
              searchPlaceholder="Buscar por cliente..."
              filterKey="estado"
              filterOptions={estadoOptions}
              pageSize={10}
            />
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form Dialog */}
      <MonitoreoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        monitoreo={editMonitoreo ? {
          id: editMonitoreo.id,
          clienteId: editMonitoreo.cliente.id,
          kitId: editMonitoreo.kitId,
          fechaInstalacion: editMonitoreo.fechaInstalacion,
          frecuenciaMantenimiento: editMonitoreo.frecuenciaMantenimiento,
          observaciones: editMonitoreo.observaciones,
        } : null}
        onSuccess={fetchData}
      />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Monitoreo</DialogTitle>
            <DialogDescription>
              {detailData?.cliente.nombre ?? 'Cargando...'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{detailData.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kit ID</p>
                  <p className="font-mono">{detailData.kitId ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <StatusBadge type="monitoreo" value={detailData.estado as EstadoMonitoreo} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha Instalación</p>
                  <p>{formatFecha(detailData.fechaInstalacion)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frecuencia</p>
                  <p>{detailData.frecuenciaMantenimiento} días</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último Mant.</p>
                  <p>{detailData.ultimoMantenimiento ? formatFecha(detailData.ultimoMantenimiento) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximo Mant.</p>
                  <div className="flex items-center gap-1">
                    <span className={getMaintenanceStatusColor(detailData.proximoMantenimiento) ?? ''}>
                      {detailData.proximoMantenimiento ? formatFecha(detailData.proximoMantenimiento) : 'N/A'}
                    </span>
                    {isOverdue(detailData.proximoMantenimiento) && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
                        Vencido
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {detailData.observaciones && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {detailData.observaciones}
                  </p>
                </div>
              )}

              <Separator />

              {/* Mantenimientos History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Historial de Mantenimientos</h3>
                  <Button
                    size="sm"
                    onClick={() => setMantFormOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Registrar Mantenimiento
                  </Button>
                </div>

                {detailData.mantenimientos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay mantenimientos registrados
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.mantenimientos.map((mant) => (
                        <TableRow key={mant.id}>
                          <TableCell className="whitespace-nowrap">{formatFecha(mant.fecha)}</TableCell>
                          <TableCell>{mant.socio}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{mant.descripcion}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground">
                            {mant.observaciones ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMonitoreo(detailData)
                    setDetailOpen(false)
                    setFormOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400"
                  onClick={() => {
                    setDeleteId(detailData.id)
                    setDetailOpen(false)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Mantenimiento Form Dialog */}
      {selectedId && (
        <MantenimientoForm
          open={mantFormOpen}
          onOpenChange={(open) => {
            setMantFormOpen(open)
            if (!open) {
              // Refresh detail data
              openDetail(selectedId)
              fetchData()
            }
          }}
          monitoreoId={selectedId}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Monitoreo"
        description="¿Está seguro de eliminar este monitoreo? Se eliminarán también todos los mantenimientos asociados."
        confirmText="Eliminar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
