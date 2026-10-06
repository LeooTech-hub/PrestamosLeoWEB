# Despliegue y validación: restringir clientes

## Migración requerida

Aplicar, una sola vez y antes de desplegar el backend, la migración:

`backend/migrations/20261005_add_client_restrictions.sql`

La migración agrega a `clients` los campos `is_restricted`, `restricted_at`,
`restricted_by` y `restriction_reason`, además del índice y la referencia al
usuario administrador. Los clientes existentes conservan el comportamiento
actual porque `is_restricted` se crea con `NOT NULL DEFAULT false`. La migración
no modifica préstamos, pagos, saldos ni estados históricos.

### Supabase Dashboard

1. Abrir el proyecto correspondiente en Supabase.
2. Ir a **SQL Editor**.
3. Copiar el contenido completo de
   `backend/migrations/20261005_add_client_restrictions.sql`.
4. Ejecutarlo una vez y comprobar que la transacción termina sin errores.
5. Desplegar o reiniciar el backend y después desplegar el frontend.

### Alternativa con psql

Desde un entorno autorizado y apuntando explícitamente a la base correcta:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/20261005_add_client_restrictions.sql
```

No se ejecutó esta migración durante el desarrollo ni contra producción.

## Validación manual

Preparar un cliente no restringido con un préstamo pendiente o vencido y una
cuenta de cada rol (`ADMIN` y `COBRADOR`).

1. Iniciar sesión como `ADMIN` y abrir **Clientes**.
2. En el cliente preparado, elegir **Restringir cliente**, escribir un motivo
   (por ejemplo, `deuda incobrable`) y confirmar.
3. Comprobar que el cliente continúa visible, conserva su deuda e historial y
   muestra el badge **Restringido** y el motivo.
4. Probar los filtros **Todos**, **Activos** y **Restringidos** de Clientes.
5. Abrir **Préstamos**: el préstamo no debe aparecer en la vista operativa
   predeterminada; debe aparecer, sin cambios en importes, saldo, pagos, mora o
   fechas, al elegir **Restringidos** o **Todos**.
6. Abrir el flujo de nuevo préstamo: el cliente restringido no debe estar entre
   los clientes disponibles. Una llamada directa a `POST /api/loans` (o al
   alias existente `POST /api/clients-with-loan`) con ese cliente debe responder
   `409` con el mensaje de cliente restringido.
7. Ejecutar o consultar los flujos operativos habituales de cobranza: alertas,
   vencimientos, próximo vencimiento, mora, recordatorios y resumen operativo.
   El cliente restringido no debe aparecer. El historial y los reportes
   financieros históricos deben conservar sus datos.
8. Iniciar sesión como `COBRADOR`: la acción de restricción no debe mostrarse.
   Una llamada directa a `PUT /api/clients/:id/restriction` debe responder
   `403` y no modificar al cliente.
9. Volver a iniciar sesión como `ADMIN`, elegir **Quitar restricción** y
   confirmar.
10. Comprobar que el cliente vuelve a las vistas operativas y notificaciones,
    y que nuevamente puede recibir préstamos.
11. Verificar en `clients` que al quitar la restricción quedaron en `false` o
    `NULL` los cuatro campos de restricción.
12. Verificar en `activity_logs` que existen entradas para restringir y quitar
    la restricción, y que el motivo original se conserva en la auditoría de la
    retirada aunque se haya limpiado de `clients`.

## Seguridad y arquitectura

La autorización se valida en el backend consultando el rol vigente del usuario;
ocultar acciones en el frontend es una protección adicional, no la barrera de
seguridad. El proyecto usa JWT propio y un pool PostgreSQL privado para estas
operaciones, no Supabase Auth/Data API, por lo que esta función no agrega una
política RLS paralela.

## Incidencia ajena al alcance

La aplicación Next.js ubicada en la raíz ya presentaba un error de tipos en
`src/components/Clients/ClientsView.tsx:67` relacionado con `Client.isArchived`.
No se modificó `src/`, `next-env.d.ts` ni ese problema en esta rama. Las
verificaciones de esta función corresponden al `frontend/` y `backend/`
operativos.
