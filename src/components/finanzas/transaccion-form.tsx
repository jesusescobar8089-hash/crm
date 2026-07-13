'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { OPERATOR_OPTIONS, PRIMARY_OPERATOR_ID } from '@/lib/operator'
import { numberInputValue, parseNumberInput } from '@/lib/numbers'
import type { TipoTransaccion } from '@/types'
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

const TIPO_OPTIONS: { value: TipoTransaccion; label: string }[] = [
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'GASTO', label: 'Gasto' },
  { value: 'APORTE_SOCIO', label: 'Aporte del socio' },
  { value: 'RETIRO_SOCIO', label: 'Retiro del socio' },
]

const CATEGORIAS_INGRESO = [
  { value: 'venta_kit', label: 'Venta Kit' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'suscripcion', label: 'Suscripción' },
  { value: 'otro', label: 'Otro' },
]

const CATEGORIAS_GASTO = [
  { value: 'compartido', label: 'Gasto compartido' },
  { value: 'operacion', label: 'Operación' },
  { value: 'componentes', label: 'Componentes' },
  { value: 'materiales', label: 'Materiales' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'arriendo', label: 'Arriendo' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'nomina', label: 'Nómina' },
  { value: 'otro', label: 'Otro' },
]

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

interface TransaccionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoInicial?: TipoTransaccion
  onSuccess: () => void
}

export function TransaccionForm({ open, onOpenChange, tipoInicial, onSuccess }: TransaccionFormProps) {
  const [tipo, setTipo] = useState<TipoTransaccion>(tipoInicial || 'INGRESO')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState<number>(0)
  const [socio, setSocio] = useState(PRIMARY_OPERATOR_ID)
  const [metodoPago, setMetodoPago] = useState('transferencia')
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    if (tipoInicial) setTipo(tipoInicial)
  }, [tipoInicial])

  // Load clients
  useEffect(() => {
    if (open) {
      fetch('/api/clientes')
        .then((res) => res.json())
        .then((data) => setClientes(data.map((c: { id: string; nombre: string }) => ({ id: c.id, nombre: c.nombre }))))
        .catch(() => {})
    }
  }, [open])

  const resetForm = () => {
    setCategoria('')
    setDescripcion('')
    setMonto(0)
    setSocio(PRIMARY_OPERATOR_ID)
    setMetodoPago('transferencia')
    setClienteId('')
    setFecha(new Date().toISOString().split('T')[0])
  }

  const getCategories = () => {
    if (tipo === 'INGRESO') return CATEGORIAS_INGRESO
    if (tipo === 'GASTO') return CATEGORIAS_GASTO
    if (tipo === 'APORTE_SOCIO') return [{ value: 'aporte', label: 'Aporte de Capital' }]
    if (tipo === 'RETIRO_SOCIO') return [{ value: 'retiro', label: 'Retiro de Capital' }]
    return []
  }

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    if (!categoria) {
      toast.error('Seleccione una categoría')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        tipo,
        categoria,
        descripcion,
        monto,
        socio,
        metodoPago,
        fecha,
      }

      if (tipo === 'INGRESO') {
        body.clienteId = clienteId || null
      }

      const res = await fetch('/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Error al crear transacción')

      toast.success('Transacción registrada')
      onOpenChange(false)
      resetForm()
      onSuccess()
    } catch {
      toast.error('Error al registrar transacción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tipo === 'INGRESO' && 'Nuevo Ingreso'}
            {tipo === 'GASTO' && 'Nuevo Gasto'}
            {tipo === 'APORTE_SOCIO' && 'Nuevo Aporte'}
            {tipo === 'RETIRO_SOCIO' && 'Nuevo Retiro'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!tipoInicial && (
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoTransaccion); setCategoria('') }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {getCategories().map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la transacción"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="monto">Monto (COP) *</Label>
              <Input
                id="monto"
                type="number"
                min="0"
                value={numberInputValue(monto)}
                onChange={(e) => setMonto(parseNumberInput(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Responsable</Label>
              <Select value={socio} onValueChange={setSocio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tipo === 'INGRESO' && (
            <div className="grid gap-2">
              <Label>Cliente (opcional)</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
