import { pool } from './src/config/db.js';

async function checkLoan() {
  try {
    const { rows } = await pool.query(`
      SELECT
        id, client_name, operation_number, start_date, due_date, status, total_amount, paid_amount, remaining_amount,
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date AS peru_today
      FROM loans
      WHERE operation_number = 'OP-000092' OR client_name ILIKE '%Christin Aracely Isla Vargas%'
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkLoan();
