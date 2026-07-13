import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // --- METRICS ---
    // Clientes Activos (INSTALADO_ACTIVO + EN_NEGOCIACION)
    const clientesActivos = await db.cliente.count({
      where: { estado: { in: ['INSTALADO_ACTIVO', 'EN_NEGOCIACION'] } },
    })

    // Kits Instalados (ACTIVO monitorings)
    const kitsInstalados = await db.monitoreo.count({
      where: { estado: 'ACTIVO' },
    })

    // Mantenimientos Próximos (7 días)
    const mantenimientosProximos = await db.monitoreo.count({
      where: {
        proximoMantenimiento: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    })

    // Cotizaciones Pendientes (ENVIADA + EN_REVISION)
    const cotizacionesPendientes = await db.cotizacion.count({
      where: { estado: { in: ['ENVIADA', 'EN_REVISION'] } },
    })

    // Ingresos del Mes
    const ingresosMes = await db.transaccion.aggregate({
      _sum: { monto: true },
      where: {
        tipo: 'INGRESO',
        fecha: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    // Gastos del Mes
    const gastosMes = await db.transaccion.aggregate({
      _sum: { monto: true },
      where: {
        tipo: 'GASTO',
        fecha: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const ingresos = ingresosMes._sum.monto || 0
    const gastos = gastosMes._sum.monto || 0
    const utilidadBruta = ingresos - gastos

    // --- ALERTS ---
    // Clients in COTIZADO/EN_NEGOCIACION with no activity > 7 days
    const clientesSinActividad = await db.cliente.findMany({
      where: {
        estado: { in: ['COTIZADO', 'EN_NEGOCIACION'] },
        interacciones: {
          every: {
            fecha: { lt: sevenDaysAgo },
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        estado: true,
        updatedAt: true,
        interacciones: {
          orderBy: { fecha: 'desc' },
          take: 1,
          select: { fecha: true },
        },
      },
    })

    // Monitorings with maintenance overdue or due in 7 days
    const monitoreosMantenimiento = await db.monitoreo.findMany({
      where: {
        estado: 'ACTIVO',
        proximoMantenimiento: { lte: sevenDaysFromNow },
      },
      include: {
        cliente: { select: { nombre: true } },
      },
    })

    // Inventory items below minimum stock
    const inventarioBajo = await db.inventarioItem.findMany({
      where: {
        stockActual: { lte: db.inventarioItem.fields.stockMinimo },
      },
    })

    // Overdue tasks
    const tareasVencidas = await db.tarea.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'EN_PROGRESO'] },
        fechaLimite: { lt: now },
      },
      include: {
        cliente: { select: { nombre: true } },
      },
    })

    // --- CHARTS ---
    // Ingresos vs Gastos last 6 months
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const ingresosGastosData: { mes: string; ingresos: number; gastos: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear().toString().slice(-2)}`

      const [ing, gas] = await Promise.all([
        db.transaccion.aggregate({
          _sum: { monto: true },
          where: { tipo: 'INGRESO', fecha: { gte: monthDate, lte: monthEnd } },
        }),
        db.transaccion.aggregate({
          _sum: { monto: true },
          where: { tipo: 'GASTO', fecha: { gte: monthDate, lte: monthEnd } },
        }),
      ])

      ingresosGastosData.push({
        mes: monthLabel,
        ingresos: ing._sum.monto || 0,
        gastos: gas._sum.monto || 0,
      })
    }

    // Clientes por estado
    const clientesPorEstado = await db.cliente.groupBy({
      by: ['estado'],
      _count: { estado: true },
    })

    const estadoLabels: Record<string, string> = {
      COTIZADO: 'Cotizado',
      EN_NEGOCIACION: 'En Negociación',
      INSTALADO_ACTIVO: 'Instalado Activo',
      INACTIVO_PERDIDO: 'Inactivo / Perdido',
    }

    const clientesPorEstadoData = clientesPorEstado.map((c) => ({
      estado: estadoLabels[c.estado] || c.estado,
      cantidad: c._count.estado,
      estadoOriginal: c.estado,
    }))

    // Cotizaciones enviadas vs aceptadas vs perdidas por mes
    const cotizacionesPorMesData: { mes: string; enviadas: number; aceptadas: number; perdidas: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear().toString().slice(-2)}`

      const [enviadas, aceptadas, perdidas] = await Promise.all([
        db.cotizacion.count({
          where: {
            estado: 'ENVIADA',
            fechaEmision: { gte: monthDate, lte: monthEnd },
          },
        }),
        db.cotizacion.count({
          where: {
            estado: 'ACEPTADA',
            fechaEmision: { gte: monthDate, lte: monthEnd },
          },
        }),
        db.cotizacion.count({
          where: {
            estado: { in: ['RECHAZADA', 'VENCIDA'] },
            fechaEmision: { gte: monthDate, lte: monthEnd },
          },
        }),
      ])

      cotizacionesPorMesData.push({
        mes: monthLabel,
        enviadas,
        aceptadas,
        perdidas,
      })
    }

    // --- RECENT ACTIVITY ---
    const actividadReciente = await db.bitacoraEvento.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      metrics: {
        clientesActivos,
        kitsInstalados,
        mantenimientosProximos,
        cotizacionesPendientes,
        ingresosDelMes: ingresos,
        gastosDelMes: gastos,
        utilidadBrutaDelMes: utilidadBruta,
      },
      alerts: {
        clientesSinActividad,
        monitoreosMantenimiento,
        inventarioBajo,
        tareasVencidas,
      },
      charts: {
        ingresosGastos: ingresosGastosData,
        clientesPorEstado: clientesPorEstadoData,
        cotizacionesPorMes: cotizacionesPorMesData,
      },
      actividadReciente,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    )
  }
}
