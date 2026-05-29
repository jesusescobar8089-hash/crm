---
Task ID: 1
Agent: Main
Task: Setup - Install dependencies, Prisma schema, seed data, core lib files

Work Log:
- Installed bcryptjs for password hashing
- Created complete Prisma schema with all 13 models (Usuario, Cliente, Interaccion, Cotizacion, CotizacionItem, Monitoreo, Mantenimiento, InventarioItem, MovimientoStock, Transaccion, Tarea, Documento, BitacoraEvento)
- Pushed schema to SQLite database
- Created seed file with 2 users, 5 clients, quotations, monitorings, inventory items, transactions, tasks, and bitacora events
- Seeded database successfully
- Created lib/format.ts (formatCOP, formatFecha, formatFechaHora)
- Created lib/bitacora.ts (registrarBitacora helper)
- Created lib/auth.ts (verifyPassword, hashPassword, authenticateUser)
- Created types/index.ts with all type definitions and color/label constants
- Updated globals.css with AgroEve theme colors (sky blue primary, emerald accent)
- Created .env with DATABASE_URL and SESSION_SECRET

Stage Summary:
- Foundation is complete - all database models, seed data, and core utilities are in place
- Ready for auth and layout development

---
Task ID: 2
Agent: Main
Task: Auth, Layout, Dashboard, and Shared Components

Work Log:
- Updated root layout (src/app/layout.tsx) with AgroEve metadata, ThemeProvider from next-themes, Sonner Toaster, Geist fonts, lang="es"
- Created QueryClientProvider wrapper (src/components/providers/query-provider.tsx) for TanStack React Query
- Added Providers wrapper in root layout for React Query support
- Created auth store (src/lib/auth-store.ts) with Zustand + persist middleware for client-side auth state
- Created auth API route (src/app/api/auth/route.ts) - POST for login, DELETE for logout
- Created login page (src/app/(auth)/login/page.tsx) with gradient background, AgroEve branding, email/password form, error toasts
- Created dashboard layout (src/app/(dashboard)/layout.tsx) with:
  - Auth guard using useSyncExternalStore for hydration-safe client detection
  - Sidebar with 10 navigation items using shadcn/ui Sidebar component
  - Header with module title, theme toggle (Sun/Moon), user dropdown menu with logout
  - Mobile-responsive sidebar (Sheet overlay on mobile, fixed on desktop)
- Created dashboard page (src/app/(dashboard)/panel/page.tsx) with:
  - 7 metric cards in responsive grid (Clientes Activos, Kits Instalados, Mantenimientos Próximos, Cotizaciones Pendientes, Ingresos/Gastos/Utilidad del Mes)
  - Alerts section (clients without activity, overdue/upcoming maintenance, low stock, overdue tasks)
  - 3 Recharts charts: Ingresos vs Gastos (BarChart), Clientes por Estado (PieChart), Cotizaciones por Mes (BarChart)
  - Recent activity from BitacoraEvento (last 10 entries)
  - Loading skeleton state
- Created dashboard API route (src/app/api/dashboard/route.ts) with all metrics, alerts, chart data, and recent activity
- Created redirect root page (src/app/page.tsx) that redirects authenticated users to /panel and unauthenticated to /login
- Created shared components:
  - StatusBadge: Badge with color based on status type (cliente, cotizacion, monitoreo, tarea, prioridad)
  - ConfirmDialog: AlertDialog wrapper for confirmations with destructive variant support
  - DataTable: Reusable data table with search, column filter, pagination using @tanstack/react-table

Routing Decision:
- Dashboard is at /panel instead of / due to Next.js route group conflict:
  app/page.tsx and app/(dashboard)/page.tsx both match the "/" URL, causing shadowing
- Root page.tsx handles redirect logic (auth → /panel, no auth → /login)
- Dashboard layout provides auth guard for all /panel and other dashboard routes
- This approach avoids infinite redirect loops while maintaining clean URL structure

All routes tested and returning 200:
- / → redirect page (200)
- /login → login page (200)
- /panel → dashboard with sidebar (200)
- /api/auth POST → 200 (valid) / 401 (invalid)
- /api/dashboard GET → 200 with full data

Lint: 0 errors, 1 warning (TanStack Table incompatible library - expected)

