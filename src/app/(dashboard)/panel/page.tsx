'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Users,
  Wrench,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Package,
  CheckSquare,
  Droplets,
  Receipt,
  FolderOpen,
  ClipboardList,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCOP, formatFecha, formatFechaHora } from '@/lib/format'
import { getOperatorLabel } from '@/lib/operator'

interface DashboardData {
  metrics: {
    clientesActivos: number
    kitsInstalados: number
    mantenimientosProximos: number
    cotizacionesPendientes: number
    ingresosDelMes: number
    gastosDelMes: number
    utilidadBrutaDelMes: number
  }
  alerts: {
    clientesSinActividad: Array<{
      id: string
      nombre: string
      estado: string
      updatedAt: string
      interacciones: Array<{ fecha: string }>
    }>
    monitoreosMantenimiento: Array<{
      id: string
      kitId: string | null
      proximoMantenimiento: string | null
      cliente: { nombre: string }
    }>
    inventarioBajo: Array<{
      id: string
      nombre: string
      stockActual: number
      stockMinimo: number
      unidad: string
    }>
    tareasVencidas: Array<{
      id: string
      titulo: string
      fechaLimite: string | null
      cliente: { nombre: string } | null
    }>
  }
  charts: {
    ingresosGastos: Array<{ mes: string; ingresos: number; gastos: number }>
    clientesPorEstado: Array<{ estado: string; cantidad: number; estadoOriginal: string }>
    cotizacionesPorMes: Array<{ mes: string; enviadas: number; aceptadas: number; perdidas: number }>
  }
  actividadReciente: Array<{
    id: string
    socio: string
    modulo: string
    accion: string
    entidadId: string | null
    detalle: string | null
    createdAt: string
  }>
}

