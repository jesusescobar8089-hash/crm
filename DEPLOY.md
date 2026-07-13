# Despliegue de AgroEve

## Variables obligatorias

- `DATABASE_URL`: conexión PostgreSQL de Neon mediante el host `-pooler`, con `sslmode=require`. Configurarla como secreto; nunca pegarla en el repositorio ni en los logs.
- `SESSION_SECRET`: mínimo 32 bytes aleatorios. Generar con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
- `SESSION_MAX_AGE_SECONDS`: opcional; por defecto `86400` (24 horas).

No se debe versionar `.env`. Para desarrollo, copiar `.env.example` a `.env` y completar los valores localmente.

## Railway

El archivo `railway.json` deja configurados Railpack, la migración previa al despliegue, el arranque, el reinicio por fallo y el chequeo `/api/health`.

1. Crear el servicio desde el repositorio de GitHub.
2. Cargar `DATABASE_URL`, `SESSION_SECRET` y, si aplica, `SESSION_MAX_AGE_SECONDS`.
3. Generar el dominio público.
4. Confirmar que el despliegue termina con `/api/health` en estado `200`.

Railway inyecta `PORT`; `next start` lo utiliza automáticamente.

## Vercel

Vercel detecta Next.js automáticamente. El archivo `vercel.json` fija el framework y ejecuta las funciones en `iad1`, cerca de la base Neon en AWS us-east-1.

1. Importar el repositorio.
2. Cargar las variables en Production y Preview según corresponda.
3. Ejecutar `npm run db:deploy` desde CI antes de promover el despliegue de producción.
4. Verificar `/api/health`, inicio de sesión y generación de PDF.

No ejecutar `prisma migrate dev` ni `prisma db push` en producción.

## Archivos subidos: decisión pendiente antes de producción

Actualmente `/api/documentos/upload` escribe en `public/uploads`. Ese disco no es almacenamiento durable en Vercel y puede perderse al reemplazar una instancia en Railway. Antes de habilitar documentos en producción hay que conectar almacenamiento de objetos (por ejemplo, un bucket de Railway, Vercel Blob o S3) y guardar en PostgreSQL la URL resultante.

Hasta completar esa integración, no usar la carga de documentos en el entorno productivo.

## Validación previa

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run db:deploy
npm start
```

El endpoint público `GET /api/health` devuelve `200` únicamente cuando la aplicación puede consultar PostgreSQL.

## Backups y restauración de Neon

Mantener retención suficiente para al menos un punto diario y una exportación lógica cifrada fuera de la cuenta principal. Trimestralmente, restaurar en una rama o base aislada, ejecutar `npm run db:deploy` y probar login, clientes, cotizaciones y facturas.

## Incidente de base de datos

1. Detener temporalmente las escrituras.
2. Crear una rama o restauración desde el último punto sano en Neon.
3. Validar `/api/health`, migraciones y datos críticos.
4. Cambiar `DATABASE_URL` al destino restaurado y desplegar.
5. Rotar `SESSION_SECRET` si existe posibilidad de exposición.
