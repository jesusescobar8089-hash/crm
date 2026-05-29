'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { formatCOP, formatFecha, formatFechaHora } from '@/lib/format'
import { CATEGORIA_INVENTARIO_LABELS, type CategoriaInventario } from '@/types'
import { useAuthStore } from '@/lib/auth-store'
import { ItemForm } from '@/components/inventario/item-form'
import { MovimientoForm } from '@/components/inventario/movimiento-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, ArrowUpDown, Edit, Trash2, ArrowRightLeft, Package, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface InventarioItem {
  id: string
  nombre: string
  categoria: CategoriaInventario
  unidad: string
  stockActual: number
  stockMinimo: number
  costoUnitario: number
  proveedor: string | null
  notas: string | null
  movimientos: MovimientoStock[]
  createdAt: string
}

interface MovimientoStock {
  id: string
  tipo: string
  cantidad: number
  costo: number | null
  proveedor: string | null
  descripcion: string
  socio: string
  fecha: string
  clienteId: string | null
}

const TIPO_MOVIMIENTO_LABELS: Record<string, string> = {
  ENTRADA: 'Entrada',
  SALIDA_INSTALACION: 'Salida - Instalación',
  SALIDA_VENTA: 'Salida - Venta',
  AJUSTE: 'Ajuste',
}

