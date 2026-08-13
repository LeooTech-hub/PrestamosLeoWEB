import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
const suffix = crypto.randomUUID();
const clientId = `verify_http_update_client_${suffix}`;
const loanId = `verify_http_update_loan_${suffix}`;

try {
  const { rows: users } = await pool.query(`
    SELECT id, email, name, role FROM users
    ORDER BY CASE WHEN UPPER(role) = 'ADMIN' THEN 0 ELSE 1 END, created_at
    LIMIT 1
  `);
  assert.ok(users[0], 'No existe un usuario para firmar la prueba HTTP');
  const user = users[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'prestamos_leo_jwt_secret_key_2026_super_secure',
    { expiresIn: '2m' }
  );

  await pool.query(`INSERT INTO clients (id, name) VALUES ($1, 'Prueba HTTP update')`, [clientId]);
  await pool.query(`
    INSERT INTO loans (
      id, client_id, client_name, amount, capital, amount_borrowed,
      interest_rate, interest_amount, total_amount, total_to_pay,
      payment_days, days_agreed, days, daily_amount, daily_payment_amount,
      daily_payment, paid_amount, remaining_amount, paid_days_count,
      remaining_days, start_date, due_date, status
    ) VALUES (
      $1, $2, 'Prueba HTTP update', 200, 200, 200, 20, 40, 240, 240,
      20, 20, 20, 12, 12, 12, 30, 210, 2, 18,
      '2026-07-29', '2026-08-18', 'ACTIVE'
    )
  `, [loanId, clientId]);
  await pool.query(`
    INSERT INTO payments (id, loan_id, client_id, client_name, amount, payment_date, date)
    VALUES ($1, $2, $3, 'Prueba HTTP update', 30, '2026-08-01', '2026-08-01')
  `, [`verify_http_update_payment_${suffix}`, loanId, clientId]);

  const payload = {
    amount: 227.5,
    capital: 227.5,
    amount_borrowed: 227.5,
    interestRate: 20,
    interest_rate: 20,
    interest: 45.5,
    interest_amount: 45.5,
    totalPay: 273,
    total_amount: 273,
    total_to_pay: 273,
    paymentDays: 17,
    payment_days: 17,
    days: 17,
    days_agreed: 17,
    daily_amount: 16.06,
    daily_payment: 16.06,
    daily_payment_amount: 16.06,
    startDate: '2026-07-29',
    dueDate: '2026-08-15',
    remaining_amount: 243,
  };
  const response = await fetch(`${apiUrl}/loans/${encodeURIComponent(loanId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.success, true);
  assert.equal(body.loan.interestRate, 20);
  assert.equal(body.loan.interestAmount, 45.5);
  assert.equal(body.loan.totalToPay, 273);
  assert.equal(body.loan.dailyPaymentAmount, 16.06);
  assert.equal(body.loan.paidAmount, 30);
  assert.equal(body.loan.remainingAmount, 243);

  console.log(JSON.stringify({
    method: 'PUT',
    url: `${apiUrl}/loans/:id`,
    status: response.status,
    loan: body.loan,
    error500: false,
  }, null, 2));
} finally {
  await pool.query(`DELETE FROM payments WHERE loan_id = $1`, [loanId]);
  await pool.query(`DELETE FROM loans WHERE id = $1`, [loanId]);
  await pool.query(`DELETE FROM clients WHERE id = $1`, [clientId]);
  await pool.end();
}
