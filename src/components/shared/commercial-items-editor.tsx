'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCOP } from '@/lib/format'
import { numberInputValue, parseNumberInput } from '@/lib/numbers'
import { calculateCommercialTotals, calculateLineTotals } from '@/lib/totals'

const INCLUDED_OPTIONS = [
  'Sensor de pH',
  'Sensor de oxigeno',
  'Sensor de temperatura',
  'ESP32 industrial',
  'Configuracion inicial',
  'Capacitacion',
  'Garantia',
]

function selectedIncludedOptions(description: string) {
  return INCLUDED_OPTIONS.filter((option) => description.includes(`- ${option}`))
}

function buildDescriptionWithIncludes(item: CommercialFormItem, selected: string[]) {
  const title = item.nombre || item.descripcion || 'Servicio comercial'
  if (!selected.length) return item.descripcionLarga

  return `${title}.\n\nIncluye:\n${selected.map((option) => `- ${option}`).join('\n')}`
}

export interface CommercialFormItem {
  nombre: string
  descripcion: string
  descripcionLarga: string
  sku: string
  unidad: string
  cantidad: number
  precioUnit: number
  descuento: number
  ivaTipo: string
  ivaPorcentaje: number
}

export const emptyCommercialItem: CommercialFormItem = {
  nombre: '',
  descripcion: '',
  descripcionLarga: '',
  sku: '',
  unidad: 'unidad',
  cantidad: 1,
  precioUnit: 0,
  descuento: 0,
  ivaTipo: 'NO_RESPONSABLE',
  ivaPorcentaje: 0,
}

interface CommercialItemsEditorProps {
  items: CommercialFormItem[]
  descuentoGlobal: number
  defaultIva: number
  onChange: (items: CommercialFormItem[]) => void
}

export function CommercialItemsEditor({
  items,
  descuentoGlobal,
  defaultIva,
  onChange,
}: CommercialItemsEditorProps) {
  const updateItem = (index: number, patch: Partial<CommercialFormItem>) => {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const addItem = () => onChange([...items, { ...emptyCommercialItem }])
  const removeItem = (index: number) => {
    if (items.length <= 1) return
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }

  const totals = calculateCommercialTotals(items, descuentoGlobal, defaultIva)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-base font-semibold">Productos y servicios</Label>
          <p className="text-xs text-muted-foreground">
            Use descripciones largas para incluir alcance, componentes, garantia y capacitacion.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar linea
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const line = calculateLineTotals(item, defaultIva)

          return (
            <div key={index} className="rounded-md border bg-card p-3">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.55fr_0.55fr_0.7fr_0.55fr_40px]">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Nombre *</Label>
                  <Input
                    value={item.nombre}
                    onChange={(event) => updateItem(index, { nombre: event.target.value, descripcion: event.target.value })}
                    placeholder="Kit de monitoreo IoT"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">SKU</Label>
                  <Input
                    value={item.sku}
                    onChange={(event) => updateItem(index, { sku: event.target.value })}
                    placeholder="KIT-IOT-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cant.</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={numberInputValue(item.cantidad)}
                    onChange={(event) => updateItem(index, { cantidad: parseNumberInput(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Unidad</Label>
                  <Input
                    value={item.unidad}
                    onChange={(event) => updateItem(index, { unidad: event.target.value })}
                    placeholder="unidad"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Precio</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={numberInputValue(item.precioUnit)}
                    onChange={(event) => updateItem(index, { precioUnit: parseNumberInput(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Desc. %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={numberInputValue(item.descuento)}
                    onChange={(event) => updateItem(index, { descuento: parseNumberInput(event.target.value) })}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_220px]">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Descripcion detallada</Label>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="mb-2 text-xs font-medium">Incluye</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {INCLUDED_OPTIONS.map((option) => {
                        const selected = selectedIncludedOptions(item.descripcionLarga)
                        const checked = selected.includes(option)

                        return (
                          <label key={option} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const nextSelected = value
                                  ? [...selected, option]
                                  : selected.filter((itemOption) => itemOption !== option)

                                updateItem(index, {
                                  descripcionLarga: buildDescriptionWithIncludes(item, nextSelected),
                                })
                              }}
                            />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <Textarea
                    value={item.descripcionLarga}
                    onChange={(event) => updateItem(index, { descripcionLarga: event.target.value })}
                    placeholder={'Kit de monitoreo IoT para sistemas acuicolas.\n\nIncluye:\n- Sensor de pH\n- Sensor de oxigeno\n- Sensor de temperatura\n- ESP32 industrial\n- Configuracion inicial\n- Capacitacion\n- Garantia'}
                    rows={5}
                  />
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>{formatCOP(line.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Subtotal</p>
          <p className="font-medium">{formatCOP(totals.subtotalGeneral)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Descuento</p>
          <p className="font-medium">{formatCOP(totals.descuentoMonto)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-semibold">{formatCOP(totals.total)}</p>
        </div>
      </div>
    </div>
  )
}