Stage Summary:
- Complete auth flow working (login → store user → redirect → dashboard)
- Dashboard displays real data from seeded database
- All shared components ready for reuse in other modules
- Dark/light theme toggle working
- Responsive design with mobile sidebar
- Ready for individual module pages (clientes, cotizaciones, etc.)

---
Task ID: 4
Agent: Main
Task: Clients Module - List Page, 360 View, API Routes, Form Components

Work Log:
- Created API route /api/clientes (GET with filters: estado, socio, search; POST with bitacora)
- Created API route /api/clientes/[id] (GET with full related data; PATCH with bitacora; DELETE with bitacora)
- Created API route /api/interacciones (GET with clienteId filter; POST with bitacora)
- Created API route /api/interacciones/[id] (PATCH; DELETE)
- Created ClienteForm component (react-hook-form + zod validation, create/edit mode in Dialog)
- Created InteraccionForm component (react-hook-form + zod validation, socio auto-filled from auth store)
- Added onRowClick prop to shared DataTable component for clickable rows
- Created Clients List Page (/clientes):
  - Summary cards showing count by status (4 cards)
  - DataTable with columns: Nombre, Empresa, Contacto, Ciudad, Tipo Negocio, Estado, Socio
  - Search input, Estado filter dropdown
  - Row click navigates to /clientes/[id]
  - "Nuevo Cliente" button opens create dialog
  - Loading skeleton state
- Created Client 360 View Page (/clientes/[id]):
  - Breadcrumb navigation (Clientes > Client Name)
  - Header with client name, status badge, action buttons (Editar, Cambiar Estado, Registrar Interacción)
  - 9 tabs: Información General, Cotizaciones, Monitoreos, Inventario, Mantenimientos, Ingresos, Historial de Interacciones, Tareas, Documentos
  - Tab: Información General - grid of all client fields with icons, notes section
  - Tab: Cotizaciones - table with numero, fecha, estado, total (calculated with IVA/descuento)
  - Tab: Monitoreos - cards with kit info, installation date, maintenance schedule
  - Tab: Inventario - placeholder "Próximamente"
  - Tab: Mantenimientos - historical table (flattened from all monitoreos)
  - Tab: Ingresos - INGRESO transactions table with total sum at bottom
  - Tab: Historial de Interacciones - timeline view with type badges, próxima acción callout
  - Tab: Tareas - table with título, asignado, prioridad badge, fecha límite, estado
  - Tab: Documentos - table (placeholder for now)
  - Edit client dialog (reuses ClienteForm)
  - Change estado dialog (ConfirmDialog with Select)
  - Register interaction dialog (InteraccionForm)
  - Loading skeleton state
- All text in Spanish
- Uses formatCOP, formatFecha from @/lib/format
- Uses registrarBitacora for all write operations
- Uses StatusBadge for all status displays
- Responsive design for mobile and desktop
- Uses TanStack React Query for data fetching

All routes tested and returning 200:
- GET /api/clientes → 200 (5 clients)
- GET /api/clientes/[id] → 200 (full client with related data)
- GET /api/interacciones?clienteId=X → 200
- GET /clientes → 200 (list page)
- GET /clientes/[id] → 200 (360 view)

Lint: 0 errors, 1 warning (TanStack Table incompatible library - pre-existing)

Stage Summary:
- Complete clients module with list and 360 view
- All CRUD API routes with bitacora logging
- Form components with validation
- 9 tab 360 view with all related data
- Ready for other modules (cotizaciones, monitoreos, etc.)

---
Task ID: 5-6
Agent: Main
Task: Cotizaciones Module & Monitoreos Module

Work Log:

**COTIZACIONES MODULE**

