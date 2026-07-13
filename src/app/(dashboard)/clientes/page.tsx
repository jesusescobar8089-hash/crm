'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Users, Building2, Handshake, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { ESTADO_CLIENTE_LABELS } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { getOperatorLabel } from '@/lib/operator'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

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
  createdAt: string
  updatedAt: string
}

const TIPOS_NEGOCIO_LABELS: Record<string, string> = {
  piscicultura: 'Piscicultura',
  camaronicultura: 'Camaronicultura',
  agricultura: 'Agricultura',
  otro: 'Otro',
}

export default function ClientesPage() {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: clientes = [], isLoading, refetch } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes')
      if (!res.ok) throw new Error('Error al cargar clientes')
      return res.json()
    },
  })

  const handleRowClick = useCallback((cliente: Cliente) => {
    router.push(`/clientes/${cliente.id}`)
  }, [router])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/clientes/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'No fue posible eliminar el cliente')
      toast.success(`Cliente ${deleteTarget.nombre} eliminado`)
      setDeleteTarget(null)
      await refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar cliente')
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('nombre')}</span>
      ),
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue('empresa') || '—'}</span>
      ),
    },
    {
      accessorKey: 'contactoNombre',
      header: 'Contacto',
      cell: ({ row }) => row.getValue('contactoNombre'),
    },
    {
      accessorKey: 'ciudad',
      header: 'Ciudad',
    },
    {
      accessorKey: 'tipoNegocio',
      header: 'Tipo Negocio',
      cell: ({ row }) => {
        const val = row.getValue('tipoNegocio') as string
        return TIPOS_NEGOCIO_LABELS[val] || val
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge type="cliente" value={row.getValue('estado') as string} />
      ),
      filterFn: (row, _columnId, filterValue) => {
        if (filterValue === 'all') return true
        return row.getValue('estado') === filterValue
      },
    },
    {
      accessorKey: 'socioResponsable',
      header: 'Responsable',
      cell: ({ row }) => {
        const val = row.getValue('socioResponsable') as string
        return getOperatorLabel(val)
      },
      filterFn: (row, _columnId, filterValue) => {
        if (filterValue === 'all') return true
        return row.getValue('socioResponsable') === filterValue
      },
    },
    {
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Editar ${row.original.nombre}`}
            title="Editar cliente"
            onClick={() => setEditingClient(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Eliminar ${row.original.nombre}`}
            title="Eliminar cliente"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
              <p className="text-sm text-muted-foreground">
                Directorio comercial, estado de negociación y responsables.
              </p>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          ['INSTALADO_ACTIVO', CheckCircle2, 'text-emerald-600', 'bg-emerald-50 dark:bg-emerald-950/30'],
          ['EN_NEGOCIACION', Handshake, 'text-amber-600', 'bg-amber-50 dark:bg-amber-950/30'],
          ['COTIZADO', Building2, 'text-sky-600', 'bg-sky-50 dark:bg-sky-950/30'],
          ['INACTIVO_PERDIDO', XCircle, 'text-red-600', 'bg-red-50 dark:bg-red-950/30'],
        ] as const).map(([estado, Icon, color, bg]) => {
          const count = clientes.filter((c) => c.estado === estado).length
          return (
            <Card key={estado} className="min-h-20 cursor-pointer rounded-lg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" onClick={() => router.push(`/clientes?estado=${estado}`)}>
              <CardContent className="flex min-h-20 items-center justify-between p-4">
                <div className="text-center sm:text-left">
                  <p className="text-3xl font-bold tracking-tight">{count}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ESTADO_CLIENTE_LABELS[estado]}</p>
                </div>
                <span className={`rounded-lg p-3 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card className="rounded-md shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={clientes}
            searchPlaceholder="Buscar por nombre, empresa o contacto..."
            searchKey="nombre"
            filterKey="estado"
            filterOptions={Object.entries(ESTADO_CLIENTE_LABELS).map(([value, label]) => ({ value, label }))}
            pageSize={10}
            onRowClick={handleRowClick}
          />
          <div className="mt-3 text-xs text-muted-foreground">
            Haz clic en una fila para ver el detalle del cliente
          </div>
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          refetch()
          toast.success('Cliente creado exitosamente')
        }}
      />

      <ClienteForm
        open={Boolean(editingClient)}
        onOpenChange={(open) => { if (!open) setEditingClient(null) }}
        cliente={editingClient}
        onSuccess={() => {
          setEditingClient(null)
          refetch()
          toast.success('Cliente actualizado')
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}
        title="Eliminar cliente"
        description={`Se eliminará ${deleteTarget?.nombre ?? 'este cliente'} y sus cotizaciones, facturas, monitoreos e interacciones. Esta acción no se puede deshacer.`}
        confirmText={deleting ? 'Eliminando…' : 'Eliminar cliente'}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
