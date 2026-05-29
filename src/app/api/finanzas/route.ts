import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'resumen'
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')

    if (tipo === 'resumen') {
      return await getResumen(mes, anio)
    }

    if (tipo === 'ingresos') {
      return await getIngresos(mes, anio)
    }

    if (tipo === 'gastos') {
      return await getGastos(mes, anio)
    }

    if (tipo === 'aportes') {
      return await getAportes()
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
  } catch (error) {
    console.error('Error en finanzas:', error)
    return NextResponse.json({ error: 'Error al obtener datos financieros' }, { status: 500 })
  }
}

async function getResumen(mesParam: string | null, anioParam: string | null) {
  const now = new Date()
  const currentMonth = mesParam ? Number(mesParam) - 1 : now.getMonth()
  const currentYear = anioParam ? Number(anioParam) : now.getFullYear()

  // Get all transactions
  const allTransactions = await db.transaccion.findMany()

  // Monthly totals (filtered by selected period)
  const mesTransactions = allTransactions.filter((t) => {
    const d = new Date(t.fecha)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const yearTransactions = allTransactions.filter((t) => {
    const d = new Date(t.fecha)
    return d.getFullYear() === currentYear
  })

  const ingresosMes = mesTransactions
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + t.monto, 0)
  const gastosMes = mesTransactions
    .filter((t) => t.tipo === 'GASTO')
    .reduce((sum, t) => sum + t.monto, 0)
  const utilidadMes = ingresosMes - gastosMes

  const ingresosAnio = yearTransactions
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + t.monto, 0)
  const gastosAnio = yearTransactions
    .filter((t) => t.tipo === 'GASTO')
    .reduce((sum, t) => sum + t.monto, 0)
  const utilidadAnio = ingresosAnio - gastosAnio

  // Balance por socio (all time)
  const socios = ['socioA', 'socioB']
  const balanceSocios = socios.map((socio) => {
    const aportado = allTransactions
      .filter((t) => t.tipo === 'APORTE_SOCIO' && t.socio === socio)
      .reduce((sum, t) => sum + t.monto, 0)
    const retirado = allTransactions
      .filter((t) => t.tipo === 'RETIRO_SOCIO' && t.socio === socio)
      .reduce((sum, t) => sum + t.monto, 0)
    return { socio, aportado, retirado, saldo: aportado - retirado }
  })

  const utilidadTotal = utilidadAnio
  const utilidadPorSocio = utilidadTotal / 2

  // Chart: Ingresos vs Gastos por mes (last 12 months from selected year)
  const mesesData: { mes: string; ingresos: number; gastos: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const mesName = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
    const mesTx = allTransactions.filter((t) => {
      const td = new Date(t.fecha)
      return td.getMonth() === m && td.getFullYear() === y
    })
    mesesData.push({
      mes: mesName,
      ingresos: mesTx.filter((t) => t.tipo === 'INGRESO').reduce((s, t) => s + t.monto, 0),
      gastos: mesTx.filter((t) => t.tipo === 'GASTO').reduce((s, t) => s + t.monto, 0),
    })
  }

  // Chart: Gastos por categoría (selected month)
  const gastosMesData = mesTransactions.filter((t) => t.tipo === 'GASTO')
  const gastosCategoria: { categoria: string; monto: number }[] = []
  const catMap: Record<string, number> = {}
  gastosMesData.forEach((t) => {
    catMap[t.categoria] = (catMap[t.categoria] || 0) + t.monto
  })
  Object.entries(catMap).forEach(([categoria, monto]) => {
    gastosCategoria.push({ categoria, monto })
  })

  // Chart: Ingresos por categoría (selected month)
  const ingresosMesData = mesTransactions.filter((t) => t.tipo === 'INGRESO')
  const ingresosCategoria: { categoria: string; monto: number }[] = []
  const ingCatMap: Record<string, number> = {}
  ingresosMesData.forEach((t) => {
    ingCatMap[t.categoria] = (ingCatMap[t.categoria] || 0) + t.monto
  })
  Object.entries(ingCatMap).forEach(([categoria, monto]) => {
    ingresosCategoria.push({ categoria, monto })
  })

  return NextResponse.json({
    ingresosMes,
    gastosMes,
    utilidadMes,
    ingresosAnio,
    gastosAnio,
    utilidadAnio,
    balanceSocios,
    utilidadPorSocio,
    chartMeses: mesesData,
    chartGastosCategoria: gastosCategoria,
    chartIngresosCategoria: ingresosCategoria,
  })
}

async function getIngresos(mes: string | null, anio: string | null) {
  const where: Record<string, unknown> = { tipo: 'INGRESO' }

  if (mes && anio) {
    const m = Number(mes) - 1
    const y = Number(anio)
    const startDate = new Date(y, m, 1)
    const endDate = new Date(y, m + 1, 1)
    where.fecha = { gte: startDate, lt: endDate }
  } else if (anio) {
    const y = Number(anio)
    const startDate = new Date(y, 0, 1)
    const endDate = new Date(y + 1, 0, 1)
    where.fecha = { gte: startDate, lt: endDate }
  }

  const ingresos = await db.transaccion.findMany({
    where,
    include: { cliente: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(ingresos)
}

async function getGastos(mes: string | null, anio: string | null) {
  const where: Record<string, unknown> = { tipo: 'GASTO' }

  if (mes && anio) {
    const m = Number(mes) - 1
    const y = Number(anio)
    const startDate = new Date(y, m, 1)
    const endDate = new Date(y, m + 1, 1)
    where.fecha = { gte: startDate, lt: endDate }
  } else if (anio) {
    const y = Number(anio)
    const startDate = new Date(y, 0, 1)
    const endDate = new Date(y + 1, 0, 1)
    where.fecha = { gte: startDate, lt: endDate }
  }

  const gastos = await db.transaccion.findMany({
    where,
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(gastos)
}

async function getAportes() {
  const aportes = await db.transaccion.findMany({
    where: {
      tipo: { in: ['APORTE_SOCIO', 'RETIRO_SOCIO'] },
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(aportes)
}
