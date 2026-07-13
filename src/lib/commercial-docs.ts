import { calculateLineTotals } from '@/lib/totals'

export interface CommercialItemInput {
  nombre?: string
  descripcion?: string
  descripcionLarga?: string
  sku?: string
  unidad?: string
  cantidad: number
  precioUnit: number
  descuento?: number
  ivaTipo?: string
  ivaPorcentaje?: number
}

export function normalizeCommercialItem(item: CommercialItemInput, idx: number, defaultIva = 0) {
  const descripcion = item.descripcion?.trim() || item.nombre?.trim() || 'Servicio comercial'
  const lineTotals = calculateLineTotals(item, defaultIva)

  return {
    nombre: item.nombre?.trim() || descripcion.split('\n')[0],
    descripcion,
    descripcionLarga: item.descripcionLarga?.trim() || null,
    sku: item.sku?.trim() || null,
    unidad: item.unidad?.trim() || 'unidad',
    cantidad: item.cantidad,
    precioUnit: item.precioUnit,
    descuento: item.descuento ?? 0,
    ivaTipo: lineTotals.ivaTipo,
    ivaPorcentaje: lineTotals.ivaPorcentaje,
    baseGravable: lineTotals.baseGravable,
    ivaMonto: lineTotals.ivaMonto,
    total: lineTotals.total,
    subtotal: lineTotals.subtotal,
    orden: idx,
  }
}
