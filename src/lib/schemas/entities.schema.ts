import { z } from 'zod'

const requiredText = (max = 255) => z.string().trim().min(1).max(max)
const optionalText = (max = 5_000) => z.string().trim().max(max).nullish()
  .transform((value) => value || undefined)
const id = requiredText(100)
const optionalId = z.string().trim().max(100).nullish().transform((value) => value || undefined)
const finiteNumber = z.coerce.number().finite()
const nonNegativeNumber = finiteNumber.min(0)
const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha inválida')
const optionalDateString = z.union([z.literal(''), dateString]).nullish()
  .transform((value) => value || undefined)

export const clienteSchema = z.object({
  nombre: requiredText(),
  empresa: optionalText(),
  nit: optionalText(100),
  direccion: optionalText(500),
  contactoNombre: optionalText(),
  telefono: optionalText(100),
  email: z.union([z.literal(''), z.string().trim().email()]).nullish(),
  ciudad: requiredText(),
  departamento: requiredText(),
  pais: optionalText(100),
  tipoNegocio: requiredText(100),
  estado: requiredText(100),
  socioResponsable: requiredText(100),
  notas: optionalText(),
}).strict()

export const commercialItemSchema = z.object({
  nombre: optionalText(),
  descripcion: optionalText(),
  descripcionLarga: optionalText(),
  sku: optionalText(100),
  unidad: optionalText(100),
  cantidad: nonNegativeNumber,
  precioUnit: nonNegativeNumber,
  descuento: nonNegativeNumber.max(100).optional(),
  ivaTipo: optionalText(100),
  ivaPorcentaje: nonNegativeNumber.max(100).optional(),
}).strict().refine((item) => item.nombre || item.descripcion, {
  message: 'Cada ítem requiere nombre o descripción',
})

const commercialDocumentFields = {
  clienteId: id,
  fechaEmision: dateString,
  fechaVencimiento: optionalDateString,
  socio: requiredText(100),
  descuento: nonNegativeNumber.max(100).optional(),
  iva: nonNegativeNumber.max(100).optional(),
  observaciones: optionalText(),
  notasInternas: optionalText(),
  moneda: optionalText(10),
  vendedor: optionalText(),
  formaPago: optionalText(),
  garantia: optionalText(),
  condiciones: optionalText(),
  legalJson: optionalText(20_000),
  items: z.array(commercialItemSchema).min(1).max(200),
}

export const cotizacionSchema = z.object({
  ...commercialDocumentFields,
  tiempoEntrega: optionalText(),
  aceptacionCliente: optionalText(),
}).strict()

export const facturaSchema = z.object({
  ...commercialDocumentFields,
  cotizacionId: optionalId,
  metodoPago: optionalText(100),
}).strict()

export const inventarioSchema = z.object({
  nombre: requiredText(),
  categoria: requiredText(100),
  unidad: requiredText(100),
  stockActual: nonNegativeNumber.optional(),
  stockMinimo: nonNegativeNumber.optional(),
  costoUnitario: nonNegativeNumber.optional(),
  proveedor: optionalText(),
  notas: optionalText(),
  socio: optionalText(100),
}).strict()

export const transaccionSchema = z.object({
  tipo: z.enum(['INGRESO', 'GASTO', 'APORTE_SOCIO']),
  categoria: requiredText(100),
  descripcion: requiredText(2_000),
  monto: nonNegativeNumber,
  socio: requiredText(100),
  metodoPago: optionalText(100),
  clienteId: optionalId,
  cotizacionId: optionalId,
  fecha: optionalDateString,
}).strict()

export const monitoreoSchema = z.object({
  clienteId: id,
  kitId: optionalId,
  fechaInstalacion: dateString,
  frecuenciaMantenimiento: z.coerce.number().int().min(1).max(3_650),
  observaciones: optionalText(),
  socio: requiredText(100),
}).strict()

export const clienteUpdateSchema = clienteSchema.partial()
export const cotizacionUpdateSchema = cotizacionSchema.partial()
export const facturaUpdateSchema = facturaSchema.partial().extend({
  fechaPago: optionalDateString,
}).strict()
export const inventarioUpdateSchema = inventarioSchema.partial()
export const transaccionUpdateSchema = transaccionSchema.partial()
export const monitoreoUpdateSchema = monitoreoSchema.partial().extend({
  estado: requiredText(100).optional(),
}).strict()
