import { describe, expect, it } from 'vitest'
import { clienteSchema, cotizacionSchema, inventarioSchema, transaccionSchema } from '@/lib/schemas/entities.schema'

describe('validación de entidades', () => {
  it('rechaza montos no numéricos y tipos financieros desconocidos', () => {
    expect(transaccionSchema.safeParse({
      tipo: 'BORRADO', categoria: 'otro', descripcion: 'Prueba', monto: 'abc', socio: 'usuario',
    }).success).toBe(false)
  })

  it('convierte números válidos y rechaza stock negativo', () => {
    expect(inventarioSchema.parse({
      nombre: 'Sensor', categoria: 'COMPONENTE', unidad: 'unidad', stockActual: '2',
    }).stockActual).toBe(2)
    expect(inventarioSchema.safeParse({
      nombre: 'Sensor', categoria: 'COMPONENTE', unidad: 'unidad', stockActual: -1,
    }).success).toBe(false)
  })

  it('rechaza campos inesperados y correos inválidos en clientes', () => {
    const base = {
      nombre: 'Cliente', ciudad: 'Bogotá', departamento: 'Cundinamarca',
      tipoNegocio: 'agro', estado: 'COTIZADO', socioResponsable: 'usuario',
    }
    expect(clienteSchema.safeParse({ ...base, email: 'correo-inválido' }).success).toBe(false)
    expect(clienteSchema.safeParse({ ...base, rol: 'admin' }).success).toBe(false)
  })

  it('acepta una cotización sin fecha de vencimiento', () => {
    const result = cotizacionSchema.safeParse({
      clienteId: 'cliente-1',
      fechaEmision: '2026-07-13',
      fechaVencimiento: '',
      socio: 'Usuario',
      descuento: 0,
      iva: 0,
      moneda: 'COP',
      vendedor: '',
      formaPago: '',
      tiempoEntrega: '',
      observaciones: '',
      garantia: '',
      condiciones: '',
      aceptacionCliente: '',
      notasInternas: '',
      items: [{
        nombre: 'Servicio', descripcion: 'Servicio', descripcionLarga: '', sku: '',
        unidad: 'unidad', cantidad: 1, precioUnit: 100, descuento: 0,
        ivaTipo: 'NO_RESPONSABLE', ivaPorcentaje: 0,
      }],
    })
    expect(result.success).toBe(true)
  })
})
