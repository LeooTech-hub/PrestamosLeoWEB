# AUDITORÍA PRESTAMOSLEO WEB

Fecha: 2026-08-12 (America/Lima)  
Alcance: frontend Next.js, frontend Vite heredado, Express, PostgreSQL/Supabase, seguridad, integridad, reglas financieras y pruebas críticas.

## 1. Resumen ejecutivo

La aplicación ya soporta varios préstamos simultáneos por cliente y pagos flexibles independientes por `loan_id`. Se corrigieron riesgos críticos en pagos, creación de préstamos, autenticación, CORS, inicialización y UI. Las pruebas aisladas reales contra Supabase aprobaron pagos parciales, concurrencia, reversión, finalización y alertas por préstamo.

No recomiendo todavía operar con dinero real sin atender los riesgos abiertos de autorización por cartera, eliminación/papelera, constraints/FK, datos inconsistentes existentes, idempotencia y trazabilidad. Las compilaciones Next y Vite pasan; ESLint conserva 7 errores React preexistentes.

## 2. Arquitectura detectada

- Frontend principal: Next.js 16.2.12 / React 19, entrada `src/app/page.tsx`, componentes en `src/components`, API en `src/services/loanService.ts`.
- Frontend heredado: Vite/React en `frontend/src`, API central en `frontend/src/api.js`.
- Backend: Express 4, entrada `backend/src/server.js`, rutas `backend/src/routes/apiRoutes.js`, controlador monolítico `backend/src/controllers/loanController.js`.
- Persistencia: `pg` contra Supabase/PostgreSQL. El frontend no usa Supabase Service Role directamente; el modelo actual es frontend → API Express → PostgreSQL.
- Autenticación: JWT Bearer; token almacenado en `localStorage`.
- Tablas observadas: `clients`, `loans`, `payments`, `users`, `activity_logs`, `expenses`.
- No existe `requests.js`; sus equivalentes son los servicios API indicados.
- Hay dos frontends activos, una doble fuente de mantenimiento y comportamiento.

## 3. Hallazgos críticos

### SEC-001

ID: SEC-001  
Severidad: CRÍTICO  
Área: Seguridad/CORS  
Archivo: `backend/src/server.js`  
Función: configuración CORS  
Descripción: en producción se aceptaba también cualquier origen no autorizado.  
Cómo reproducir: enviar `Origin` externo no incluido en `FRONTEND_URL`.  
Causa raíz: ambas ramas llamaban `callback(null, true)`.  
Impacto: una web maliciosa podía invocar la API usando credenciales/tokens disponibles al navegador.  
Solución: rechazar orígenes no permitidos en producción y limitar JSON a 100 KB.  
Estado: CORREGIDO.

### SEC-002

ID: SEC-002  
Severidad: CRÍTICO  
Área: Autenticación  
Archivos: `authController.js`, `authMiddleware.js`  
Descripción: existía un secreto JWT fijo como fallback.  
Causa raíz: `process.env.JWT_SECRET || '...'`.  
Impacto: falsificación de tokens si la variable faltaba.  
Solución: ahora la ausencia de `JWT_SECRET` falla de forma controlada con 500.  
Estado: CORREGIDO.

### SEC-003

ID: SEC-003  
Severidad: CRÍTICO  
Área: Inicialización/credenciales  
Archivo: `backend/src/config/initDb.js`  
Descripción: una BD sin usuarios creaba `admin@prestamosleo.com/admin123` y lo imprimía.  
Impacto: toma de control trivial.  
Solución: solo crea administrador cuando existe `INITIAL_ADMIN_PASSWORD` y nunca registra la contraseña.  
Estado: CORREGIDO. Los scripts manuales `createAdmin.js` y `seedAdmin.js` aún contienen claves conocidas; no ejecutarlos y retirarlos antes de producción.

### DATA-001

ID: DATA-001  
Severidad: CRÍTICO  
Área: Integridad referencial  
Archivo: `backend/src/config/initDb.js` / esquema Supabase  
Descripción: cada arranque eliminaba `payments_loan_id_fkey`; actualmente no existe FK payment→loan.  
Impacto: pueden crearse pagos huérfanos y perderse la trazabilidad financiera.  
Solución: se eliminó el `DROP CONSTRAINT`; se preparó SQL recomendado para reponerla `NOT VALID`.  
Estado: CÓDIGO CORREGIDO / MIGRACIÓN PENDIENTE DE APROBACIÓN.

