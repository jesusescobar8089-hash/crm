'use client'

import { Badge } from '@/components/ui/badge'
import {
  ESTADO_CLIENTE_COLORS,
  ESTADO_COTIZACION_COLORS,
  ESTADO_MONITOREO_COLORS,
  ESTADO_TAREA_COLORS,
  PRIORIDAD_COLORS,
  ESTADO_FACTURA_COLORS,
  ESTADO_CLIENTE_LABELS,
  ESTADO_COTIZACION_LABELS,
  ESTADO_MONITOREO_LABELS,
  ESTADO_TAREA_LABELS,
  ESTADO_FACTURA_LABELS,
} from '@/types'

type StatusType = 'cliente' | 'cotizacion' | 'monitoreo' | 'tarea' | 'prioridad' | 'factura'

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
  factura: ESTADO_FACTURA_COLORS,
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
  factura: ESTADO_FACTURA_LABELS,
}

const dotColorMaps: Record<StatusType, Record<string, string>> = {
  cliente: {
    INSTALADO_ACTIVO: 'bg-emerald-500',
    EN_NEGOCIACION: 'bg-amber-500',
    COTIZADO: 'bg-sky-500',
    INACTIVO_PERDIDO: 'bg-red-500',
  },
  cotizacion: {
    BORRADOR: 'bg-muted-foreground',
    ENVIADA: 'bg-sky-500',
    EN_REVISION: 'bg-amber-500',
    ACEPTADA: 'bg-emerald-500',
    RECHAZADA: 'bg-red-500',
    VENCIDA: 'bg-red-500',
  },
  monitoreo: {
    ACTIVO: 'bg-emerald-500',
    EN_MANTENIMIENTO: 'bg-amber-500',
    SUSPENDIDO: 'bg-red-500',
  },
  tarea: {
    PENDIENTE: 'bg-sky-500',
    EN_PROGRESO: 'bg-amber-500',
    COMPLETADA: 'bg-emerald-500',
  },
  prioridad: {
    ALTA: 'bg-red-500',
    MEDIA: 'bg-amber-500',
    BAJA: 'bg-sky-500',
  },
  factura: {
    BORRADOR: 'bg-muted-foreground',
    PENDIENTE: 'bg-sky-500',
    EMITIDA: 'bg-sky-500',
    PAGADA: 'bg-emerald-500',
    VENCIDA: 'bg-red-500',
    ANULADA: 'bg-red-500',
  },
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const colorClass = colorMaps[type]?.[value] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  const label = labelMaps[type]?.[value] ?? value
  const dotClass = dotColorMaps[type]?.[value] ?? 'bg-muted-foreground'

  return (
    <Badge variant="secondary" className={`${colorClass} border-0 font-medium ${className ?? ''}`}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      {label}
    </Badge>
  )
}
