'use client'

import { Badge } from '@/components/ui/badge'
import {
  ESTADO_CLIENTE_COLORS,
  ESTADO_COTIZACION_COLORS,
  ESTADO_MONITOREO_COLORS,
  ESTADO_TAREA_COLORS,
  PRIORIDAD_COLORS,
  ESTADO_CLIENTE_LABELS,
  ESTADO_COTIZACION_LABELS,
  ESTADO_MONITOREO_LABELS,
  ESTADO_TAREA_LABELS,
  type EstadoCliente,
  type EstadoCotizacion,
  type EstadoMonitoreo,
  type EstadoTarea,
  type PrioridadTarea,
} from '@/types'

type StatusType = 'cliente' | 'cotizacion' | 'monitoreo' | 'tarea' | 'prioridad'

interface StatusBadgeProps {
  type: StatusType
  value: string
  className?: string
}

const colorMaps: Record<StatusType, Record<string, string>> = {
  cliente: ESTADO_CLIENTE_COLORS,
  cotizacion: ESTADO_COTIZACION_COLORS,
  monitoreo: ESTADO_MONITOREO_COLORS,
  tarea: ESTADO_TAREA_COLORS,
  prioridad: PRIORIDAD_COLORS,
}

const labelMaps: Record<StatusType, Record<string, string>> = {
  cliente: ESTADO_CLIENTE_LABELS,
  cotizacion: ESTADO_COTIZACION_LABELS,
  monitoreo: ESTADO_MONITOREO_LABELS,
  tarea: ESTADO_TAREA_LABELS,
  prioridad: {
    ALTA: 'Alta',
    MEDIA: 'Media',
    BAJA: 'Baja',
  },
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const colorClass = colorMaps[type]?.[value] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  const label = labelMaps[type]?.[value] ?? value

  return (
    <Badge variant="secondary" className={`${colorClass} border-0 font-medium ${className ?? ''}`}>
      {label}
    </Badge>
  )
}
