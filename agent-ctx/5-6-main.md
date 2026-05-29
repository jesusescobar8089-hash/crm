# Task 5-6: Cotizaciones & Monitoreos Modules

## Agent: Main

## Summary
Built the complete Cotizaciones and Monitoreos modules for the AgroEve internal management system.

## Files Created

### Cotizaciones API Routes
- `src/app/api/cotizaciones/route.ts` - GET (list with filters), POST (create with auto numero COT-YYYY-NNN)
- `src/app/api/cotizaciones/[id]/route.ts` - GET (with totals), PATCH (BORRADOR only), DELETE
- `src/app/api/cotizaciones/[id]/estado/route.ts` - PATCH (change estado with valid transitions)
- `src/app/api/cotizaciones/[id]/convertir/route.ts` - POST (convert ACEPTADA to INGRESO transaction)
- `src/app/api/cotizaciones/[id]/duplicar/route.ts` - POST (duplicate as BORRADOR)

### Cotizaciones Frontend
- `src/components/cotizaciones/cotizacion-form.tsx` - Dialog form with dynamic items, auto-calculations
- `src/app/(dashboard)/cotizaciones/page.tsx` - List page with DataTable, search, filters
- `src/app/(dashboard)/cotizaciones/[id]/page.tsx` - Detail page with estado transitions, convert, duplicate

### Monitoreos API Routes
- `src/app/api/monitoreos/route.ts` - GET (with cliente), POST (auto-calculate proximoMantenimiento)
- `src/app/api/monitoreos/[id]/route.ts` - GET, PATCH, DELETE (cascade mantenimientos)
- `src/app/api/mantenimientos/route.ts` - GET (filter by monitoreoId), POST (update monitoreo dates)

### Monitoreos Frontend
- `src/components/monitoreos/monitoreo-form.tsx` - Dialog form for create/edit
- `src/components/monitoreos/mantenimiento-form.tsx` - Dialog form for registering maintenance
- `src/app/(dashboard)/monitoreos/page.tsx` - List page with detail dialog, overdue warnings, maintenance history

## Key Features
- Quotation workflow: BORRADOR → ENVIADA → EN_REVISION → ACEPTADA → Convertir en Ingreso
- Auto-generated quotation numbers (COT-YYYY-NNN)
- Dynamic item list with auto-calculated subtotals, descuento, IVA, total
- Convert ACEPTADA quotation to INGRESO transaction (creates Transaccion record)
- Duplicate quotation as BORRADOR with new number
- Maintenance tracking with overdue/next-soon color warnings (red for overdue, amber for within 7 days)
- Alert banner for overdue maintenance
- Register maintenance updates monitoreo's ultimoMantenimiento and proximoMantenimiento
- All write operations logged via registrarBitacora
- All text in Spanish
- Responsive design for mobile and desktop

## Test Results
- All routes returning 200
- Lint: 0 errors, 1 warning (pre-existing TanStack Table)
