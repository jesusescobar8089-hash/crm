'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
})

const formatCOP = (valor: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor)

const formatFechaPDF = (fecha: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(fecha))

const colors = {
  primary: '#0ea5e9',
  dark: '#1e293b',
  muted: '#64748b',
  light: '#f8fafc',
  border: '#e2e8f0',
  white: '#ffffff',
  accent: '#10b981',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: `2px solid ${colors.primary}`,
  },
  headerLeft: {
    flex: 1,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'Helvetica-Bold',
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  cotizacionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'Helvetica-Bold',
  },
  cotizacionNumber: {
    fontSize: 12,
    color: colors.dark,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  clientInfo: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  clientRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  clientLabel: {
    width: 80,
    fontSize: 9,
    color: colors.muted,
  },
  clientValue: {
    flex: 1,
    fontSize: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: '4 4 0 0',
  },
  tableHeaderText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.border}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.light,
  },
  tableCell: {
    fontSize: 9,
  },
  colDescription: { width: '40%' },
  colCantidad: { width: '15%', textAlign: 'right' as const },
  colPrecio: { width: '20%', textAlign: 'right' as const },
  colSubtotal: { width: '25%', textAlign: 'right' as const },
  summaryContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 10,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTop: `2px solid ${colors.primary}`,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  observationsBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.light,
    borderRadius: 4,
    borderLeft: `3px solid ${colors.primary}`,
  },
  observationsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.muted,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 9,
    color: colors.dark,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: `1px solid ${colors.border}`,
  },
  footerLeft: {
    fontSize: 8,
    color: colors.muted,
  },
  footerRight: {
    fontSize: 8,
    color: colors.muted,
    textAlign: 'right',
  },
  dateInfo: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  dateItem: {
    flexDirection: 'row',
    gap: 4,
  },
  dateLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  dateValue: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
})

interface CotizacionPDFProps {
  numero: string
  fechaEmision: string
  fechaVencimiento: string | null
  cliente: {
    nombre: string
    empresa: string | null
    contactoNombre: string
    telefono: string
    email: string | null
    ciudad: string
    departamento: string | null
  }
  items: {
    descripcion: string
    cantidad: number
    precioUnit: number
    subtotal: number
  }[]
  subtotalGeneral: number
  descuento: number
  descuentoMonto: number
  iva: number
  ivaMonto: number
  total: number
  observaciones: string | null
}

export function CotizacionPDF({
  numero,
  fechaEmision,
  fechaVencimiento,
  cliente,
  items,
  subtotalGeneral,
  descuento,
  descuentoMonto,
  iva,
  ivaMonto,
  total,
  observaciones,
}: CotizacionPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>AgroEve</Text>
            <Text style={styles.brandSubtitle}>Sistema de Monitoreo IoT</Text>
            <Text style={styles.brandSubtitle}>Kits de monitoreo en tiempo real para acuicultura y agroindustria</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.cotizacionTitle}>COTIZACIÓN</Text>
            <Text style={styles.cotizacionNumber}>{numero}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.dateInfo}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Fecha de emisión:</Text>
            <Text style={styles.dateValue}>{formatFechaPDF(fechaEmision)}</Text>
          </View>
          {fechaVencimiento && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Vence:</Text>
              <Text style={styles.dateValue}>{formatFechaPDF(fechaVencimiento)}</Text>
            </View>
          )}
        </View>

        {/* Client Info */}
        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.clientInfo}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Nombre:</Text>
            <Text style={styles.clientValue}>{cliente.empresa || cliente.nombre}</Text>
          </View>
          {cliente.empresa && (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Contacto:</Text>
              <Text style={styles.clientValue}>{cliente.contactoNombre}</Text>
            </View>
          )}
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Teléfono:</Text>
            <Text style={styles.clientValue}>{cliente.telefono}</Text>
          </View>
          {cliente.email && (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Email:</Text>
              <Text style={styles.clientValue}>{cliente.email}</Text>
            </View>
          )}
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Ciudad:</Text>
            <Text style={styles.clientValue}>{cliente.ciudad}{cliente.departamento ? `, ${cliente.departamento}` : ''}</Text>
          </View>
        </View>

        {/* Items Table */}
        <Text style={styles.sectionTitle}>Detalle</Text>
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.colCantidad]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrecio]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.colSubtotal]}>Subtotal</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, styles.colDescription]}>{item.descripcion}</Text>
              <Text style={[styles.tableCell, styles.colCantidad]}>{item.cantidad}</Text>
              <Text style={[styles.tableCell, styles.colPrecio]}>{formatCOP(item.precioUnit)}</Text>
              <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCOP(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCOP(subtotalGeneral)}</Text>
          </View>
          {descuento > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Descuento ({descuento}%)</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>-{formatCOP(descuentoMonto)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>IVA ({iva}%)</Text>
            <Text style={styles.summaryValue}>{formatCOP(ivaMonto)}</Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>{formatCOP(total)}</Text>
          </View>
        </View>

        {/* Observations */}
        {observaciones && (
          <View style={styles.observationsBox}>
            <Text style={styles.observationsTitle}>OBSERVACIONES / TÉRMINOS Y CONDICIONES</Text>
            <Text style={styles.observationsText}>{observaciones}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text>AgroEve · Sistema de Monitoreo IoT</Text>
            <Text>agroeve.co · contacto@agroeve.co</Text>
          </View>
          <View style={styles.footerRight}>
            <Text>Cotización válida por 30 días</Text>
            <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
