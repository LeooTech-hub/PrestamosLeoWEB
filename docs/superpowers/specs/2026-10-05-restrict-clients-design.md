# Restringir clientes — Diseño

## Objetivo

Permitir que un administrador marque un cliente como restringido sin eliminarlo ni modificar sus préstamos, pagos, saldos, mora o historial. Mientras la restricción esté activa, el cliente queda fuera de los flujos operativos de cobranza, no genera alertas y no puede recibir préstamos nuevos.

## Alcance técnico

La aplicación operativa está formada por `frontend/` (Vite, React y React Router) y `backend/` (Express y PostgreSQL alojado en Supabase). La aplicación Next.js de la raíz no forma parte de este cambio.

La implementación preservará las convenciones actuales: JWT propio, roles almacenados en `users`, consultas PostgreSQL desde Express y estado compartido cargado en `frontend/src/App.jsx`.

## Datos y migración

La tabla `clients` incorporará:

- `is_restricted BOOLEAN NOT NULL DEFAULT FALSE`;
- `restricted_at TIMESTAMPTZ NULL`;
- `restricted_by VARCHAR(36) NULL`;
- `restriction_reason TEXT NULL`.

`restricted_by` usará el mismo tipo real que `users.id`. Una clave foránea protegerá referencias futuras sin reescribir datos históricos. Se añadirá un índice parcial para las consultas de clientes restringidos.

La migración será idempotente y segura para clientes existentes. `initDb.js` también declarará las columnas para instalaciones nuevas o entornos inicializados automáticamente.

No se modificarán columnas ni filas de `loans` o `payments` al restringir o rehabilitar un cliente.

## Autorización y auditoría

Se agregará `PUT /api/clients/:id/restriction`, protegido con `verifyToken` y `requireAdmin`. El middleware existente vuelve a consultar el rol en `users`, por lo que un JWT antiguo o una petición manual de un cobrador no podrá autorizar la operación.

El endpoint aceptará el estado deseado y, al restringir, un motivo opcional. El backend tomará `restricted_by` exclusivamente de `req.user.id`; ignorará cualquier identidad enviada por el cliente.

Al restringir:

- `is_restricted = TRUE`;
- `restricted_at = CURRENT_TIMESTAMP`;
- `restricted_by = req.user.id`;
- `restriction_reason = motivo normalizado o NULL`.

Al quitar la restricción, los cuatro campos se limpiarán (`is_restricted = FALSE` y los demás en `NULL`). Antes de limpiarlos, el backend registrará en `activity_logs` la rehabilitación y el motivo anterior. La restricción también se registrará, incluyendo el motivo y el administrador.

La aplicación no usa Supabase Auth ni el Data API para estas operaciones: usa JWT propio y una conexión PostgreSQL privada desde Express. Por eso no se añadirá una política RLS basada en `auth.uid()` que no podría representar los roles actuales. La autorización se mantendrá en la frontera Express y la base no se expondrá directamente al navegador.

## Consultas operativas

Se centralizará la semántica de visibilidad en el backend:

- `GET /api/loans` excluirá clientes restringidos por defecto y admitirá `restriction=restricted` y `restriction=all`.
- La carga global del frontend solicitará explícitamente `restriction=all` para conservar el historial completo disponible en Clientes; `VistaPrestamos` aplicará su filtro operativo predeterminado y permitirá consultar restringidos o todos.
- `GET /api/today-collections` excluirá clientes restringidos.
- `GET /api/alerts` excluirá clientes restringidos en SQL, antes de generar las alertas.
- `GET /api/dashboard/summary` calculará préstamos recientes y conteos operativos únicamente con clientes no restringidos. Los pagos ya realizados seguirán siendo información histórica y no se borrarán.
- `GET /api/reports/financial` conservará todos los préstamos, pagos y gastos, incluidos los pertenecientes a clientes restringidos.

La sección Clientes seguirá devolviendo todos los clientes no archivados, incluidos los restringidos, con sus campos de restricción y sus agregados de deuda intactos.

