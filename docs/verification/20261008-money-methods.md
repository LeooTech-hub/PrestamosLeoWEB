# Métodos de entrega y cobro — informe de revisión

Fecha: 08/10/2026. Implementación local, sin commit, merge ni despliegue.

## 1. Campos encontrados previamente

Se inspeccionaron el esquema conectado de Supabase, `initDb.js`, los controladores, los servicios y los tipos TypeScript.

- `loans`: no existía un campo de método de entrega. `payment_frequency` representa la frecuencia contractual, no el desembolso; se conserva sin reutilizarlo.
- `payments`: no existía una columna de método de pago. La interfaz TypeScript `Payment` sí tenía una propiedad opcional `paymentMethod`, pero no tenía persistencia en el backend. Se reutiliza ese nombre en la API.
- Fechas existentes: `loans.start_date`, `payments.payment_date`, `payments.date` y `payments.created_at`. El historial usa la fecha guardada del cobro, nunca el vencimiento ni el día actual del navegador.
- `payments.created_at` es TIMESTAMPTZ en la base conectada y TIMESTAMP en el inicializador local. La consulta soporta ambos formatos y calcula el día de Lima cuando faltan ambas fechas civiles.

## 2–4. Migración y nombres finales

| Concepto | Base de datos | API / TypeScript | Valores nuevos |
| --- | --- | --- | --- |
| Entrega del préstamo | `loans.disbursement_method` | `disbursementMethod` y alias `disbursement_method` | `YAPE`, `CASH` |
| Pago del cliente | `payments.payment_method` | `paymentMethod` y alias `payment_method` | `YAPE`, `CASH` |

Sí fue necesaria una migración: `backend/migrations/20261008_add_money_methods.sql`.

La migración es transaccional, repetible, admite NULL y limita el tiempo de espera de bloqueo a 5 segundos. Agrega restricciones para aceptar únicamente los dos valores o NULL. No contiene DEFAULT ni actualización retroactiva de registros. La ejecución repetida y la conservación de datos históricos se probaron con PostgreSQL local aislado (PGlite).

No se aplicó la migración a la base remota. `initDb.js` queda preparado para ejecutarla en el siguiente arranque del backend con este código. Debe revisarse ese paso antes de reiniciar el backend conectado. La persistencia nueva fue verificada localmente mediante INSERT, GET posterior y edición reales en PostgreSQL, no mediante cambios en producción.

Crear préstamos y registrar cobros requiere elección válida tanto en interfaz como en API (HTTP 422 si falta). Al editar un pago histórico se permite conservar NULL si el usuario no selecciona un método; no se inventa una clasificación.

## 5. Archivos modificados o nuevos

Backend:

- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/config/initDb.js`
- `backend/src/controllers/loanController.js`
- `backend/src/controllers/restrictedLoanCreation.test.js`
- `backend/migrations/20261008_add_money_methods.sql` — nuevo
- `backend/src/controllers/moneyMethods.test.js` — nuevo
- `backend/src/controllers/moneyMethodsPostgres.test.js` — nuevo
- `backend/test-support/isolatedDatabase.js` — nuevo

Frontend React / JSX:

- `frontend/src/App.jsx`
- `frontend/src/components/EditPaymentModal.jsx`
- `frontend/src/components/LoanConstanciaModal.jsx`
- `frontend/src/components/PaymentModal.jsx`
- `frontend/src/components/QuickCreateLoanModal.jsx`
- `frontend/src/components/MoneyMethodSelector.jsx` — nuevo
- `frontend/src/pages/VistaCobros.jsx`
- `frontend/src/pages/VistaNuevoCliente.jsx`
- `frontend/src/utils/loanHelpers.js`
- `frontend/src/utils/moneyMethods.test.js` — nuevo

Next.js / TypeScript:

- `src/app/page.tsx`
- `src/components/DailyRoute/DailyRouteView.tsx`
- `src/components/DailyRoute/PaymentModal.tsx`
- `src/components/LoanCalculator/CalculatorView.tsx`
- `src/components/Loans/LoansListView.tsx`
- `src/components/Modals/EditPaymentModal.tsx`
- `src/components/Modals/LoanConstanciaModal.tsx`
- `src/components/Modals/QuickCreateLoanModal.tsx`
- `src/components/MoneyMethodSelector.tsx` — nuevo
- `src/services/loanService.ts`
- `src/types/index.ts`

Pruebas y documentación:

- `package.json`
- `package-lock.json`
- `tests/moneyMethods-ui.test.cjs` — nuevo
- `docs/verification/20261008-money-methods.md` — este informe

El cambio previo del usuario en `frontend/src/pages/VistaClientes.jsx` se preservó y no se editó. Aparece en el diff global, pero no pertenece a esta implementación.

## 6. Descripción: Generar Préstamo

Sobre el botón de confirmación aparece «Método de entrega del préstamo» con dos botones/pills, Yape y Efectivo, manteniendo colores, bordes, tipografía y soporte oscuro del diseño actual. Ninguno comienza seleccionado. La selección muestra un check y el estilo activo. Confirmar sin selección muestra «Selecciona el método de entrega: Yape o Efectivo.» y no envía la creación.

El panel «Resumen de Liquidación» muestra «Método de entrega» y actualiza inmediatamente el valor elegido. Antes de elegir muestra «No registrado». Al reabrir el modal, la selección se limpia.

Se cubren Nuevo Cliente, préstamo rápido y los equivalentes TSX activos. Se corrigió además una importación preexistente incorrecta de `calculateCustomLoan` que impedía renderizar el modal JSX; no se cambió el cálculo financiero.

## 7. Descripción: Constancia

La constancia muestra «Préstamo efectuado en: Yape», «Efectivo» o «No registrado», leyendo exclusivamente el método guardado del préstamo. El mismo dato aparece en el mensaje generado, antes del contacto Yape.

Previsualización, Copiar Texto y Enviar por WhatsApp usan la misma cadena generada. Las pruebas comparan el texto de previsualización, el contenido enviado al portapapeles y el parámetro decodificado del enlace de WhatsApp para ambos métodos y el caso histórico. No se envió un WhatsApp real.

## 8. Descripción: Historial de Cobros

Las columnas principales son Cliente, Día de Inicio, Día de Cancelación, Monto y Método de Pago. El número OP se conserva debajo del cliente y el cobrador queda como información secundaria bajo el método. La vista móvil muestra la misma información en tarjetas.

Inicio proviene de `loans.start_date`; cancelación corresponde a la fecha civil almacenada del cobro. Si ambas fechas civiles faltan, se usa únicamente el timestamp almacenado convertido al día de Lima; si tampoco existe, muestra «No registrado». No se utiliza la fecha contractual de vencimiento ni se fabrica una fecha actual.

Los filtros rápidos Todos / Yape / Efectivo se combinan con rango, cobrador y búsqueda actual (cliente, operación, cobrador o nota). El resumen existente muestra total cobrado, Yape, Efectivo y, cuando corresponde, monto sin método registrado; sus cifras se calculan sobre las mismas filas filtradas. No se creó un dashboard.

Estas son descripciones de la implementación y de las pruebas DOM, no capturas ni una inspección visual en navegador.

## 9. Pruebas

Se verificó primero el fallo de las pruebas nuevas por falta de validación, persistencia, selectores y constancia. También se reprodujeron fallos adicionales antes de corregirlos: reapertura de cobro con recibo anterior, límite de medianoche para timestamps históricos y fechas de calendario imposibles.

| Comando / ubicación | Resultado final |
| --- | --- |
| `npm test` — raíz, componentes JSX/TSX con React y jsdom | 20/20 PASS |
| `npm test` — backend, toda la suite aislada de la base conectada | 46/46 PASS |
| `npm test` — frontend, helpers y regresiones existentes | 28/28 PASS |
| Total | 94/94 PASS, sin fallos ni pruebas omitidas |

Cobertura de los 20 requisitos pedidos:

- 1–4: validación de préstamo, ambos métodos, INSERT y lectura posterior con controladores reales; persistencia PostgreSQL.
- 5–9: constancia JSX/TSX, ambos métodos, portapapeles, WhatsApp y préstamo histórico.
- 10–12: cobro obligatorio, ambos métodos y persistencia sin reutilizar el método de entrega.
- 13–16: inicio del préstamo, fecha real almacenada del cobro, monto y método en historial.
- 17–18: filtros Yape y Efectivo excluyen los demás pagos.
- 19: préstamos/pagos históricos sin método, edición que conserva NULL y fechas ausentes.
- 20: combinación de rango, cobrador, búsqueda, método y totales; aislamiento por cobrador autenticado.

Regresiones adicionales: restricciones de clientes, cronogramas, cálculos financieros existentes, independencia de métodos opuestos en un mismo préstamo/pago, migración repetida, valores inválidos rechazados por CHECK y fechas históricas cerca de medianoche en ambos esquemas de timestamp.

La guía TDD orientó la secuencia fallo/corrección/verificación. La revisión independiente de código detectó el límite histórico de fecha; quedó corregido y cubierto con SQL real. No quedaron hallazgos críticos o importantes pendientes en esa revisión.

Nota de ejecución: antes de introducir el aislamiento, una prueba heredada de gastos usó la base conectada para crear un gasto temporal de S/ 25 y lo eliminó en su limpieza. La consulta posterior confirmó cero filas con su descripción de prueba. Después de detectar ese comportamiento, toda la suite backend pasó a PostgreSQL local aislado; las verificaciones finales no escriben en la base conectada. La migración remota no fue ejecutada.

## 10. Builds

- Raíz: `npm run build`, Next.js 16.2.12: PASS, incluyendo comprobación TypeScript y generación estática.
- Frontend: `npm run build`, Vite 6.4.3: PASS. Advertencia no bloqueante por chunk JS de 604.01 kB, superior al umbral de 500 kB. No se amplió el alcance para cambiar el empaquetado.
- `git diff --check`: PASS. Git avisa de normalización LF/CRLF de Windows; no encontró errores de whitespace.

No se cambiaron intereses, capital, mora, saldos, fechas contractuales ni reglas de estado de préstamos.

## 11. git diff --stat

Salida para archivos ya versionados, antes de agregar al índice:

```text
 backend/package-lock.json                          |   8 +
 backend/package.json                               |   3 +-
 backend/src/config/initDb.js                        |   4 +
 backend/src/controllers/loanController.js           |  85 +++-
 .../src/controllers/restrictedLoanCreation.test.js  |   2 +-
 frontend/src/App.jsx                               |   4 +-
 frontend/src/components/EditPaymentModal.jsx        |   8 +-
 frontend/src/components/LoanConstanciaModal.jsx     |   5 +
 frontend/src/components/PaymentModal.jsx            |  13 +-
 frontend/src/components/QuickCreateLoanModal.jsx    |  14 +-
 frontend/src/pages/VistaClientes.jsx                |  12 +
 frontend/src/pages/VistaCobros.jsx                  |  46 +-
 frontend/src/pages/VistaNuevoCliente.jsx             |  14 +
 frontend/src/utils/loanHelpers.js                   |   9 +-
 package-lock.json                                  | 475 +++++++++++++++++++++
 package.json                                       |   4 +-
 src/app/page.tsx                                   |   5 +-
 src/components/DailyRoute/DailyRouteView.tsx         |   3 +-
 src/components/DailyRoute/PaymentModal.tsx           |  18 +-
 src/components/LoanCalculator/CalculatorView.tsx     |  15 +
 src/components/Loans/LoansListView.tsx               |   4 +-
 src/components/Modals/EditPaymentModal.tsx           |  10 +-
 src/components/Modals/LoanConstanciaModal.tsx         |   5 +
 src/components/Modals/QuickCreateLoanModal.tsx        |  13 +-
 src/services/loanService.ts                         |  16 +-
 src/types/index.ts                                  |  10 +-
 26 files changed, 743 insertions(+), 62 deletions(-)
```

Incluye las 12 inserciones previas del usuario en VistaClientes. Git no incluye en esta salida los 9 archivos nuevos sin seguimiento (8 de implementación/pruebas más este informe); están enumerados arriba. No se hizo `git add` ni commit.
