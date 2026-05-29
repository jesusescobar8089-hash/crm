'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatCOP, formatFecha } from '@/lib/format'
import { TIPO_TRANSACCION_LABELS, type TipoTransaccion } from '@/types'
import { TransaccionForm } from '@/components/finanzas/transaccion-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/auth-store'
import {
  Plus,
  MoreHorizontal,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const CATEGORIA_INGRESO_LABELS: Record<string, string> = {
  venta_kit: 'Venta Kit',
  instalacion: 'Instalación',
  mantenimiento: 'Mantenimiento',
  suscripcion: 'Suscripción',
  otro: 'Otro',
}

const CATEGORIA_GASTO_LABELS: Record<string, string> = {
  componentes: 'Componentes',
  materiales: 'Materiales',
  transporte: 'Transporte',
  arriendo: 'Arriendo',
  servicios: 'Servicios',
  nomina: 'Nómina',
  otro: 'Otro',
}

const METODO_PAGO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}

const SOCIOS_LABELS: Record<string, string> = {
  socioA: 'Carlos Méndez',
  socioB: 'María López',
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']

interface ResumenData {
  ingresosMes: number
  gastosMes: number
  utilidadMes: number
  ingresosAnio: number
  gastosAnio: number
  utilidadAnio: number
  balanceSocios: { socio: string; aportado: number; retirado: number; saldo: number }[]
  utilidadPorSocio: number
  chartMeses: { mes: string; ingresos: number; gastos: number }[]
  chartGastosCategoria: { categoria: string; monto: number }[]
  chartIngresosCategoria: { categoria: string; monto: number }[]
}

interface Transaccion {
  id: string
  tipo: string
  categoria: string
  descripcion: string
  monto: number
  socio: string
  metodoPago: string | null
  clienteId: string | null
  cliente?: { nombre: string } | null
  cotizacionId: string | null
  fecha: string
  createdAt: string
}

export default function FinanzasPage() {
  const { user } = useAuthStore()
  const currentDate = new Date()
  const [activeTab, setActiveTab] = useState('resumen')
  const [resumen, setResumen] = useState<ResumenData | null>(null)
  const [ingresos, setIngresos] = useState<Transaccion[]>([])
  const [gastos, setGastos] = useState<Transaccion[]>([])
  const [aportes, setAportes] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)

  // Period filter
  const [mesFiltro, setMesFiltro] = useState(currentDate.getMonth() + 1)
  const [anioFiltro, setAnioFiltro] = useState(currentDate.getFullYear())

  // Transaction form
  const [transaccionFormOpen, setTransaccionFormOpen] = useState(false)
  const [tipoTransaccion, setTipoTransaccion] = useState<TipoTransaccion>('INGRESO')

  // Delete
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaccion | null>(null)

  // Text filters (client-side, on top of server-filtered data)
  const [ingresoSearch, setIngresoSearch] = useState('')
  const [gastoSearch, setGastoSearch] = useState('')

  const fetchResumen = useCallback(async () => {
    try {
      const res = await fetch(`/api/finanzas?tipo=resumen&mes=${mesFiltro}&anio=${anioFiltro}`)
      if (res.ok) {
        const data = await res.json()
        setResumen(data)
      }
    } catch {
      toast.error('Error al cargar resumen')
    }
  }, [mesFiltro, anioFiltro])

  const fetchIngresos = useCallback(async () => {
    try {
      const res = await fetch(`/api/finanzas?tipo=ingresos&mes=${mesFiltro}&anio=${anioFiltro}`)
      if (res.ok) {
        const data = await res.json()
        setIngresos(data)
      }
    } catch {
      toast.error('Error al cargar ingresos')
    }
  }, [mesFiltro, anioFiltro])

  const fetchGastos = useCallback(async () => {
    try {
      const res = await fetch(`/api/finanzas?tipo=gastos&mes=${mesFiltro}&anio=${anioFiltro}`)
      if (res.ok) {
        const data = await res.json()
        setGastos(data)
      }
    } catch {
      toast.error('Error al cargar gastos')
    }
  }, [mesFiltro, anioFiltro])

  const fetchAportes = useCallback(async () => {
    try {
      const res = await fetch('/api/finanzas?tipo=aportes')
      if (res.ok) {
        const data = await res.json()
        setAportes(data)
      }
    } catch {
      toast.error('Error al cargar aportes')
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchResumen(), fetchIngresos(), fetchGastos(), fetchAportes()])
      setLoading(false)
    }
    loadData()
  }, [fetchResumen, fetchIngresos, fetchGastos, fetchAportes])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/transacciones/${deleteTarget.id}?socio=${user?.nombre || 'sistema'}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Transacción eliminada')
      setDeleteDialog(false)
      setDeleteTarget(null)
      fetchResumen()
      fetchIngresos()
      fetchGastos()
      fetchAportes()
    } catch {
      toast.error('Error al eliminar transacción')
    }
  }

  const onFormSuccess = () => {
    fetchResumen()
    fetchIngresos()
    fetchGastos()
    fetchAportes()
  }

  const filteredIngresos = ingresos.filter((t) =>
    !ingresoSearch || t.descripcion.toLowerCase().includes(ingresoSearch.toLowerCase()) || (t.cliente?.nombre || '').toLowerCase().includes(ingresoSearch.toLowerCase())
  )

  const filteredGastos = gastos.filter((t) =>
    !gastoSearch || t.descripcion.toLowerCase().includes(gastoSearch.toLowerCase())
  )

  if (loading || !resumen) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
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
          <h2 className="text-2xl font-bold">Finanzas</h2>
          <p className="text-muted-foreground text-sm">
            Control de ingresos, gastos y aportes
          </p>
        </div>
        <Button onClick={() => { setTipoTransaccion('INGRESO'); setTransaccionFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Transacción
        </Button>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Período:</span>

            <Select value={String(mesFiltro)} onValueChange={(v) => setMesFiltro(Number(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOMBRES_MESES.map((mes, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{mes}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(anioFiltro)} onValueChange={(v) => setAnioFiltro(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028].map(anio => (
                  <SelectItem key={anio} value={String(anio)}>{anio}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMesFiltro(currentDate.getMonth() + 1)
                setAnioFiltro(currentDate.getFullYear())
              }}
            >
              Hoy
            </Button>

            <span className="text-sm font-semibold ml-2">
              {NOMBRES_MESES[mesFiltro - 1]} {anioFiltro}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="aportes">Aportes/Retiros</TabsTrigger>
        </TabsList>

        {/* TAB: RESUMEN */}
        <TabsContent value="resumen" className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Ingresos — {NOMBRES_MESES[mesFiltro - 1]}</span>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCOP(resumen.ingresosMes)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Gastos — {NOMBRES_MESES[mesFiltro - 1]}</span>
                </div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCOP(resumen.gastosMes)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-sky-500" />
                  <span className="text-sm text-muted-foreground">Utilidad — {NOMBRES_MESES[mesFiltro - 1]}</span>
                </div>
                <p className={`text-xl font-bold mt-1 ${resumen.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCOP(resumen.utilidadMes)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <span className="text-sm text-muted-foreground">Ingresos del Año {anioFiltro}</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCOP(resumen.ingresosAnio)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <span className="text-sm text-muted-foreground">Gastos del Año {anioFiltro}</span>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCOP(resumen.gastosAnio)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <span className="text-sm text-muted-foreground">Utilidad del Año {anioFiltro}</span>
                <p className={`text-lg font-bold mt-1 ${resumen.utilidadAnio >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCOP(resumen.utilidadAnio)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Balance por Socio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Balance por Socio</CardTitle>
              <CardDescription>Utilidad del año dividida 50/50</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resumen.balanceSocios.map((bs) => (
                  <div key={bs.socio} className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-500" />
                      <span className="font-medium">{SOCIOS_LABELS[bs.socio] || bs.socio}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Aportado</span>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatCOP(bs.aportado)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retirado</span>
                        <p className="font-medium text-red-600 dark:text-red-400">{formatCOP(bs.retirado)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Saldo</span>
                        <p className="font-medium">{formatCOP(bs.saldo)}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Utilidad correspondiente (50%)</span>
                      <p className="font-bold text-sky-600 dark:text-sky-400">{formatCOP(resumen.utilidadPorSocio)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ingresos vs Gastos por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumen.chartMeses} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip
                        formatter={(value: number) => formatCOP(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gastos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {resumen.chartGastosCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={resumen.chartGastosCategoria}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ categoria, percent }: { categoria: string; percent: number }) =>
                            `${CATEGORIA_GASTO_LABELS[categoria] || categoria} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={90}
                          dataKey="monto"
                          nameKey="categoria"
                        >
                          {resumen.chartGastosCategoria.map((_, index) => (
                            <Cell key={`cell-gasto-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCOP(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Sin datos de gastos para este período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ingresos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {resumen.chartIngresosCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={resumen.chartIngresosCategoria}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ categoria, percent }: { categoria: string; percent: number }) =>
                            `${CATEGORIA_INGRESO_LABELS[categoria] || categoria} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          dataKey="monto"
                          nameKey="categoria"
                        >
                          {resumen.chartIngresosCategoria.map((_, index) => (
                            <Cell key={`cell-ingreso-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCOP(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Sin datos de ingresos para este período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: INGRESOS */}
        <TabsContent value="ingresos" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ingresos..."
                value={ingresoSearch}
                onChange={(e) => setIngresoSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setTipoTransaccion('INGRESO'); setTransaccionFormOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Método</TableHead>
                  <TableHead className="hidden lg:table-cell">Socio</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngresos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No se encontraron ingresos para {NOMBRES_MESES[mesFiltro - 1]} {anioFiltro}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIngresos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{formatFecha(t.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-0">
                          {CATEGORIA_INGRESO_LABELS[t.categoria] || t.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {t.cliente?.nombre || '—'}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{t.descripcion}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCOP(t.monto)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {METODO_PAGO_LABELS[t.metodoPago || ''] || t.metodoPago}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {SOCIOS_LABELS[t.socio] || t.socio}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => { setDeleteTarget(t); setDeleteDialog(true) }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB: GASTOS */}
        <TabsContent value="gastos" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gastos..."
                value={gastoSearch}
                onChange={(e) => setGastoSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setTipoTransaccion('GASTO'); setTransaccionFormOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Socio</TableHead>
                  <TableHead className="hidden md:table-cell">Comprobante</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGastos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron gastos para {NOMBRES_MESES[mesFiltro - 1]} {anioFiltro}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGastos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{formatFecha(t.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-0">
                          {CATEGORIA_GASTO_LABELS[t.categoria] || t.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{t.descripcion}</TableCell>
                      <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                        {formatCOP(t.monto)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {SOCIOS_LABELS[t.socio] || t.socio}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {METODO_PAGO_LABELS[t.metodoPago || ''] || t.metodoPago || '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => { setDeleteTarget(t); setDeleteDialog(true) }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB: APORTES/RETIROS */}
        <TabsContent value="aportes" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Aportes y Retiros de Socios</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setTipoTransaccion('APORTE_SOCIO'); setTransaccionFormOpen(true) }}>
                <ArrowUpCircle className="h-4 w-4 mr-2 text-emerald-500" />
                Nuevo Aporte
              </Button>
              <Button variant="outline" onClick={() => { setTipoTransaccion('RETIRO_SOCIO'); setTransaccionFormOpen(true) }}>
                <ArrowDownCircle className="h-4 w-4 mr-2 text-red-500" />
                Nuevo Retiro
              </Button>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Socio</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Método</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aportes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron aportes o retiros
                    </TableCell>
                  </TableRow>
                ) : (
                  aportes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{formatFecha(t.fecha)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`border-0 ${
                            t.tipo === 'APORTE_SOCIO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {TIPO_TRANSACCION_LABELS[t.tipo as keyof typeof TIPO_TRANSACCION_LABELS] || t.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{SOCIOS_LABELS[t.socio] || t.socio}</TableCell>
                      <TableCell className="max-w-48 truncate">{t.descripcion}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        t.tipo === 'APORTE_SOCIO'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {t.tipo === 'APORTE_SOCIO' ? '+' : '-'}{formatCOP(t.monto)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {METODO_PAGO_LABELS[t.metodoPago || ''] || t.metodoPago || '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => { setDeleteTarget(t); setDeleteDialog(true) }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <TransaccionForm
        open={transaccionFormOpen}
        onOpenChange={setTransaccionFormOpen}
        tipoInicial={tipoTransaccion}
        onSuccess={onFormSuccess}
      />

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar Transacción"
        description={`¿Está seguro de eliminar la transacción "${deleteTarget?.descripcion}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
