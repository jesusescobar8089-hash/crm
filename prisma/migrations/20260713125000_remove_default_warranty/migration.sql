-- Warranty is optional and must only appear when entered explicitly.
UPDATE "ConfiguracionComercial"
SET "garantiaPredeterminada" = ''
WHERE "garantiaPredeterminada" = 'Garantia sujeta a condiciones de instalacion, uso adecuado y alcance contratado.';

ALTER TABLE "ConfiguracionComercial"
ALTER COLUMN "garantiaPredeterminada" SET DEFAULT '';
