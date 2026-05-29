'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, FileText, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { CotizacionForm } from '@/components/cotizaciones/cotizacion-form'
import { formatCOP, formatFecha } from '@/lib/format'
import { ESTADO_COTIZACION_LABELS, type EstadoCotizacion } from '@/types'

interface CotizacionRow {
  id: string
  numero: string
  cliente: { id: string; nombre: string; empresa: string | null }
  fechaEmision: string
  estado: string
  socio: string
  total: number
}

const estadoOptions = Object.entries(ESTADO_COTIZACION_LABELS).map(([value, label]) => ({
  value,
  label,
}))

function getColumns(router: ReturnType<typeof useRouter>): ColumnDef<CotizacionRow>[] {
  return [
    {
      accessorKey: 'numero',
      header: 'Número',
      cell: ({ row }) => (
        <button
          className="font-mono font-medium text-sm text-primary hover:underline cursor-pointer"
          onClick={() => router.push(`/cotizaciones/${row.original.id}`)}
        >
          {row.getValue('numero')}
        </button>
      ),
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const cliente = row.original.cliente
        return (
          <div>
            <div className="font-medium">{cliente.nombre}</div>
            {cliente.empresa && (
              <div className="text-xs text-muted-foreground">{cliente.empresa}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'fechaEmision',
      header: 'Fecha Emisión',
      cell: ({ row }) => formatFecha(row.getValue('fechaEmision')),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge type="cotizacion" value={row.getValue('estado') as EstadoCotizacion} />,
      filterFn: (row, _columnId, filterValue) => {
        return row.getValue('estado') === filterValue
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold">{formatCOP(row.getValue('total'))}</span>
      ),
    },
    {
      accessorKey: 'socio',
      header: 'Socio',
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push(`/cotizaciones/${row.original.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]
}

export default function CotizacionesPage() {
  const router = useRouter()
  const [data, setData] = useState<CotizacionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const columns = getColumns(router)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cotizaciones')
      if (res.ok) {
        const cotizaciones = await res.json()
        setData(cotizaciones)
      }
    } catch {
      toast.error('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Cotizaciones</h2>
              <p className="text-sm text-muted-foreground">
                Seguimiento de propuestas, estados y valores comerciales.
              </p>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {estadoOptions.slice(0, 4).map((estado) => (
          <Card key={estado.value} className="rounded-md shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{estado.label}</p>
              <p className="mt-2 text-2xl font-semibold">
                {data.filter((item) => item.estado === estado.value).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
          <FileText className="h-12 w-12" />
          <p>No hay cotizaciones registradas</p>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primera cotización
          </Button>
        </div>
      ) : (
        <Card className="rounded-md shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Listado de Cotizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data}
              searchPlaceholder="Buscar por número o cliente..."
              filterKey="estado"
              filterOptions={estadoOptions}
              pageSize={10}
            />
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <CotizacionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchData}
      />
    </div>
  )
}