## Bloqueo de préstamos nuevos

`POST /api/loans` y su alias `POST /api/clients-with-loan` comprobarán dentro de la transacción si el cliente resuelto está restringido. La comprobación se hará tanto cuando llega un `clientId` como cuando el flujo detecta un cliente existente por DNI, teléfono o nombre.

Si está restringido, la transacción se revertirá y responderá `409` con el mensaje: `Este cliente está restringido. Un administrador debe quitar la restricción antes de registrar un nuevo préstamo.`

En el frontend, los selectores de `VistaNuevoCliente` y `QuickCreateLoanModal` omitirán los clientes restringidos. Si la navegación intenta precargar uno restringido o el estado queda obsoleto, la pantalla bloqueará el envío y mostrará el mismo mensaje. El backend seguirá siendo la autoridad final.

## Interfaz de Clientes

`VistaClientes` conservará los filtros actuales de cartera y añadirá un filtro independiente de restricción: `Todos | Activos | Restringidos`. Así no se mezclan estados de deuda con la condición administrativa del cliente.

Cada cliente restringido mostrará un badge visible `RESTRINGIDO`. El detalle mostrará motivo y fecha cuando existan, manteniendo visibles préstamos y pagos históricos.

Solo un usuario `ADMIN` verá las acciones:

- `Restringir cliente` para clientes activos;
- `Quitar restricción` para clientes restringidos.

Un modal reutilizable solicitará confirmación explícita. La restricción permitirá un motivo opcional y explicará que no borra historial ni deuda. La rehabilitación tendrá su propia confirmación. Los accesos para crear préstamos desde la tarjeta y el detalle quedarán deshabilitados para restringidos.

## Interfaz de Préstamos

`VistaPrestamos` mantendrá los filtros de estado existentes y añadirá un filtro independiente de cliente: `Activos | Restringidos | Todos`. El valor predeterminado será `Activos`, que en este contexto significa clientes no restringidos; no cambia el estado financiero del préstamo.

Los préstamos restringidos conservarán todos sus importes y estados y mostrarán un indicador contextual cuando se consulten mediante `Restringidos` o `Todos`.

## Manejo de errores

- `401`: token ausente o inválido, según el middleware actual.
- `403`: usuario autenticado sin rol ADMIN al cambiar una restricción.
- `404`: cliente inexistente.
- `409`: intento de otorgar préstamo a un cliente restringido.
- `422`: estado de restricción o cuerpo inválido.
- `500`: fallo inesperado, sin convertirlo en éxito visual.

Tras una mutación exitosa, `App.jsx` recargará los datos. Ante error, el modal permanecerá abierto y mostrará el mensaje del backend.

## Pruebas

Se incorporará un runner de pruebas del backend con `node:test`, usando dependencias inyectables o un pool controlado para verificar comportamiento real del controlador y las consultas sin tocar la base de producción. Se probarán:

- ADMIN puede restringir y rehabilitar;
- COBRADOR recibe `403` en la ruta;
- se registran restricción y rehabilitación con el motivo anterior;
- la creación de préstamos rechaza clientes restringidos;
- préstamos, pagos y datos financieros no se modifican;
- préstamos, alertas, ruta diaria y Dashboard excluyen restringidos por defecto;
- los filtros `restricted` y `all` permiten consultar préstamos históricos;
- clientes no restringidos mantienen el comportamiento anterior.

El frontend tendrá pruebas de las funciones puras de filtrado y disponibilidad de clientes. La verificación final ejecutará las pruebas, `npm run build` en `frontend/` y las verificaciones del backend. El fallo TypeScript preexistente en `src/components/Clients/ClientsView.tsx:67` se documentará como ajeno y no se modificará.

## Fuera de alcance

- No se elimina ni archiva ningún cliente, préstamo, pago o alerta histórica persistida.
- No se cambia la lógica de cálculo de intereses, cuotas, mora o saldos.
- No se modifica la aplicación Next.js de la raíz.
- No se hace merge a `main`.
