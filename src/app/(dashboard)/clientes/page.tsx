'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { ESTADO_CLIENTE_LABELS, type EstadoCliente } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

interface Cliente {
  id: string
  nombre: string
  empresa: string | null
  contactoNombre: string
  telefono: string
  email: string | null
  ciudad: string
  departamento: string
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
      header: 'Socio',
      cell: ({ row }) => {
        const val = row.getValue('socioResponsable') as string
        return val === 'socioA' ? 'Socio A' : val === 'socioB' ? 'Socio B' : val
      },
      filterFn: (row, _columnId, filterValue) => {
        if (filterValue === 'all') return true
        return row.getValue('socioResponsable') === filterValue
      },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-500" />
            Clientes
          </h2>
          <p className="text-muted-foreground">
            Gestiona la información de tus clientes
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['INSTALADO_ACTIVO', 'EN_NEGOCIACION', 'COTIZADO', 'INACTIVO_PERDIDO'] as EstadoCliente[]).map((estado) => {
          const count = clientes.filter((c) => c.estado === estado).length
          return (
            <Card key={estado} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/clientes?estado=${estado}`)}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{ESTADO_CLIENTE_LABELS[estado]}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card>
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
    </div>
  )
}