### DATA-002

ID: DATA-002  
Severidad: CRÍTICO  
Área: Endpoint destructivo  
Archivo: `loanController.js`, `apiRoutes.js`  
Función: `seedDatabase`  
Descripción: un usuario autenticado podía borrar payments, expenses, loans y clients.  
Impacto: pérdida total de cartera.  
Solución: exige administrador en ruta y `ALLOW_DESTRUCTIVE_SEED=true`; queda siempre bloqueado en producción.  
Estado: CORREGIDO.

### PAY-001

ID: PAY-001  
Severidad: CRÍTICO  
Área: Pagos  
Archivo: `loanController.js`  
Funciones: `registerPayment`, `updatePayment`, `revertLastPayment`  
Descripción: la edición de un pago podía superar la deuda; el saldo se limitaba a cero, pero `SUM(payments.amount)` quedaba mayor al total.  
Impacto: corrupción de saldos y reportes.  
Solución: lock del préstamo, suma de los otros pagos y rechazo del monto sobre el máximo; cobro/reversión siempre por `loan_id`.  
Estado: CORREGIDO Y PROBADO.

## 4. Hallazgos altos

### AUTHZ-001

ID: AUTHZ-001  
Severidad: ALTO  
Área: Autorización  
Archivos: rutas/controladores financieros  
Descripción: `COBRADOR` autenticado puede consultar/modificar cartera global; no se filtra consistentemente por `assigned_to_user_id`.  
Impacto: acceso y cobro de cartera ajena.  
Solución: middleware/predicados de ownership por rol y préstamo.  
Estado: REQUIERE DECISIÓN DEL NEGOCIO sobre alcance exacto de cobradores.

### AUTHZ-002

ID: AUTHZ-002  
Severidad: ALTO  
Área: Administración  
Archivo: `authMiddleware.js`  
Descripción: `requireAdmin` mezclaba sintaxis mysql2 (`[rows]`, `?`) y confiaba inicialmente en rol stale del JWT.  
Solución: consulta PostgreSQL parametrizada y verificación actual contra DB.  
Estado: CORREGIDO.

### LOAN-001

ID: LOAN-001  
Severidad: ALTO  
Área: Múltiples préstamos  
Archivo: `loanController.js`  
Función: `createClientAndLoan`  
Descripción: devolvía 409 si había ACTIVE/OVERDUE.  
Impacto: impedía la regla principal.  
Solución: eliminada la consulta/validación de préstamo activo; cada POST inserta nuevo ID usando el mismo cliente existente.  
Estado: CORREGIDO Y PROBADO.

### LOAN-002

ID: LOAN-002  
Severidad: ALTO  
Área: Validación financiera  
Archivo: `loanController.js`  
Funciones: creación/edición  
Descripción: negativos, NaN, cero o días decimales podían normalizarse silenciosamente; se podía reducir el total por debajo de lo cobrado.  
Solución: respuestas 422/409, validación de fechas y preservación matemática de pagos.  
Estado: CORREGIDO.

### DELETE-001

ID: DELETE-001  
Severidad: ALTO  
Área: Eliminación/papelera  
Archivo: `loanController.js` y modales de eliminación  
Descripción: el frontend envía modo `ARCHIVE`, pero backend elimina físicamente cliente/préstamos/pagos; restaurar no conserva estados anteriores.  
Impacto: pérdida irreversible y estados falsos al restaurar.  
Solución: soft-delete transaccional con estado previo o tabla de archivo; borrado permanente solo admin con confirmación reforzada.  
Estado: REQUIERE DECISIÓN DEL NEGOCIO; no se cambió a ciegas.

### IDEMP-001

ID: IDEMP-001  
Severidad: ALTO  
Área: Doble clic/red  
Descripción: no existe clave de idempotencia en creación/pago. El loading del modal reduce doble clic, pero reintentos de red pueden duplicar pagos.  
Solución: `Idempotency-Key` única y constraint por operación.  
Estado: PENDIENTE.

