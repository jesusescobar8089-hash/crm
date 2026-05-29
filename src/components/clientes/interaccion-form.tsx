'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TipoInteraccion } from '@/types'

const interaccionSchema = z.object({
  tipo: z.string().min(1, 'El tipo es obligatorio'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  proximaAccion: z.string().optional(),
  fechaProxima: z.string().optional(),
})

type InteraccionFormValues = z.infer<typeof interaccionSchema>

interface InteraccionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  socio: string
  onSuccess?: () => void
}

const TIPOS_INTERACCION: { value: TipoInteraccion; label: string }[] = [
  { value: 'llamada', label: 'Llamada' },
  { value: 'visita', label: 'Visita' },
  { value: 'cotizacion_enviada', label: 'Cotización Enviada' },
  { value: 'instalacion', label: 'Instalación' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'nota', label: 'Nota' },
]

export function InteraccionForm({ open, onOpenChange, clienteId, socio, onSuccess }: InteraccionFormProps) {
  const form = useForm<InteraccionFormValues>({
    resolver: zodResolver(interaccionSchema),
    defaultValues: {
      tipo: 'llamada',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      proximaAccion: '',
      fechaProxima: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: 'llamada',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        proximaAccion: '',
        fechaProxima: '',
      })
    }
  }, [open, form])

  const onSubmit = async (values: InteraccionFormValues) => {
    try {
      const res = await fetch('/api/interacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          clienteId,
          socio,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al registrar interacción')
      }

      toast.success('Interacción registrada')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Interacción</DialogTitle>
          <DialogDescription>
            Registra una nueva interacción con el cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_INTERACCION.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
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
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción de la interacción..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proximaAccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima Acción</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Enviar cotización" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaProxima"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Próxima Acción</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Registrar Interacción'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
