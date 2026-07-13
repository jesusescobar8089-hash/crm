import type { ReactNode } from 'react'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { DEFAULT_COMMERCIAL_CONFIG, type CommercialConfig } from '@/lib/commercial-config'

export const formatCOP = (valor: number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(valor)

export const formatFechaPDF = (fecha: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(fecha))

const joinFilled = (values: Array<string | null | undefined>) => values.filter(Boolean).join(' | ')

export const colors = {
  green: '#428d73',
  greenDark: '#225b46',
  blue: '#5c9bc6',
  blueDark: '#3b5286',
  ink: '#1f2933',
  muted: '#5f6f7a',
  soft: '#f3f8f6',
  softBlue: '#eef6fb',
  border: '#d9e7e2',
  white: '#ffffff',
  red: '#c2413b',
}

function getLogoDataUri(logoUrl?: string) {
  if (!logoUrl?.trim()) return null
  const publicPath = logoUrl
  const absolutePath = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''))
  if (!existsSync(absolutePath)) return null
  const ext = path.extname(absolutePath).toLowerCase()
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
  return `data:${mimeType};base64,${readFileSync(absolutePath).toString('base64')}`
}

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.7,
    color: colors.ink,
    paddingTop: 38,
    paddingRight: 42,
    paddingBottom: 48,
    paddingLeft: 42,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 18,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.green,
  },
  logo: {
    width: 205,
    height: 62,
    objectFit: 'contain' as const,
    marginLeft: -18,
    marginBottom: 5,
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: colors.greenDark,
  },
  companyText: {
    fontSize: 7.5,
    color: colors.muted,
    lineHeight: 1.35,
  },
  documentBadge: {
    width: 215,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.soft,
  },
  documentTitle: {
    fontSize: 16,
    color: colors.greenDark,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  documentNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
    marginBottom: 7,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 7.4,
  },
  metaValue: {
    color: colors.ink,
    fontSize: 7.6,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right' as const,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
  },
  boxTitle: {
    fontSize: 8.6,
    color: colors.greenDark,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  line: {
    flexDirection: 'row',
    marginBottom: 2,
    gap: 6,
  },
  label: {
    width: 72,
    fontSize: 7.4,
    color: colors.muted,
  },
  value: {
    flex: 1,
    fontSize: 7.8,
    color: colors.ink,
    lineHeight: 1.35,
  },
  table: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.greenDark,
    paddingVertical: 7,
    paddingHorizontal: 7,
  },
  tableHeaderText: {
    color: colors.white,
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.soft,
  },
  colProduct: { width: '45%' },
  colProductNoSku: { width: '57%' },
  colSku: { width: '12%' },
  colQty: { width: '14%', textAlign: 'right' as const },
  colUnit: { width: '10%' },
  colPrice: { width: '14%', textAlign: 'right' as const },
  colTax: { width: '0%', textAlign: 'right' as const },
  colTotal: { width: '15%', textAlign: 'right' as const },
  productName: {
    fontSize: 8.2,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
    lineHeight: 1.3,
  },
  productDescription: {
    marginTop: 2,
    fontSize: 7.4,
    color: colors.muted,
    lineHeight: 1.35,
  },
  tableText: {
    fontSize: 7.6,
    color: colors.ink,
    lineHeight: 1.35,
  },
  bottomArea: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
    alignItems: 'flex-start',
  },
  notesArea: {
    flex: 1,
    gap: 8,
  },
  noteBox: {
    padding: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  noteTitle: {
    fontSize: 8,
    color: colors.greenDark,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  noteText: {
    fontSize: 7.6,
    color: colors.ink,
    lineHeight: 1.45,
  },
  totalsBox: {
    width: 218,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  totalRowNormal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
    paddingHorizontal: 9,
  },
  totalRowStrong: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 9,
    backgroundColor: colors.softBlue,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 8,
    color: colors.muted,
  },
  totalValue: {
    fontSize: 8,
    color: colors.ink,
  },
  grandLabel: {
    fontSize: 11,
    color: colors.blueDark,
    fontFamily: 'Helvetica-Bold',
  },
  grandValue: {
    fontSize: 11,
    color: colors.greenDark,
    fontFamily: 'Helvetica-Bold',
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 22,
  },
  signatureBox: {
    flex: 1,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.ink,
  },
  signatureText: {
    fontSize: 7.5,
    color: colors.muted,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 24,
    left: 42,
    right: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: colors.muted,
  },
})