## 5. Hallazgos medios

- DATA-003: 42/46 loans discrepan entre `payment_days/days_agreed/days`; 45/46 entre variantes de cuota. Compatibilidad heredada, riesgo de doble fuente de verdad. PENDIENTE de migración canónica.
- DATA-004: `loans.client_id`, `payments.loan_id` y `payments.client_id` permiten NULL. PENDIENTE tras saneamiento.
- STATE-001: el estado OVERDUE se persiste al editar/pagar, no mediante proceso diario; lecturas de alertas sí calculan por fecha. PENDIENTE.
- REPORT-001: reporte financiero acepta `period` pero no filtra por período y omite varias métricas. PENDIENTE.
- LOG-001: `activity_logs` no registra consistentemente creación, edición, pago, reversión y eliminación. PENDIENTE.
- PERF-001: faltan índices operativos en client/status/due_date/loan_id/payment_date/assigned. SQL preparado, NO ejecutado.
- FE-001: dos frontends duplican lógica y pueden divergir. PENDIENTE.
- FE-002: token JWT en `localStorage`, expuesto ante XSS. Evaluar cookie `HttpOnly`, `Secure`, `SameSite` y CSRF.
- FE-003: bundle Vite 541.44 KB minificado; requiere code splitting.
- ERROR-001: varios endpoints de colectores/portfolio todavía convierten fallos en listas vacías 200. PENDIENTE; reportes/gastos/papelera ya corregidos.
- TIME-001: `CURRENT_DATE` depende de timezone de la sesión PostgreSQL; definir explícitamente America/Lima en conexión o BD para “cobrado hoy”.
- RESET-001: email de recuperación registra el enlace/token en consola si no hay transporte. Riesgo en logs.

## 6. Hallazgos bajos/UX/accesibilidad

- ESLint: 7 errores `react-hooks/set-state-in-effect`, 6 warnings; pueden causar renders extra.
- Vite tenía key con `Math.random()` durante render; CORREGIDO con key determinista.
- Hay `console.log` con objetos de clientes en componentes; retirar en producción.
- Algunos modales y formularios requieren una revisión manual completa de teclado/focus/labels/responsive.
- `package.json` raíz conserva dependencias MySQL/libSQL/Drizzle no usadas, que confunden la arquitectura migrada.
- `.env.example` raíz sigue describiendo SQLite/libSQL, no PostgreSQL.

## 7. Frontend: cambios verificados

- `PaymentModal` recibe préstamo seleccionado, no asume `activeLoan`; si falta préstamo, bloquea el cobro con error controlado.
- Envía `loanId`/`loan_id` exacto y admite decimales/montos parciales.
- Los botones se deshabilitan mientras se envía y se evita sobrepago también en UI.
- La ficha deduplica por ID, lista cada préstamo, muestra contador coherente y resumen agregado ACTIVE+OVERDUE.
- Tarjeta: `totalActiveCapital` y `totalRemainingAmount` reemplazan el único `activeLoan.amount`.
- Próximo vencimiento: mínimo real entre préstamos vigentes con saldo.

Causa del antiguo “Monto S/ 200”: la tarjeta tomaba el préstamo de referencia producido por `DISTINCT ON`, no el agregado.  
Causa del antiguo “Préstamos (3)”: el frontend combinaba el préstamo activo de referencia con la colección completa y podía contar el mismo ID dos veces. Ahora se deduplica y la pestaña total cuenta todos; “Préstamos Vigentes” filtra ACTIVE/OVERDUE.

## 8. Backend/API: cambios verificados

- `GET /api/loans?clientId=` devuelve la colección completa, sin `LIMIT 1`.
- `getClients` conserva un loan de referencia para compatibilidad visual, pero agrega por cliente: total de préstamos, activos, capital activo, saldo activo y próximo vencimiento.
- `registerPayment`: `SELECT ... FOR UPDATE` por ID, suma real de payments, rechazo de sobrepago, INSERT con `loan_id/client_id`, sincronización del mismo loan.
- `updatePayment`: lock del payment y loan, máximo calculado descontando otros pagos.
- `revertLastPayment`: lock del loan, último pago `WHERE loan_id`, borrado de ese pago y resincronización del loan.
- `paid_amount = SUM(payments.amount)`; `remaining_amount = max(0, total_to_pay - paid_amount)`.
- `paid_days_count` queda informativo (`floor(paid/daily)`), sin redondear dinero.
- `PAID` solo se aplica al préstamo cuyo saldo llega a cero.
- Alertas usan loan ID, due date y saldo de cada préstamo; DUE_TOMORROW/DUE_TODAY/OVERDUE no son valores fijos.

