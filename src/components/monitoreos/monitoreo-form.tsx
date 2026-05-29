'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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

interface ClienteOption {
  id: string
  nombre: string
  empresa: string | null
}

interface MonitoreoFormData {
  clienteId: string
  kitId: string
  fechaInstalacion: string
  frecuenciaMantenimiento: number
  observaciones: string
}

interface MonitoreoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  monitoreo?: {
    id: string
    clienteId: string
    kitId: string | null
    fechaInstalacion: string
    frecuenciaMantenimiento: number
    observaciones: string | null
  } | null
  onSuccess: () => void
}

const emptyForm: MonitoreoFormData = {
  clienteId: '',
  kitId: '',
  fechaInstalacion: new Date().toISOString().split('T')[0],
  frecuenciaMantenimiento: 30,
  observaciones: '',
}

export function MonitoreoForm({ open, onOpenChange, monitoreo, onSuccess }: MonitoreoFormProps) {
  const { user } = useAuthStore()
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<MonitoreoFormData>(emptyForm)

  useEffect(() => {
    if (open) {
      fetchClientes()
      if (monitoreo) {
        setForm({
          clienteId: monitoreo.clienteId,
          kitId: monitoreo.kitId ?? '',
          fechaInstalacion: new Date(monitoreo.fechaInstalacion).toISOString().split('T')[0],
          frecuenciaMantenimiento: monitoreo.frecuenciaMantenimiento,
          observaciones: monitoreo.observaciones ?? '',
        })
      } else {
        setForm(emptyForm)
      }
    }
  }, [open, monitoreo])

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

  const handleSubmit = async () => {
    if (!form.clienteId || !form.fechaInstalacion || !form.frecuenciaMantenimiento) {
      toast.error('Complete los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        socio: user?.nombre ?? 'Sistema',
      }

      let res: Response
      if (monitoreo) {
        res = await fetch(`/api/monitoreos/${monitoreo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/monitoreos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success(monitoreo ? 'Monitoreo actualizado' : 'Monitoreo creado')
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{monitoreo ? 'Editar Monitoreo' : 'Nuevo Monitoreo'}</DialogTitle>
          <DialogDescription>
            {monitoreo
              ? 'Modifique los datos del monitoreo'
              : 'Complete los datos para registrar un nuevo monitoreo'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={form.clienteId}
                onValueChange={(value) => setForm({ ...form, clienteId: value })}
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
            <div className="space-y-2">
              <Label htmlFor="kitId">Kit ID</Label>
              <Input
                id="kitId"
                placeholder="Ej: KIT-001"
                value={form.kitId}
                onChange={(e) => setForm({ ...form, kitId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInstalacion">Fecha Instalación *</Label>
              <Input
                id="fechaInstalacion"
                type="date"
                value={form.fechaInstalacion}
                onChange={(e) => setForm({ ...form, fechaInstalacion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frecuenciaMantenimiento">Frecuencia Mant. (días) *</Label>
              <Input
                id="frecuenciaMantenimiento"
                type="number"
                min={1}
                value={form.frecuenciaMantenimiento}
                onChange={(e) =>
                  setForm({ ...form, frecuenciaMantenimiento: parseInt(e.target.value) || 30 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones sobre el monitoreo..."
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {monitoreo ? 'Guardar Cambios' : 'Crear Monitoreo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
