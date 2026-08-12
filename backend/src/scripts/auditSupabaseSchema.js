import pool from '../config/db.js';

async function audit() {
  const schema = await pool.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY($1)
    ORDER BY table_name, ordinal_position
  `, [['clients', 'loans', 'payments', 'users', 'activity_logs']]);

  const duplicates = await pool.query(`
    SELECT client_id::text, COUNT(*)::integer AS active_count
    FROM loans
    WHERE status IN ('ACTIVE', 'OVERDUE')
    GROUP BY client_id::text
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);

  const loans = await pool.query(`
    SELECT
      COUNT(*)::integer AS total,
      COUNT(*) FILTER (WHERE due_date IS NULL)::integer AS missing_due,
      COUNT(*) FILTER (WHERE start_date IS NULL)::integer AS missing_start,
      COUNT(*) FILTER (
        WHERE COALESCE(amount, 0) != COALESCE(capital, 0)
           OR COALESCE(amount, 0) != COALESCE(amount_borrowed, 0)
      )::integer AS capital_mismatch,
      COUNT(*) FILTER (
        WHERE COALESCE(total_amount, 0) != COALESCE(total_to_pay, 0)
      )::integer AS total_mismatch,
      COUNT(*) FILTER (
        WHERE COALESCE(payment_days, 0) != COALESCE(days_agreed, 0)
           OR COALESCE(payment_days, 0) != COALESCE(days, 0)
      )::integer AS days_mismatch,
      COUNT(*) FILTER (
        WHERE COALESCE(daily_amount, 0) != COALESCE(daily_payment_amount, 0)
           OR COALESCE(daily_amount, 0) != COALESCE(daily_payment, 0)
      )::integer AS daily_mismatch
    FROM loans
  `);

  console.log(JSON.stringify({
    schema: schema.rows,
    duplicateActiveLoans: duplicates.rows,
    loanAudit: loans.rows[0],
  }, null, 2));
}

audit()
  .catch((error) => {
    console.error('No se pudo auditar Supabase:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
