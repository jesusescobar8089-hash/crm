import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from '@/proxy'

const protectedApiPaths = [
  '/api/bitacora',
  '/api/clientes',
  '/api/configuracion/comercial',
  '/api/cotizaciones',
  '/api/dashboard',
  '/api/documentos',
  '/api/facturas',
  '/api/finanzas',
  '/api/interacciones',
  '/api/inventario',
  '/api/mantenimientos',
  '/api/monitoreos',
  '/api/tareas',
  '/api/transacciones',
]

function routeFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const target = path.join(directory, name)
    return statSync(target).isDirectory() ? routeFiles(target) : [target]
  })
}

describe('proteccion de API', () => {
  it.each(protectedApiPaths)('rechaza acceso anonimo a %s', async (pathname) => {
    const response = await proxy(new NextRequest(`https://agroeve.example${pathname}`))
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'No autenticado' })
  })

  it.each(['/api/auth', '/api/health'])('mantiene publica la ruta %s', async (pathname) => {
    const response = await proxy(new NextRequest(`https://agroeve.example${pathname}`))
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('mantiene un guard dentro de cada route handler de negocio', () => {
    const apiRoot = path.resolve('src/app/api')
    const publicFiles = new Set([
      path.join(apiRoot, 'auth', 'route.ts'),
      path.join(apiRoot, 'health', 'route.ts'),
    ])

    const missing = routeFiles(apiRoot)
      .filter((file) => /route\.tsx?$/.test(file) && !publicFiles.has(file))
      .filter((file) => {
        const source = readFileSync(file, 'utf8')
        return /export async function (GET|POST|PUT|PATCH|DELETE)/.test(source)
          && !source.includes('requireSession(')
          && !source.includes('rejectUnauthenticated(')
      })

    expect(missing).toEqual([])
  })
})
