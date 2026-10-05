-- PrestamosLeo Web - estado administrativo de restricción de clientes.
-- Seguro para clientes existentes: todos permanecen no restringidos por defecto.
BEGIN;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS restricted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS restricted_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS restriction_reason TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_is_restricted
  ON clients (is_restricted)
  WHERE is_restricted = TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_restricted_by_fkey'
      AND conrelid = 'clients'::regclass
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_restricted_by_fkey
      FOREIGN KEY (restricted_by) REFERENCES users(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

COMMIT;
