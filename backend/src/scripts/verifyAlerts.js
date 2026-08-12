import pool from '../config/db.js';

async function verify() {
  const { rows } = await pool.query(`
    WITH test_cases(case_id, due_date, remaining_amount, status) AS (
      VALUES
        (1, DATE '2026-08-20', 240::numeric, 'ACTIVE'),
        (2, DATE '2026-08-13', 240::numeric, 'ACTIVE'),
        (3, DATE '2026-08-12', 240::numeric, 'ACTIVE'),
        (4, DATE '2026-08-11', 240::numeric, 'ACTIVE'),
        (5, DATE '2026-08-11',   0::numeric, 'PAID'),
        (6, DATE '2026-08-20', 240::numeric, 'ACTIVE')
    ), evaluated AS (
      SELECT
        *,
        CASE
          WHEN due_date < DATE '2026-08-12' THEN 'OVERDUE'
          WHEN due_date = DATE '2026-08-12' THEN 'DUE_TODAY'
          WHEN due_date = DATE '2026-08-12' + 1 THEN 'DUE_TOMORROW'
        END AS type
      FROM test_cases
      WHERE remaining_amount > 0
        AND UPPER(status) != 'PAID'
        AND due_date <= DATE '2026-08-12' + 1
    )
    SELECT case_id, type FROM evaluated ORDER BY case_id
  `);

  const actual = Object.fromEntries(rows.map((row) => [Number(row.case_id), row.type]));
  const expected = {
    2: 'DUE_TOMORROW',
    3: 'DUE_TODAY',
    4: 'OVERDUE',
  };

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Alertas inesperadas: ${JSON.stringify(actual)}`);
  }

  const dailyPaymentCase = {
    hasActiveLoan: true,
    paidTodayAmount: 0,
    cardStatus: 'PAGO PENDIENTE HOY',
    alertGenerated: Object.hasOwn(actual, 6),
  };
  if (dailyPaymentCase.alertGenerated) {
    throw new Error('El pago pendiente diario generó incorrectamente una alerta de vencimiento');
  }

  console.log(JSON.stringify({ alerts: actual, dailyPaymentCase }, null, 2));
}

verify()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
