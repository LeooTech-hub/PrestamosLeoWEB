-- PrestamosLeo Web - reparación no destructiva de préstamos migrados a PostgreSQL.
-- Revisar el resultado del bloque PREVIEW antes de ejecutar COMMIT.
BEGIN;

-- PREVIEW: filas cuyos campos equivalentes cambiarán.
SELECT id, client_id, amount, capital, amount_borrowed, total_amount, total_to_pay,
       payment_days, days_agreed, days, daily_amount, daily_payment_amount,
       daily_payment, start_date, due_date
FROM loans
WHERE COALESCE(amount, 0) != COALESCE(capital, 0)
   OR COALESCE(amount, 0) != COALESCE(amount_borrowed, 0)
   OR COALESCE(total_amount, 0) != COALESCE(total_to_pay, 0)
   OR COALESCE(payment_days, 0) != COALESCE(days_agreed, 0)
   OR COALESCE(payment_days, 0) != COALESCE(days, 0)
   OR COALESCE(daily_amount, 0) != COALESCE(daily_payment_amount, 0)
   OR COALESCE(daily_amount, 0) != COALESCE(daily_payment, 0)
   OR due_date IS NULL;

WITH normalized AS (
  SELECT
    id,
    COALESCE(NULLIF(amount, 0), NULLIF(capital, 0), NULLIF(amount_borrowed, 0), 0) AS capital_value,
    COALESCE(NULLIF(interest_rate, 0), 20) AS interest_rate_value,
    COALESCE(NULLIF(payment_days, 0), NULLIF(days_agreed, 0), NULLIF(days, 0), 20)::integer AS days_value,
    start_date,
    due_date
  FROM loans
), calculated AS (
  SELECT
    id,
    capital_value,
    interest_rate_value,
    ROUND(capital_value * interest_rate_value / 100, 2) AS interest_value,
    ROUND(capital_value + capital_value * interest_rate_value / 100, 2) AS total_value,
    days_value,
    start_date,
    COALESCE(due_date, start_date + days_value) AS due_date_value
  FROM normalized
)
UPDATE loans AS l
SET
  amount = c.capital_value,
  capital = c.capital_value,
  amount_borrowed = c.capital_value,
  interest_rate = c.interest_rate_value,
  interest_amount = c.interest_value,
  total_amount = c.total_value,
  total_to_pay = c.total_value,
  payment_days = c.days_value,
  days_agreed = c.days_value,
  days = c.days_value,
  daily_amount = ROUND(c.total_value / GREATEST(c.days_value, 1), 2),
  daily_payment_amount = ROUND(c.total_value / GREATEST(c.days_value, 1), 2),
  daily_payment = ROUND(c.total_value / GREATEST(c.days_value, 1), 2),
  due_date = c.due_date_value
FROM calculated AS c
WHERE l.id = c.id;

WITH totals AS (
  SELECT
    l.id,
    COALESCE(SUM(p.amount), 0)::numeric AS paid_value,
    MAX(COALESCE(p.payment_date, p.date)) AS last_payment_value
  FROM loans AS l
  LEFT JOIN payments AS p ON p.loan_id::text = l.id::text
  GROUP BY l.id
)
UPDATE loans AS l
SET
  paid_amount = LEAST(l.total_amount, t.paid_value),
  remaining_amount = GREATEST(0, l.total_amount - t.paid_value),
  paid_days_count = LEAST(l.payment_days, FLOOR(t.paid_value / GREATEST(l.daily_amount, 0.01))::integer),
  remaining_days = GREATEST(0, l.payment_days - LEAST(l.payment_days, FLOOR(t.paid_value / GREATEST(l.daily_amount, 0.01))::integer)),
  last_payment_date = t.last_payment_value,
  status = CASE
    WHEN t.paid_value >= l.total_amount THEN 'PAID'
    WHEN l.due_date < CURRENT_DATE THEN 'OVERDUE'
    ELSE 'ACTIVE'
  END
FROM totals AS t
WHERE l.id = t.id;

-- Esta consulta debe revisarse manualmente. No modifica ni elimina duplicados.
SELECT client_id, ARRAY_AGG(id ORDER BY created_at DESC) AS active_loan_ids
FROM loans
WHERE UPPER(status) IN ('ACTIVE', 'OVERDUE') AND COALESCE(is_archived, 0) = 0
GROUP BY client_id
HAVING COUNT(*) > 1;

COMMIT;
