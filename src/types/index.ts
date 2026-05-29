export type EstadoCliente = 'COTIZADO' | 'EN_NEGOCIACION' | 'INSTALADO_ACTIVO' | 'INACTIVO_PERDIDO'
export type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA'
export type EstadoMonitoreo = 'ACTIVO' | 'EN_MANTENIMIENTO' | 'SUSPENDIDO'
export type TipoNegocio = 'piscicultura' | 'camaronicultura' | 'agricultura' | 'otro'
export type TipoInteraccion = 'llamada' | 'visita' | 'cotizacion_enviada' | 'instalacion' | 'mantenimiento' | 'nota'
export type CategoriaInventario = 'COMPONENTE' | 'KIT_ARMADO' | 'MATERIAL_INSTALACION'
export type TipoMovimiento = 'ENTRADA' | 'SALIDA_INSTALACION' | 'SALIDA_VENTA' | 'AJUSTE'
export type TipoTransaccion = 'INGRESO' | 'GASTO' | 'APORTE_SOCIO' | 'RETIRO_SOCIO'
export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA'
export type PrioridadTarea = 'ALTA' | 'MEDIA' | 'BAJA'
export type TipoDocumento = 'CONTRATO' | 'COTIZACION' | 'MANUAL' | 'FOTOGRAFIA_INSTALACION' | 'ACTA_ENTREGA' | 'COMPROBANTE_PAGO' | 'OTRO'

export const ESTADO_CLIENTE_COLORS: Record<EstadoCliente, string> = {
  COTIZADO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  EN_NEGOCIACION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  INSTALADO_ACTIVO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  INACTIVO_PERDIDO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const ESTADO_COTIZACION_COLORS: Record<EstadoCotizacion, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  ENVIADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  EN_REVISION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  ACEPTADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  RECHAZADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  VENCIDA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

export const ESTADO_MONITOREO_COLORS: Record<EstadoMonitoreo, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  EN_MANTENIMIENTO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SUSPENDIDO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const PRIORIDAD_COLORS: Record<PrioridadTarea, string> = {
  ALTA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  MEDIA: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  BAJA: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export const ESTADO_TAREA_COLORS: Record<EstadoTarea, string> = {
  PENDIENTE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  EN_PROGRESO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const ESTADO_CLIENTE_LABELS: Record<EstadoCliente, string> = {
  COTIZADO: 'Cotizado',
  EN_NEGOCIACION: 'En Negociación',
  INSTALADO_ACTIVO: 'Instalado Activo',
  INACTIVO_PERDIDO: 'Inactivo / Perdido',
}

export const ESTADO_COTIZACION_LABELS: Record<EstadoCotizacion, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  EN_REVISION: 'En Revisión',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
}

export const ESTADO_MONITOREO_LABELS: Record<EstadoMonitoreo, string> = {
  ACTIVO: 'Activo',
  EN_MANTENIMIENTO: 'En Mantenimiento',
  SUSPENDIDO: 'Suspendido',
}

export const ESTADO_TAREA_LABELS: Record<EstadoTarea, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADA: 'Completada',
}

export const CATEGORIA_INVENTARIO_LABELS: Record<CategoriaInventario, string> = {
  COMPONENTE: 'Componente',
  KIT_ARMADO: 'Kit Armado',
  MATERIAL_INSTALACION: 'Material Instalación',
}

export const TIPO_TRANSACCION_LABELS: Record<TipoTransaccion, string> = {
  INGRESO: 'Ingreso',
  GASTO: 'Gasto',
  APORTE_SOCIO: 'Aporte Socio',
  RETIRO_SOCIO: 'Retiro Socio',
}

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  CONTRATO: 'Contrato',
  COTIZACION: 'Cotización',
  MANUAL: 'Manual',
  FOTOGRAFIA_INSTALACION: 'Fotografía Instalación',
  ACTA_ENTREGA: 'Acta de Entrega',
  COMPROBANTE_PAGO: 'Comprobante de Pago',
  OTRO: 'Otro',
}

export const TIPO_DOCUMENTO_COLORS: Record<TipoDocumento, string> = {
  CONTRATO: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  COTIZACION: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  MANUAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  FOTOGRAFIA_INSTALACION: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  ACTA_ENTREGA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  COMPROBANTE_PAGO: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  OTRO: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}
