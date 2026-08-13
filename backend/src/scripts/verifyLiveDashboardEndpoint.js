import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const baseUrl = process.env.API_URL || 'http://127.0.0.1:5000/api';

try {
  const { rows } = await pool.query(`
    SELECT id, email, name, role
    FROM users
    ORDER BY CASE WHEN UPPER(role) = 'ADMIN' THEN 0 ELSE 1 END
    LIMIT 1
  `);
  assert.ok(rows[0], 'Se requiere un usuario existente para probar endpoints protegidos');
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET no está configurado');

  const token = jwt.sign({
    id: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
    role: rows[0].role,
  }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}` };

  const [summaryResponse, paymentsResponse] = await Promise.all([
    fetch(`${baseUrl}/dashboard/summary?_t=${Date.now()}`, { headers }),
    fetch(`${baseUrl}/payments?_t=${Date.now()}`, { headers }),
  ]);
  assert.equal(summaryResponse.status, 200);
  assert.equal(paymentsResponse.status, 200);

  const summary = await summaryResponse.json();
  const payments = await paymentsResponse.json();
  const summaryThirty = summary.recentPayments.find((payment) => payment.amount === 30);
  const paymentsThirty = payments.find((payment) => payment.id === summaryThirty?.id);

  assert.ok(summaryThirty, 'GET /dashboard/summary no devolvió el pago real de S/ 30');
  assert.ok(paymentsThirty, 'GET /payments no devolvió el mismo pago real de S/ 30');
  assert.equal(summary.collectedToday, summary.todayCollected);
  assert.ok(summary.recentPayments.every((payment, index, list) => (
    index === 0 || new Date(list[index - 1].createdAt) >= new Date(payment.createdAt)
  )), 'recentPayments no está ordenado por created_at DESC');

  console.log(JSON.stringify({
    summaryStatus: summaryResponse.status,
    paymentsStatus: paymentsResponse.status,
    collectedToday: summary.collectedToday,
    todayCollected: summary.todayCollected,
    businessDate: summary.businessDate,
    timeZone: summary.timeZone,
    recentPayments: summary.recentPayments,
    paymentThirtyInPaymentsEndpoint: paymentsThirty,
  }, null, 2));
} finally {
  await pool.end();
}
