# Restringir clientes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que solo ADMIN restrinja o rehabilite clientes, excluyéndolos de cobranza operativa y nuevos préstamos sin alterar su historial financiero.

**Architecture:** El estado vive únicamente en `clients` y Express es la frontera de autorización. Consultas PostgreSQL aplican la visibilidad operativa antes de producir préstamos, alertas, ruta y Dashboard; React recibe el historial completo cuando lo solicita explícitamente y aplica filtros independientes de restricción en Clientes y Préstamos.

**Tech Stack:** PostgreSQL/Supabase, Node.js, Express, JWT, `node:test`, React 19, React Router 7, Vite 6.

**Spec:** `docs/superpowers/specs/2026-10-05-restrict-clients-design.md`

## Global Constraints

- Modificar únicamente `frontend/` y `backend/`, además de esta documentación y `.gitignore` de la rama.
- No modificar préstamos, pagos, saldos, mora ni estados históricos al restringir o rehabilitar.
- Solo `ADMIN` puede cambiar la restricción; la validación de rol debe ejecutarse en backend.
- Los reportes financieros conservan clientes restringidos; Préstamos, Alertas, Ruta diaria y métricas operativas del Dashboard los excluyen por defecto.
- No introducir Supabase Auth ni políticas RLS incompatibles con el JWT propio.
- No corregir ni modificar la aplicación Next.js raíz ni `src/components/Clients/ClientsView.tsx:67`.
- No hacer merge a `main`.

## Review Focus

- Un `clientId` directo y un cliente deduplicado por DNI/teléfono/nombre deben quedar bloqueados por igual si están restringidos; Task 3 prueba ambos caminos.
- `restriction=restricted`, `restriction=all` y valores inválidos deben producir consultas o errores deterministas; Task 3 cubre los tres casos.
- Un COBRADOR con JWT que afirme ADMIN pero cuyo rol actual en base sea COBRADOR debe recibir `403`; Task 2 prueba el middleware real con rol consultado.
- Rehabilitar debe registrar el motivo anterior antes de limpiarlo; Task 2 afirma el orden y los valores persistidos.
- Pagos y reportes históricos de restringidos no deben desaparecer; Task 4 comprueba que solo las consultas operativas incorporan el predicado.

---

### Task 1: Esquema y representación del estado de restricción

**Files:**
- Create: `backend/migrations/20261005_add_client_restrictions.sql`
- Modify: `backend/src/config/initDb.js`
- Modify: `backend/src/controllers/loanController.js`
- Modify: `backend/package.json`
- Test: `backend/src/controllers/clientRestrictionMapping.test.js`

**Interfaces:**
- Consumes: filas PostgreSQL de `clients`.
- Produces: `mapRowToClient(row)` con `isRestricted`, `is_restricted`, `restrictedAt`, `restricted_at`, `restrictedBy`, `restricted_by`, `restrictionReason` y `restriction_reason`.

- [ ] **Step 1: Añadir el script de pruebas y escribir el test fallido del mapeo**

Crear un test que importe el mapeador exportado y compruebe literales para una fila restringida y otra heredada sin columnas. La mutación que debe detectar es omitir o convertir incorrectamente `is_restricted` y sus metadatos.

- [ ] **Step 2: Ejecutar el test y confirmar RED**

Run: `npm test -- clientRestrictionMapping.test.js`

Expected: FAIL porque el mapeador no exporta ni devuelve los campos de restricción.

- [ ] **Step 3: Implementar el mapeo mínimo**

Exportar `mapRowToClient(row)` y añadir ambas convenciones de nombres sin cambiar sus cálculos financieros.

- [ ] **Step 4: Ejecutar el test y confirmar GREEN**

Run: `npm test -- clientRestrictionMapping.test.js`

Expected: PASS.

- [ ] **Step 5: Crear la migración y actualizar `initDb.js`**

La migración debe usar `ADD COLUMN IF NOT EXISTS`, default seguro, índice parcial y FK nullable hacia `users(id)` con una estrategia idempotente. `initDb.js` añadirá las cuatro columnas para instalaciones nuevas.

- [ ] **Step 6: Revisar SQL y confirmar que no muta `loans` ni `payments`**

Run: `rg -n "UPDATE loans|DELETE FROM loans|UPDATE payments|DELETE FROM payments" backend/migrations/20261005_add_client_restrictions.sql`

