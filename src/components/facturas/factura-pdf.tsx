import { Document } from '@react-pdf/renderer'
import {
  CommercialDocumentPage,
  NoteBox,
  NotesAndTotals,
  PartyAndDocumentInfo,
  ProductsTable,
  TotalsBox,
  formatFechaPDF,
  type PdfClient,
  type PdfItem,
} from '@/components/shared/agroeve-pdf'
import type { CommercialConfig } from '@/lib/commercial-config'

interface FacturaPDFProps {
  numero: string
  fechaEmision: string
  fechaVencimiento: string | null
  estado: string
  cliente: PdfClient
  items: PdfItem[]
  subtotalGeneral: number
  descuento: number
  descuentoMonto: number
  baseGravable: number
  ivaMonto: number
  total: number
  observaciones: string | null
  metodoPago: string | null
  formaPago: string | null
  moneda: string
  vendedor: string | null
  garantia: string | null
  condiciones: string | null
  config: Partial<CommercialConfig>
}

const metodoLabel = (value?: string | null) => {
  if (value === 'transferencia') return 'Transferencia bancaria'
  if (value === 'efectivo') return 'Efectivo'
  if (value === 'tarjeta') return 'Tarjeta'
  if (value === 'otro') return 'Otro'
  return value || null
}

const formaPagoLabel = (value?: string | null) => {
  if (value === 'contado') return 'Contado'
  if (value === 'credito_15') return 'Credito a 15 dias'
  if (value === 'credito_30') return 'Credito a 30 dias'
  if (value === 'anticipo_saldo') return 'Anticipo y saldo contra entrega'
  if (value === 'anticipo_50') return '50% anticipo, 50% contra entrega'
  return value || null
}

export function FacturaPDF({
  numero,
  fechaEmision,
  fechaVencimiento,
  cliente,
  items,
  subtotalGeneral,
  descuento,
  descuentoMonto,
  baseGravable,
  ivaMonto,
  total,
  observaciones,
  metodoPago,
  formaPago,
  moneda,
  vendedor,
  garantia,
  condiciones,
  config,
}: FacturaPDFProps) {
  return (
    <Document>
      <CommercialDocumentPage title="Factura de venta" number={numero} config={config}>
        <PartyAndDocumentInfo
          cliente={cliente}
          documentRows={[
            { label: 'Numero', value: numero },
            { label: 'Emision', value: formatFechaPDF(fechaEmision) },
            { label: 'Vencimiento', value: fechaVencimiento ? formatFechaPDF(fechaVencimiento) : null },
            { label: 'Metodo pago', value: metodoLabel(metodoPago) },
            { label: 'Forma pago', value: formaPagoLabel(formaPago) },
            { label: 'Moneda', value: moneda },
            { label: 'Vendedor', value: vendedor },
          ]}
        />

        <ProductsTable items={items} currency={moneda} />

        <NotesAndTotals
          totals={(
            <TotalsBox
              subtotalGeneral={subtotalGeneral}
              descuento={descuento}
              descuentoMonto={descuentoMonto}
              baseGravable={baseGravable}
              ivaMonto={ivaMonto}
              total={total}
              currency={moneda}
              totalLabel="Total a pagar"
            />
          )}
        >
          <NoteBox title="Observaciones">{observaciones}</NoteBox>
          <NoteBox title="Condiciones comerciales">{condiciones || config.notasAutomaticas}</NoteBox>
          <NoteBox title="Garantia">{garantia}</NoteBox>
          <NoteBox title="Informacion bancaria">{config.informacionBancaria}</NoteBox>
        </NotesAndTotals>
      </CommercialDocumentPage>
    </Document>
  )
}
