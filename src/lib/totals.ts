export interface PricedItem {
  cantidad: number
  precioUnit: number
  descuento?: number
  ivaTipo?: string
  ivaPorcentaje?: number
  subtotal?: number
}

export const TAX_OPTIONS = [
  { value: 'NO_RESPONSABLE', label: 'No responsable', rate: 0, taxable: false },
] as const

export type TaxType = (typeof TAX_OPTIONS)[number]['value']

export function getTaxOption(value?: string, _fallbackRate = 19) {
  return TAX_OPTIONS.find((option) => option.value === value) ?? TAX_OPTIONS[0]
}

export function calculateLineTotals(item: PricedItem, _defaultIva = 19) {
  const cantidad = Number.isFinite(item.cantidad) ? item.cantidad : 0
  const precioUnit = Number.isFinite(item.precioUnit) ? item.precioUnit : 0
  const descuento = Number.isFinite(item.descuento ?? 0) ? item.descuento ?? 0 : 0
  const bruto = cantidad * precioUnit
  const descuentoMonto = bruto * (descuento / 100)
  const subtotal = Math.max(bruto - descuentoMonto, 0)

  return {
    bruto,
    descuentoMonto,
    subtotal,
    baseGravable: subtotal,
    ivaMonto: 0,
    total: subtotal,
    ivaTipo: TAX_OPTIONS[0].value,
    ivaPorcentaje: 0,
  }
}

export function calculateCommercialTotals(items: PricedItem[], descuentoGlobal = 0, defaultIva = 19) {
  const lineas = items.map((item) => calculateLineTotals(item, defaultIva))
  const subtotalConIva = lineas.reduce((sum, line) => sum + line.subtotal, 0)
  const descuentoMonto = subtotalConIva * (descuentoGlobal / 100)
  const total = Math.max(subtotalConIva - descuentoMonto, 0)
  const baseAntesDescuento = lineas.reduce((sum, line) => sum + line.baseGravable, 0)
  const factor = subtotalConIva > 0 ? total / subtotalConIva : 1
  const baseGravable = baseAntesDescuento * factor

  return {
    lineas,
    subtotalGeneral: subtotalConIva,
    subtotalConIva,
    descuentoMonto,
    subtotalConDescuento: total,
    baseGravable,
    ivaMonto: 0,
    total,
  }
}

export function calculateTaxIncludedTotals(items: PricedItem[], descuento = 0, iva = 19) {
  return calculateCommercialTotals(
    items.map((item) => ({ ...item, ivaPorcentaje: item.ivaPorcentaje ?? iva })),
    descuento,
    iva
  )
}
