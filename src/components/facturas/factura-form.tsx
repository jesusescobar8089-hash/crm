'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  CommercialItemsEditor,
  emptyCommercialItem,
  type CommercialFormItem,
} from '@/components/shared/commercial-items-editor'
import { useAuthStore } from '@/lib/auth-store'
import { numberInputValue, parseNumberInput } from '@/lib/numbers'

interface ClienteOption {
  id: string
  nombre: string
  empresa: string | null
}

interface FacturaFormData {
  clienteId: string
  cotizacionId: string
  fechaEmision: string
  fechaVencimiento: string
  descuento: number
  iva: number
  moneda: string
  vendedor: string
  metodoPago: string
  formaPago: string
  observaciones: string
  garantia: string
  condiciones: string
  notasInternas: string
  items: CommercialFormItem[]
}

interface FacturaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClienteId?: string
  defaultCotizacionId?: string
  defaultItems?: Partial<CommercialFormItem>[]
  factura?: {
    id: string
    clienteId: string
    fechaEmision: string
    fechaVencimiento: string | null
    descuento: number
    iva: number
    moneda?: string
    vendedor?: string | null
    metodoPago: string | null
    formaPago?: string | null
    observaciones: string | null
    garantia?: string | null
    condiciones?: string | null
    notasInternas: string | null
    items: Partial<CommercialFormItem>[]
  } | null
  onSuccess: () => void
}

