---
Task ID: 1
Agent: Main Agent
Task: Fix 6 bugs in AgroEve v1.2 (PDF generation, Font.register, serverExternalPackages, download icon, clickable alerts, nueva cotización button)

Work Log:
- Bug #1: Removed `'use client'` directive from `src/components/cotizaciones/cotizacion-pdf.tsx` — react-pdf components are server-only
- Bug #2: Removed `Font.register` block with invalid `src: 'Helvetica'` strings — Helvetica is built-in in react-pdf v4
- Bug #3: Added `serverExternalPackages: ['@react-pdf/renderer']` to `next.config.ts`
- Bug #3b: Removed `output: "standalone"` from `next.config.ts` as it was causing dev server to hang/crash during compilation
- Bug #3c: Added `allowedDevOrigins: ['.space-z.ai']` to fix cross-origin warnings
- Bug #4: Verified Download icon already present in client 360° documents tab (line 810) — no fix needed
- Bug #5: Made all dashboard alert items clickable via `Link` components from next/link:
  - Clientes sin actividad → links to `/clientes/[id]`
  - Monitoreos vencidos → links to `/monitoreos`
  - Inventario bajo → links to `/inventario`
  - Tareas vencidas → links to `/tareas`
- Bug #6: Added "Nueva Cotización" button in client 360° Cotizaciones tab + CotizacionForm with `defaultClienteId` prop:
  - Added `CotizacionForm` import and `Plus` icon import to client detail page
  - Added `cotizacionOpen` state
  - Added "Nueva Cotización" button in Cotizaciones tab CardHeader
  - Added `CotizacionForm` dialog with `defaultClienteId={cliente.id}`
  - Modified `CotizacionForm` to accept `defaultClienteId?: string` prop
  - Pre-selects and disables client select when `defaultClienteId` is provided

Stage Summary:
- All 6 bugs fixed
- PDF generation verified: GET /api/cotizaciones/[id]/pdf returns valid PDF (4268 bytes, version 1.3, 1 page)
- All API routes return 200 (dashboard, clientes, cotizaciones, PDF)
- 0 lint errors (1 pre-existing TanStack Table warning)
- Key config change: removed `output: "standalone"` which was blocking dev server startup
- Key config addition: `serverExternalPackages` for @react-pdf/renderer
