'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/lib/auth-store'
import { OPERATOR_OPTIONS, PRIMARY_OPERATOR_ID, getOperatorValue } from '@/lib/operator'
import { ESTADO_TAREA_LABELS } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const tareaSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string(),
  asignadoA: z.enum(['socioPrincipal', 'socioA', 'socioB', 'ambos']),
  prioridad: z.enum(['ALTA', 'MEDIA', 'BAJA']),
  fechaLimite: z.string(),
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA']),
  clienteId: z.string(),
})

type TareaFormValues = z.infer<typeof tareaSchema>

interface ClienteOption {
  id: string
  nombre: string
  empresa: string | null
}

interface TareaData {
  id?: string
  titulo: string
  descripcion?: string | null
  asignadoA: string
  prioridad: string
  fechaLimite?: string | null
  estado: string
  clienteId?: string | null
}

interface TareaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tarea?: TareaData | null
  onSuccess: () => void
}

const PRIORIDAD_LABELS: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

export function TareaForm({ open, onOpenChange, tarea, onSuccess }: TareaFormProps) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const { user } = useAuthStore()
  const isEditing = !!tarea?.id

  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      asignadoA: PRIMARY_OPERATOR_ID,
      prioridad: 'MEDIA',
      fechaLimite: '',
      estado: 'PENDIENTE',
      clienteId: '',
    },
  })

  // Load clientes
  useEffect(() => {
    async function loadClientes() {
      try {
        const res = await fetch('/api/clientes')
        if (res.ok) {
          const data = await res.json()
          setClientes(data.map((c: { id: string; nombre: string; empresa: string | null }) => ({
            id: c.id,
            nombre: c.nombre,
            empresa: c.empresa,
          })))
        }
      } catch {
        // Silently fail
      }
    }
    if (open) loadClientes()
  }, [open])

  // Reset form when tarea changes
  useEffect(() => {
    if (open) {
      if (tarea) {
        const fechaStr = tarea.fechaLimite
          ? new Date(tarea.fechaLimite).toISOString().split('T')[0]
          : ''
        form.reset({
          titulo: tarea.titulo || '',
          descripcion: tarea.descripcion || '',
          asignadoA: getOperatorValue(tarea.asignadoA) as TareaFormValues['asignadoA'],
          prioridad: (tarea.prioridad as 'ALTA' | 'MEDIA' | 'BAJA') || 'MEDIA',
          fechaLimite: fechaStr,
          estado: (tarea.estado as 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA') || 'PENDIENTE',
          clienteId: tarea.clienteId || '',
        })
      } else {
        form.reset({
          titulo: '',
          descripcion: '',
          asignadoA: PRIMARY_OPERATOR_ID,
          prioridad: 'MEDIA',
          fechaLimite: '',
          estado: 'PENDIENTE',
          clienteId: '',
        })
      }
    }
  }, [open, tarea, form])

  const onSubmit = async (values: TareaFormValues) => {
    setLoading(true)
    try {
      const url = isEditing ? `/api/tareas/${tarea!.id}` : '/api/tareas'
      const method = isEditing ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        titulo: values.titulo,
        descripcion: values.descripcion || null,
        asignadoA: values.asignadoA,
        prioridad: values.prioridad,
        estado: values.estado,
        clienteId: values.clienteId && values.clienteId !== 'none' ? values.clienteId : null,
        socio: user?.nombre || 'sistema',
      }

      if (values.fechaLimite) {
        body.fechaLimite = values.fechaLimite
      } else {
        body.fechaLimite = null
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al guardar')
      }

      toast.success(isEditing ? 'Tarea actualizada' : 'Tarea creada')
      onOpenChange(false)
      form.reset()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Título de la tarea" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de la tarea"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asignadoA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRIORIDAD_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaLimite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha límite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ESTADO_TAREA_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="clienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente vinculado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}{c.empresa ? ` - ${c.empresa}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Tarea'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