const TIPO_MOVIMIENTO_COLORS: Record<string, string> = {
  ENTRADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  SALIDA_INSTALACION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SALIDA_VENTA: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  AJUSTE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function InventarioPage() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')

  // Dialogs
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventarioItem | null>(null)
  const [movimientoOpen, setMovimientoOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<InventarioItem | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoriaFilter && categoriaFilter !== 'all') params.set('categoria', categoriaFilter)

      const res = await fetch(`/api/inventario?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {
      toast.error('Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }, [search, categoriaFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/inventario/${deleteItem.id}?socio=${user?.nombre || 'sistema'}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Ítem eliminado')
      setDeleteDialog(false)
      setDeleteItem(null)
      fetchItems()
    } catch {
      toast.error('Error al eliminar ítem')
    }
  }

  const isLowStock = (item: InventarioItem) => item.stockActual < item.stockMinimo

  const handleRowClick = (item: InventarioItem) => {
    if (expandedRow === item.id) {
      setExpandedRow(null)
    } else {
      setExpandedRow(item.id)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventario</h2>
          <p className="text-muted-foreground text-sm">
            Gestión de componentes, kits y materiales
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setItemFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ítem
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-sky-500" />
              <span className="text-sm text-muted-foreground">Total Ítems</span>
            </div>
            <p className="text-2xl font-bold mt-1">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Stock Bajo</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {items.filter(isLowStock).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-sm text-muted-foreground">Valor Total</span>
            <p className="text-lg font-bold mt-1">
              {formatCOP(items.reduce((sum, i) => sum + i.stockActual * i.costoUnitario, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-sm text-muted-foreground">Componentes</span>
            <p className="text-2xl font-bold mt-1">
              {items.filter((i) => i.categoria === 'COMPONENTE').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORIA_INVENTARIO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead className="hidden md:table-cell">Unidad</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right hidden md:table-cell">Mínimo</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Costo Unit.</TableHead>
              <TableHead className="hidden lg:table-cell">Proveedor</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron ítems
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <>
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer hover:bg-muted/50 ${isLowStock(item) ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="w-8">
                      {expandedRow === item.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.nombre}</span>
                        {isLowStock(item) && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px] px-1.5">
                            Bajo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="border-0">
                        {CATEGORIA_INVENTARIO_LABELS[item.categoria] || item.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{item.unidad}</TableCell>
                    <TableCell className="text-right">
                      <span className={isLowStock(item) ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                        {item.stockActual}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">{item.stockMinimo}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {formatCOP(item.costoUnitario)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground truncate block max-w-32">
                        {item.proveedor || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                              setDetailOpen(true)
                            }}
                          >
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                              setMovimientoOpen(true)
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Registrar Movimiento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditItem(item)
                              setItemFormOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteItem(item)
                              setDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRow === item.id && (
                    <TableRow key={`${item.id}-detail`}>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Costo Unitario:</span>
                              <p className="font-medium">{formatCOP(item.costoUnitario)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor en Stock:</span>
                              <p className="font-medium">{formatCOP(item.stockActual * item.costoUnitario)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Proveedor:</span>
                              <p className="font-medium">{item.proveedor || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Notas:</span>
                              <p className="font-medium">{item.notas || '—'}</p>
                            </div>
                          </div>

                          {item.movimientos && item.movimientos.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Últimos Movimientos</h4>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {item.movimientos.map((mov) => (
                                  <div key={mov.id} className="flex items-center justify-between text-xs bg-background rounded p-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className={`border-0 text-[10px] px-1.5 ${TIPO_MOVIMIENTO_COLORS[mov.tipo] || ''}`}>
                                        {TIPO_MOVIMIENTO_LABELS[mov.tipo] || mov.tipo}
                                      </Badge>
                                      <span>{mov.descripcion}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={mov.tipo === 'ENTRADA' || (mov.tipo === 'AJUSTE' && mov.cantidad > 0) ? 'text-emerald-600' : 'text-red-600'}>
                                        {mov.tipo === 'ENTRADA' || (mov.tipo === 'AJUSTE' && mov.cantidad > 0) ? '+' : '-'}{Math.abs(mov.cantidad)}
                                      </span>
                                      <span className="text-muted-foreground">{formatFechaHora(mov.fecha)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                              setMovimientoOpen(true)
                            }}
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            Registrar Movimiento
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Item Form Dialog */}
      <ItemForm
        open={itemFormOpen}
        onOpenChange={(open) => {
          setItemFormOpen(open)
          if (!open) setEditItem(null)
        }}
        item={editItem}
        onSuccess={fetchItems}
      />

      {/* Movement Form Dialog */}
      {selectedItem && (
        <MovimientoForm
          open={movimientoOpen}
          onOpenChange={setMovimientoOpen}
          itemId={selectedItem.id}
          itemName={selectedItem.nombre}
          onSuccess={fetchItems}
        />
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.nombre}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Categoría</span>
                  <p className="font-medium">{CATEGORIA_INVENTARIO_LABELS[selectedItem.categoria]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Unidad</span>
                  <p className="font-medium">{selectedItem.unidad}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Stock Actual</span>
                  <p className={`font-bold text-lg ${isLowStock(selectedItem) ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {selectedItem.stockActual} / {selectedItem.stockMinimo}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Costo Unitario</span>
                  <p className="font-medium">{formatCOP(selectedItem.costoUnitario)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor en Stock</span>
                  <p className="font-medium">{formatCOP(selectedItem.stockActual * selectedItem.costoUnitario)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Proveedor</span>
                  <p className="font-medium">{selectedItem.proveedor || '—'}</p>
                </div>
              </div>
              {selectedItem.notas && (
                <div>
                  <span className="text-muted-foreground text-sm">Notas</span>
                  <p className="text-sm mt-1 bg-muted p-3 rounded">{selectedItem.notas}</p>
                </div>
              )}

              {/* Full movements list */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Historial de Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedItem.movimientos && selectedItem.movimientos.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedItem.movimientos.map((mov) => (
                        <div key={mov.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`border-0 text-[10px] px-1.5 ${TIPO_MOVIMIENTO_COLORS[mov.tipo] || ''}`}>
                              {TIPO_MOVIMIENTO_LABELS[mov.tipo] || mov.tipo}
                            </Badge>
                            <span>{mov.descripcion}</span>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <span className={`font-medium ${mov.tipo === 'ENTRADA' || (mov.tipo === 'AJUSTE' && mov.cantidad > 0) ? 'text-emerald-600' : 'text-red-600'}`}>
                              {mov.tipo === 'ENTRADA' || (mov.tipo === 'AJUSTE' && mov.cantidad > 0) ? '+' : '-'}{Math.abs(mov.cantidad)} {selectedItem.unidad}
                            </span>
                            <span className="text-muted-foreground w-24">{formatFecha(mov.fecha)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin movimientos registrados</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false)
                    setMovimientoOpen(true)
                  }}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Registrar Movimiento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false)
                    setEditItem(selectedItem)
                    setItemFormOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Ítem
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Eliminar Ítem"
        description={`¿Está seguro de eliminar "${deleteItem?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
