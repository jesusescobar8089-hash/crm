-- Preserve the original filename when the stored Blob pathname receives a random suffix.
ALTER TABLE "Documento" ADD COLUMN "nombreArchivo" TEXT;
