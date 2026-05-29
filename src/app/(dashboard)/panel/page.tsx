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
    detalle: string | null
    createdAt: string
  }>
}

const METRIC_CARDS = [
  { key: 'clientesActivos' as const, label: 'Clientes Activos', icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', format: 'number' },
  { key: 'kitsInstalados' as const, label: 'Kits Instalados', icon: Droplets, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', format: 'number' },
  { key: 'mantenimientosProximos' as const, label: 'Mantenimientos Próximos', icon: Wrench, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', format: 'number' },
  { key: 'cotizacionesPendientes' as const, label: 'Cotizaciones Pendientes', icon: FileText, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', format: 'number' },
  { key: 'ingresosDelMes' as const, label: 'Ingresos del Mes', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', format: 'money' },
  { key: 'gastosDelMes' as const, label: 'Gastos del Mes', icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', format: 'money' },
  { key: 'utilidadBrutaDelMes' as const, label: 'Utilidad Bruta', icon: DollarSign, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', format: 'money' },
]

const PIE_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444']

const CHART_COLORS = {
  ingresos: '#10b981',
  gastos: '#ef4444',
  enviadas: '#0ea5e9',
  aceptadas: '#10b981',
  perdidas: '#ef4444',
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
        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Alertas</CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                {totalAlerts}
              </Badge>
            </div>
            <CardDescription>Elementos que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-4">
                {/* Clients without activity */}
                {alerts.clientesSinActividad.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Clientes sin actividad reciente
                    </h4>
                    <div className="space-y-1.5">
                      {alerts.clientesSinActividad.map((c) => (
                        <Link key={c.id} href={`/clientes/${c.id}`}
                          className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{c.nombre}</span>
                            <StatusBadge type="cliente" value={c.estado} />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            Última interacción: {c.interacciones[0] ? formatFecha(c.interacciones[0].fecha) : 'Sin registros'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming/overdue maintenance */}
                {alerts.monitoreosMantenimiento.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5" />
                      Mantenimientos próximos o vencidos
                    </h4>
                    <div className="space-y-1.5">
                      {alerts.monitoreosMantenimiento.map((m) => {
                        const isOverdue = m.proximoMantenimiento && new Date(m.proximoMantenimiento) < new Date()
                        return (
                          <Link key={m.id} href="/monitoreos"
                            className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs">
                                {isOverdue ? 'Vencido' : 'Próximo'}
                              </Badge>
                              <span className="font-medium">{m.cliente.nombre}</span>
                              <span className="text-muted-foreground">({m.kitId ?? 'Sin kit'})</span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {m.proximoMantenimiento ? formatFecha(m.proximoMantenimiento) : 'Sin fecha'}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Low stock */}
                {alerts.inventarioBajo.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Package className="h-3.5 w-3.5" />
                      Inventario bajo mínimo
                    </h4>
                    <div className="space-y-1.5">
                      {alerts.inventarioBajo.map((item) => (
                        <Link key={item.id} href="/inventario"
                          className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <span className="font-medium">{item.nombre}</span>
                          <span className="text-red-600 dark:text-red-400 text-xs font-medium">
                            {item.stockActual} / {item.stockMinimo} {item.unidad}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overdue tasks */}
                {alerts.tareasVencidas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Tareas vencidas
                    </h4>
                    <div className="space-y-1.5">
                      {alerts.tareasVencidas.map((t) => (
                        <Link key={t.id} href="/tareas"
                          className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{t.titulo}</span>
                            {t.cliente && (
                              <span className="text-muted-foreground">({t.cliente.nombre})</span>
                            )}
                          </div>
                          <span className="text-red-600 dark:text-red-400 text-xs">
                            Vencida: {t.fechaLimite ? formatFecha(t.fechaLimite) : 'Sin fecha'}
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
      <Card>
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
        <CardContent>
          <ScrollArea className="max-h-72">
            {actividadReciente.length > 0 ? (
              <div className="space-y-3">
                {actividadReciente.map((evento) => (
                  <div
                    key={evento.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 mt-0.5 shrink-0">
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                        {evento.socio.replace('socio', '').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">
                          {evento.modulo}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {evento.accion.replace('_', ' ')}
                        </Badge>
                      </div>
                      {evento.detalle && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {evento.detalle}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFechaHora(evento.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
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
