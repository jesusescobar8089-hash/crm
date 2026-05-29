'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatFechaHora } from '@/lib/format'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, RefreshCw, ClipboardList, Filter, X } from 'lucide-react'

interface BitacoraEvento {
  id: string
  socio: string
  modulo: string
  accion: string
  entidadId: string | null
  detalle: string | null
  createdAt: string
}

interface BitacoraResponse {
  data: BitacoraEvento[]
  total: number
  page: number
  pageSize: number
}

const MODULOS = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'cotizaciones', label: 'Cotizaciones' },
  { value: 'monitoreos', label: 'Monitoreos' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'tareas', label: 'Tareas' },
] as const

const MODULO_COLORS: Record<string, string> = {
  clientes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cotizaciones: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  monitoreos: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  inventario: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  finanzas: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  documentos: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  tareas: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const MODULO_LABELS: Record<string, string> = {
  clientes: 'Clientes',
  cotizaciones: 'Cotizaciones',
  monitoreos: 'Monitoreos',
  inventario: 'Inventario',
  finanzas: 'Finanzas',
  documentos: 'Documentos',
  tareas: 'Tareas',
}

const SOCIOS = ['socioA', 'socioB']

export default function BitacoraPage() {
  const [events, setEvents] = useState<BitacoraEvento[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)

  // Filters
  const [socioFilter, setSocioFilter] = useState<string>('all')
  const [moduloFilter, setModuloFilter] = useState<string>('all')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      if (socioFilter && socioFilter !== 'all') params.set('socio', socioFilter)
      if (moduloFilter && moduloFilter !== 'all') params.set('modulo', moduloFilter)
      if (fechaDesde) params.set('fechaDesde', fechaDesde)
      if (fechaHasta) params.set('fechaHasta', fechaHasta)
      if (search) params.set('search', search)

      const res = await fetch(`/api/bitacora?${params}`)
      if (res.ok) {
        const data: BitacoraResponse = await res.json()
        setEvents(data.data)
        setTotal(data.total)
      }
    } catch {
      toast.error('Error al cargar bitácora')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, socioFilter, moduloFilter, fechaDesde, fechaHasta, search])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSocioFilter('all')
    setModuloFilter('all')
    setFechaDesde('')
    setFechaHasta('')
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  const hasActiveFilters =
    socioFilter !== 'all' ||
    moduloFilter !== 'all' ||
    fechaDesde !== '' ||
    fechaHasta !== '' ||
    search !== ''

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  if (loading && events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="flex gap-3">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
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
          <h2 className="text-2xl font-bold">Bitácora</h2>
          <p className="text-muted-foreground text-sm">
            Registro de actividades del sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchEvents()
            toast.success('Bitácora actualizada')
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-sky-500" />
              <span className="text-sm text-muted-foreground">
                Total de registros: <span className="font-bold text-foreground">{total}</span>
              </span>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Socio filter */}
          <Select value={socioFilter} onValueChange={(v) => { setSocioFilter(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Socio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los socios</SelectItem>
              {SOCIOS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'socioA' ? 'Socio A' : 'Socio B'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Módulo filter */}
          <Select value={moduloFilter} onValueChange={(v) => { setModuloFilter(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los módulos</SelectItem>
              {MODULOS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Fecha desde */}
          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }}
            placeholder="Fecha desde"
          />

          {/* Fecha hasta */}
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }}
            placeholder="Fecha hasta"
          />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en detalle..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-10"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={handleSearch}
              >
                <Search className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Fecha/Hora</TableHead>
              <TableHead className="w-28">Socio</TableHead>
              <TableHead className="w-36">Módulo</TableHead>
              <TableHead className="w-40">Acción</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatFechaHora(event.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {event.socio === 'socioA' ? 'Socio A' : event.socio === 'socioB' ? 'Socio B' : event.socio}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`border-0 font-medium ${MODULO_COLORS[event.modulo] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}
                    >
                      {MODULO_LABELS[event.modulo] || event.modulo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {event.accion}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {event.detalle || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total} registros
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {getPageNumbers().map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
