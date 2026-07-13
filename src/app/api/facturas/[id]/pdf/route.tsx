import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { db } from '@/lib/db'
import { FacturaPDF } from '@/components/facturas/factura-pdf'
import { calculateTaxIncludedTotals } from '@/lib/totals'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === '1'

    const factura = await db.factura.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            nombre: true,
            empresa: true,
            nit: true,
            direccion: true,
            contactoNombre: true,
            telefono: true,
            email: true,
            ciudad: true,
            departamento: true,
            pais: true,
          },
        },
        items: { orderBy: { orden: 'asc' } },
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const config = await db.configuracionComercial.upsert({
      where: { id: 'default' },
      update: {},
      create: {},
    })
    const totals = calculateTaxIncludedTotals(factura.items, factura.descuento, factura.iva)

    const pdfDoc = (
      <FacturaPDF
        numero={factura.numero}
        fechaEmision={factura.fechaEmision.toISOString()}
        fechaVencimiento={factura.fechaVencimiento?.toISOString() || null}
        estado={factura.estado}
        cliente={factura.cliente}
        items={factura.items.map((item) => ({
          nombre: item.nombre,
          descripcion: item.descripcion,
          descripcionLarga: item.descripcionLarga,
          sku: item.sku,
          unidad: item.unidad,
          cantidad: item.cantidad,
          precioUnit: item.precioUnit,
          descuento: item.descuento,
          ivaTipo: item.ivaTipo,
          ivaPorcentaje: item.ivaPorcentaje,
          ivaMonto: item.ivaMonto,
          subtotal: item.subtotal,
        }))}
        subtotalGeneral={totals.subtotalGeneral}
        descuento={factura.descuento}
        descuentoMonto={totals.descuentoMonto}
        baseGravable={totals.baseGravable}
        ivaMonto={totals.ivaMonto}
        total={totals.total}
        observaciones={factura.observaciones}
        metodoPago={factura.metodoPago}
        formaPago={factura.formaPago}
        moneda={factura.moneda}
        vendedor={factura.vendedor}
        garantia={factura.garantia}
        condiciones={factura.condiciones}
        config={config}
      />
    )

    const buffer = await renderToBuffer(pdfDoc)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${preview ? 'inline' : 'attachment'}; filename="${factura.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