## 9. Supabase/PostgreSQL e integridad real

Conteo auditado: 46 préstamos. Tipos monetarios relevantes: `NUMERIC`; fechas civiles: PostgreSQL `DATE` con parser que conserva `YYYY-MM-DD`.

Hallazgos no modificados:

1. Loan `loan_53614aa2-22ff-4aac-b493-698ef6695e5e`, client `cli_0b463e36-f657-46f4-93da-82068daf811b`: ACTIVE, `total_amount=180`, `total_to_pay=0`, `paid=0`, `remaining=0`; matemáticamente debería quedar 180 y además hay discrepancia de asignación.
2. Pagos posiblemente duplicados `1f5e722b-ea9c-40e6-84b2-8023ef1df650` y `97f36b66-b008-4f0b-8f73-7a79beba43e0`: mismo loan `57f0f60e-badb-4b21-8d4d-84356cce124a`, client `0731a7dd-20ca-4e3c-b4b6-801fd723ab7c`, S/ 8, fecha 2026-08-07 y mismo `created_at`.

No se detectaron pagos huérfanos, client mismatch payment/loan, loans huérfanos, saldos negativos ni duplicados de nombre/teléfono en la foto auditada. No se borró ni reparó ningún dato real.

## 10. Migración TiDB/MySQL

- No se encontró sintaxis MySQL activa (`DATE_ADD`, `CURDATE`, `IFNULL`, `ON DUPLICATE KEY`, `AUTO_INCREMENT`) en runtime; `CURDATE` solo aparece en `backend/refactor.mjs` auxiliar.
- El antiguo `requireAdmin` sí conservaba placeholder `?` y contrato mysql2; corregido.
- Persisten nombres/descripciones/dependencias TiDB/MySQL obsoletas y columnas espejo. Retirarlas solo después de telemetría/migración.
- Comparaciones text/UUID se realizan con parámetros y `::text`; funcionales, aunque pueden limitar el uso de índices si los tipos futuros cambian.

## 11. Seguridad

Corregido: JWT fallback, CORS, admin por defecto, rol admin en DB, seed destructivo.  
Pendiente prioritario: ownership de cobradores, rate limiting en login/reset, cookies HttpOnly, retirar scripts con passwords conocidas, logs de reset, CSP/headers (Helmet), auditoría de inputs de actualización masiva y rotación de secretos existentes. No se encontró Service Role expuesta en frontend.

RLS: el modelo observado accede desde backend con `DATABASE_URL`; RLS no sustituye autorización de aplicación. Si se habilita acceso directo Supabase en el futuro, se requieren policies antes de exponerlo.

## 12. Rendimiento

No hay índices secundarios observados para las rutas financieras principales. El SQL recomendado incluye los índices solicitados. El tamaño actual (46 préstamos) tolera scans, pero no escala. `getClients` usa un agregado único, evitando N+1, aunque `DISTINCT ON` + agregado necesita índices. Vite advierte chunk >500 KB. Hay polling/refresh en vistas; revisar deduplicación y cleanup al consolidar frontends.

## 13. Archivos modificados

- `backend/src/controllers/loanController.js`
- `backend/src/config/initDb.js`
- `backend/src/controllers/authController.js`
- `backend/src/middleware/authMiddleware.js`
- `backend/src/routes/apiRoutes.js`
- `backend/src/server.js`
- `frontend/src/components/PaymentModal.jsx`
- `frontend/src/pages/VistaClientes.jsx`
- `frontend/src/pages/VistaDashboard.jsx`
- `src/components/Clients/ClientDetailModal.tsx`
- `src/components/Clients/ClientsView.tsx`
- `src/components/DailyRoute/PaymentModal.tsx`
- `src/types/index.ts`
- Nuevo: `backend/src/scripts/verifyAuditCriticalFlow.js`
- Nuevo: `backend/migrations/20260812_audit_recommended_constraints_indexes.sql`

