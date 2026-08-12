import crypto from 'crypto';
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

async function invoke(handler, req) {
  const res = responseCapture();
  await handler(req, res);
  if (res.statusCode >= 400) {
    throw new Error(`${res.statusCode}: ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function verify() {
  const suffix = crypto.randomUUID();
  const clientId = `test_client_${suffix}`;
  const userResult = await pool.query(`SELECT id FROM users ORDER BY created_at LIMIT 1`);
  const userId = String(userResult.rows[0]?.id || 'test_user');

  try {
    await pool.query(`
      INSERT INTO clients (id, name, phone, address, assigned_to_user_id)
      VALUES ($1, $2, '', '', $3)
    `, [clientId, `PRUEBA CODEX ${suffix}`, userId]);

    const created = await invoke(loanController.createClientAndLoan, {
      body: {
        client_id: clientId,
        capital: 150,
        interestRate: 20,
        paymentDays: 20,
        startDate: '2026-08-10',
      },
      user: { id: userId, role: 'ADMIN' },
    });

    const persistedAfterCreate = await pool.query(`SELECT * FROM loans WHERE id::text = $1`, [created.id]);
    const loan = persistedAfterCreate.rows[0];
    const createActual = {
      capital: Number(loan.capital),
      amount: Number(loan.amount),
      amount_borrowed: Number(loan.amount_borrowed),
      interest_amount: Number(loan.interest_amount),
      total_amount: Number(loan.total_amount),
      total_to_pay: Number(loan.total_to_pay),
      daily_amount: Number(loan.daily_amount),
      payment_days: Number(loan.payment_days),
      start_date: loan.start_date,
      due_date: loan.due_date,
      paid_amount: Number(loan.paid_amount),
      remaining_amount: Number(loan.remaining_amount),
      paid_days_count: Number(loan.paid_days_count),
      remaining_days: Number(loan.remaining_days),
      status: loan.status,
    };

    await invoke(loanController.registerPayment, {
      body: { loanId: created.id, amount: 9 },
      user: { id: userId, role: 'ADMIN' },
    });
    const persistedAfterPayment = (await pool.query(`SELECT * FROM loans WHERE id::text = $1`, [created.id])).rows[0];

    await invoke(loanController.revertLastPayment, {
      params: { id: created.id },
      body: {},
      user: { id: userId, role: 'ADMIN' },
    });
    const persistedAfterRevert = (await pool.query(`SELECT * FROM loans WHERE id::text = $1`, [created.id])).rows[0];

    const result = {
      create: createActual,
      payment: {
        paid_amount: Number(persistedAfterPayment.paid_amount),
        remaining_amount: Number(persistedAfterPayment.remaining_amount),
        paid_days_count: Number(persistedAfterPayment.paid_days_count),
        remaining_days: Number(persistedAfterPayment.remaining_days),
        status: persistedAfterPayment.status,
      },
      revert: {
        paid_amount: Number(persistedAfterRevert.paid_amount),
        remaining_amount: Number(persistedAfterRevert.remaining_amount),
        paid_days_count: Number(persistedAfterRevert.paid_days_count),
        remaining_days: Number(persistedAfterRevert.remaining_days),
        status: persistedAfterRevert.status,
      },
    };

    const expected = {
      create: {
        capital: 150, amount: 150, amount_borrowed: 150, interest_amount: 30,
        total_amount: 180, total_to_pay: 180, daily_amount: 9, payment_days: 20,
        start_date: '2026-08-10', due_date: '2026-08-30', paid_amount: 0,
        remaining_amount: 180, paid_days_count: 0, remaining_days: 20, status: 'ACTIVE',
      },
      payment: { paid_amount: 9, remaining_amount: 171, paid_days_count: 1, remaining_days: 19, status: 'ACTIVE' },
      revert: { paid_amount: 0, remaining_amount: 180, paid_days_count: 0, remaining_days: 20, status: 'ACTIVE' },
    };

    if (JSON.stringify(result) !== JSON.stringify(expected)) {
      throw new Error(`Resultado inesperado:\n${JSON.stringify(result, null, 2)}`);
    }
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.query(`DELETE FROM payments WHERE client_id::text = $1`, [clientId]);
    await pool.query(`DELETE FROM loans WHERE client_id::text = $1`, [clientId]);
    await pool.query(`DELETE FROM clients WHERE id::text = $1`, [clientId]);
    await pool.end();
  }
}

verify().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
