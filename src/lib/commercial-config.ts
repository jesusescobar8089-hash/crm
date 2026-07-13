export interface CommercialConfig {
  logoUrl: string
  colorPrimario: string
  colorSecundario: string
  razonSocial: string
  nit: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
  paginaWeb: string
  piePagina: string
  informacionLegal: string
  informacionBancaria: string
  notasAutomaticas: string
  garantiaPredeterminada: string
  ivaPredeterminado: number
  moneda: string
  dianJson?: string | null
}

export const DEFAULT_COMMERCIAL_CONFIG: CommercialConfig = {
  logoUrl: '/brand/image2.png',
  colorPrimario: '#428d73',
  colorSecundario: '#5c9bc6',
  razonSocial: 'AgroEve',
  nit: '1007072083-6',
  direccion: '',
  ciudad: '',
  telefono: '',
  correo: 'agroeve.contacto@gmail.com',
  paginaWeb: '',
  piePagina: '',
  informacionLegal: '',
  informacionBancaria: '',
  notasAutomaticas: '',
  garantiaPredeterminada: '',
  ivaPredeterminado: 0,
  moneda: 'COP',
  dianJson: null,
}