## 14. SQL recomendado

Ver `backend/migrations/20260812_audit_recommended_constraints_indexes.sql`. No fue ejecutado. Agrega índices, FK payment→loan y checks positivos/no negativos como `NOT VALID`. Antes de validar, revisar y corregir explícitamente los dos hallazgos reales.

## 15. Cambios que requieren aprobación/decisión

1. Política exacta de visibilidad y mutación para COBRADOR.
2. Semántica de archivar/restaurar, retención y borrado permanente.
3. Regla para editar capital/interés después de pagos (actualmente se permite solo si nuevo total ≥ pagado).
4. Si “pago pendiente hoy” es por loan o por cliente; no se mezcló con alertas.
5. Reparación de los dos registros anómalos y deduplicación del pago S/ 8.
6. Ventana para aplicar/validar constraints e índices.
7. Fuente canónica de columnas heredadas y retiro de uno de los dos frontends.

## 16. Tests ejecutados y resultados

Aprobados:

- `node backend/src/scripts/verifyAuditCriticalFlow.js` contra Supabase de desarrollo, con cleanup exclusivo `AUDIT_TEST`.
- Dos préstamos mismo cliente: 201 ambos, 2 IDs distintos, GET devuelve 2.
- Pagos A: S/ 5 + S/ 30 + S/ 7.50 = S/ 42.50; saldo S/ 1,157.50 sobre total S/ 1,200.
- B permaneció 0/S/ 360 mientras se pagó A.
- Pago B S/ 18 → pagado 18, saldo 342; A no cambió.
- Reversión del último A → A pagado 35/saldo 1,165; B siguió 18/342.
- Sobrepago rechazado; pago exacto final marcó solo B PAID.
- Concurrencia real S/ 30 + S/ 50: pagado 80, saldo 40, sin lost update.
- Capital negativo y fecha inválida: rechazados.
- Alerta: B vence mañana → DUE_TOMORROW; A vence en 8 días → sin alerta; B PAID → deja de alertar.
- `npm run build` Next: aprobado.
- `npm run build` Vite: aprobado con warning de chunk.
- `node --check` en backend modificado y script: aprobado.
- Arranque backend puerto 5001 durante 12 s: aprobado, `initDb` completó.
- Auditoría Supabase read-only: ejecutada.

Fallidos/no completados:

- `npm run lint`: 7 errores React `set-state-in-effect` y 6 warnings; el error de pureza por `Math.random` fue corregido.
- DevTools visual/Network/consola no pudo completarse de forma fiable porque el navegador integrado falló en el entorno Windows. No se afirma “cero errores de consola” sin evidencia. Las compilaciones y pruebas API sí pasan.
- Responsive/accesibilidad requieren QA visual manual adicional.

## 17. Riesgos residuales: los 10 prioritarios antes de dinero real

1. Implementar autorización por cartera/rol en cada endpoint financiero.
2. Sustituir hard delete por política segura de archivo/restauración y backups probados.
3. Aplicar y validar FK/checks/NOT NULL después de sanear datos.
4. Resolver el loan inconsistente y el pago posiblemente duplicado con revisión humana.
5. Añadir idempotencia de pagos/préstamos para reintentos y doble clic.
6. Registrar auditoría inmutable de altas, pagos, reversiones, ediciones y eliminaciones.
7. Definir job/lectura canónica de OVERDUE y timezone America/Lima.
8. Consolidar columnas financieras duplicadas y un solo frontend/fuente de verdad.
9. Endurecer autenticación: rate limiting, cookie HttpOnly, retirar scripts de claves, headers y rotación.
10. Corregir lint/efectos React y completar QA real de consola, Network, responsive y accesibilidad.

## 18. Conclusión

El núcleo de múltiples préstamos y pagos flexibles por `loan_id` quedó corregido y probado con persistencia real. El proyecto mejoró materialmente, pero conserva riesgos de gobierno de datos, autorización y operación que impiden clasificarlo todavía como listo para producción financiera sin las decisiones y migraciones señaladas.