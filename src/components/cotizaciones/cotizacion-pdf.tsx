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

const formaPagoLabel = (value?: string | null) => {
  if (value === 'contado') return 'Contado'
  if (value === 'credito_15') return 'Credito a 15 dias'
  if (value === 'credito_30') return 'Credito a 30 dias'
  if (value === 'anticipo_saldo') return 'Anticipo y saldo contra entrega'
  if (value === 'anticipo_50') return '50% anticipo, 50% contra entrega'
  return value || null
}

interface CotizacionPDFProps {
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
  moneda: string
  vendedor: string | null
  formaPago: string | null
  tiempoEntrega: string | null
  garantia: string | null
  condiciones: string | null
  aceptacionCliente: string | null
  config: Partial<CommercialConfig>
}

export function CotizacionPDF({
  numero,
  fechaEmision,
  fechaVencimiento,
  estado,
  cliente,
  items,
  subtotalGeneral,
  descuento,
  descuentoMonto,
  baseGravable,
  ivaMonto,
  total,
  observaciones,
  moneda,
  vendedor,
  formaPago,
  tiempoEntrega,
  garantia,
  condiciones,
  aceptacionCliente,
  config,
}: CotizacionPDFProps) {
  return (
    <Document>
      <CommercialDocumentPage title="Cotizacion" number={numero} config={config}>
        <PartyAndDocumentInfo
          cliente={cliente}
          documentRows={[
            { label: 'Numero', value: numero },
            { label: 'Emision', value: formatFechaPDF(fechaEmision) },
            { label: 'Valida hasta', value: fechaVencimiento ? formatFechaPDF(fechaVencimiento) : null },
            { label: 'Estado', value: estado },
            { label: 'Entrega', value: tiempoEntrega },
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
              totalLabel="Total propuesta"
            />
          )}
        >
          <NoteBox title="Observaciones">{observaciones}</NoteBox>
          <NoteBox title="Condiciones comerciales">{condiciones || config.notasAutomaticas}</NoteBox>
          <NoteBox title="Garantia">{garantia || config.garantiaPredeterminada}</NoteBox>
          <NoteBox title="Aceptacion del cliente">{aceptacionCliente}</NoteBox>
        </NotesAndTotals>
      </CommercialDocumentPage>
    </Document>
  )
}