const METRIC_CARDS = [
  { key: 'clientesActivos' as const, label: 'Clientes Activos', helper: '(activos)', icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', border: 'border-l-sky-500', format: 'number' },
  { key: 'kitsInstalados' as const, label: 'Kits Instalados', helper: '(activos)', icon: Droplets, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-l-emerald-500', format: 'number' },
  { key: 'mantenimientosProximos' as const, label: 'Mantenimientos Próximos', helper: '(7 días)', icon: Wrench, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-l-amber-500', format: 'number' },
  { key: 'cotizacionesPendientes' as const, label: 'Cotizaciones Pendientes', helper: '(abiertas)', icon: FileText, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', border: 'border-l-violet-500', format: 'number' },
  { key: 'ingresosDelMes' as const, label: 'Ingresos del Mes', helper: '(este mes)', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-l-emerald-500', format: 'money' },
  { key: 'gastosDelMes' as const, label: 'Gastos del Mes', helper: '(este mes)', icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-l-red-500', format: 'money' },
  { key: 'utilidadBrutaDelMes' as const, label: 'Utilidad Bruta', helper: '(este mes)', icon: DollarSign, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', border: 'border-l-sky-500', format: 'money' },
]

const PIE_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444']

const CHART_COLORS = {
  ingresos: '#10b981',
  gastos: '#ef4444',
  enviadas: '#0ea5e9',
  aceptadas: '#10b981',
  perdidas: '#ef4444',
}

const MODULE_META = {
  clientes: { label: 'Clientes', href: '/clientes', icon: Users },
  cotizaciones: { label: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
  facturas: { label: 'Facturas', href: '/facturas', icon: Receipt },
  monitoreos: { label: 'Monitoreos', href: '/monitoreos', icon: Wrench },
  mantenimientos: { label: 'Mantenimientos', href: '/monitoreos', icon: Wrench },
  inventario: { label: 'Inventario', href: '/inventario', icon: Package },
  finanzas: { label: 'Finanzas', href: '/finanzas', icon: DollarSign },
  documentos: { label: 'Documentos', href: '/documentos', icon: FolderOpen },
  tareas: { label: 'Tareas', href: '/tareas', icon: CheckSquare },
  bitacora: { label: 'Bitácora', href: '/bitacora', icon: ClipboardList },
} as const

function getModuleMeta(modulo: string) {
  const key = modulo.toLowerCase() as keyof typeof MODULE_META
  return MODULE_META[key] ?? {
    label: modulo.replaceAll('_', ' '),
    href: '/bitacora',
    icon: ClipboardList,
  }
}

function getEventHref(evento: DashboardData['actividadReciente'][number]) {
  const meta = getModuleMeta(evento.modulo)
  if (!evento.entidadId) return meta.href

  const key = evento.modulo.toLowerCase()
  if (key === 'clientes') return `/clientes/${evento.entidadId}`
  if (key === 'cotizaciones') return `/cotizaciones/${evento.entidadId}`
  if (key === 'facturas') return `/facturas/${evento.entidadId}`

  return meta.href
}

function getAccessLabel(socio: string) {
  return getOperatorLabel(socio)
}

function getReadableAction(evento: DashboardData['actividadReciente'][number]) {
  const modulo = getModuleMeta(evento.modulo).label.toLowerCase()
  const accion = evento.accion.toLowerCase()

  if (accion.includes('crear')) return `Creó ${modulo}`
  if (accion.includes('actualizar') || accion.includes('editar')) return `Actualizó ${modulo}`
  if (accion.includes('eliminar')) return `Eliminó ${modulo}`
  if (accion.includes('cambiar_estado')) return 'Cambió estado'
  if (accion.includes('subir')) return 'Subió documento'

  return accion.replaceAll('_', ' ')
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Error al cargar datos')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Error al cargar los datos del dashboard</p>
      </div>
    )
  }

  const { metrics, alerts, charts, actividadReciente } = data

  const totalAlerts =
    alerts.clientesSinActividad.length +
    alerts.monitoreosMantenimiento.length +
    alerts.inventarioBajo.length +
    alerts.tareasVencidas.length

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panel de Control</h2>
        <p className="text-muted-foreground">
          Resumen general de AgroEve
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {METRIC_CARDS.map((card) => {
          const value = metrics[card.key]
          return (
            <Card key={card.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.bg}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{card.label}</p>
                    <p className="text-xl font-bold">
                      {card.format === 'money' ? formatCOP(value) : value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Alerts section */}
      {totalAlerts > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Alertas</CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                {totalAlerts}
              </Badge>
            </div>
            <CardDescription>Elementos que requieren atencion</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-72 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alerts.clientesSinActividad.length > 0 && (
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      Sin actividad
                    </h4>
                    <div className="space-y-1">
                      {alerts.clientesSinActividad.map((c) => (
                        <Link key={c.id} href={`/clientes/${c.id}`}
                          className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <StatusBadge type="cliente" value={c.estado} />
                            <span className="font-medium truncate">{c.nombre}</span>
                          </div>
                          <span className="text-muted-foreground text-[11px] shrink-0">
                            {c.interacciones[0] ? formatFecha(c.interacciones[0].fecha) : '—'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {alerts.monitoreosMantenimiento.length > 0 && (
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="h-3 w-3" />
                      Mantenimiento
                    </h4>
                    <div className="space-y-1">
                      {alerts.monitoreosMantenimiento.map((m) => {
                        const isOverdue = m.proximoMantenimiento && new Date(m.proximoMantenimiento) < new Date()
                        return (
                          <Link key={m.id} href="/monitoreos"
                            className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-amber-500'}`} />
                              <span className="font-medium truncate">{m.cliente.nombre}</span>
                            </div>
                            <span className="text-muted-foreground text-[11px] shrink-0">
                              {m.proximoMantenimiento ? formatFecha(m.proximoMantenimiento) : '—'}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {alerts.inventarioBajo.length > 0 && (
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-3 w-3" />
                      Stock bajo
                    </h4>
                    <div className="space-y-1">
                      {alerts.inventarioBajo.map((item) => (
                        <Link key={item.id} href="/inventario"
                          className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-w-0">
                          <span className="font-medium truncate">{item.nombre}</span>
                          <span className="text-red-600 dark:text-red-400 text-[11px] font-medium shrink-0">
                            {item.stockActual}/{item.stockMinimo} {item.unidad}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {alerts.tareasVencidas.length > 0 && (
                  <div className="space-y-2 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="h-3 w-3" />
                      Tareas vencidas
                    </h4>
                    <div className="space-y-1">
                      {alerts.tareasVencidas.map((t) => (
                        <Link key={t.id} href="/tareas"
                          className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                            <span className="font-medium truncate">{t.titulo}</span>
                          </div>
                          <span className="text-red-600 dark:text-red-400 text-[11px] shrink-0">
                            {t.fechaLimite ? formatFecha(t.fechaLimite) : '—'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.ingresosGastos} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill={CHART_COLORS.ingresos} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill={CHART_COLORS.gastos} radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clientes por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes por Estado</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.clientesPorEstado}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {charts.clientesPorEstado.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cotizaciones chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Cotizaciones por Mes</CardTitle>
          <CardDescription>Enviadas vs Aceptadas vs Perdidas - Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.cotizacionesPorMes} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <Bar dataKey="enviadas" name="Enviadas" fill={CHART_COLORS.enviadas} radius={[4, 4, 0, 0]} />
                <Bar dataKey="aceptadas" name="Aceptadas" fill={CHART_COLORS.aceptadas} radius={[4, 4, 0, 0]} />
                <Bar dataKey="perdidas" name="Perdidas" fill={CHART_COLORS.perdidas} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </div>
          <CardDescription>Últimos eventos registrados en la bitácora</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden px-0 pb-0">
          <ScrollArea className="h-96 overflow-hidden px-6 pb-6">
            {actividadReciente.length > 0 ? (
              <div className="space-y-2">
                {actividadReciente.map((evento) => {
                  const moduleMeta = getModuleMeta(evento.modulo)
                  const ModuleIcon = moduleMeta.icon

                  return (
                    <Link
                      key={evento.id}
                      href={getEventHref(evento)}
                      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border bg-card/60 p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ModuleIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 space-y-1">
                        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold leading-5">{moduleMeta.label}</span>
                          <span className="text-xs leading-5 text-muted-foreground">{getReadableAction(evento)}</span>
                        </span>
                        {evento.detalle && (
                          <span className="block break-words text-sm leading-5 text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                            {evento.detalle}
                          </span>
                        )}
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[11px] font-medium">
                            {getAccessLabel(evento.socio)}
                          </Badge>
                          <span>{formatFechaHora(evento.createdAt)}</span>
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay actividad reciente
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
