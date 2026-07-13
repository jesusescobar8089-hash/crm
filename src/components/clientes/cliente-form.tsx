'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EstadoCliente, TipoNegocio } from '@/types'
import { ESTADO_CLIENTE_LABELS } from '@/types'
import { OPERATOR_OPTIONS, PRIMARY_OPERATOR_ID, getOperatorValue } from '@/lib/operator'

const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  empresa: z.string().optional(),
  nit: z.string().optional(),
  direccion: z.string().optional(),
  contactoNombre: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  ciudad: z.string().min(1, 'La ciudad es obligatoria'),
  departamento: z.string().min(1, 'El departamento es obligatorio'),
  pais: z.string().optional(),
  tipoNegocio: z.string().min(1, 'El tipo de negocio es obligatorio'),
  estado: z.string().min(1, 'El estado es obligatorio'),
  socioResponsable: z.string().min(1, 'El responsable es obligatorio'),
  notas: z.string().optional(),
})

type ClienteFormValues = z.infer<typeof clienteSchema>

interface Cliente {
  id: string
  nombre: string
  empresa: string | null
  nit: string | null
  direccion: string | null
  contactoNombre: string
  telefono: string
  email: string | null
  ciudad: string
  departamento: string
  pais: string | null
  tipoNegocio: string
  estado: string
  socioResponsable: string
  notas: string | null
}

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente | null
  onSuccess?: () => void
}

const ESTADOS: EstadoCliente[] = ['COTIZADO', 'EN_NEGOCIACION', 'INSTALADO_ACTIVO', 'INACTIVO_PERDIDO']
const TIPOS_NEGOCIO: { value: TipoNegocio; label: string }[] = [
  { value: 'piscicultura', label: 'Piscicultura' },
  { value: 'camaronicultura', label: 'Camaronicultura' },
  { value: 'agricultura', label: 'Agricultura' },
  { value: 'otro', label: 'Otro' },
]

export function ClienteForm({ open, onOpenChange, cliente, onSuccess }: ClienteFormProps) {
  const isEditing = !!cliente
  const [includeContacto, setIncludeContacto] = useState(false)
  const [includeTelefono, setIncludeTelefono] = useState(false)
  const [includeEmail, setIncludeEmail] = useState(false)

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      empresa: '',
      nit: '',
      direccion: '',
      contactoNombre: '',
      telefono: '',
      email: '',
      ciudad: '',
      departamento: '',
      pais: 'Colombia',
      tipoNegocio: 'piscicultura',
      estado: 'COTIZADO',
      socioResponsable: PRIMARY_OPERATOR_ID,
      notas: '',
    },
  })

  useEffect(() => {
    if (cliente) {
      setIncludeContacto(Boolean(cliente.contactoNombre))
      setIncludeTelefono(Boolean(cliente.telefono))
      setIncludeEmail(Boolean(cliente.email))
      form.reset({
        nombre: cliente.nombre,
        empresa: cliente.empresa ?? '',
        nit: cliente.nit ?? '',
        direccion: cliente.direccion ?? '',
        contactoNombre: cliente.contactoNombre,
        telefono: cliente.telefono,
        email: cliente.email ?? '',
        ciudad: cliente.ciudad,
        departamento: cliente.departamento,
        pais: cliente.pais ?? 'Colombia',
        tipoNegocio: cliente.tipoNegocio as TipoNegocio,
        estado: cliente.estado as EstadoCliente,
        socioResponsable: getOperatorValue(cliente.socioResponsable),
        notas: cliente.notas ?? '',
      })
    } else {
      setIncludeContacto(false)
      setIncludeTelefono(false)
      setIncludeEmail(false)
      form.reset({
        nombre: '',
        empresa: '',
        nit: '',
        direccion: '',
        contactoNombre: '',
        telefono: '',
        email: '',
        ciudad: '',
        departamento: '',
        pais: 'Colombia',
        tipoNegocio: 'piscicultura',
        estado: 'COTIZADO',
        socioResponsable: PRIMARY_OPERATOR_ID,
        notas: '',
      })
    }
  }, [cliente, form])

  const onSubmit = async (values: ClienteFormValues) => {
    try {
      const url = isEditing ? `/api/clientes/${cliente.id}` : '/api/clientes'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar cliente')
      }

      toast.success(isEditing ? 'Cliente actualizado' : 'Cliente creado')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos del cliente' : 'Completa los datos para crear un nuevo cliente'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT / Cedula</FormLabel>
                    <FormControl>
                      <Input placeholder="Identificacion fiscal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direccion</FormLabel>
                    <FormControl>
                      <Input placeholder="Direccion comercial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3 rounded-md border bg-muted/20 p-3 sm:col-span-2">
                <div>
                  <FormLabel>Datos de contacto opcionales</FormLabel>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selecciona solo los datos que quieras guardar para este cliente.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeContacto}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true
                        setIncludeContacto(enabled)
                        if (!enabled) form.setValue('contactoNombre', '')
                      }}
                    />
                    Contacto
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeTelefono}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true
                        setIncludeTelefono(enabled)
                        if (!enabled) form.setValue('telefono', '')
                      }}
                    />
                    Telefono
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeEmail}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true
                        setIncludeEmail(enabled)
                        if (!enabled) form.setValue('email', '')
                      }}
                    />
                    Correo
                  </label>
                </div>
              </div>
              {includeContacto && (
                <FormField
                  control={form.control}
                  name="contactoNombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Persona de contacto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {includeTelefono && (
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {includeEmail && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Departamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pais</FormLabel>
                    <FormControl>
                      <Input placeholder="Colombia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipoNegocio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Negocio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_NEGOCIO.map((tipo) => (
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
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS.map((est) => (
                          <SelectItem key={est} value={est}>
                            {ESTADO_CLIENTE_LABELS[est]}
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
                name="socioResponsable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable operativo *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." className="resize-none" rows={3} {...field} />
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
                {form.formState.isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
