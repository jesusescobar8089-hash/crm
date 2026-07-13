-- DropForeignKey
ALTER TABLE "Cotizacion" DROP CONSTRAINT "Cotizacion_clienteId_fkey";
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_clienteId_fkey";
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_cotizacionId_fkey";
ALTER TABLE "Monitoreo" DROP CONSTRAINT "Monitoreo_clienteId_fkey";

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Monitoreo" ADD CONSTRAINT "Monitoreo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
