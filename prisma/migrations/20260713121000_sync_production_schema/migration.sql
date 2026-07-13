-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "nit" TEXT,
ADD COLUMN     "pais" TEXT NOT NULL DEFAULT 'Colombia';

-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "aceptacionCliente" TEXT,
ADD COLUMN     "condiciones" TEXT,
ADD COLUMN     "formaPago" TEXT,
ADD COLUMN     "garantia" TEXT,
ADD COLUMN     "legalJson" TEXT,
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'COP',
ADD COLUMN     "tiempoEntrega" TEXT,
ADD COLUMN     "vendedor" TEXT,
ALTER COLUMN "iva" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "CotizacionItem" ADD COLUMN     "baseGravable" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "descripcionLarga" TEXT,
ADD COLUMN     "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaMonto" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaTipo" TEXT NOT NULL DEFAULT 'NO_RESPONSABLE',
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unidad" TEXT NOT NULL DEFAULT 'unidad';

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "condiciones" TEXT,
ADD COLUMN     "formaPago" TEXT,
ADD COLUMN     "garantia" TEXT,
ADD COLUMN     "legalJson" TEXT,
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'COP',
ADD COLUMN     "vendedor" TEXT,
ALTER COLUMN "iva" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "FacturaItem" ADD COLUMN     "baseGravable" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "descripcionLarga" TEXT,
ADD COLUMN     "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaMonto" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaTipo" TEXT NOT NULL DEFAULT 'NO_RESPONSABLE',
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unidad" TEXT NOT NULL DEFAULT 'unidad';

-- CreateTable
CREATE TABLE "ConfiguracionComercial" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "logoUrl" TEXT NOT NULL DEFAULT '/brand/image2.png',
    "colorPrimario" TEXT NOT NULL DEFAULT '#428d73',
    "colorSecundario" TEXT NOT NULL DEFAULT '#5c9bc6',
    "razonSocial" TEXT NOT NULL DEFAULT 'AgroEve',
    "nit" TEXT NOT NULL DEFAULT '1007072083-6',
    "direccion" TEXT NOT NULL DEFAULT '',
    "ciudad" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT 'agroeve.contacto@gmail.com',
    "paginaWeb" TEXT NOT NULL DEFAULT '',
    "piePagina" TEXT NOT NULL DEFAULT 'Documento generado por el sistema interno de AgroEve.',
    "informacionLegal" TEXT NOT NULL DEFAULT 'Documento comercial preparado para operacion en Colombia. Integracion DIAN pendiente.',
    "informacionBancaria" TEXT NOT NULL DEFAULT '',
    "notasAutomaticas" TEXT NOT NULL DEFAULT '',
    "garantiaPredeterminada" TEXT NOT NULL DEFAULT 'Garantia sujeta a condiciones de instalacion, uso adecuado y alcance contratado.',
    "ivaPredeterminado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "dianJson" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfiguracionComercial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
