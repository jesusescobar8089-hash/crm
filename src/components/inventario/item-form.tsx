'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { numberInputValue, parseNumberInput } from '@/lib/numbers'
import { CATEGORIA_INVENTARIO_LABELS } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InventarioItem {
  id?: string
  nombre: string
  categoria: string
  unidad: string
  stockActual: number
  stockMinimo: number
  costoUnitario: number
  proveedor: string | null
  notas: string | null
}

interface ItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventarioItem | null
  onSuccess: () => void
}

const emptyForm: InventarioItem = {
  nombre: '',
  categoria: 'COMPONENTE',
  unidad: 'unidad',
  stockActual: 0,
  stockMinimo: 0,
  costoUnitario: 0,
  proveedor: '',
  notas: '',
}

export function ItemForm({ open, onOpenChange, item, onSuccess }: ItemFormProps) {
  const [form, setForm] = useState<InventarioItem>(item || emptyForm)
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()

  const isEditing = !!item?.id

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/inventario/${item.id}` : '/api/inventario'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          socio: user?.nombre || 'sistema',
        }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast.success(isEditing ? 'Ítem actualizado' : 'Ítem creado')
      onOpenChange(false)
      setForm(emptyForm)
      onSuccess()
    } catch {
      toast.error('Error al guardar el ítem')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof InventarioItem, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              placeholder="Nombre del ítem"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => updateField('categoria', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_INVENTARIO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Input
                id="unidad"
                value={form.unidad}
                onChange={(e) => updateField('unidad', e.target.value)}
                placeholder="unidad, metro, kit..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stockActual">Stock Actual</Label>
              <Input
                id="stockActual"
                type="number"
                min="0"
                value={numberInputValue(form.stockActual)}
                onChange={(e) => updateField('stockActual', parseNumberInput(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockMinimo">Stock Mínimo</Label>
              <Input
                id="stockMinimo"
                type="number"
                min="0"
                value={numberInputValue(form.stockMinimo)}
                onChange={(e) => updateField('stockMinimo', parseNumberInput(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costoUnitario">Costo Unitario</Label>
              <Input
                id="costoUnitario"
                type="number"
                min="0"
                value={numberInputValue(form.costoUnitario)}
                onChange={(e) => updateField('costoUnitario', parseNumberInput(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              value={form.proveedor ?? ''}
              onChange={(e) => updateField('proveedor', e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={form.notas ?? ''}
              onChange={(e) => updateField('notas', e.target.value)}
              placeholder="Notas adicionales"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Ítem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