- Created API route /api/cotizaciones (GET with filters: estado, clienteId, search; POST with auto-generated numero COT-YYYY-NNN, bitacora)
- Created API route /api/cotizaciones/[id] (GET with cliente+items+calculated totals; PATCH only if BORRADOR with items replacement; DELETE with bitacora)
- Created API route /api/cotizaciones/[id]/estado (PATCH to change estado, validates allowed transitions, bitacora)
- Created API route /api/cotizaciones/[id]/convertir (POST converts ACEPTADA to INGRESO transaction, creates Transaccion record, bitacora)
- Created API route /api/cotizaciones/[id]/duplicar (POST duplicates as BORRADOR with new numero, bitacora)
- Created CotizacionForm component (Dialog for create/edit, dynamic items list with add/remove rows, auto-calc subtotal per row, descuento/IVA fields, auto-calculate totals, client select, date fields, observaciones/notas internas)
- Created Cotizaciones List Page (/cotizaciones):
  - DataTable with columns: Número (clickable link), Cliente, Fecha Emisión, Estado (StatusBadge), Total, Socio, Acciones
  - Search by number or client name
  - Filter by estado dropdown (6 estados)
  - "Nueva Cotización" button opens creation dialog
  - Empty state with FileText icon
  - Loading state
- Created Cotizacion Detail Page (/cotizaciones/[id]):
  - Header with número, StatusBadge, back button, client name
  - Change estado dropdown (validates transitions: BORRADOR→ENVIADA, ENVIADA→EN_REVISION/ACEPTADA/RECHAZADA, etc.)
  - "Convertir en Ingreso" button (only when ACEPTADA, creates INGRESO transaction with confirmation dialog)
  - More actions menu: Edit (BORRADOR only), Duplicate, Download PDF, Delete
  - Info card with número, cliente, contacto, fecha emisión, vencimiento, socio
  - Items table with descripción, cantidad, precio unit, subtotal
  - Summary section: subtotal, descuento %, IVA %, TOTAL
  - Sidebar with status card (transition buttons), notas (observaciones + notas internas with "Solo interno" badge), quick actions card
  - Edit dialog (reuses CotizacionForm, only BORRADOR)
  - Convert confirmation dialog
  - Delete confirmation dialog

**MONITOREOS MODULE**