Expected: sin coincidencias.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/migrations/20261005_add_client_restrictions.sql backend/src/config/initDb.js backend/src/controllers/loanController.js backend/src/controllers/clientRestrictionMapping.test.js
git commit -m "feat: add client restriction schema"
```

### Task 2: Endpoint ADMIN y auditoría de restricción

**Files:**
- Create: `backend/src/services/clientRestrictionService.js`
- Modify: `backend/src/controllers/loanController.js`
- Modify: `backend/src/routes/apiRoutes.js`
- Test: `backend/src/services/clientRestrictionService.test.js`
- Test: `backend/src/routes/clientRestrictionRoute.test.js`

**Interfaces:**
- Consumes: `setClientRestriction(db, { clientId, isRestricted, reason, adminId, adminName, ip })`.
- Produces: cliente actualizado; `PUT /api/clients/:id/restriction` con respuestas 200, 403, 404 y 422.

- [ ] **Step 1: Escribir tests fallidos del servicio**

Probar restricción, rehabilitación, cliente inexistente y motivo opcional con un adaptador de base controlado. Afirmar que la rehabilitación inserta en `activity_logs` el motivo previo antes de limpiar los cuatro campos.

- [ ] **Step 2: Ejecutar los tests y confirmar RED**

Run: `npm test -- clientRestrictionService.test.js`

Expected: FAIL porque el servicio no existe.

- [ ] **Step 3: Implementar el servicio transaccional mínimo**

Normalizar `reason`, bloquear/leer el cliente, actualizar solo columnas de restricción e insertar la auditoría dentro de la misma transacción.

- [ ] **Step 4: Ejecutar los tests del servicio y confirmar GREEN**

Run: `npm test -- clientRestrictionService.test.js`

Expected: PASS.

- [ ] **Step 5: Escribir tests fallidos de ruta y autorización**

Invocar la cadena real de middleware/controlador con peticiones controladas: ADMIN actual permitido, COBRADOR actual rechazado aunque el JWT diga ADMIN, cuerpo inválido `422`.

- [ ] **Step 6: Ejecutar los tests y confirmar RED**

Run: `npm test -- clientRestrictionRoute.test.js`

Expected: FAIL porque la ruta no existe.

- [ ] **Step 7: Montar la ruta y controlador mínimos**

Agregar `PUT /clients/:id/restriction` con `verifyToken`, `requireAdmin` y `loanController.setClientRestriction`; nunca leer `restricted_by` del cuerpo.

- [ ] **Step 8: Ejecutar los tests y confirmar GREEN**

Run: `npm test -- clientRestrictionRoute.test.js`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/services/clientRestrictionService.js backend/src/services/clientRestrictionService.test.js backend/src/controllers/loanController.js backend/src/routes/apiRoutes.js backend/src/routes/clientRestrictionRoute.test.js
git commit -m "feat: protect client restriction endpoint"
```

### Task 3: Bloqueo de préstamos y consulta histórica filtrable

**Files:**
- Create: `backend/src/services/clientRestrictionQueries.js`
- Modify: `backend/src/controllers/loanController.js`
- Test: `backend/src/services/clientRestrictionQueries.test.js`
- Test: `backend/src/controllers/restrictedLoanCreation.test.js`

**Interfaces:**
- Consumes: `parseRestrictionScope(value)` y `restrictionSql(scope, clientAlias)`; estado del cliente resuelto dentro de `createClientAndLoan`.
- Produces: scopes `active`, `restricted`, `all`; error HTTP 409 con el mensaje aprobado.

- [ ] **Step 1: Escribir tests fallidos del parser y predicados SQL**

Comprobar default `active`, scopes explícitos y rechazo de valores inválidos. La mutación que deben detectar es devolver todos los clientes por defecto.

- [ ] **Step 2: Ejecutar y confirmar RED**

Run: `npm test -- clientRestrictionQueries.test.js`

Expected: FAIL porque el módulo no existe.

- [ ] **Step 3: Implementar helpers mínimos e integrar `GET /loans`**

Unir `clients` y aplicar el predicado antes de ordenar/mapear. Responder `422` para scope inválido.

- [ ] **Step 4: Ejecutar y confirmar GREEN**

Run: `npm test -- clientRestrictionQueries.test.js`

Expected: PASS.

- [ ] **Step 5: Escribir tests fallidos de creación**

Cubrir `clientId` restringido, coincidencia restringida por DNI/teléfono/nombre y cliente no restringido. Afirmar 409 y ausencia de `INSERT INTO loans` para los dos primeros.

