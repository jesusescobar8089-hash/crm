'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Receipt, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { FacturaForm } from '@/components/facturas/factura-form'
import { formatCOP, formatFecha } from '@/lib/format'
import { ESTADO_FACTURA_LABELS, type EstadoFactura } from '@/types'

interface FacturaRow {
  id: string
  numero: string
  cliente: { id: string; nombre: string; empresa: string | null }
  fechaEmision: string
  estado: string
  socio: string
  total: number
}

const estadoOptions = Object.entries(ESTADO_FACTURA_LABELS).map(([value, label]) => ({
  value,
  label,
}))

function getColumns(router: ReturnType<typeof useRouter>): ColumnDef<FacturaRow>[] {
  return [
    {
      accessorKey: 'numero',
      header: 'Número',
      cell: ({ row }) => (
        <button
          className="font-mono font-medium text-sm text-primary hover:underline cursor-pointer"
          onClick={() => router.push(`/facturas/${row.original.id}`)}
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
      cell: ({ row }) => <StatusBadge type="factura" value={row.getValue('estado') as EstadoFactura} />,
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
          onClick={() => router.push(`/facturas/${row.original.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]
}

export default function FacturasPage() {
  const router = useRouter()
  const [data, setData] = useState<FacturaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const columns = getColumns(router)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/facturas')
      if (res.ok) {
        const facturas = await res.json()
        setData(facturas)
      }
    } catch {
      toast.error('Error al cargar facturas')
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
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Facturas</h2>
              <p className="text-sm text-muted-foreground">
                Gestión de facturas de venta y control de pagos.
              </p>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {estadoOptions.map((estado) => (
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
          <Receipt className="h-12 w-12" />
          <p>No hay facturas registradas</p>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primera factura
          </Button>
        </div>
      ) : (
        <Card className="rounded-md shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Listado de Facturas</CardTitle>
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

      <FacturaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchData}
      />
    </div>
  )
}