- Created API route /api/monitoreos (GET with cliente info and mantenimientos; POST with auto-calculate proximoMantenimiento, bitacora)
- Created API route /api/monitoreos/[id] (GET with cliente+mantenimientos; PATCH with recalculate proximoMantenimiento on frecuencia change, bitacora; DELETE with cascade delete mantenimientos, bitacora)
- Created API route /api/mantenimientos (GET with monitoreoId filter; POST creates maintenance, updates monitoreo's ultimoMantenimiento and proximoMantenimiento, sets estado to ACTIVO, bitacora)
- Created MonitoreoForm component (Dialog for create/edit, client select, kit ID, fecha instalación, frecuencia mantenimiento, observaciones)
- Created MantenimientoForm component (Dialog for registering maintenance, fecha, descripción, observaciones, auto-fills socio from auth store)
- Created Monitoreos List Page (/monitoreos):
  - DataTable with columns: Cliente, Fecha Instalación, Estado (StatusBadge), Frecuencia Mant., Próx. Mantenimiento (with warning colors), Acciones
  - Warning colors for próximo mantenimiento: red for overdue (Vencido badge), amber for within 7 days (Próximo badge), AlertTriangle icon
  - Overdue alert banner at top when any monitoreo has overdue maintenance
  - Filter by estado dropdown (3 estados)
  - "Nuevo Monitoreo" button
  - Detail dialog with:
    - Info grid: cliente, kit ID, estado, fecha instalación, frecuencia, último mant., próximo mant. (with overdue badge)
    - Observaciones section
    - Historial de Mantenimientos table (fecha, socio, descripción, observaciones)
    - "Registrar Mantenimiento" button (opens MantenimientoForm, refreshes detail and list on success)
    - Edit and Delete action buttons
  - Create/edit form dialog (reuses MonitoreoForm)
  - Delete confirmation dialog

All text in Spanish.
Uses formatCOP, formatFecha from @/lib/format.
Uses registrarBitacora for all write operations.
Uses StatusBadge for all status displays.
Uses sonner for toast notifications.
Responsive design for mobile and desktop.
Uses shadcn/ui components throughout.

All routes tested and returning 200:
- GET /api/cotizaciones → 200 (3 cotizaciones with totals)
- GET /api/cotizaciones/[id] → 200 (full detail with items, cliente, totals)
- GET /api/monitoreos → 200 (2 monitoreos with cliente and mantenimientos)
- GET /api/monitoreos/[id] → 200 (full detail)
- GET /cotizaciones → 200 (list page)
- GET /cotizaciones/[id] → 200 (detail page)
- GET /monitoreos → 200 (list page)

Lint: 0 errors, 1 warning (TanStack Table incompatible library - pre-existing)

Stage Summary:
- Complete Cotizaciones module with list, detail, form, and 5 API routes
- Complete Monitoreos module with list, detail dialog, maintenance form, and 3 API routes
- All CRUD operations with bitacora logging
- Quotation workflow: BORRADOR → ENVIADA → EN_REVISION → ACEPTADA → Convertir en Ingreso
- Maintenance tracking with overdue/next-soon warnings
- Both modules fully integrated with existing shared components

---
Task ID: 7-8
Agent: Main
Task: Inventario Module & Finanzas Module

Work Log:

**INVENTARIO MODULE**

- Created API route /api/inventario (GET with filters: categoria, search, includes latest 5 movements; POST with bitacora)
- Created API route /api/inventario/[id] (GET with full movements; PATCH with bitacora; DELETE with cascade on MovimientoStock, bitacora)
- Created API route /api/inventario/[id]/movimientos (GET list; POST creates movement, updates stock and costoUnitario with weighted average for ENTRADA, bitacora)
- Added onDelete: Cascade to MovimientoStock → InventarioItem relation in Prisma schema (fixes P2003 foreign key error on delete)
- Ran db:push to sync schema change
- Created ItemForm component (Dialog for create/edit inventory item: nombre, categoria dropdown, unidad, stockActual, stockMinimo, costoUnitario, proveedor, notas)
- Created MovimientoForm component (Dialog for stock movement: tipo select ENTRADA/SALIDA_INSTALACION/SALIDA_VENTA/AJUSTE, conditional fields: costo+proveedor for ENTRADA, clienteId for SALIDA, fecha, descripcion; loads clientes from API)
- Created Inventario List Page (/inventario):
  - Summary cards: Total Ítems, Stock Bajo (red), Valor Total, Componentes count
  - Search by name input
  - Filter by categoría dropdown (COMPONENTE, KIT_ARMADO, MATERIAL_INSTALACION)
  - Table with columns: Nombre, Categoría, Unidad, Stock, Mínimo, Costo Unit., Proveedor
  - Low stock rows highlighted with red/warning background + "Bajo" badge
  - Expandable row on click shows: details (costo unitario, valor en stock, proveedor, notas), last movements list with type badges and +/- indicators, "Registrar Movimiento" button
  - Detail dialog with full item info + full movement history
  - Dropdown menu per row: Ver Detalle, Registrar Movimiento, Editar, Eliminar
  - Create/edit form dialog (reuses ItemForm)
  - Movement form dialog (reuses MovimientoForm)
  - Delete confirmation dialog
  - Loading skeleton state

**FINANZAS MODULE**

- Created API route /api/finanzas (GET with tipo param: resumen, ingresos, gastos, aportes)
  - resumen: monthly/yearly totals, balance per socio (aportado/retirado/saldo), utilidad 50/50 split, chart data (12-month ingresos vs gastos, gastos por categoría, ingresos por categoría)
  - ingresos: INGRESO transactions with cliente relation
  - gastos: GASTO transactions
  - aportes: APORTE_SOCIO + RETIRO_SOCIO transactions
  - Supports mes and anio filters
- Created API route /api/transacciones (GET with filters: tipo, categoria, socio, mes, anio; POST with bitacora)
- Created API route /api/transacciones/[id] (GET; PATCH; DELETE with bitacora)
- Created API route /api/clientes (GET with search, returns id/nombre/empresa/estado - used by MovimientoForm and TransaccionForm)
- Created TransaccionForm component (Dialog for any transaction type: INGRESO/GASTO/APORTE_SOCIO/RETIRO_SOCIO; conditional fields by tipo: categoría options change, clienteId for INGRESO; socio, metodoPago, monto, fecha, descripcion)
- Created Finanzas Page (/finanzas) with 4 tabs:
  - Tab: Resumen
    - 6 summary cards: Ingresos del Mes, Gastos del Mes, Utilidad del Mes, Ingresos del Año, Gastos del Año, Utilidad del Año
    - Balance por Socio card: aportado, retirado, saldo per socio + utilidad correspondiente 50%
    - BarChart: Ingresos vs Gastos por mes (last 12 months, sky blue #0ea5e9 for ingresos, red for gastos)
    - PieChart: Gastos por categoría
    - PieChart: Ingresos por categoría
  - Tab: Ingresos
    - Search input
    - "Nuevo Ingreso" button
    - Table: Fecha, Categoría, Cliente, Descripción, Monto, Método, Socio, Acciones
  - Tab: Gastos
    - Search input
    - "Nuevo Gasto" button
    - Table: Fecha, Categoría, Descripción, Monto, Socio, Comprobante, Acciones
  - Tab: Aportes/Retiros
    - "Nuevo Aporte" and "Nuevo Retiro" buttons
    - Table: Fecha, Tipo (badge: green for aporte, red for retiro), Socio, Concepto, Monto, Método, Acciones
  - Transaction form dialog (reuses TransaccionForm)
  - Delete confirmation dialog
  - Loading skeleton state

All text in Spanish.
Uses formatCOP, formatFecha from @/lib/format.
Uses registrarBitacora for all write operations.
Uses sonner for toast notifications.
Responsive design for mobile and desktop.
Uses Recharts for all charts with AgroEve palette colors.
Uses shadcn/ui components throughout.

All routes tested and returning 200:
- GET /api/inventario → 200 (10 items with movements)
- GET /api/inventario/[id] → 200 (item detail with full movements)
- POST /api/inventario → 201 (creates item)
- POST /api/inventario/[id]/movimientos → 201 (creates movement, updates stock)
- DELETE /api/inventario/[id] → 200 (cascade deletes movements)
- GET /api/finanzas?tipo=resumen → 200 (full summary with charts)
- GET /api/finanzas?tipo=ingresos → 200 (INGRESO transactions with cliente)
- GET /api/finanzas?tipo=gastos → 200 (GASTO transactions)
- GET /api/finanzas?tipo=aportes → 200 (APORTE_SOCIO + RETIRO_SOCIO)
- GET /api/transacciones → 200 (with filters)
- POST /api/transacciones → 201 (creates transaction)
- GET /inventario → 200 (list page)
- GET /finanzas → 200 (tabs page)

Verified weighted average cost calculation:
- Created item with stock=10, costo=50000, then ENTRADA of 5 at costo=55000
- Stock updated to 15, costoUnitario = (10*50000 + 5*55000)/15 = 51666.67 ✓

Lint: 0 errors, 1 warning (TanStack Table incompatible library - pre-existing)

Stage Summary:
- Complete Inventario module with list, expandable rows, detail dialog, item form, movement form
- Complete Finanzas module with 4 tabs (Resumen, Ingresos, Gastos, Aportes/Retiros), charts, transaction form
- Stock movement logic: ENTRADA increases stock + weighted average cost, SALIDA decreases, AJUSTE +/- 
- All CRUD API routes with bitacora logging
- Both modules fully integrated with existing shared components and AgroEve palette

---
Task ID: 11
Agent: Main
Task: Bitácora (Activity Log) Page & Configuración (Settings) Page

Work Log:

**BITÁCORA MODULE**

- Created API route /api/bitacora (GET with filters: socio, modulo, fechaDesde, fechaHasta, search; paginated with page & pageSize)
  - Returns: { data: events[], total: number, page: number, pageSize: number }
  - Supports filtering by socio, modulo (dropdown), date range, and text search in detalle
  - Ordered by createdAt descending (newest first)
- Created Bitácora Page (/bitacora):
  - Table with columns: Fecha/Hora, Socio, Módulo, Acción, Detalle
  - Colored badges for módulo with specific color coding:
    - clientes: blue, cotizaciones: purple, monitoreos: cyan, inventario: orange, finanzas: green, documentos: pink, tareas: amber
  - Filters: Socio (socioA/socioB), Módulo (7 options dropdown), Fecha desde/hasta (date inputs), Search in detalle text
  - Pagination (20 per page) with page number display and navigation
  - Total count display in summary card
  - "Limpiar filtros" button when filters are active
  - "Actualizar" refresh button with toast notification
  - Loading skeleton state
  - Responsive design for mobile and desktop

**CONFIGURACIÓN MODULE**

- Created API route /api/auth/password (POST for changing password)
  - Body: { userId, currentPassword, newPassword }
  - Verifies current password with bcryptjs
  - Hashes new password and updates user record
  - Calls registrarBitacora on successful password change
  - Validates minimum 6 character password length
  - Error handling for incorrect current password, user not found
- Created Configuración Page (/configuracion) with two sections:
  - Section 1: Mi Perfil
    - User info display: nombre and email (read-only)
    - Theme toggle (dark/light) using next-themes useTheme
    - Change password button → opens dialog with:
      - Current password, new password, confirm new password fields
      - Client-side validation (required fields, min 6 chars, passwords match)
      - POST to /api/auth/password
      - Success/error toast notifications
  - Section 2: Datos de la Empresa
    - AgroEve branded identity card with gradient background
    - Static info in grid layout:
      - Versión 1.0.0
      - Base de datos: SQLite (local)
      - Socios: 2 usuarios activos
      - Tipo: Sistema interno

All text in Spanish.
Uses formatFechaHora from @/lib/format.
Uses registrarBitacora for password change operation.
Uses sonner for toast notifications.
Uses shadcn/ui components (Card, Table, Select, Input, Button, Badge, Dialog, Pagination).
Responsive design for mobile and desktop.

All routes tested and returning 200:
- GET /api/bitacora → 200 (paginated events with filters)
- GET /api/bitacora?modulo=inventario → 200 (filtered by module)
- GET /api/bitacora?search=ingreso → 200 (text search)
- POST /api/auth/password → 200 (valid) / 401 (wrong password) / 404 (user not found) / 400 (validation)
- GET /bitacora → 200 (list page)
- GET /configuracion → 200 (settings page)

Lint: 0 errors, 1 warning (TanStack Table incompatible library - pre-existing)

Stage Summary:
- Complete Bitácora module with paginated table, all filters, module color badges, and refresh functionality
- Complete Configuración page with profile section, theme toggle, change password dialog, and company info
- Both pages fully integrated with existing dashboard layout and AgroEve theme

---
Task ID: 9
Agent: Main
Task: Documents Module - List Page, Upload Form, API Routes

Work Log:

**DOCUMENTS MODULE**

- Added TIPO_DOCUMENTO_LABELS and TIPO_DOCUMENTO_COLORS to types/index.ts (7 types: CONTRATO, COTIZACION, MANUAL, FOTOGRAFIA_INSTALACION, ACTA_ENTREGA, COMPROBANTE_PAGO, OTRO)
- Created public/uploads directory for file storage
- Created API route /api/documentos (GET with filters: tipo, clienteId, search; includes cliente relation)
- Created API route /api/documentos/upload (POST multipart/form-data file upload):
  - Validates file size (max 20MB) and accepted formats (PDF, JPG, PNG, DOCX, XLSX)
  - Generates path: /uploads/{tipo}/{year}/{month}/{uuid}-{originalName}
  - Creates directories recursively if not exist
  - Writes file to disk using fs/promises
  - Saves document record in DB with all metadata
  - Calls registrarBitacora
- Created API route /api/documentos/[id] (GET with cotizacion+monitoreo relations; DELETE with file removal from disk + DB record deletion, bitacora)
- Created API route /api/documentos/[id]/descargar (GET serves file with appropriate Content-Type and Content-Disposition headers, extracts original filename from uuid-prefixed stored name)
- Created DocumentoUploader component (Dialog for uploading):
  - File input with drag-to-select area (accept PDF, JPG, PNG, DOCX, XLSX, max 20MB validation)
  - File preview with name, size display, and remove button
  - Nombre/título field (auto-fills from filename)
  - Tipo select (7 TipoDocumento values)
  - Descripción/notes textarea
  - Cliente asociado (optional select, loads from API)
  - Cotización asociada (optional select, filtered by selected cliente)
  - Monitoreo asociado (optional select, filtered by selected cliente)
  - Fecha del documento (date input, defaults to today)
  - Tags (comma-separated input)
  - Loading state with spinner during upload
  - Uses FormData to POST to /api/documentos/upload
- Created Documentos List Page (/documentos):
  - Summary cards: Total documentos, top 3 tipo counts, "Otros tipos" if more than 3
  - Search by nombre input
  - Filter by tipo dropdown (7 TipoDocumento values + "Todos")
  - Filter by cliente dropdown (loads from API + "Todos")
  - Table with columns: file type icon, Nombre (with tags badges), Tipo (colored badge), Cliente, Fecha Documento, Socio, Tamaño, Acciones
  - Empty state with FolderOpen icon and descriptive text
  - Click row → detail dialog with full metadata (tipo, tamaño, cliente, socio, fechas, descripción, tags)
  - Download button (opens /api/documentos/{id}/descargar in new tab)
  - Delete button with ConfirmDialog
  - Detail dialog with download, delete, and close buttons
  - Loading skeleton state
  - Responsive design (hidden columns on mobile)

All text in Spanish.
Uses formatFecha from @/lib/format.
Uses registrarBitacora for upload and delete operations.
Uses sonner for toast notifications.
Uses shadcn/ui components throughout.
Responsive design for mobile and desktop.

All routes tested and returning 200:
- GET /api/documentos → 200 (empty list)
- GET /api/documentos?tipo=COTIZACION → 200 (filtered by tipo)
- GET /api/documentos?search=Cliente → 200 (search filter)
- POST /api/documentos/upload → 201 (PDF upload with metadata, file saved to disk)
- POST /api/documentos/upload (invalid type .txt) → 400 (validation error)
- GET /api/documentos/[id] → 200 (document detail with relations)
- GET /api/documentos/[id]/descargar → 200 (file served with correct headers)
- DELETE /api/documentos/[id] → 200 (file removed from disk + DB record deleted)
- GET /documentos → 200 (list page)

Lint: 0 errors, 1 warning (TanStack Table incompatible library - pre-existing)

Stage Summary:
- Complete Documents module with list page, upload form, detail dialog, and 4 API routes
- File upload with validation (size, format), organized storage (/uploads/{tipo}/{year}/{month}/)
- File download with original filename extraction
- File deletion removes both disk file and DB record
- Dynamic filtering by tipo and cliente, search by name
- Cotización and Monitoreo associations filtered by selected cliente
- All CRUD operations with bitacora logging

---
Task ID: 10
Agent: Main
Task: Tasks Module with Kanban Board

Work Log:

**API ROUTES**

- Created API route /api/tareas (GET with filters: estado, asignadoA, prioridad, clienteId; includes cliente relation; POST with bitacora)
  - asignadoA filter supports: socioA, socioB, ambos (returns tasks assigned to either socio or both)
- Created API route /api/tareas/[id] (GET with cliente; PATCH with bitacora; DELETE with bitacora)
- Created API route /api/tareas/[id]/estado (PATCH to change task estado for Kanban drag & drop, validates against PENDIENTE/EN_PROGRESO/COMPLETADA, bitacora)

**TAREA FORM COMPONENT**

- Created TareaForm component (src/components/tareas/tarea-form.tsx):
  - Dialog for create/edit with react-hook-form + zod validation
  - Fields: Título (required), Descripción (textarea), Asignado a (select: Socio A, Socio B, Ambos), Prioridad (select: ALTA, MEDIA, BAJA), Fecha límite (date input), Estado (select: PENDIENTE, EN_PROGRESO, COMPLETADA), Cliente vinculado (optional select from API)
  - Loads clientes from /api/clientes on dialog open
  - Handles "none" value for clienteId (converts to null before API call)
  - Resets form properly when switching between create/edit

**KANBAN BOARD COMPONENT**

- Created KanbanBoard component (src/components/tareas/kanban-board.tsx):
  - Uses @dnd-kit/core (DndContext, DragOverlay, closestCorners, PointerSensor, useDroppable) and @dnd-kit/sortable (SortableContext, useSortable, verticalListSortingStrategy)
  - 3 columns: PENDIENTE (sky), EN_PROGRESO (amber), COMPLETADA (emerald) with colored headers and top borders
  - Each column is a useDroppable area (supports dropping into empty columns)
  - Each task card is a useSortable draggable item with grip handle
  - KanbanCard shows: título, prioridad badge (color-coded), asignado a, fecha límite (with overdue highlight), cliente vinculado
  - Cards have left border color by priority: red (ALTA), amber (MEDIA), gray (BAJA)
  - DragOverlay shows rotated card preview during drag
  - On drag end, determines target column from over element (column droppable or card within column)
  - PATCH /api/tareas/[id]/estado to update task estado
  - Visual feedback: isOver column highlighting, isDragging opacity reduction

**TAREAS PAGE**

- Created Tareas Page (src/app/(dashboard)/tareas/page.tsx):
  - Toggle between Lista and Kanban views using shadcn/ui Tabs
  - 5 Summary cards: Total, Pendientes (sky), En Progreso (amber), Completadas (emerald), Vencidas (red)
  - Filters: Search input (searches título, cliente, asignado), Asignado a (select: Todos/Socio A/Socio B/Ambos), Prioridad (select: Todas/ALTA/MEDIA/BAJA)
  - "Nueva Tarea" button

  **Lista View:**
  - Table with columns: Título, Asignado a, Prioridad (badge), Fecha Límite, Estado, Cliente, Acciones
  - Sortable by priority and date (click column header to toggle sort direction)
  - Click row → opens edit dialog
  - Estado dropdown in table allows changing estado inline (dropdown with colored badges)
  - Overdue tasks highlighted with red background and "Vencida" label
  - Edit and Delete actions in dropdown menu

  **Kanban View:**
  - 3 columns with horizontal scroll on mobile (flex-shrink-0 with fixed widths on mobile, flex-1 on desktop)
  - Cards with priority-colored left border
  - Drag and drop between columns to change estado
  - Click card → edit dialog
  - Overdue date highlighted in red

All text in Spanish.
Uses formatFecha from @/lib/format.
Uses registrarBitacora for all write operations.
Uses sonner for toast notifications.
Uses shadcn/ui components throughout.
Uses ESTADO_TAREA_COLORS, ESTADO_TAREA_LABELS, PRIORIDAD_COLORS from @/types.
Responsive design for mobile and desktop.

All routes tested and returning 200:
- GET /api/tareas → 200 (3 tasks with cliente relations)
- GET /api/tareas?asignadoA=socioA → 200 (filtered, 2 tasks)
- GET /api/tareas?asignadoA=ambos → 200 (filtered, 3 tasks including "ambos" tasks)
- GET /api/tareas?prioridad=ALTA → 200 (filtered, 2 tasks)
- GET /api/tareas/[id] → 200 (task detail)
- PATCH /api/tareas/[id]/estado → 200 (changes estado successfully)
- POST /api/tareas → 201 (creates task)
- PATCH /api/tareas/[id] → 200 (updates task)
- DELETE /api/tareas/[id] → 200 (deletes task)
- GET /tareas → 200 (page with Lista/Kanban views)

Lint: 0 errors, 1 warning (TanStack Table incompatible library - pre-existing)

Stage Summary:
- Complete Tasks module with dual view (Lista + Kanban), full CRUD API routes, and form component
- Kanban board with @dnd-kit drag and drop between columns, visual feedback, and estado updates
- Priority and overdue highlighting throughout both views
- Inline estado change via dropdown in table view
- Sortable table columns for priority and date
- All operations logged to bitacora

---
Task ID: 12
Agent: Main
Task: Final Polish & Verification

Work Log:
- Verified all API routes return 200/201 with no errors
- Lint check: 0 errors, 1 pre-existing warning (TanStack Table)
- Checked dev.log: no runtime errors, all routes working
- Upload directory verified (public/uploads/ with CONTRATO and COTIZACION subdirs)
- Verified complete file count: 70 custom source files (118 total including shadcn/ui)
- Verified all 10 modules are functional: Auth, Dashboard, Clientes, Cotizaciones, Monitoreos, Inventario, Finanzas, Documentos, Tareas, Bitácora + Configuración

Stage Summary:
- AgroEve is fully functional with all 10 modules + configuration
- All text in Spanish, COP currency, Colombian date format
- Dark/Light theme toggle, responsive design
- All CRUD operations log to bitacora
- File upload/download working with local storage
- Kanban drag & drop working with @dnd-kit
- Charts working with Recharts
- Test credentials: socioA@agroeve.co / agroeve2026
