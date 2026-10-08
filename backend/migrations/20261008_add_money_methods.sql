-- Métodos distintos: entrega del préstamo y pago del cliente.
-- Sin DEFAULT ni backfill: los registros históricos permanecen NULL.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursement_method VARCHAR(10) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loans_disbursement_method_check' AND conrelid = 'loans'::regclass) THEN
    ALTER TABLE loans ADD CONSTRAINT loans_disbursement_method_check
      CHECK (disbursement_method IS NULL OR disbursement_method IN ('YAPE', 'CASH')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_payment_method_check' AND conrelid = 'payments'::regclass) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('YAPE', 'CASH')) NOT VALID;
  END IF;
END $$;

ALTER TABLE loans VALIDATE CONSTRAINT loans_disbursement_method_check;
ALTER TABLE payments VALIDATE CONSTRAINT payments_payment_method_check;
COMMIT;
