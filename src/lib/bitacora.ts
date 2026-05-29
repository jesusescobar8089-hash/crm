import { db } from './db'

export async function registrarBitacora({
  socio,
  modulo,
  accion,
  entidadId,
  detalle,
}: {
  socio: string
  modulo: string
  accion: string
  entidadId?: string
  detalle?: string
}) {
  await db.bitacoraEvento.create({
    data: { socio, modulo, accion, entidadId, detalle }
  })
}