- [ ] **Step 6: Ejecutar y confirmar RED**

Run: `npm test -- restrictedLoanCreation.test.js`

Expected: FAIL porque actualmente el préstamo se inserta.

- [ ] **Step 7: Implementar el bloqueo dentro de la transacción**

Seleccionar `is_restricted` en ambos caminos de resolución y revertir con el mensaje exacto antes de calcular o insertar el préstamo.

- [ ] **Step 8: Ejecutar y confirmar GREEN**

Run: `npm test -- restrictedLoanCreation.test.js`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/services/clientRestrictionQueries.js backend/src/services/clientRestrictionQueries.test.js backend/src/controllers/loanController.js backend/src/controllers/restrictedLoanCreation.test.js
git commit -m "feat: block loans for restricted clients"
```

### Task 4: Exclusión en alertas, ruta y Dashboard

**Files:**
- Modify: `backend/src/controllers/loanController.js`
- Test: `backend/src/controllers/restrictedOperationalQueries.test.js`

**Interfaces:**
- Consumes: `clients.is_restricted` mediante joins existentes.
- Produces: alertas, ruta diaria, préstamos recientes y conteos operativos sin restringidos; reportes financieros sin filtro nuevo.

- [ ] **Step 1: Escribir tests fallidos sobre las consultas operativas**

Ejecutar controladores con un adaptador de consulta que inspeccione y responda a SQL real. Afirmar exclusión en `getAlerts`, `getTodayCollections` y `buildDashboardSummary`, y ausencia de exclusión en `getFinancialReport`.

- [ ] **Step 2: Ejecutar y confirmar RED**

Run: `npm test -- restrictedOperationalQueries.test.js`

Expected: FAIL porque las consultas no filtran `is_restricted`.

- [ ] **Step 3: Añadir predicados mínimos en SQL**

Usar `COALESCE(c.is_restricted, FALSE) = FALSE` en flujos operativos. Mantener intactas las consultas financieras y pagos históricos.

- [ ] **Step 4: Ejecutar y confirmar GREEN**

Run: `npm test -- restrictedOperationalQueries.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/loanController.js backend/src/controllers/restrictedOperationalQueries.test.js
git commit -m "feat: exclude restricted clients from collections"
```

### Task 5: Utilidades frontend y flujo ADMIN en Clientes

**Files:**
- Create: `frontend/src/utils/clientRestriction.js`
- Create: `frontend/src/utils/clientRestriction.test.js`
- Create: `frontend/src/components/ClientRestrictionModal.jsx`
- Modify: `frontend/src/pages/VistaClientes.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `isClientRestricted(client)`, `filterClientsByRestriction(clients, scope)`, usuario actual y `PUT /clients/:id/restriction`.
- Produces: filtro `ALL|ACTIVE|RESTRICTED`, badge, modal ADMIN, detalles de motivo/fecha y recarga posterior.

- [ ] **Step 1: Escribir tests fallidos de utilidades**

Probar booleanos reales y heredados, los tres filtros y preservación del orden. La mutación que deben detectar es tratar valores ausentes como restringidos o mezclar filtro de deuda.

- [ ] **Step 2: Ejecutar y confirmar RED**

Run: `npm test -- clientRestriction.test.js`

Expected: FAIL porque el módulo no existe.

- [ ] **Step 3: Implementar utilidades mínimas**

Mantenerlas puras y sin React para que las pruebas ejecuten código real.

- [ ] **Step 4: Ejecutar y confirmar GREEN**

Run: `npm test -- clientRestriction.test.js`

Expected: PASS.

- [ ] **Step 5: Implementar modal y acciones de Clientes**

Agregar confirmación explícita, motivo opcional, mensajes del backend, filtro independiente, badge, metadatos y ocultar/deshabilitar préstamos nuevos para restringidos. Renderizar acciones únicamente si `user.role === 'ADMIN'`.

- [ ] **Step 6: Integrar mutación en `App.jsx`**

Crear `handleSetClientRestriction(id, payload)`, llamar al endpoint, recargar y pasarlo a `VistaClientes`. Cargar préstamos globales con `/loans?restriction=all` para conservar historiales.

- [ ] **Step 7: Ejecutar test y build frontend**

Run: `npm test -- clientRestriction.test.js && npm run build`

