import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pool from '../config/db.js';
import loanController from '../controllers/loanController.js';

function responseCapture() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function invokeUpdate(id, body) {
  const res = responseCapture();
  await loanController.updateLoan({ params: { id }, body }, res);
  return res;
}

function numericSnapshot(row) {
  return {
    amount: Number(row.amount),
    capital: Number(row.capital),
    amount_borrowed: Number(row.amount_borrowed),
    interest_rate: Number(row.interest_rate),
    interest_amount: Number(row.interest_amount),
    total_amount: Number(row.total_amount),
    total_to_pay: Number(row.total_to_pay),
    payment_days: Number(row.payment_days),
    days_agreed: Number(row.days_agreed),
    days: Number(row.days),
    daily_amount: Number(row.daily_amount),
    daily_payment_amount: Number(row.daily_payment_amount),
    daily_payment: Number(row.daily_payment),
    paid_amount: Number(row.paid_amount),
    remaining_amount: Number(row.remaining_amount),
    start_date: row.start_date,
    due_date: row.due_date,
  };
}

const suffix = crypto.randomUUID();
const clientId = `verify_update_client_${suffix}`;
const paidLoanId = `verify_update_paid_${suffix}`;
const decimalLoanId = `verify_update_decimal_${suffix}`;

try {
  await pool.query(
    `INSERT INTO clients (id, name) VALUES ($1, $2)`,
    [clientId, `Verificación update ${suffix}`]
  );
  await pool.query(`
    INSERT INTO loans (
      id, client_id, client_name, amount, capital, amount_borrowed,
      interest_rate, interest_amount, total_amount, total_to_pay,
      payment_days, days_agreed, days, daily_amount,
      daily_payment_amount, daily_payment, paid_amount, remaining_amount,
      paid_days_count, remaining_days, start_date, due_date, status
    ) VALUES
      ($1, $3, 'Prueba pagada', 200, 200, 200, 20, 40, 240, 240,
       20, 20, 20, 12, 12, 12, 30, 210, 2, 18, '2026-07-29', '2026-08-18', 'ACTIVE'),
      ($2, $3, 'Prueba decimal', 100, 100, 100, 20, 20, 120, 120,
       20, 20, 20, 6, 6, 6, 0, 120, 0, 20, '2026-07-29', '2026-08-18', 'ACTIVE')
  `, [paidLoanId, decimalLoanId, clientId]);
  await pool.query(`
    INSERT INTO payments (id, loan_id, client_id, client_name, amount, payment_date, date)
    VALUES ($1, $2, $3, 'Prueba pagada', 30, '2026-08-01', '2026-08-01')
  `, [`verify_update_payment_${suffix}`, paidLoanId, clientId]);

  const paidResponse = await invokeUpdate(paidLoanId, {
    amount: 227.5,
    capital: 227.5,
    amount_borrowed: 227.5,
    interestRate: 20,
    interest_rate: 20,
    interes: 20,
    paymentDays: 17,
    payment_days: 17,
    days_agreed: 17,
    days: 17,
    startDate: '2026-07-29',
    dueDate: '2026-08-15',
    notes: 'paga',
  });
  assert.equal(paidResponse.statusCode, 200, JSON.stringify(paidResponse.body));

  const paidRow = (await pool.query(`SELECT * FROM loans WHERE id = $1`, [paidLoanId])).rows[0];
  const paidActual = numericSnapshot(paidRow);
  assert.deepEqual(paidActual, {
    amount: 227.5,
    capital: 227.5,
    amount_borrowed: 227.5,
    interest_rate: 20,
    interest_amount: 45.5,
    total_amount: 273,
    total_to_pay: 273,
    payment_days: 17,
    days_agreed: 17,
    days: 17,
    daily_amount: 16.06,
    daily_payment_amount: 16.06,
    daily_payment: 16.06,
    paid_amount: 30,
    remaining_amount: 243,
    start_date: '2026-07-29',
    due_date: '2026-08-15',
  });
  assert.equal(paidResponse.body.loan.interestRate, 20);
  assert.equal(paidResponse.body.loan.interestAmount, 45.5);

  const decimalResponse = await invokeUpdate(decimalLoanId, {
    amount: 199.99,
    interest_rate: 20,
    payment_days: 17,
    start_date: '2026-07-29',
    due_date: '2026-08-15',
  });
  assert.equal(decimalResponse.statusCode, 200, JSON.stringify(decimalResponse.body));
  const decimalRow = (await pool.query(`SELECT * FROM loans WHERE id = $1`, [decimalLoanId])).rows[0];
  const decimalActual = numericSnapshot(decimalRow);
  assert.equal(decimalActual.interest_amount, 40);
  assert.equal(decimalActual.total_amount, 239.99);
  assert.equal(decimalActual.daily_amount, 14.12);
  assert.equal(decimalActual.remaining_amount, 239.99);

  console.log(JSON.stringify({
    paidLoan: { status: paidResponse.statusCode, persisted: paidActual },
    decimalLoan: { status: decimalResponse.statusCode, persisted: decimalActual },
    inconsistentParameterError: false,
  }, null, 2));
} finally {
  await pool.query(`DELETE FROM payments WHERE loan_id = ANY($1::text[])`, [[paidLoanId, decimalLoanId]]);
  await pool.query(`DELETE FROM loans WHERE id = ANY($1::text[])`, [[paidLoanId, decimalLoanId]]);
  await pool.query(`DELETE FROM clients WHERE id = $1`, [clientId]);
  await pool.end();
}
