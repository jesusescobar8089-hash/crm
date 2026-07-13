import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function validationError(error: ZodError) {
  return NextResponse.json(
    { error: 'Datos inválidos', issues: error.issues },
    { status: 400 },
  )
}