Expected: tests PASS y build Vite exit 0.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/utils/clientRestriction.js frontend/src/utils/clientRestriction.test.js frontend/src/components/ClientRestrictionModal.jsx frontend/src/pages/VistaClientes.jsx frontend/src/App.jsx
git commit -m "feat: manage restrictions from clients"
```

### Task 6: Filtros de Préstamos y bloqueo preventivo frontend

**Files:**
- Modify: `frontend/src/pages/VistaPrestamos.jsx`
- Modify: `frontend/src/pages/VistaNuevoCliente.jsx`
- Modify: `frontend/src/components/QuickCreateLoanModal.jsx`
- Modify: `frontend/src/utils/clientRestriction.js`
- Modify: `frontend/src/utils/clientRestriction.test.js`

**Interfaces:**
- Consumes: historial global con marcadores de restricción; `availableLoanClients(clients)`.
- Produces: filtro `ACTIVE|RESTRICTED|ALL`, badge en préstamos restringidos, selectores sin restringidos y bloqueo de estado precargado obsoleto.

- [ ] **Step 1: Escribir tests fallidos de elegibilidad y filtros de préstamos**

Comprobar que un restringido nunca aparece como elegible y que cada scope devuelve exactamente los préstamos esperados sin cambiar sus datos.

- [ ] **Step 2: Ejecutar y confirmar RED**

Run: `npm test -- clientRestriction.test.js`

Expected: FAIL porque faltan las funciones nuevas.

- [ ] **Step 3: Implementar utilidades y UI mínima**

Añadir el filtro independiente a `VistaPrestamos`, retirar restringidos de ambos selectores y mostrar el mensaje aprobado si llega uno precargado o la API responde 409.

- [ ] **Step 4: Ejecutar pruebas y build frontend**

Run: `npm test -- clientRestriction.test.js && npm run build`

Expected: tests PASS y build Vite exit 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/VistaPrestamos.jsx frontend/src/pages/VistaNuevoCliente.jsx frontend/src/components/QuickCreateLoanModal.jsx frontend/src/utils/clientRestriction.js frontend/src/utils/clientRestriction.test.js
git commit -m "feat: filter restricted client loans"
```

### Task 7: Verificación integral y guía de despliegue

**Files:**
- Create: `docs/restrict-clients-deployment.md`
- Modify only if a failing test exposes a restriction-related defect: files from Tasks 1–6.

**Interfaces:**
- Consumes: feature completa y migración.
- Produces: evidencia reproducible y pasos manuales exactos.

- [ ] **Step 1: Ejecutar toda la suite backend**

Run: `npm test`

Working directory: `backend/`

Expected: 0 failures.

- [ ] **Step 2: Ejecutar verificaciones backend existentes compatibles**

Ejecutar scripts locales que no requieran ni modifiquen producción; documentar por nombre cualquier script que dependa de `DATABASE_URL` o servidor vivo y no pueda ejecutarse de forma segura.

- [ ] **Step 3: Ejecutar toda la suite frontend**

Run: `npm test`

Working directory: `frontend/`

Expected: 0 failures.

- [ ] **Step 4: Compilar frontend operativo**

Run: `npm run build`

Working directory: `frontend/`

Expected: Vite exit 0.

- [ ] **Step 5: Validar migración sin tocar producción**

Ejecutar el validador local disponible o, si no hay PostgreSQL local configurado, revisar la migración dentro de una transacción y documentar el comando exacto de Supabase SQL Editor/CLI para el usuario.

- [ ] **Step 6: Ejecutar lint focalizado o parser sobre archivos modificados**

Usar las herramientas ya instaladas; no ampliar el alcance para corregir advertencias ajenas.

- [ ] **Step 7: Auditar los requisitos**

Comparar diff y resultados contra los 14 escenarios solicitados, comprobar que `loans` y `payments` no reciben mutaciones de restricción y que `src/` raíz no cambió.

- [ ] **Step 8: Escribir guía de migración y prueba manual**

Incluir archivo SQL exacto, orden de despliegue, reinicio backend y pasos ADMIN/COBRADOR/HTTP directo/Clientes/Préstamos/Alertas/Ruta/Dashboard/nuevo préstamo/rehabilitación/historial.

- [ ] **Step 9: Commit**

```bash
git add docs/restrict-clients-deployment.md
git commit -m "docs: add client restriction rollout guide"
```

- [ ] **Step 10: Verificación final fresca**

Run: `git status --short --branch && git diff main...HEAD --check`

Expected: rama `feature/restrict-clients`, árbol limpio y sin errores de whitespace. Documentar aparte el fallo preexistente de Next.js raíz; no ejecutar ningún merge.