const METODO_PAGO_NONE = 'sin_metodo'
const METODO_PAGO_OPTIONS = [
  { value: METODO_PAGO_NONE, label: 'No especificado' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

const FORMA_PAGO_OPTIONS = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito_15', label: 'Credito 15 dias' },
  { value: 'credito_30', label: 'Credito 30 dias' },
  { value: 'anticipo_saldo', label: 'Anticipo y saldo contra entrega' },
]

const addDays = (dateValue: string, days: number) => {
  const date = new Date(`${dateValue || new Date().toISOString().split('T')[0]}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const normalizeItem = (item: Partial<CommercialFormItem>): CommercialFormItem => ({
  ...emptyCommercialItem,
  ...item,
  nombre: item.nombre || item.descripcion || '',
  descripcion: item.descripcion || item.nombre || '',
  descripcionLarga: item.descripcionLarga || '',
  sku: item.sku || '',
  unidad: item.unidad || 'unidad',
  descuento: item.descuento ?? 0,
  ivaTipo: 'NO_RESPONSABLE',
  ivaPorcentaje: 0,
})

const emptyForm: FacturaFormData = {
  clienteId: '',
  cotizacionId: '',
  fechaEmision: new Date().toISOString().split('T')[0],
  fechaVencimiento: '',
  descuento: 0,
  iva: 0,
  moneda: 'COP',
  vendedor: 'Jesus Andres',
  metodoPago: '',
  formaPago: 'contado',
  observaciones: '',
  garantia: '',
  condiciones: '',
  notasInternas: '',
  items: [{ ...emptyCommercialItem }],
}

export function FacturaForm({
  open,
  onOpenChange,
  defaultClienteId,
  defaultCotizacionId,
  defaultItems,
  factura,
  onSuccess,
}: FacturaFormProps) {
  const { user } = useAuthStore()
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FacturaFormData>(emptyForm)

  const setDueDays = (days: number) => {
    setForm((current) => ({
      ...current,
      fechaVencimiento: addDays(current.fechaEmision, days),
    }))
  }

  useEffect(() => {
    if (!open) return

    fetch('/api/clientes')
      .then((res) => res.json())
      .then(setClientes)
      .catch(() => toast.error('Error al cargar clientes'))

    if (factura) {
      setForm({
        clienteId: factura.clienteId,
        cotizacionId: '',
        fechaEmision: new Date(factura.fechaEmision).toISOString().split('T')[0],
        fechaVencimiento: factura.fechaVencimiento
          ? new Date(factura.fechaVencimiento).toISOString().split('T')[0]
          : '',
        descuento: factura.descuento,
        iva: 0,
        moneda: factura.moneda || 'COP',
        vendedor: factura.vendedor || user?.nombre || 'Jesus Andres',
        metodoPago: factura.metodoPago || '',
        formaPago: factura.formaPago || 'contado',
        observaciones: factura.observaciones || '',
        garantia: factura.garantia || '',
        condiciones: factura.condiciones || '',
        notasInternas: factura.notasInternas || '',
        items: factura.items.map(normalizeItem),
      })
    } else {
      setForm({
        ...emptyForm,
        clienteId: defaultClienteId || '',
        cotizacionId: defaultCotizacionId || '',
        vendedor: user?.nombre || 'Jesus Andres',
        items: defaultItems?.length ? defaultItems.map(normalizeItem) : [{ ...emptyCommercialItem }],
      })
    }
  }, [open, factura, defaultClienteId, defaultCotizacionId, defaultItems, user?.nombre])

  const handleSubmit = async () => {
    if (!form.clienteId) {
      toast.error('Seleccione un cliente para emitir la factura')
      return
    }
    if (!form.items.length || form.items.some((item) => !item.nombre.trim() || item.cantidad <= 0)) {
      toast.error('Cada producto debe tener nombre y cantidad mayor a 0')
      return
    }
    if (form.items.some((item) => item.precioUnit < 0)) {
      toast.error('El precio unitario no puede ser negativo')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        cotizacionId: form.cotizacionId || null,
        metodoPago: form.metodoPago === METODO_PAGO_NONE ? '' : form.metodoPago,
        socio: user?.nombre ?? 'Sistema',
        items: form.items.map((item) => ({
          ...item,
          descripcion: item.nombre,
        })),
      }

      const res = await fetch(factura ? `/api/facturas/${factura.id}` : '/api/facturas', {
        method: factura ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar factura')
      }

      toast.success(factura ? 'Factura actualizada' : 'Factura creada')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{factura ? 'Editar factura' : 'Nueva factura'}</DialogTitle>
          <DialogDescription>
            Complete informacion comercial, productos, impuestos y condiciones de la factura.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-4 rounded-md border p-4 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Cliente *</Label>
              <Select
                value={form.clienteId}
                onValueChange={(value) => setForm({ ...form, clienteId: value })}
                disabled={!!defaultClienteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.empresa ? `(${cliente.empresa})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha emision *</Label>
              <Input
                type="date"
                value={form.fechaEmision}
                onChange={(event) => setForm({ ...form, fechaEmision: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha vencimiento</Label>
              <Input
                type="date"
                value={form.fechaVencimiento}
                onChange={(event) => setForm({ ...form, fechaVencimiento: event.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDueDays(0)}>
                  Hoy
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDueDays(15)}>
                  15 dias
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDueDays(30)}>
                  30 dias
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, fechaVencimiento: '' })}>
                  Omitir
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Metodo de pago</Label>
              <Select
                value={form.metodoPago || METODO_PAGO_NONE}
                onValueChange={(value) => setForm({ ...form, metodoPago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODO_PAGO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de pago</Label>
              <Select value={form.formaPago} onValueChange={(value) => setForm({ ...form, formaPago: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMA_PAGO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Input value={form.moneda} onChange={(event) => setForm({ ...form, moneda: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Input value={form.vendedor} onChange={(event) => setForm({ ...form, vendedor: event.target.value })} />
            </div>
          </div>

          <CommercialItemsEditor
            items={form.items}
            descuentoGlobal={form.descuento}
            defaultIva={form.iva}
            onChange={(items) => setForm({ ...form, items })}
          />

          <div className="grid gap-4 rounded-md border p-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Descuento global (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={numberInputValue(form.descuento)}
                onChange={(event) => setForm({ ...form, descuento: parseNumberInput(event.target.value) })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Observaciones</Label>
              <Textarea
                value={form.observaciones}
                onChange={(event) => setForm({ ...form, observaciones: event.target.value })}
                rows={2}
                placeholder="Informacion visible para el cliente."
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Garantia</Label>
              <Textarea
                value={form.garantia}
                onChange={(event) => setForm({ ...form, garantia: event.target.value })}
                rows={3}
                placeholder="Garantia aplicable, exclusiones y vigencia."
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Condiciones comerciales</Label>
              <Textarea
                value={form.condiciones}
                onChange={(event) => setForm({ ...form, condiciones: event.target.value })}
                rows={3}
                placeholder="Condiciones de pago, entrega, soporte e instalacion."
              />
            </div>
            <div className="space-y-2 lg:col-span-4">
              <Label>Notas internas</Label>
              <Textarea
                value={form.notasInternas}
                onChange={(event) => setForm({ ...form, notasInternas: event.target.value })}
                rows={2}
                placeholder="Notas no visibles para el cliente."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {factura ? 'Guardar cambios' : 'Crear factura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
