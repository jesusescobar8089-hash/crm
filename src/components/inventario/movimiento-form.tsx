'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { numberInputValue, parseNumberInput } from '@/lib/numbers'
import type { TipoMovimiento } from '@/types'
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

const TIPO_MOVIMIENTO_OPTIONS: { value: TipoMovimiento; label: string }[] = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SALIDA_INSTALACION', label: 'Salida - Instalación' },
  { value: 'SALIDA_VENTA', label: 'Salida - Venta' },
  { value: 'AJUSTE', label: 'Ajuste (+/-)' },
]

interface MovimientoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  itemName: string
  onSuccess: () => void
}

export function MovimientoForm({ open, onOpenChange, itemId, itemName, onSuccess }: MovimientoFormProps) {
  const { user } = useAuthStore()
  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA')
  const [cantidad, setCantidad] = useState<number>(0)
  const [costo, setCosto] = useState<number>(0)
  const [proveedor, setProveedor] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])

  // Load clients when dialog opens
  const handleOpenChange = async (openVal: boolean) => {
    if (openVal && clientes.length === 0) {
      try {
        const res = await fetch('/api/clientes')
        if (res.ok) {
          const data = await res.json()
          setClientes(data.map((c: { id: string; nombre: string }) => ({ id: c.id, nombre: c.nombre })))
        }
      } catch {
        // ignore
      }
    }
    onOpenChange(openVal)
  }

  const resetForm = () => {
    setTipo('ENTRADA')
    setCantidad(0)
    setCosto(0)
    setProveedor('')
    setClienteId('')
    setDescripcion('')
    setFecha(new Date().toISOString().split('T')[0])
  }

  const handleSubmit = async () => {
    if (cantidad === 0 && tipo !== 'AJUSTE') {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (tipo === 'AJUSTE' && cantidad === 0) {
      toast.error('La cantidad de ajuste no puede ser 0')
      return
    }
    if (!descripcion.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        tipo,
        cantidad,
        descripcion,
        socio: user?.nombre || 'sistema',
        fecha,
      }

      if (tipo === 'ENTRADA') {
        body.costo = costo
        body.proveedor = proveedor
      }

      if (tipo === 'SALIDA_INSTALACION' || tipo === 'SALIDA_VENTA') {
        body.clienteId = clienteId || null
      }

      const res = await fetch(`/api/inventario/${itemId}/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Error al registrar movimiento')

      toast.success('Movimiento registrado')
      onOpenChange(false)
      resetForm()
      onSuccess()
    } catch {
      toast.error('Error al registrar movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento - {itemName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Movimiento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_MOVIMIENTO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cantidad">
              Cantidad {tipo === 'AJUSTE' ? '(positivo o negativo)' : ''}
            </Label>
            <Input
              id="cantidad"
              type="number"
              value={numberInputValue(cantidad)}
              onChange={(e) => setCantidad(parseNumberInput(e.target.value))}
            />
          </div>

          {tipo === 'ENTRADA' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="costo">Costo Unitario</Label>
                <Input
                  id="costo"
                  type="number"
                  min="0"
                  value={numberInputValue(costo)}
                  onChange={(e) => setCosto(parseNumberInput(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Nombre del proveedor"
                />
              </div>
            </>
          )}

          {(tipo === 'SALIDA_INSTALACION' || tipo === 'SALIDA_VENTA') && (
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

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del movimiento"
              rows={3}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Movimiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
