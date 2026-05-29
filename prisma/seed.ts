import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create 2 users
  const passwordHash = await bcrypt.hash('agroeve2026', 10)

  const socioA = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Méndez',
      email: 'socioA@agroeve.co',
      password: passwordHash,
      tema: 'dark',
    },
  })

  const socioB = await prisma.usuario.create({
    data: {
      nombre: 'María López',
      email: 'socioB@agroeve.co',
      password: passwordHash,
      tema: 'light',
    },
  })

  // Create 5 clients
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: 'Acuicultura del Caribe',
      empresa: 'Acuicultura del Caribe SAS',
      contactoNombre: 'Juan Pérez',
      telefono: '3001234567',
      email: 'juan@acucaribe.com',
      ciudad: 'Cartagena',
      departamento: 'Bolívar',
      tipoNegocio: 'camaronicultura',
      estado: 'INSTALADO_ACTIVO',
      socioResponsable: 'socioA',
      notas: 'Cliente principal de camaronicultura. Instalación completada en enero.',
    },
  })

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: 'Piscícola San Martín',
      empresa: 'Piscícola San Martín Ltda',
      contactoNombre: 'Ana Gómez',
      telefono: '3109876543',
      email: 'ana@piscisanmartin.com',
      ciudad: 'Villavicencio',
      departamento: 'Meta',
      tipoNegocio: 'piscicultura',
      estado: 'EN_NEGOCIACION',
      socioResponsable: 'socioB',
      notas: 'Interesada en 3 kits. Negociación en curso.',
    },
  })

  const cliente3 = await prisma.cliente.create({
    data: {
      nombre: 'Agroindustria Los Llanos',
      empresa: 'Agroindustria Los Llanos SA',
      contactoNombre: 'Pedro Ruiz',
      telefono: '3205551234',
      email: 'pedro@agrollanos.com',
      ciudad: 'Puerto López',
      departamento: 'Meta',
      tipoNegocio: 'agricultura',
      estado: 'COTIZADO',
      socioResponsable: 'socioA',
      notas: 'Cotización enviada, esperando respuesta desde hace 10 días.',
    },
  })

  const cliente4 = await prisma.cliente.create({
    data: {
      nombre: 'Camaronera del Pacífico',
      empresa: 'Camaronera del Pacífico SAS',
      contactoNombre: 'Laura Martínez',
      telefono: '3157894561',
      email: 'laura@camaronerapacifico.com',
      ciudad: 'Buenaventura',
      departamento: 'Valle del Cauca',
      tipoNegocio: 'camaronicultura',
      estado: 'INSTALADO_ACTIVO',
      socioResponsable: 'socioA',
      notas: 'Dos kits instalados. Excelente relación.',
    },
  })

  const cliente5 = await prisma.cliente.create({
    data: {
      nombre: 'Finca Acuícola La Esperanza',
      empresa: null,
      contactoNombre: 'Roberto Díaz',
      telefono: '3216549870',
      email: null,
      ciudad: 'Barranquilla',
      departamento: 'Atlántico',
      tipoNegocio: 'piscicultura',
      estado: 'INACTIVO_PERDIDO',
      socioResponsable: 'socioB',
      notas: 'No se concretó el negocio. Presupuesto insuficiente.',
    },
  })

  // Create interactions
  await prisma.interaccion.createMany({
    data: [
      {
        clienteId: cliente1.id,
        tipo: 'visita',
        descripcion: 'Primera visita a las instalaciones del cliente.',
        fecha: new Date('2026-01-05'),
        socio: 'socioA',
        proximaAccion: 'Seguimiento de instalación',
        fechaProxima: new Date('2026-01-15'),
      },
      {
        clienteId: cliente1.id,
        tipo: 'instalacion',
        descripcion: 'Instalación del kit de monitoreo completada.',
        fecha: new Date('2026-01-15'),
        socio: 'socioA',
      },
      {
        clienteId: cliente2.id,
        tipo: 'llamada',
        descripcion: 'Llamada inicial de prospección. Mucho interés.',
        fecha: new Date('2026-02-10'),
        socio: 'socioB',
        proximaAccion: 'Enviar cotización formal',
        fechaProxima: new Date('2026-02-15'),
      },
      {
        clienteId: cliente3.id,
        tipo: 'cotizacion_enviada',
        descripcion: 'Cotización enviada por correo electrónico.',
        fecha: new Date('2026-02-20'),
        socio: 'socioA',
        proximaAccion: 'Seguimiento en 5 días',
        fechaProxima: new Date('2026-02-25'),
      },
      {
        clienteId: cliente4.id,
        tipo: 'mantenimiento',
        descripcion: 'Mantenimiento rutinario del kit 1.',
        fecha: new Date('2026-02-01'),
        socio: 'socioA',
      },
    ],
  })

  // Create inventory items
  const itemSensorPH = await prisma.inventarioItem.create({
    data: {
      nombre: 'Sensor de pH',
      categoria: 'COMPONENTE',
      unidad: 'unidad',
      stockActual: 15,
      stockMinimo: 5,
      costoUnitario: 85000,
      proveedor: 'Distribuidora Electrónica Ltda',
    },
  })

  const itemSensorTemp = await prisma.inventarioItem.create({
    data: {
      nombre: 'Sensor de Temperatura',
      categoria: 'COMPONENTE',
      unidad: 'unidad',
      stockActual: 20,
      stockMinimo: 5,
      costoUnitario: 45000,
      proveedor: 'Distribuidora Electrónica Ltda',
    },
  })

  const itemSensorOD = await prisma.inventarioItem.create({
    data: {
      nombre: 'Sensor de Oxígeno Disuelto',
      categoria: 'COMPONENTE',
      unidad: 'unidad',
      stockActual: 8,
      stockMinimo: 5,
      costoUnitario: 120000,
      proveedor: 'AquaSensor Import',
    },
  })

  const itemPlaca = await prisma.inventarioItem.create({
    data: {
      nombre: 'Placa Controladora IoT',
      categoria: 'COMPONENTE',
      unidad: 'unidad',
      stockActual: 12,
      stockMinimo: 3,
      costoUnitario: 95000,
      proveedor: 'Distribuidora Electrónica Ltda',
    },
  })

  const itemKitCompleto = await prisma.inventarioItem.create({
    data: {
      nombre: 'Kit Completo de Monitoreo',
      categoria: 'KIT_ARMADO',
      unidad: 'unidad',
      stockActual: 4,
      stockMinimo: 2,
      costoUnitario: 650000,
      proveedor: null,
      notas: 'Incluye sensor pH, temperatura, OD y placa controladora.',
    },
  })

  const itemCable = await prisma.inventarioItem.create({
    data: {
      nombre: 'Cable USB-C',
      categoria: 'COMPONENTE',
      unidad: 'unidad',
      stockActual: 30,
      stockMinimo: 10,
      costoUnitario: 8000,
    },
  })

  const itemTuberia = await prisma.inventarioItem.create({
    data: {
      nombre: 'Tubería PVC 1/2"',
      categoria: 'MATERIAL_INSTALACION',
      unidad: 'metro',
      stockActual: 50,
      stockMinimo: 20,
      costoUnitario: 4500,
      proveedor: 'Ferretería Industrial',
    },
  })

  const itemCaja = await prisma.inventarioItem.create({
    data: {
      nombre: 'Caja NEMA para exteriores',
      categoria: 'MATERIAL_INSTALACION',
      unidad: 'unidad',
      stockActual: 6,
      stockMinimo: 3,
      costoUnitario: 35000,
      proveedor: 'Ferretería Industrial',
    },
  })

  const itemTornilleria = await prisma.inventarioItem.create({
    data: {
      nombre: 'Kit Tornillería Inoxidable',
      categoria: 'MATERIAL_INSTALACION',
      unidad: 'kit',
      stockActual: 25,
      stockMinimo: 10,
      costoUnitario: 12000,
    },
  })

  const itemSellador = await prisma.inventarioItem.create({
    data: {
      nombre: 'Sellador Silicona Resistente al Agua',
      categoria: 'MATERIAL_INSTALACION',
      unidad: 'unidad',
      stockActual: 3,
      stockMinimo: 5,
      costoUnitario: 18000,
      notas: '¡Stock bajo! Reponer urgente.',
    },
  })

  // Create quotations
  const cotizacion1 = await prisma.cotizacion.create({
    data: {
      numero: 'COT-2026-001',
      clienteId: cliente1.id,
      fechaEmision: new Date('2026-01-08'),
      fechaVencimiento: new Date('2026-02-08'),
      estado: 'ACEPTADA',
      socio: 'socioA',
      descuento: 5,
      iva: 19,
      observaciones: 'Precio incluye instalación y capacitación. Garantía de 1 año.',
      notasInternas: 'Se dio descuento por ser primer cliente.',
      items: {
        create: [
          { descripcion: 'Kit Completo de Monitoreo (pH + Temp + OD)', cantidad: 1, precioUnit: 1500000, subtotal: 1500000, orden: 1 },
          { descripcion: 'Instalación y configuración', cantidad: 1, precioUnit: 300000, subtotal: 300000, orden: 2 },
          { descripcion: 'Capacitación de personal', cantidad: 1, precioUnit: 150000, subtotal: 150000, orden: 3 },
        ],
      },
    },
  })

  const cotizacion2 = await prisma.cotizacion.create({
    data: {
      numero: 'COT-2026-002',
      clienteId: cliente2.id,
      fechaEmision: new Date('2026-02-15'),
      fechaVencimiento: new Date('2026-03-15'),
      estado: 'ENVIADA',
      socio: 'socioB',
      descuento: 0,
      iva: 19,
      observaciones: 'Válido por 30 días. No incluye transporte fuera de Villavicencio.',
      items: {
        create: [
          { descripcion: 'Kit Completo de Monitoreo (pH + Temp + OD)', cantidad: 3, precioUnit: 1500000, subtotal: 4500000, orden: 1 },
          { descripcion: 'Instalación y configuración (3 sitios)', cantidad: 3, precioUnit: 300000, subtotal: 900000, orden: 2 },
        ],
      },
    },
  })

  const cotizacion3 = await prisma.cotizacion.create({
    data: {
      numero: 'COT-2026-003',
      clienteId: cliente3.id,
      fechaEmision: new Date('2026-02-20'),
      fechaVencimiento: new Date('2026-03-20'),
      estado: 'ENVIADA',
      socio: 'socioA',
      descuento: 0,
      iva: 19,
      observaciones: 'Cotización para monitoreo agrícola.',
      items: {
        create: [
          { descripcion: 'Kit Completo de Monitoreo Agro', cantidad: 2, precioUnit: 1200000, subtotal: 2400000, orden: 1 },
          { descripcion: 'Instalación y configuración', cantidad: 2, precioUnit: 250000, subtotal: 500000, orden: 2 },
        ],
      },
    },
  })

  // Create monitorings
  const monitoreo1 = await prisma.monitoreo.create({
    data: {
      clienteId: cliente1.id,
      kitId: itemKitCompleto.id,
      fechaInstalacion: new Date('2026-01-15'),
      frecuenciaMantenimiento: 30,
      ultimoMantenimiento: new Date('2026-02-15'),
      proximoMantenimiento: new Date('2026-03-17'),
      estado: 'ACTIVO',
      observaciones: 'Monitoreo de estanque 1. Funcionamiento correcto.',
    },
  })

  const monitoreo2 = await prisma.monitoreo.create({
    data: {
      clienteId: cliente4.id,
      kitId: itemKitCompleto.id,
      fechaInstalacion: new Date('2026-01-20'),
      frecuenciaMantenimiento: 30,
      ultimoMantenimiento: new Date('2026-02-01'),
      proximoMantenimiento: new Date('2026-03-03'),
      estado: 'ACTIVO',
      observaciones: 'Monitoreo de piscina 3. Todo en orden.',
    },
  })

  // Create maintenance records
  await prisma.mantenimiento.createMany({
    data: [
      {
        monitoreoId: monitoreo1.id,
        fecha: new Date('2026-02-15'),
        socio: 'socioA',
        descripcion: 'Mantenimiento rutinario. Calibración de sensores de pH y OD. Limpieza de sensores.',
        observaciones: 'Sensor de pH mostraba desviación de 0.2. Recalibrado correctamente.',
      },
      {
        monitoreoId: monitoreo1.id,
        fecha: new Date('2026-01-15'),
        socio: 'socioA',
        descripcion: 'Puesta en marcha y verificación inicial del sistema.',
        observaciones: 'Todos los parámetros dentro del rango esperado.',
      },
      {
        monitoreoId: monitoreo2.id,
        fecha: new Date('2026-02-01'),
        socio: 'socioA',
        descripcion: 'Primer mantenimiento post-instalación. Revisión general.',
        observaciones: 'Sin novedad. Equipo funcionando correctamente.',
      },
    ],
  })

  // Create financial transactions
  await prisma.transaccion.createMany({
    data: [
      {
        tipo: 'INGRESO',
        categoria: 'venta_kit',
        descripcion: 'Venta kit de monitoreo - Acuicultura del Caribe',
        monto: 1950000,
        socio: 'socioA',
        metodoPago: 'transferencia',
        clienteId: cliente1.id,
        cotizacionId: cotizacion1.id,
        fecha: new Date('2026-01-20'),
      },
      {
        tipo: 'INGRESO',
        categoria: 'instalacion',
        descripcion: 'Servicio de instalación - Acuicultura del Caribe',
        monto: 300000,
        socio: 'socioA',
        metodoPago: 'transferencia',
        clienteId: cliente1.id,
        cotizacionId: cotizacion1.id,
        fecha: new Date('2026-01-20'),
      },
      {
        tipo: 'GASTO',
        categoria: 'componentes',
        descripcion: 'Compra de sensores de pH y OD - Lote 10 unidades',
        monto: 1200000,
        socio: 'socioB',
        metodoPago: 'transferencia',
        fecha: new Date('2026-01-10'),
      },
      {
        tipo: 'GASTO',
        categoria: 'materiales',
        descripcion: 'Materiales de instalación - Tuberías y cajas NEMA',
        monto: 350000,
        socio: 'socioA',
        metodoPago: 'efectivo',
        fecha: new Date('2026-01-12'),
      },
      {
        tipo: 'APORTE_SOCIO',
        categoria: 'aporte',
        descripcion: 'Aporte inicial de capital - Carlos',
        monto: 5000000,
        socio: 'socioA',
        metodoPago: 'transferencia',
        fecha: new Date('2026-01-01'),
      },
    ],
  })

  // Create tasks
  await prisma.tarea.createMany({
    data: [
      {
        titulo: 'Seguimiento cotización Piscícola San Martín',
        descripcion: 'Llamar a Ana Gómez para conocer decisión sobre la cotización de 3 kits.',
        asignadoA: 'socioB',
        prioridad: 'ALTA',
        fechaLimite: new Date('2026-03-10'),
        estado: 'PENDIENTE',
        clienteId: cliente2.id,
      },
      {
        titulo: 'Comprar sellador de silicona',
        descripcion: 'Stock bajo de sellador. Comprar mínimo 10 unidades.',
        asignadoA: 'socioA',
        prioridad: 'MEDIA',
        fechaLimite: new Date('2026-03-05'),
        estado: 'EN_PROGRESO',
      },
      {
        titulo: 'Preparar demo para Agroindustria Los Llanos',
        descripcion: 'Preparar demostración del kit de monitoreo agro para visita.',
        asignadoA: 'ambos',
        prioridad: 'ALTA',
        fechaLimite: new Date('2026-03-01'),
        estado: 'COMPLETADA',
        clienteId: cliente3.id,
      },
    ],
  })

  // Create bitacora events
  await prisma.bitacoraEvento.createMany({
    data: [
      {
        socio: 'socioA',
        modulo: 'clientes',
        accion: 'crear',
        entidadId: cliente1.id,
        detalle: 'Cliente creado: Acuicultura del Caribe',
      },
      {
        socio: 'socioA',
        modulo: 'cotizaciones',
        accion: 'crear',
        entidadId: cotizacion1.id,
        detalle: 'Cotización COT-2026-001 creada para Acuicultura del Caribe',
      },
      {
        socio: 'socioA',
        modulo: 'cotizaciones',
        accion: 'cambiar_estado',
        entidadId: cotizacion1.id,
        detalle: 'Cotización COT-2026-001 cambiada a ACEPTADA',
      },
      {
        socio: 'socioA',
        modulo: 'monitoreos',
        accion: 'crear',
        entidadId: monitoreo1.id,
        detalle: 'Monitoreo creado para Acuicultura del Caribe',
      },
      {
        socio: 'socioB',
        modulo: 'clientes',
        accion: 'crear',
        entidadId: cliente2.id,
        detalle: 'Cliente creado: Piscícola San Martín',
      },
    ],
  })

  // Create stock movements
  await prisma.movimientoStock.createMany({
    data: [
      {
        itemId: itemSensorPH.id,
        tipo: 'ENTRADA',
        cantidad: 20,
        costo: 85000,
        proveedor: 'Distribuidora Electrónica Ltda',
        descripcion: 'Compra lote inicial de sensores de pH',
        socio: 'socioB',
        fecha: new Date('2026-01-10'),
      },
      {
        itemId: itemSensorPH.id,
        tipo: 'SALIDA_INSTALACION',
        cantidad: 5,
        costo: 85000,
        clienteId: cliente1.id,
        descripcion: 'Uso en instalación Acuicultura del Caribe',
        socio: 'socioA',
        fecha: new Date('2026-01-15'),
      },
    ],
  })

  console.log('✅ Seed completado exitosamente')
  console.log('Usuarios creados:')
  console.log('  - socioA@agroeve.co / agroeve2026')
  console.log('  - socioB@agroeve.co / agroeve2026')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
