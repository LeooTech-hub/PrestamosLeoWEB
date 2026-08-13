-- AUDITORÍA PRESTAMOSLEO WEB - recomendaciones NO ejecutadas automáticamente.
-- Revisar primero los hallazgos de integridad documentados en AUDITORIA_PRESTAMOSLEO_WEB.md.
BEGIN;

CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans (client_id);
CREATE INDEX IF NOT EXISTS idx_loans_status_due_date ON loans (status, due_date);
CREATE INDEX IF NOT EXISTS idx_loans_assigned_to_user_id ON loans (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments (loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to_user_id ON clients (assigned_to_user_id);

-- NOT VALID evita escanear/bloquear toda la tabla al agregarla, pero impide nuevos huérfanos.
-- Ejecutar VALIDATE CONSTRAINT después de confirmar que la auditoría de huérfanos sigue en cero.
ALTER TABLE payments
  ADD CONSTRAINT payments_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES loans(id) NOT VALID;

ALTER TABLE loans
  ADD CONSTRAINT loans_amounts_nonnegative_check
  CHECK (
    COALESCE(paid_amount, 0) >= 0
    AND COALESCE(remaining_amount, 0) >= 0
    AND COALESCE(total_amount, total_to_pay, 0) >= 0
  ) NOT VALID;

ALTER TABLE payments
  ADD CONSTRAINT payments_amount_positive_check CHECK (amount > 0) NOT VALID;

COMMIT;

-- En una ventana de mantenimiento, después de corregir datos existentes:
-- ALTER TABLE payments VALIDATE CONSTRAINT payments_loan_id_fkey;
-- ALTER TABLE loans VALIDATE CONSTRAINT loans_amounts_nonnegative_check;
-- ALTER TABLE payments VALIDATE CONSTRAINT payments_amount_positive_check;
-- Evaluar luego SET NOT NULL para loans.client_id, payments.loan_id y payments.client_id.