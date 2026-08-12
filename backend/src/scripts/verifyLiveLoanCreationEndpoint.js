import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const API_URL = 'http://localhost:5000/api';

async function verify() {
  const suffix = Date.now().toString().slice(-8);
  const clientName = `PRUEBA CODEX CAMELCASE ${suffix}`;
  const clientIdentification = `9${suffix}`;
  const clientPhone = `900${suffix}`;
  let createdLoanId = null;
  let createdClientId = null;

  const { rows: users } = await pool.query(`
    SELECT id, email, name, role
    FROM users
    ORDER BY CASE WHEN UPPER(role) = 'ADMIN' THEN 0 ELSE 1 END, created_at
    LIMIT 1
  `);
  if (!users[0]) throw new Error('No existe un usuario para verificar el endpoint');

  const user = users[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'prestamos_leo_jwt_secret_key_2026_super_secure',
    { expiresIn: '2m' }
  );
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const payload = {
      alias: '',
      amount: 1000,
      capital: 1000,
      clientAddress: 'jr prueba',
      clientAlias: '',
      clientIdentification,
      clientName,
      clientPhone,
      days: 20,
      dueDate: '2026-09-01',
      interestRate: 20,
      interest_rate: 20,
      notes: '',
      paymentDays: 20,
      startDate: '2026-08-12',
    };

    const response = await fetch(`${API_URL}/loans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (response.status !== 201) {
      throw new Error(`POST /api/loans devolvió ${response.status}: ${JSON.stringify(body)}`);
    }

    createdLoanId = String(body.id);
    createdClientId = String(body.clientId || body.client_id);
    const persisted = await pool.query(`
      SELECT
        l.id, l.client_id, l.amount, l.capital, l.amount_borrowed,
        l.interest_rate, l.interest_amount, l.total_amount, l.total_to_pay,
        l.payment_days, l.days_agreed, l.days,
        l.daily_amount, l.daily_payment_amount, l.daily_payment,
        l.start_date, l.due_date, l.paid_amount, l.remaining_amount, l.status,
        c.name, c.phone, c.dni, c.address
      FROM loans l
      JOIN clients c ON c.id::text = l.client_id::text
      WHERE l.id::text = $1
    `, [createdLoanId]);
    if (!persisted.rows[0]) throw new Error('El préstamo no persistió en PostgreSQL');

    const loan = persisted.rows[0];
    const actual = {
      clientName: loan.name,
      clientPhone: loan.phone,
      clientIdentification: loan.dni,
      clientAddress: loan.address,
      amount: Number(loan.amount),
      capital: Number(loan.capital),
      amountBorrowed: Number(loan.amount_borrowed),
      interestRate: Number(loan.interest_rate),
      interestAmount: Number(loan.interest_amount),
      totalAmount: Number(loan.total_amount),
      totalToPay: Number(loan.total_to_pay),
      days: Number(loan.days),
      paymentDays: Number(loan.payment_days),
      daysAgreed: Number(loan.days_agreed),
      dailyAmount: Number(loan.daily_amount),
      dailyPaymentAmount: Number(loan.daily_payment_amount),
      dailyPayment: Number(loan.daily_payment),
      startDate: loan.start_date,
      dueDate: loan.due_date,
      paidAmount: Number(loan.paid_amount),
      remainingAmount: Number(loan.remaining_amount),
      status: loan.status,
    };
    const expected = {
      clientName,
      clientPhone,
      clientIdentification,
      clientAddress: 'jr prueba',
      amount: 1000,
      capital: 1000,
      amountBorrowed: 1000,
      interestRate: 20,
      interestAmount: 200,
      totalAmount: 1200,
      totalToPay: 1200,
      days: 20,
      paymentDays: 20,
      daysAgreed: 20,
      dailyAmount: 60,
      dailyPaymentAmount: 60,
      dailyPayment: 60,
      startDate: '2026-08-12',
      dueDate: '2026-09-01',
      paidAmount: 0,
      remainingAmount: 1200,
      status: 'ACTIVE',
    };
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Persistencia inesperada: ${JSON.stringify(actual, null, 2)}`);
    }

    const reloadResponse = await fetch(`${API_URL}/loans?clientId=${encodeURIComponent(createdClientId)}`, { headers });
    const reloaded = await reloadResponse.json();
    if (!reloadResponse.ok || !Array.isArray(reloaded) || !reloaded.some((item) => String(item.id) === createdLoanId)) {
      throw new Error(`El préstamo no apareció al recargar vía GET /api/loans: ${JSON.stringify(reloaded)}`);
    }

    console.log(JSON.stringify({
      url: `${API_URL}/loans`,
      status: response.status,
      createdClientId,
      createdLoanId,
      persisted: actual,
      visibleAfterReload: true,
    }, null, 2));
  } finally {
    if (createdLoanId) {
      await pool.query(`DELETE FROM payments WHERE loan_id::text = $1`, [createdLoanId]);
      await pool.query(`DELETE FROM loans WHERE id::text = $1`, [createdLoanId]);
    }
    if (createdClientId) {
      await pool.query(`DELETE FROM clients WHERE id::text = $1 AND name = $2`, [createdClientId, clientName]);
    }
    await pool.end();
  }
}

verify().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
