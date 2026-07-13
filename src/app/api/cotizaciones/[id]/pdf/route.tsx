import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { db } from '@/lib/db'
import { CotizacionPDF } from '@/components/cotizaciones/cotizacion-pdf'
import { calculateTaxIncludedTotals } from '@/lib/totals'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === '1'

    const cotizacion = await db.cotizacion.findUnique({
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

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    const totals = calculateTaxIncludedTotals(cotizacion.items, cotizacion.descuento, cotizacion.iva)
    const config = await db.configuracionComercial.upsert({
      where: { id: 'default' },
      update: {},
      create: {},
    })

    const pdfDoc = (
      <CotizacionPDF
        numero={cotizacion.numero}
        fechaEmision={cotizacion.fechaEmision.toISOString()}
        fechaVencimiento={cotizacion.fechaVencimiento?.toISOString() || null}
        estado={cotizacion.estado}
        cliente={cotizacion.cliente}
        items={cotizacion.items.map((item) => ({
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
        descuento={cotizacion.descuento}
        descuentoMonto={totals.descuentoMonto}
        baseGravable={totals.baseGravable}
        ivaMonto={totals.ivaMonto}
        total={totals.total}
        observaciones={cotizacion.observaciones}
        moneda={cotizacion.moneda}
        vendedor={cotizacion.vendedor}
        formaPago={cotizacion.formaPago}
        tiempoEntrega={cotizacion.tiempoEntrega}
        garantia={cotizacion.garantia}
        condiciones={cotizacion.condiciones}
        aceptacionCliente={cotizacion.aceptacionCliente}
        config={config}
      />
    )

    const buffer = await renderToBuffer(pdfDoc)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${preview ? 'inline' : 'attachment'}; filename="${cotizacion.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
