'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  MessageSquarePlus,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  FileText,
  Activity,
  Package,
  Wrench,
  DollarSign,
  Clock,
  CheckSquare,
  FolderOpen,
  Calendar,
  Upload,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { StatusBadge } from '@/components/shared/status-badge'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { InteraccionForm } from '@/components/clientes/interaccion-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DocumentoUploader } from '@/components/documentos/documento-uploader'
import { useAuthStore } from '@/lib/auth-store'
import { formatCOP, formatFecha } from '@/lib/format'
import { ESTADO_CLIENTE_LABELS, type EstadoCliente, ESTADO_COTIZACION_LABELS, ESTADO_MONITOREO_LABELS, ESTADO_TAREA_LABELS, PRIORIDAD_COLORS, CATEGORIA_INVENTARIO_LABELS } from '@/types'

interface ClienteDetalle {
  id: string
  nombre: string
  empresa: string | null
  contactoNombre: string
  telefono: string
  email: string | null
  ciudad: string
  departamento: string
  tipoNegocio: string
  estado: string
  socioResponsable: string
  notas: string | null
  createdAt: string
  updatedAt: string
  interacciones: Array<{
    id: string
    tipo: string
    descripcion: string
    fecha: string
    socio: string
    proximaAccion: string | null
    fechaProxima: string | null
  }>
  monitoreos: Array<{
    id: string
    kitId: string | null
    fechaInstalacion: string
    frecuenciaMantenimiento: number
    ultimoMantenimiento: string | null
    proximoMantenimiento: string | null
    estado: string
    observaciones: string | null
    mantenimientos: Array<{
      id: string
      fecha: string
      socio: string
      descripcion: string
      observaciones: string | null
    }>
  }>
  cotizaciones: Array<{
    id: string
    numero: string
    fechaEmision: string
    fechaVencimiento: string | null
    estado: string
    socio: string
    descuento: number
    iva: number
    observaciones: string | null
    notasInternas: string | null
    items: Array<{
      id: string
      descripcion: string
      cantidad: number
      precioUnit: number
      subtotal: number
    }>
  }>
  transacciones: Array<{
    id: string
    tipo: string
    categoria: string
    descripcion: string
    monto: number
    socio: string
    metodoPago: string | null
    fecha: string
  }>
  tareas: Array<{
    id: string
    titulo: string
    descripcion: string | null
    asignadoA: string
    prioridad: string
    fechaLimite: string | null
    estado: string
  }>
  documentos: Array<{
    id: string
    nombre: string
    tipo: string
    descripcion: string | null
    socio: string
    fechaDocumento: string | null
  }>
  movimientosInventario: Array<{
    id: string
    tipo: string
    cantidad: number
    fecha: string
    descripcion: string
    socio: string
    item: {
      id: string
      nombre: string
      categoria: string
      unidad: string
      costoUnitario: number
    }
  }>
}

const TIPOS_NEGOCIO_LABELS: Record<string, string> = {
  piscicultura: 'Piscicultura',
  camaronicultura: 'Camaronicultura',
  agricultura: 'Agricultura',
  otro: 'Otro',
}

const TIPOS_INTERACCION_LABELS: Record<string, string> = {
  llamada: 'Llamada',
  visita: 'Visita',
  cotizacion_enviada: 'Cotización Enviada',
  instalacion: 'Instalación',
  mantenimiento: 'Mantenimiento',
  nota: 'Nota',
}

