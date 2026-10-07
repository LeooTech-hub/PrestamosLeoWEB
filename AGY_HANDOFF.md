# AGY_HANDOFF - Estado de Continuidad: Módulo de Finanzas

**Fecha**: 2026-10-06  
**Proyecto**: PrestamosLeoWEB (Backend Express + PostgreSQL / Frontend Next.js)

---

## 1. Qué ya se implementó
- **Regla de Negocio "Comisión Realizada" implementada y verificada**:
  - Función pura determinística exportada: `calculateRealizedFinancialMetrics` en `backend/src/controllers/loanController.js`.
  - Ordenamiento cronológico de pagos por préstamo (`COALESCE(payment_date, date) ASC, created_at ASC, id ASC`).
  - Detección auditable del **pago cancelatorio** (aquel pago exacto que completó el `total_to_pay` / redujo `remaining_amount` a 0).
  - Imputación de `interest_amount` únicamente en el período donde ocurrió dicho pago cancelatorio.
  - La ganancia bruta NO incluye capital y no prorratea intereses de préstamos activos/incompletos.
  - Prevención de doble contabilización: préstamos liquidados en fechas anteriores o posteriores no aportan comisión al período consultado.
- **Moras y Efectivo en Caja**:
  - `realCollected` (`cashCollected`) suma el dinero físico cobrado según pagos reales del período (`amount + late_fee`).
  - Se verificó que `payments.amount` amortiza el préstamo y no duplica `late_fee`.
  - `totalMoras` consolida moras recaudadas en el período.
  - `grossProfit = commissionRealized + totalMoras`.
  - `netProfit = grossProfit - totalExpenses`.
  - `principalCollected` (Capital recuperado) se mantiene separado y exacto.
- **Fecha local civil de Perú (`America/Lima`) en Gastos**:
  - `addExpense` adopta por defecto `peruTodayStr` si no se envía fecha explícita, evitando desfasajes a semanas previas.
- **Tipado TypeScript y Frontend**:
  - `FinancialReportData` en `src/types/index.ts` enriquecido con `commissionRealized?: number;` y `cashCollected?: number;`.
  - Build Next.js (`npm run build`) validado y 100% exitoso.
- **Suite de Pruebas**:
  - 26 tests en `backend/` pasando al 100% (incluyendo los 6 casos obligatorios y pruebas de integración con base de datos real).

---

## 2. Archivos Modificados
1. `backend/src/controllers/loanController.js`: Lógica determinística de `calculateRealizedFinancialMetrics`, controlador `getFinancialReport` y fijación de fecha civil de Lima en `addExpense`.
2. `backend/src/controllers/financialReport.test.js`: Suite completa de 9 tests para los 6 casos obligatorios, identificación del pago cancelatorio, no-duplicación y consistencia matemática.
3. `src/types/index.ts`: Contrato de reporte financiero con `commissionRealized` y `cashCollected`.

---

## 3. Pruebas Pasadas y Validadas
- **Tests unitarios e integración**:
  - `node --test src/controllers/financialReport.test.js` -> 9/9 tests pasados (100%).
  - `npm test` en backend -> 26/26 tests pasados (100%).
- **Frontend**:
  - `npm run build` -> Compilación Next.js 16.2.12 Turbopack exitosa (0 errores).

---

## 4. Resultados Reales en Base de Datos

### Semanal (WEEKLY - 05/10/2026 al 11/10/2026):
- **Caja Cobrada (`realCollected`)**: S/. 603.60
- **Comisión Realizada (`commissionRealized`)**: S/. 119.00 (Johann S/. 24 + Fidel 1 S/. 20 + Fidel 2 S/. 15 + Giovanny S/. 60)
- **Moras Recaudadas (`totalMoras`)**: S/. 21.00 (Fidel S/. 12 + S/. 9)
- **Ganancia Bruta (`grossProfit`)**: S/. 140.00 (119 + 21)
- **Capital Recuperado (`principalCollected`)**: S/. 463.60 (603.60 - 140.00)
- **Gastos Operativos (`totalExpenses`)**: S/. 0.00
- **Ganancia Neta (`netProfit`)**: S/. 140.00

### Quincenal (BIWEEKLY - 01/10/2026 al 15/10/2026):
- **Caja Cobrada (`realCollected`)**: S/. 1,458.00
- **Comisión Realizada (`commissionRealized`)**: S/. 304.00
- **Moras Recaudadas (`totalMoras`)**: S/. 24.00
- **Ganancia Bruta (`grossProfit`)**: S/. 328.00
- **Gastos Operativos (`totalExpenses`)**: S/. 42.00
- **Ganancia Neta (`netProfit`)**: S/. 286.00

