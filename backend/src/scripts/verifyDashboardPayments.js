import assert from 'node:assert/strict';
import pool from '../config/db.js';
import { buildDashboardSummary } from '../controllers/loanController.js';

const client = await pool.connect();

try {
  await client.query('BEGIN');
  await client.query('SET LOCAL search_path TO pg_temp, public');
  await client.query(`
    CREATE TEMP TABLE users (id text PRIMARY KEY, name text);
    CREATE TEMP TABLE clients (id text PRIMARY KEY, name text);
    CREATE TEMP TABLE loans (
      id text PRIMARY KEY, client_id text, client_name text,
      amount numeric, capital numeric, amount_borrowed numeric,
      interest_rate numeric, interest_amount numeric,
      total_amount numeric, total_to_pay numeric,
      payment_days integer, days_agreed integer, days integer,
      daily_amount numeric, daily_payment_amount numeric, daily_payment numeric,
      paid_amount numeric, remaining_amount numeric,
      paid_days_count integer, remaining_days integer,
      start_date date, due_date date, status text, created_at timestamptz
    );
    CREATE TEMP TABLE payments (
      id text PRIMARY KEY, loan_id text, client_id text, client_name text,
      amount numeric, payment_date date, date date, type text,
      day_number integer, late_fee numeric, notes text,
      collected_by_user_id text, created_at timestamptz
    );
  `);

  await client.query(`
    INSERT INTO users (id, name) VALUES ('collector_1', 'Cobrador Prueba');
    INSERT INTO clients (id, name) VALUES ('client_maria', 'María Prueba');
    INSERT INTO loans (
      id, client_id, client_name, amount, capital, amount_borrowed,
      interest_rate, interest_amount, total_amount, total_to_pay,
      payment_days, days_agreed, days, daily_amount,
      daily_payment_amount, daily_payment, paid_amount, remaining_amount,
      paid_days_count, remaining_days, start_date, due_date, status, created_at
    ) VALUES
      ('loan_A', 'client_maria', 'María Prueba', 100, 100, 100, 20, 20, 120, 120,
       20, 20, 20, 6, 6, 6, 0, 120, 0, 20, CURRENT_DATE, CURRENT_DATE + 20, 'ACTIVE', NOW() - INTERVAL '2 minutes'),
      ('loan_B', 'client_maria', 'María Prueba', 200, 200, 200, 20, 40, 240, 240,
       20, 20, 20, 12, 12, 12, 0, 240, 0, 20, CURRENT_DATE, CURRENT_DATE + 20, 'ACTIVE', NOW() - INTERVAL '1 minute');
  `);

  const insertPayment = async (id, loanId, amount, age) => client.query(`
    INSERT INTO payments (
      id, loan_id, client_id, client_name, amount, payment_date, date,
      type, day_number, late_fee, notes, collected_by_user_id, created_at
    ) VALUES (
      $1, $2, 'client_maria', 'María Prueba', $3,
      (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date,
      (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date,
      'PARTIAL', 1, 0, 'Pago de integración', 'collector_1', NOW() - $4::interval
    )
  `, [id, loanId, amount, age]);

  await insertPayment('payment_30', 'loan_A', 30, '3 minutes');
  const afterThirty = await buildDashboardSummary(client);
  assert.equal(afterThirty.collectedToday, 30);
  assert.equal(afterThirty.todayCollected, 30);
  assert.equal(afterThirty.recentPayments[0].loanId, 'loan_A');
  assert.equal(afterThirty.recentPayments[0].clientName, 'María Prueba');

  await insertPayment('payment_750', 'loan_A', 7.5, '2 minutes');
  const afterSevenFifty = await buildDashboardSummary(client);
  assert.equal(afterSevenFifty.collectedToday, 37.5);
  assert.deepEqual(
    afterSevenFifty.recentPayments.slice(0, 2).map((payment) => payment.id),
    ['payment_750', 'payment_30']
  );

  await insertPayment('payment_18', 'loan_B', 18, '1 minute');
  const afterLoanB = await buildDashboardSummary(client);
  assert.equal(afterLoanB.collectedToday, 55.5);
  assert.equal(afterLoanB.recentPayments[0].loanId, 'loan_B');
  assert.equal(afterLoanB.recentPayments[0].clientId, 'client_maria');
  assert.equal(afterLoanB.recentPayments[1].loanId, 'loan_A');

  await client.query('ROLLBACK');
  console.log(JSON.stringify({
    isolated: {
      afterThirty: afterThirty.collectedToday,
      afterSevenFifty: afterSevenFifty.collectedToday,
      afterLoanB: afterLoanB.collectedToday,
      order: afterLoanB.recentPayments.map((payment) => payment.id),
      loanBPayment: afterLoanB.recentPayments[0],
      rolledBack: true,
    },
  }, null, 2));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}

try {
  const liveSummary = await buildDashboardSummary(pool);
  const realThirty = liveSummary.recentPayments.find((payment) => payment.amount === 30);
  assert.ok(realThirty, 'El summary real no contiene el pago de S/ 30 entre los 10 más recientes de hoy');
  assert.ok(realThirty.loanId, 'El pago real de S/ 30 no conserva loan_id');
  assert.ok(realThirty.clientId, 'El pago real de S/ 30 no conserva client_id');

  console.log(JSON.stringify({
    live: {
      businessDate: liveSummary.businessDate,
      timeZone: liveSummary.timeZone,
      collectedToday: liveSummary.collectedToday,
      todayCollected: liveSummary.todayCollected,
      recentPaymentsCount: liveSummary.recentPayments.length,
      realThirty,
    },
  }, null, 2));
} finally {
  await pool.end();
}
