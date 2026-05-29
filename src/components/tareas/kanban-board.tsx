'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatFecha } from '@/lib/format'
import { useAuthStore } from '@/lib/auth-store'
import {
  ESTADO_TAREA_COLORS,
  ESTADO_TAREA_LABELS,
  PRIORIDAD_COLORS,
  type EstadoTarea,
  type PrioridadTarea,
} from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, User, Building2, GripVertical } from 'lucide-react'

interface TareaKanban {
  id: string
  titulo: string
  descripcion?: string | null
  asignadoA: string
  prioridad: PrioridadTarea
  fechaLimite?: string | null
  estado: EstadoTarea
  clienteId?: string | null
  cliente?: { id: string; nombre: string; empresa: string | null } | null
}

const ASIGNADO_LABELS: Record<string, string> = {
  socioA: 'Socio A',
  socioB: 'Socio B',
  ambos: 'Ambos',
}

const COLUMNAS: { estado: EstadoTarea; color: string; bgColor: string; headerBorder: string }[] = [
  { estado: 'PENDIENTE', color: 'text-sky-700 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/30', headerBorder: 'border-t-sky-400' },
  { estado: 'EN_PROGRESO', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30', headerBorder: 'border-t-amber-400' },
  { estado: 'COMPLETADA', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', headerBorder: 'border-t-emerald-400' },
]

function KanbanCard({ tarea, onClick }: { tarea: TareaKanban; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = tarea.fechaLimite && new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'COMPLETADA'

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40 scale-95' : ''}>
      <Card
        className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${
          tarea.prioridad === 'ALTA'
            ? 'border-l-red-500'
            : tarea.prioridad === 'MEDIA'
            ? 'border-l-amber-500'
            : 'border-l-gray-400'
        } ${isOverdue ? 'border-l-red-600' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight line-clamp-2">{tarea.titulo}</h4>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pt-0.5">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className={`border-0 text-[10px] px-1.5 py-0 ${PRIORIDAD_COLORS[tarea.prioridad] || ''}`}
            >
              {tarea.prioridad === 'ALTA' ? 'Alta' : tarea.prioridad === 'MEDIA' ? 'Media' : 'Baja'}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 shrink-0" />
              <span>{ASIGNADO_LABELS[tarea.asignadoA] || tarea.asignadoA}</span>
            </div>

            {tarea.fechaLimite && (
              <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatFecha(tarea.fechaLimite)}{isOverdue ? ' (Vencida)' : ''}</span>
              </div>
            )}

            {tarea.cliente && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{tarea.cliente.nombre}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DragOverlayCard({ tarea }: { tarea: TareaKanban }) {
  const isOverdue = tarea.fechaLimite && new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'COMPLETADA'

  return (
    <Card
      className={`shadow-2xl border-l-4 rotate-2 ${
        tarea.prioridad === 'ALTA'
          ? 'border-l-red-500'
          : tarea.prioridad === 'MEDIA'
          ? 'border-l-amber-500'
          : 'border-l-gray-400'
      } ${isOverdue ? 'border-l-red-600' : ''}`}
    >
      <CardContent className="p-3 space-y-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2">{tarea.titulo}</h4>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="secondary"
            className={`border-0 text-[10px] px-1.5 py-0 ${PRIORIDAD_COLORS[tarea.prioridad] || ''}`}
          >
            {tarea.prioridad === 'ALTA' ? 'Alta' : tarea.prioridad === 'MEDIA' ? 'Media' : 'Baja'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            <span>{ASIGNADO_LABELS[tarea.asignadoA] || tarea.asignadoA}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({
  columna,
  tareas,
  onEditTarea,
}: {
  columna: typeof COLUMNAS[number]
  tareas: TareaKanban[]
  onEditTarea: (tarea: TareaKanban) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columna.estado,
    data: { type: 'column', estado: columna.estado },
  })

  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[320px] md:flex-1">
      {/* Column header */}
      <div className={`rounded-t-lg px-3 py-2.5 ${columna.bgColor} border border-b-0 border-t-2 ${columna.headerBorder}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${columna.color}`}>
            {ESTADO_TAREA_LABELS[columna.estado]}
          </h3>
          <Badge variant="secondary" className="border-0 text-[10px] px-1.5">
            {tareas.length}
          </Badge>
        </div>
      </div>

      {/* Column body - droppable area */}
      <div
        ref={setNodeRef}
        className={`rounded-b-lg border border-t-0 bg-muted/20 min-h-[200px] p-2 transition-colors ${
          isOver ? 'bg-muted/40 ring-2 ring-inset ring-primary/20' : ''
        }`}
      >
        <SortableContext
          items={tareas.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ScrollArea className="h-[calc(60vh-120px)]">
            <div className="space-y-2 p-1">
              {tareas.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Sin tareas
                </div>
              ) : (
                tareas.map((tarea) => (
                  <KanbanCard
                    key={tarea.id}
                    tarea={tarea}
                    onClick={() => onEditTarea(tarea)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  tareas: TareaKanban[]
  onEditTarea: (tarea: TareaKanban) => void
  onTareaUpdated: () => void
}

export function KanbanBoard({ tareas, onEditTarea, onTareaUpdated }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { user } = useAuthStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const getTareaById = useCallback(
    (id: string) => tareas.find((t) => t.id === id),
    [tareas]
  )

  const findColumnForId = useCallback(
    (id: string): EstadoTarea | null => {
      // Check if it's a column
      const columnMatch = COLUMNAS.find((c) => c.estado === id)
      if (columnMatch) return columnMatch.estado
      // Check if it's a tarea
      const tarea = getTareaById(id)
      if (tarea) return tarea.estado as EstadoTarea
      return null
    },
    [getTareaById]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Could be used for intermediate visual feedback
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const tareaId = String(active.id)
    const tarea = getTareaById(tareaId)
    if (!tarea) return

    // Determine the target column from the "over" element
    const targetEstado = findColumnForId(String(over.id))

    if (targetEstado && targetEstado !== tarea.estado) {
      try {
        const res = await fetch(`/api/tareas/${tareaId}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: targetEstado,
            socio: user?.nombre || 'sistema',
          }),
        })

        if (!res.ok) throw new Error()

        toast.success(`Tarea movida a ${ESTADO_TAREA_LABELS[targetEstado]}`)
        onTareaUpdated()
      } catch {
        toast.error('Error al mover la tarea')
      }
    }
  }

  const activeTarea = activeId ? getTareaById(activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {COLUMNAS.map((columna) => {
          const columnTareas = tareas.filter((t) => t.estado === columna.estado)
          return (
            <KanbanColumn
              key={columna.estado}
              columna={columna}
              tareas={columnTareas}
              onEditTarea={onEditTarea}
            />
          )
        })}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'ease',
      }}>
        {activeTarea ? <DragOverlayCard tarea={activeTarea} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