### Mensual (MONTHLY - 01/10/2026 al 31/10/2026):
- **Caja Cobrada (`realCollected`)**: S/. 1,458.00
- **Comisión Realizada (`commissionRealized`)**: S/. 304.00
- **Moras Recaudadas (`totalMoras`)**: S/. 24.00
- **Ganancia Bruta (`grossProfit`)**: S/. 328.00
- **Gastos Operativos (`totalExpenses`)**: S/. 42.00
- **Ganancia Neta (`netProfit`)**: S/. 286.00

---

## 5. Préstamo de Giovanny Paolo Ruiz (S/. 360)
- **loan_id**: `e2ed9e1e-e0b2-4439-a871-ea936b141842`
- **capital**: S/. 300.00
- **interest_amount**: S/. 60.00
- **total_to_pay**: S/. 360.00
- **payment cancelatorio**: ID `335565d6-b2d7-4081-b980-225fdb57e8be` (Monto S/. 360.00, tipo `FULL_PAYOFF`)
- **fecha del pago**: `2026-10-06`
- **comisión reconocida**: S/. 60.00 exactos (su aporte a `grossProfit` es exactamente S/. 60.00, 0 mora)
- **No duplicación**: Reportes de días posteriores (ej. `2026-10-07`) o semanas futuras reconocen S/. 0.00 de comisión para este préstamo.

---

## 6. Módulo de "Número de Operación" (Completado y Validado)
- **Migración Idempotente y Robusta**: [`backend/src/scripts/migrateOperationNumber.js`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/backend/src/scripts/migrateOperationNumber.js)
  - Secuencia de PostgreSQL: `loan_operation_number_seq`
  - Formato: `OP-XXXXXX` (ej. `OP-000001` a `OP-000109`)
  - Backfill seguro ordenado por `COALESCE(created_at, start_date::timestamp), id ASC`.
  - Configurado DEFAULT `('OP-' || LPAD(nextval('loan_operation_number_seq')::text, 6, '0'))`, NOT NULL e índice UNIQUE `idx_loans_operation_number_unique`.
  - Verificación controlada de inserción con `OP-000110`, integridad de FK `payments.loan_id` hacia el UUID técnico, y posterior limpieza sin basura residual en producción.
  - Estadísticas actuales en base de datos: 109 préstamos, 109 con `operation_number`, 0 nulos, 0 duplicados, próximo esperado `OP-000110`.
- **Mappers y Endpoints Backend**:
  - `mapRowToLoan`: mapea `operationNumber` y `operation_number`.
  - `mapRowToClient`: mapea `operationNumber` y `operation_number` en el cliente y en `activeLoan`.
  - `mapRowToPayment`: mapea `operationNumber` y `operation_number`.
  - `getClients`: selecciona `l.operation_number AS loan_operation_number` y `operation_number`.
  - `getLoans`: búsqueda incluye `OR l.operation_number ILIKE $3`.
  - `getPayments` & `getPaymentHistory`: LEFT JOIN con `loans` para incluir `l.operation_number`.
  - `getFinancialReport`: incluye `cancelledLoans` con desglose de ganancia por número de operación.
- **Frontend Next.js**:
  - [`src/types/index.ts`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/types/index.ts): contratos de `Client`, `Loan`, `Payment` y `FinancialReportData` enriquecidos.
  - [`LoansListView`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/components/Loans/LoansListView.tsx): búsqueda por `OP-XXXXXX` y badge visual en tarjetas de préstamos.
  - [`DailyRouteView`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/components/DailyRoute/DailyRouteView.tsx): búsqueda por `OP-XXXXXX` y badge visual en tarjeta de ruta.
  - [`ClientsView`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/components/Clients/ClientsView.tsx): buscador soporta `OP-XXXXXX` en clientes y préstamos activos.
  - [`ClientDetailModal`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/components/Clients/ClientDetailModal.tsx): badge `OP-XXXXXX` en préstamos y en historial de pagos.
  - [`PaymentReceiptModal`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/components/Modals/PaymentReceiptModal.tsx) & [`loanService.ts`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/services/loanService.ts): inclusión de número de operación en constancia visual y mensaje de WhatsApp.
  - [`FinancialReportView`](file:///E:/Users/Leonardo/Documents/PrestamosLeoWEB/src/components/Reports/FinancialReportView.tsx): sección de Operaciones Canceladas en UI y en exportaciones Excel y PDF.
- **Pruebas y Verificación**:
  - `npm test` en backend: 28/28 tests pasando (100%).
  - `npm run build` en frontend: Compilación 100% exitosa (0 errores de TypeScript/Linting).

