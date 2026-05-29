'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useAuthStore } from '@/lib/auth-store'
import { formatCOP } from '@/lib/format'

interface CotizacionItem {
  descripcion: string
  cantidad: number
  precioUnit: number
}

interface ClienteOption {
  id: string
  nombre: string
  empresa: string | null
}

interface CotizacionFormData {
  clienteId: string
  fechaEmision: string
  fechaVencimiento: string
  descuento: number
  iva: number
  observaciones: string
  notasInternas: string
  items: CotizacionItem[]
}

interface CotizacionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClienteId?: string
  cotizacion?: {
    id: string
    clienteId: string
    fechaEmision: string
    fechaVencimiento: string | null
    descuento: number
    iva: number
    observaciones: string | null
    notasInternas: string | null
    items: { descripcion: string; cantidad: number; precioUnit: number }[]
  } | null
  onSuccess: () => void
}

const emptyForm: CotizacionFormData = {
  clienteId: '',
  fechaEmision: new Date().toISOString().split('T')[0],
  fechaVencimiento: '',
  descuento: 0,
  iva: 19,
  observaciones: '',
  notasInternas: '',
  items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
}

export function CotizacionForm({ open, onOpenChange, defaultClienteId, cotizacion, onSuccess }: CotizacionFormProps) {
  const { user } = useAuthStore()
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CotizacionFormData>(emptyForm)

  useEffect(() => {
    if (open) {
      fetchClientes()
      if (cotizacion) {
        setForm({
          clienteId: cotizacion.clienteId,
          fechaEmision: new Date(cotizacion.fechaEmision).toISOString().split('T')[0],
          fechaVencimiento: cotizacion.fechaVencimiento
            ? new Date(cotizacion.fechaVencimiento).toISOString().split('T')[0]
            : '',
          descuento: cotizacion.descuento,
          iva: cotizacion.iva,
          observaciones: cotizacion.observaciones ?? '',
          notasInternas: cotizacion.notasInternas ?? '',
          items: cotizacion.items.map((i) => ({
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            precioUnit: i.precioUnit,
          })),
        })
      } else {
        setForm({
          ...emptyForm,
          clienteId: defaultClienteId || '',
        })
      }
    }
  }, [open, cotizacion, defaultClienteId])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      if (res.ok) {
        const data = await res.json()
        setClientes(data)
      }
    } catch {
      toast.error('Error al cargar clientes')
    }
  }

  const subtotalGeneral = form.items.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnit,
    0
  )
  const descuentoMonto = subtotalGeneral * (form.descuento / 100)
  const subtotalConDescuento = subtotalGeneral - descuentoMonto
  const ivaMonto = subtotalConDescuento * (form.iva / 100)
  const total = subtotalConDescuento + ivaMonto

  const handleItemChange = (index: number, field: keyof CotizacionItem, value: string | number) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm({ ...form, items: newItems })
  }

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { descripcion: '', cantidad: 1, precioUnit: 0 }] })
  }

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const handleSubmit = async () => {
    if (!form.clienteId) {
      toast.error('Seleccione un cliente')
      return
    }
    if (!form.items.length || form.items.some((i) => !i.descripcion)) {
      toast.error('Agregue al menos un item con descripción')
      return
    }
    if (form.items.some((i) => i.cantidad <= 0)) {
      toast.error('Las cantidades deben ser mayores a 0')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        socio: user?.nombre ?? 'Sistema',
        items: form.items.map((item) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnit: item.precioUnit,
        })),
      }

      let res: Response
      if (cotizacion) {
        res = await fetch(`/api/cotizaciones/${cotizacion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/cotizaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success(cotizacion ? 'Cotización actualizada' : 'Cotización creada')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cotizacion ? 'Editar Cotización' : 'Nueva Cotización'}</DialogTitle>
          <DialogDescription>
            {cotizacion
              ? 'Modifique los datos de la cotización'
              : 'Complete los datos para crear una nueva cotización'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteId">Cliente *</Label>
              <Select
                value={form.clienteId}
                onValueChange={(value) => setForm({ ...form, clienteId: value })}
                disabled={!!defaultClienteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.empresa ? `(${c.empresa})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="fechaEmision">Fecha Emisión *</Label>
                <Input
                  id="fechaEmision"
                  type="date"
                  value={form.fechaEmision}
                  onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-end"
                >
                  <div>
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Descripción</Label>}
                    <Input
                      placeholder="Descripción del item"
                      value={item.descripcion}
                      onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Cant.</Label>}
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Precio Unit.</Label>}
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.precioUnit}
                      onChange={(e) => handleItemChange(idx, 'precioUnit', parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs text-muted-foreground">Subtotal</Label>}
                    <div className="h-9 px-3 flex items-center text-sm bg-muted rounded-md">
                      {formatCOP(item.cantidad * item.precioUnit)}
                    </div>
                  </div>
                  <div>
                    {idx === 0 && <div className="h-5" />}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Descuento, IVA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento (%)</Label>
              <Input
                id="descuento"
                type="number"
                min={0}
                max={100}
                value={form.descuento}
                onChange={(e) => setForm({ ...form, descuento: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iva">IVA (%)</Label>
              <Input
                id="iva"
                type="number"
                min={0}
                value={form.iva}
                onChange={(e) => setForm({ ...form, iva: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <div className="h-9 px-3 flex items-center text-sm bg-muted rounded-md">
                {formatCOP(subtotalGeneral)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-bold">TOTAL</Label>
              <div className="h-9 px-3 flex items-center text-sm font-bold bg-primary/10 rounded-md">
                {formatCOP(total)}
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones visibles para el cliente..."
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notasInternas">Notas Internas</Label>
            <Textarea
              id="notasInternas"
              placeholder="Notas internas (no visibles para el cliente)..."
              value={form.notasInternas}
              onChange={(e) => setForm({ ...form, notasInternas: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {cotizacion ? 'Guardar Cambios' : 'Crear Cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