const TIPOS_INTERACCION_COLORS: Record<string, string> = {
  llamada: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  visita: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cotizacion_enviada: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  instalacion: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  mantenimiento: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  nota: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function ClienteDetallePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const clienteId = params.id as string

  const [editOpen, setEditOpen] = useState(false)
  const [interaccionOpen, setInteraccionOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<string>('')
  const [uploadOpen, setUploadOpen] = useState(false)

  const socio = useMemo(() => {
    if (!user?.email) return 'socioA'
    return user.email.startsWith('socioB') ? 'socioB' : 'socioA'
  }, [user?.email])

  const { data: cliente, isLoading, refetch } = useQuery<ClienteDetalle>({
    queryKey: ['cliente', clienteId],
    queryFn: async () => {
      const res = await fetch(`/api/clientes/${clienteId}`)
      if (!res.ok) throw new Error('Error al cargar cliente')
      return res.json()
    },
    enabled: !!clienteId,
  })

  const handleCambiarEstado = async () => {
    if (!nuevoEstado || !cliente) return
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, socioResponsable: cliente.socioResponsable }),
      })
      if (!res.ok) throw new Error('Error al cambiar estado')
      toast.success('Estado actualizado')
      setEstadoDialogOpen(false)
      refetch()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!cliente) return
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Cliente eliminado')
      router.push('/clientes')
    } catch {
      toast.error('Error al eliminar cliente')
    }
  }

  if (isLoading) {
    return <ClienteDetalleSkeleton />
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="outline" onClick={() => router.push('/clientes')}>
          Volver a Clientes
        </Button>
      </div>
    )
  }

  const ingresos = cliente.transacciones.filter((t) => t.tipo === 'INGRESO')
  const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0)

  // Flatten all mantenimientos from all monitoreos
  const allMantenimientos = cliente.monitoreos.flatMap((m) =>
    m.mantenimientos.map((mant) => ({
      ...mant,
      monitoreoId: m.id,
      kitId: m.kitId,
    }))
  ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.push('/clientes')} className="cursor-pointer">
              Clientes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{cliente.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/clientes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">{cliente.nombre}</h2>
              <StatusBadge type="cliente" value={cliente.estado} />
            </div>
            {cliente.empresa && (
              <p className="text-muted-foreground text-sm">{cliente.empresa}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEstadoDialogOpen(true)} className="gap-2">
            <Activity className="h-4 w-4" />
            Cambiar Estado
          </Button>
          <Button size="sm" onClick={() => setInteraccionOpen(true)} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Registrar Interacción
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="info" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5 hidden sm:block" />
            Información
          </TabsTrigger>
          <TabsTrigger value="cotizaciones" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 hidden sm:block" />
            Cotizaciones
          </TabsTrigger>
          <TabsTrigger value="monitoreos" className="gap-1.5 text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 hidden sm:block" />
            Monitoreos
          </TabsTrigger>
          <TabsTrigger value="inventario" className="gap-1.5 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 hidden sm:block" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="mantenimientos" className="gap-1.5 text-xs sm:text-sm">
            <Wrench className="h-3.5 w-3.5 hidden sm:block" />
            Mantenimientos
          </TabsTrigger>
          <TabsTrigger value="ingresos" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-3.5 w-3.5 hidden sm:block" />
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="interacciones" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 hidden sm:block" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="tareas" className="gap-1.5 text-xs sm:text-sm">
            <CheckSquare className="h-3.5 w-3.5 hidden sm:block" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5 text-xs sm:text-sm">
            <FolderOpen className="h-3.5 w-3.5 hidden sm:block" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información General</CardTitle>
              <CardDescription>Datos principales del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoField icon={User} label="Nombre" value={cliente.nombre} />
                <InfoField icon={Building2} label="Empresa" value={cliente.empresa} />
                <InfoField icon={User} label="Contacto" value={cliente.contactoNombre} />
                <InfoField icon={Phone} label="Teléfono" value={cliente.telefono} />
                <InfoField icon={Mail} label="Email" value={cliente.email} />
                <InfoField icon={MapPin} label="Ciudad" value={cliente.ciudad} />
                <InfoField icon={MapPin} label="Departamento" value={cliente.departamento} />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tipo de Negocio</p>
                  <p className="font-medium">{TIPOS_NEGOCIO_LABELS[cliente.tipoNegocio] || cliente.tipoNegocio}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <StatusBadge type="cliente" value={cliente.estado} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Socio Responsable</p>
                  <p className="font-medium">{cliente.socioResponsable === 'socioA' ? 'Socio A' : 'Socio B'}</p>
                </div>
                <InfoField icon={Calendar} label="Fecha Primer Contacto" value={formatFecha(cliente.createdAt)} />
              </div>
              {cliente.notas && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Notas</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{cliente.notas}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cotizaciones */}
        <TabsContent value="cotizaciones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Cotizaciones</CardTitle>
                <CardDescription>{cliente.cotizaciones.length} cotización(es) registrada(s)</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {cliente.cotizaciones.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cliente.cotizaciones.map((cot) => {
                        const subtotal = cot.items.reduce((sum, item) => sum + item.subtotal, 0)
                        const descuentoVal = subtotal * (cot.descuento / 100)
                        const conDescuento = subtotal - descuentoVal
                        const ivaVal = conDescuento * (cot.iva / 100)
                        const total = conDescuento + ivaVal
                        return (
                          <TableRow key={cot.id}>
                            <TableCell className="font-medium">{cot.numero}</TableCell>
                            <TableCell>{formatFecha(cot.fechaEmision)}</TableCell>
                            <TableCell>
                              <StatusBadge type="cotizacion" value={cot.estado} />
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCOP(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState message="No hay cotizaciones registradas" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Monitoreos */}
        <TabsContent value="monitoreos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monitoreos</CardTitle>
              <CardDescription>{cliente.monitoreos.length} monitoreo(s) registrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {cliente.monitoreos.length > 0 ? (
                <div className="space-y-4">
                  {cliente.monitoreos.map((mon) => (
                    <Card key={mon.id} className="border-l-4 border-l-sky-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Kit: {mon.kitId || 'Sin kit'}</span>
                            <StatusBadge type="monitoreo" value={mon.estado} />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Frecuencia: cada {mon.frecuenciaMantenimiento} días
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Fecha Instalación</p>
                            <p className="font-medium">{formatFecha(mon.fechaInstalacion)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Último Mantenimiento</p>
                            <p className="font-medium">{mon.ultimoMantenimiento ? formatFecha(mon.ultimoMantenimiento) : '—'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Próximo Mantenimiento</p>
                            <p className="font-medium">{mon.proximoMantenimiento ? formatFecha(mon.proximoMantenimiento) : '—'}</p>
                          </div>
                        </div>
                        {mon.observaciones && (
                          <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                            {mon.observaciones}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState message="No hay monitoreos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inventario Asignado */}
        <TabsContent value="inventario">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventario Asignado</CardTitle>
              <CardDescription>Kits y materiales usados en instalaciones para este cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {cliente.movimientosInventario && cliente.movimientosInventario.length > 0 ? (
                <>
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ítem</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Tipo Mov.</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cliente.movimientosInventario.map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell className="font-medium">{mov.item.nombre}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="border-0 text-xs">
                                {CATEGORIA_INVENTARIO_LABELS[mov.item.categoria as keyof typeof CATEGORIA_INVENTARIO_LABELS] || mov.item.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell>{mov.cantidad} {mov.item.unidad}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`border-0 text-xs ${
                                  mov.tipo === 'SALIDA_INSTALACION'
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}
                              >
                                {mov.tipo === 'SALIDA_INSTALACION' ? 'Instalación' : 'Venta'}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatFecha(mov.fecha)}</TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground">{mov.descripcion}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total ítems asignados: {cliente.movimientosInventario.length}
                    </span>
                    <span className="text-sm font-medium">
                      Valor estimado: {formatCOP(
                        cliente.movimientosInventario.reduce((sum, mov) => sum + (mov.cantidad * mov.item.costoUnitario), 0)
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <EmptyState message="No hay ítems de inventario asignados a este cliente aún. Los movimientos de stock vinculados a este cliente aparecerán aquí." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mantenimientos */}
        <TabsContent value="mantenimientos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Mantenimientos</CardTitle>
              <CardDescription>{allMantenimientos.length} mantenimiento(s) registrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {allMantenimientos.length > 0 ? (
                <ScrollArea className="max-h-96">
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
                      {allMantenimientos.map((mant) => (
                        <TableRow key={mant.id}>
                          <TableCell className="whitespace-nowrap">{formatFecha(mant.fecha)}</TableCell>
                          <TableCell>{mant.socio === 'socioA' ? 'Socio A' : 'Socio B'}</TableCell>
                          <TableCell className="max-w-xs truncate">{mant.descripcion}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {mant.observaciones || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState message="No hay mantenimientos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ingresos */}
        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos</CardTitle>
              <CardDescription>{ingresos.length} ingreso(s) registrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {ingresos.length > 0 ? (
                <>
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Método Pago</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingresos.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap">{formatFecha(tx.fecha)}</TableCell>
                            <TableCell className="capitalize">{tx.categoria.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="max-w-xs truncate">{tx.descripcion}</TableCell>
                            <TableCell className="capitalize">{tx.metodoPago || '—'}</TableCell>
                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCOP(tx.monto)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Ingresos</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCOP(totalIngresos)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState message="No hay ingresos registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial de Interacciones */}
        <TabsContent value="interacciones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Historial de Interacciones</CardTitle>
                <CardDescription>{cliente.interacciones.length} interacción(es) registrada(s)</CardDescription>
              </div>
              <Button size="sm" onClick={() => setInteraccionOpen(true)} className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {cliente.interacciones.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <div className="space-y-4">
                    {cliente.interacciones.map((inter, idx) => (
                      <div key={inter.id} className="relative pl-8 pb-4">
                        {/* Timeline line */}
                        {idx < cliente.interacciones.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
                        )}
                        {/* Timeline dot */}
                        <div className={`absolute left-1 top-1 w-5 h-5 rounded-full flex items-center justify-center ${TIPOS_INTERACCION_COLORS[inter.tipo] || 'bg-gray-100 text-gray-800'}`}>
                          <span className="text-[10px] font-bold">
                            {inter.tipo === 'llamada' ? 'L' : inter.tipo === 'visita' ? 'V' : inter.tipo === 'nota' ? 'N' : 'I'}
                          </span>
                        </div>
                        <div className="ml-2">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="secondary" className={`border-0 text-xs ${TIPOS_INTERACCION_COLORS[inter.tipo] || ''}`}>
                              {TIPOS_INTERACCION_LABELS[inter.tipo] || inter.tipo}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFecha(inter.fecha)} · {inter.socio === 'socioA' ? 'Socio A' : 'Socio B'}
                            </span>
                          </div>
                          <p className="text-sm">{inter.descripcion}</p>
                          {inter.proximaAccion && (
                            <div className="mt-2 p-2 bg-sky-50 dark:bg-sky-900/20 rounded text-sm">
                              <span className="font-medium text-sky-700 dark:text-sky-400">Próxima acción: </span>
                              <span className="text-sky-600 dark:text-sky-300">{inter.proximaAccion}</span>
                              {inter.fechaProxima && (
                                <span className="text-sky-500 dark:text-sky-400 ml-2">({formatFecha(inter.fechaProxima)})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <EmptyState message="No hay interacciones registradas" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tareas */}
        <TabsContent value="tareas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tareas</CardTitle>
              <CardDescription>{cliente.tareas.length} tarea(s) vinculada(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {cliente.tareas.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Asignado</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Fecha Límite</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cliente.tareas.map((tarea) => (
                        <TableRow key={tarea.id}>
                          <TableCell className="font-medium">{tarea.titulo}</TableCell>
                          <TableCell>{tarea.asignadoA === 'socioA' ? 'Socio A' : tarea.asignadoA === 'socioB' ? 'Socio B' : tarea.asignadoA}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`border-0 ${PRIORIDAD_COLORS[tarea.prioridad as keyof typeof PRIORIDAD_COLORS] || ''}`}>
                              {tarea.prioridad}
                            </Badge>
                          </TableCell>
                          <TableCell>{tarea.fechaLimite ? formatFecha(tarea.fechaLimite) : '—'}</TableCell>
                          <TableCell>
                            <StatusBadge type="tarea" value={tarea.estado} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState message="No hay tareas vinculadas" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Documentos</CardTitle>
                <CardDescription>{cliente.documentos.length} documento(s) registrado(s)</CardDescription>
              </div>
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </CardHeader>
            <CardContent>
              {cliente.documentos.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cliente.documentos.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.nombre}</TableCell>
                          <TableCell className="capitalize">{doc.tipo.replace(/_/g, ' ').toLowerCase()}</TableCell>
                          <TableCell>{doc.fechaDocumento ? formatFecha(doc.fechaDocumento) : '—'}</TableCell>
                          <TableCell>{doc.socio === 'socioA' ? 'Socio A' : 'Socio B'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Descargar"
                              onClick={() => window.open(`/api/documentos/${doc.id}/descargar`, '_blank')}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState message="No hay documentos vinculados a este cliente" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <ClienteForm
        open={editOpen}
        onOpenChange={setEditOpen}
        cliente={cliente}
        onSuccess={() => refetch()}
      />

      {/* Interaction Form Dialog */}
      <InteraccionForm
        open={interaccionOpen}
        onOpenChange={setInteraccionOpen}
        clienteId={cliente.id}
        socio={socio}
        onSuccess={() => refetch()}
      />

      {/* Change Estado Dialog */}
      <ConfirmDialog
        open={estadoDialogOpen}
        onOpenChange={setEstadoDialogOpen}
        title="Cambiar Estado del Cliente"
        description={`Estado actual: ${ESTADO_CLIENTE_LABELS[cliente.estado as EstadoCliente] || cliente.estado}`}
        onConfirm={handleCambiarEstado}
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Selecciona el nuevo estado:</p>
          <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADO_CLIENTE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ConfirmDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Cliente"
        description="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer y se eliminarán todas las interacciones, monitoreos y cotizaciones asociadas."
        onConfirm={handleDelete}
        destructive
      />

      {/* Document Upload Dialog */}
      <DocumentoUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultClienteId={cliente.id}
        onSuccess={() => {
          setUploadOpen(false)
          refetch()
        }}
      />
    </div>
  )
}

function InfoField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

function ClienteDetalleSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
