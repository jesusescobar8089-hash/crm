'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatFecha } from '@/lib/format'
import { useAuthStore } from '@/lib/auth-store'
import { PRIMARY_OPERATOR_ID } from '@/lib/operator'
import {
  ESTADO_TAREA_COLORS,
  ESTADO_TAREA_LABELS,
  PRIORIDAD_COLORS,
  type EstadoTarea,
  type PrioridadTarea,
} from '@/types'
import { TareaForm } from '@/components/tareas/tarea-form'
import { KanbanBoard } from '@/components/tareas/kanban-board'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckSquare,
  Clock,
  AlertTriangle,
  ListChecks,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react'

interface Tarea {
  id: string
  titulo: string
  descripcion?: string | null
  asignadoA: string
  prioridad: PrioridadTarea
  fechaLimite?: string | null
  estado: EstadoTarea
  clienteId?: string | null
  cliente?: { id: string; nombre: string; empresa: string | null } | null
  createdAt: string
}

const ASIGNADO_LABELS: Record<string, string> = {
  socioPrincipal: 'Socio principal',
  socioA: 'Socio principal',
  socioB: 'Socio principal',
  ambos: 'Socio principal',
}

const PRIORIDAD_LABELS: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

export default function TareasPage() {
  const { user } = useAuthStore()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'lista' | 'kanban'>('lista')
  const [search, setSearch] = useState('')
  const [asignadoFilter, setAsignadoFilter] = useState<string>('all')
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editTarea, setEditTarea] = useState<Tarea | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteTarea, setDeleteTarea] = useState<Tarea | null>(null)
  const [sortField, setSortField] = useState<'prioridad' | 'fechaLimite'>('fechaLimite')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchTareas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (asignadoFilter && asignadoFilter !== 'all') params.set('asignadoA', asignadoFilter)
      if (prioridadFilter && prioridadFilter !== 'all') params.set('prioridad', prioridadFilter)

      const res = await fetch(`/api/tareas?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTareas(data)
      }
    } catch {
      toast.error('Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }, [asignadoFilter, prioridadFilter])

  useEffect(() => {
    fetchTareas()
  }, [fetchTareas])

  const handleDelete = async () => {
    if (!deleteTarea) return
    try {
      const res = await fetch(`/api/tareas/${deleteTarea.id}?socio=${user?.nombre || 'sistema'}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Tarea eliminada')
      setDeleteDialog(false)
      setDeleteTarea(null)
      fetchTareas()
    } catch {
      toast.error('Error al eliminar tarea')
    }
  }

  const handleEstadoChange = async (tareaId: string, nuevoEstado: EstadoTarea) => {
    try {
      const res = await fetch(`/api/tareas/${tareaId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          socio: user?.nombre || 'sistema',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Estado cambiado a ${ESTADO_TAREA_LABELS[nuevoEstado]}`)
      fetchTareas()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const toggleSort = (field: 'prioridad' | 'fechaLimite') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Filtered & sorted tasks for list view
  const prioridadOrder: Record<string, number> = { ALTA: 3, MEDIA: 2, BAJA: 1 }
  const filteredTareas = tareas
    .filter((t) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        t.titulo.toLowerCase().includes(q) ||
        (t.cliente?.nombre || '').toLowerCase().includes(q) ||
        ASIGNADO_LABELS[t.asignadoA]?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'prioridad') {
        cmp = (prioridadOrder[a.prioridad] || 0) - (prioridadOrder[b.prioridad] || 0)
      } else {
        const dateA = a.fechaLimite ? new Date(a.fechaLimite).getTime() : Infinity
        const dateB = b.fechaLimite ? new Date(b.fechaLimite).getTime() : Infinity
        cmp = dateA - dateB
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  // Summary stats
  const totalTareas = tareas.length
  const pendientes = tareas.filter((t) => t.estado === 'PENDIENTE').length
  const enProgreso = tareas.filter((t) => t.estado === 'EN_PROGRESO').length
  const completadas = tareas.filter((t) => t.estado === 'COMPLETADA').length
  const vencidas = tareas.filter(
    (t) => t.fechaLimite && new Date(t.fechaLimite) < new Date() && t.estado !== 'COMPLETADA'
  ).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
          <h2 className="text-2xl font-bold">Tareas</h2>
          <p className="text-muted-foreground text-sm">
            Gestión de tareas y seguimiento de actividades
          </p>
        </div>
        <Button onClick={() => { setEditTarea(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-sky-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalTareas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-sky-500" />
              <span className="text-sm text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">{pendientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">En Progreso</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{enProgreso}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Completadas</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{completadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Vencidas</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{vencidas}</p>
          </CardContent>
        </Card>
      </div>

      {/* View toggle + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as 'lista' | 'kanban')}>
          <TabsList>
            <TabsTrigger value="lista" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={asignadoFilter} onValueChange={setAsignadoFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Asignado a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value={PRIMARY_OPERATOR_ID}>Socio principal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="MEDIA">Media</SelectItem>
              <SelectItem value="BAJA">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'lista' ? (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden sm:table-cell">Asignado a</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('prioridad')}
                  >
                    Prioridad
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort('fechaLimite')}
                  >
                    Fecha Límite
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTareas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No se encontraron tareas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTareas.map((tarea) => {
                  const isOverdue =
                    tarea.fechaLimite &&
                    new Date(tarea.fechaLimite) < new Date() &&
                    tarea.estado !== 'COMPLETADA'

                  return (
                    <TableRow
                      key={tarea.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''
                      }`}
                      onClick={() => {
                        setEditTarea(tarea)
                        setFormOpen(true)
                      }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{tarea.titulo}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {ASIGNADO_LABELS[tarea.asignadoA] || tarea.asignadoA}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                              Vencida
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">{ASIGNADO_LABELS[tarea.asignadoA] || tarea.asignadoA}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-[10px] px-1.5 ${PRIORIDAD_COLORS[tarea.prioridad] || ''}`}
                        >
                          {PRIORIDAD_LABELS[tarea.prioridad] || tarea.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                          {tarea.fechaLimite ? formatFecha(tarea.fechaLimite) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border-0 ${
                                ESTADO_TAREA_COLORS[tarea.estado] || ''
                              }`}
                            >
                              {ESTADO_TAREA_LABELS[tarea.estado] || tarea.estado}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {Object.entries(ESTADO_TAREA_LABELS).map(([key, label]) => (
                              <DropdownMenuItem
                                key={key}
                                disabled={key === tarea.estado}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEstadoChange(tarea.id, key as EstadoTarea)
                                }}
                              >
                                {label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {tarea.cliente?.nombre || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditTarea(tarea)
                                setFormOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarea(tarea)
                                setDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <KanbanBoard
          tareas={filteredTareas}
          onEditTarea={(tarea) => {
            setEditTarea(tarea)
            setFormOpen(true)
          }}
          onTareaUpdated={fetchTareas}
        />
      )}

      {/* Task Form Dialog */}
      <TareaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditTarea(null)
        }}
        tarea={editTarea}
        onSuccess={fetchTareas}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar Tarea"
        description={`¿Está seguro de eliminar "${deleteTarea?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
