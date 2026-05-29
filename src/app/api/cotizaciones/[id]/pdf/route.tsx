import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { db } from '@/lib/db'
import { CotizacionPDF } from '@/components/cotizaciones/cotizacion-pdf'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cotizacion = await db.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            nombre: true,
            empresa: true,
            contactoNombre: true,
            telefono: true,
            email: true,
            ciudad: true,
            departamento: true,
          },
        },
        items: { orderBy: { orden: 'asc' } },
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Calculate totals
    const subtotalGeneral = cotizacion.items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentoMonto = subtotalGeneral * (cotizacion.descuento / 100)
    const subtotalConDescuento = subtotalGeneral - descuentoMonto
    const ivaMonto = subtotalConDescuento * (cotizacion.iva / 100)
    const total = subtotalConDescuento + ivaMonto

    const pdfDoc = (
      <CotizacionPDF
        numero={cotizacion.numero}
        fechaEmision={cotizacion.fechaEmision.toISOString()}
        fechaVencimiento={cotizacion.fechaVencimiento?.toISOString() || null}
        cliente={cotizacion.cliente}
        items={cotizacion.items.map((item) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnit: item.precioUnit,
          subtotal: item.subtotal,
        }))}
        subtotalGeneral={subtotalGeneral}
        descuento={cotizacion.descuento}
        descuentoMonto={descuentoMonto}
        iva={cotizacion.iva}
        ivaMonto={ivaMonto}
        total={total}
        observaciones={cotizacion.observaciones}
      />
    )

    const buffer = await renderToBuffer(pdfDoc)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cotizacion.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
