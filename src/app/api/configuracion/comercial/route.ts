import { rejectUnauthenticated } from '@/lib/auth-guard'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_COMMERCIAL_CONFIG } from '@/lib/commercial-config'

export async function GET(request: NextRequest) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const config = await db.configuracionComercial.upsert({
      where: { id: 'default' },
      update: {},
      create: DEFAULT_COMMERCIAL_CONFIG,
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching commercial config:', error)
    return NextResponse.json({ error: 'Error al obtener configuracion comercial' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await rejectUnauthenticated(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const allowedKeys = [
      'logoUrl',
      'colorPrimario',
      'colorSecundario',
      'razonSocial',
      'nit',
      'direccion',
      'ciudad',
      'telefono',
      'correo',
      'paginaWeb',
      'piePagina',
      'informacionLegal',
      'informacionBancaria',
      'notasAutomaticas',
      'garantiaPredeterminada',
      'ivaPredeterminado',
      'moneda',
      'dianJson',
    ]

    const data = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedKeys.includes(key))
    )

    const config = await db.configuracionComercial.upsert({
      where: { id: 'default' },
      update: data,
      create: { ...DEFAULT_COMMERCIAL_CONFIG, ...data },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating commercial config:', error)
    return NextResponse.json({ error: 'Error al actualizar configuracion comercial' }, { status: 500 })
  }
}