export interface PdfClient {
  nombre: string
  empresa: string | null
  nit?: string | null
  direccion?: string | null
  contactoNombre?: string | null
  telefono?: string | null
  email: string | null
  ciudad: string
  departamento: string | null
  pais?: string | null
}

export interface PdfItem {
  nombre?: string | null
  descripcion: string
  descripcionLarga?: string | null
  sku?: string | null
  unidad?: string | null
  cantidad: number
  precioUnit: number
  descuento?: number
  ivaTipo?: string
  ivaPorcentaje?: number
  ivaMonto?: number
  subtotal: number
}

export function CommercialDocumentPage({
  title,
  number,
  config,
  children,
}: {
  title: string
  number: string
  config?: Partial<CommercialConfig> | null
  children: ReactNode
}) {
  const company = { ...DEFAULT_COMMERCIAL_CONFIG, ...config }
  const logo = getLogoDataUri(company.logoUrl)
  const footerText = company.piePagina === 'Documento generado por el sistema interno de AgroEve.'
    ? ''
    : company.piePagina

  return (
    <Page size="LETTER" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <View style={{ flex: 1 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image does not support alt. */}
          {logo && <Image src={logo} style={pdfStyles.logo} />}
          {!logo && <Text style={pdfStyles.companyName}>{company.razonSocial}</Text>}
          {company.nit && <Text style={pdfStyles.companyText}>NIT: {company.nit}</Text>}
          {company.direccion && <Text style={pdfStyles.companyText}>{company.direccion}</Text>}
          {joinFilled([company.ciudad, company.telefono]) && (
            <Text style={pdfStyles.companyText}>{joinFilled([company.ciudad, company.telefono])}</Text>
          )}
          {joinFilled([company.correo, company.paginaWeb]) && (
            <Text style={pdfStyles.companyText}>{joinFilled([company.correo, company.paginaWeb])}</Text>
          )}
        </View>
        <View style={pdfStyles.documentBadge}>
          <Text style={pdfStyles.documentTitle}>{title}</Text>
          <Text style={pdfStyles.documentNumber}>{number}</Text>
        </View>
      </View>

      {children}

      <View style={pdfStyles.footer} fixed>
        <Text style={pdfStyles.footerText}>
          {footerText}
        </Text>
        <Text
          style={pdfStyles.footerText}
          render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`}
        />
      </View>
    </Page>
  )
}

export function PartyAndDocumentInfo({
  cliente,
  documentRows,
}: {
  cliente: PdfClient
  documentRows: { label: string; value?: string | null }[]
}) {
  return (
    <View style={pdfStyles.twoColumns}>
      <View style={pdfStyles.infoBox}>
        <Text style={pdfStyles.boxTitle}>Cliente</Text>
        <InfoLine label="Nombre" value={cliente.nombre} />
        <InfoLine label="Empresa" value={cliente.empresa} />
        <InfoLine label="NIT/Cedula" value={cliente.nit} />
        <InfoLine label="Direccion" value={cliente.direccion} />
        <InfoLine label="Ciudad" value={[cliente.ciudad, cliente.departamento, cliente.pais].filter(Boolean).join(', ')} />
        <InfoLine label="Telefono" value={cliente.telefono} />
        <InfoLine label="Correo" value={cliente.email} />
        <InfoLine label="Contacto" value={cliente.contactoNombre} />
      </View>
      <View style={pdfStyles.infoBox}>
        <Text style={pdfStyles.boxTitle}>Informacion del documento</Text>
        {documentRows.map((row) => (
          <InfoLine key={row.label} label={row.label} value={row.value} />
        ))}
      </View>
    </View>
  )
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <View style={pdfStyles.line}>
      <Text style={pdfStyles.label}>{label}:</Text>
      <Text style={pdfStyles.value}>{value}</Text>
    </View>
  )
}

export function ProductsTable({ items, currency }: { items: PdfItem[]; currency: string }) {
  const showSku = items.some((item) => item.sku?.trim())
  const productCol = showSku ? pdfStyles.colProduct : pdfStyles.colProductNoSku

  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableHeader}>
        <Text style={[pdfStyles.tableHeaderText, productCol]}>Producto / descripcion</Text>
        {showSku && <Text style={[pdfStyles.tableHeaderText, pdfStyles.colSku]}>SKU</Text>}
        <Text style={[pdfStyles.tableHeaderText, pdfStyles.colQty]}>Cant./Unidad</Text>
        <Text style={[pdfStyles.tableHeaderText, pdfStyles.colPrice]}>Precio</Text>
        <Text style={[pdfStyles.tableHeaderText, pdfStyles.colTotal]}>Total</Text>
      </View>
      {items.map((item, index) => {
        const productTitle = item.nombre || item.descripcion
        const detail = item.descripcionLarga || (item.descripcion !== productTitle ? item.descripcion : '')

        return (
          <View key={`${item.descripcion}-${index}`} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt} wrap={false}>
            <View style={productCol}>
              <Text style={pdfStyles.productName}>{productTitle}</Text>
              {detail && <Text style={pdfStyles.productDescription}>{detail}</Text>}
            </View>
            {showSku && <Text style={[pdfStyles.tableText, pdfStyles.colSku]}>{item.sku || ''}</Text>}
            <Text style={[pdfStyles.tableText, pdfStyles.colQty]}>
              {item.unidad ? `${item.cantidad} ${item.unidad}` : item.cantidad}
            </Text>
            <Text style={[pdfStyles.tableText, pdfStyles.colPrice]}>{formatCOP(item.precioUnit, currency)}</Text>
            <Text style={[pdfStyles.tableText, pdfStyles.colTotal]}>{formatCOP(item.subtotal, currency)}</Text>
          </View>
        )
      })}
    </View>
  )
}

export function TotalsBox({
  subtotalGeneral,
  descuento,
  descuentoMonto,
  total,
  currency,
  totalLabel,
}: {
  subtotalGeneral: number
  descuento: number
  descuentoMonto: number
  baseGravable: number
  ivaMonto: number
  total: number
  currency: string
  totalLabel: string
}) {
  return (
    <View style={pdfStyles.totalsBox}>
      <TotalLine label="Subtotal" value={formatCOP(subtotalGeneral, currency)} />
      {descuento > 0 && <TotalLine label={`Descuento (${descuento}%)`} value={`-${formatCOP(descuentoMonto, currency)}`} />}
      <View style={pdfStyles.totalRowStrong}>
        <Text style={pdfStyles.grandLabel}>{totalLabel}</Text>
        <Text style={pdfStyles.grandValue}>{formatCOP(total, currency)}</Text>
      </View>
    </View>
  )
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.totalRowNormal}>
      <Text style={pdfStyles.totalLabel}>{label}</Text>
      <Text style={pdfStyles.totalValue}>{value}</Text>
    </View>
  )
}

export function NotesAndTotals({
  children,
  totals,
}: {
  children: ReactNode
  totals: ReactNode
}) {
  return (
    <View style={pdfStyles.bottomArea}>
      <View style={pdfStyles.notesArea}>{children}</View>
      {totals}
    </View>
  )
}

export function NoteBox({ title, children }: { title: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <View style={pdfStyles.noteBox}>
      <Text style={pdfStyles.noteTitle}>{title}</Text>
      <Text style={pdfStyles.noteText}>{children}</Text>
    </View>
  )
}

export function SignatureBoxes({ leftLabel, rightLabel }: { leftLabel: string; rightLabel: string }) {
  return (
    <View style={pdfStyles.signatureRow}>
      <View style={pdfStyles.signatureBox}>
        <Text style={pdfStyles.signatureText}>{leftLabel}</Text>
      </View>
      <View style={pdfStyles.signatureBox}>
        <Text style={pdfStyles.signatureText}>{rightLabel}</Text>
      </View>
    </View>
  )
}
