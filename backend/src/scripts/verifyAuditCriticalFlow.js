import crypto from 'crypto';
import pool from '../config/db.js';
import loanController from '../controllers/loanController.js';

function capture() {
  return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
async function call(handler, req) { const res = capture(); await handler(req, res); return res; }
function assert(ok, message, details) { if (!ok) throw new Error(`${message}${details ? `: ${JSON.stringify(details)}` : ''}`); }
function money(value) { return Number(Number(value).toFixed(2)); }

async function main() {
  const suffix = crypto.randomUUID().slice(0, 8);
  const clientId = crypto.randomUUID();
  const clientName = `AUDIT_TEST_${suffix}`;
  const createdLoanIds = [];
  const { rows: users } = await pool.query(`SELECT id, role FROM users ORDER BY CASE WHEN UPPER(role)='ADMIN' THEN 0 ELSE 1 END LIMIT 1`);
  assert(users[0], 'Se requiere un usuario de prueba existente');
  const user = { id: String(users[0].id), role: String(users[0].role) };
  const { rows: dates } = await pool.query(`SELECT CURRENT_DATE::text today, (CURRENT_DATE + 1)::text tomorrow, (CURRENT_DATE + 8)::text later`);
  const results = {};
  try {
    await pool.query(`INSERT INTO clients (id,name,phone,address,assigned_to_user_id) VALUES ($1,$2,'','',$3)`, [clientId, clientName, user.id]);
    const base = { clientId, clientName, clientPhone: '', clientAddress: '', interestRate: 20, paymentDays: 20, startDate: dates[0].today };
    const first = await call(loanController.createClientAndLoan, { body: { ...base, capital: 1000, dueDate: dates[0].later }, user });
    assert(first.statusCode === 201, 'No creó el primer préstamo', first.body); createdLoanIds.push(String(first.body.id));
    const second = await call(loanController.createClientAndLoan, { body: { ...base, capital: 300, dueDate: dates[0].tomorrow }, user });
    assert(second.statusCode === 201, 'No permitió segundo préstamo', second.body); createdLoanIds.push(String(second.body.id));
    assert(first.body.id !== second.body.id, 'Reutilizó loan_id');
    const loansForClient = await call(loanController.getLoans, { query: { clientId }, user });
    assert(loansForClient.statusCode === 200 && loansForClient.body.length === 2, 'GET loans no devolvió exactamente ambos préstamos', loansForClient.body);

    const payments = [];
    for (const amount of [5, 30, 7.5]) {
      const paid = await call(loanController.registerPayment, { body: { loanId: first.body.id, amount }, user });
      assert(paid.statusCode === 201, `Falló pago flexible ${amount}`, paid.body); payments.push(paid.body.payment.id);
    }
    let a = (await pool.query(`SELECT paid_amount,remaining_amount,status FROM loans WHERE id=$1`, [first.body.id])).rows[0];
    let b = (await pool.query(`SELECT paid_amount,remaining_amount,status FROM loans WHERE id=$1`, [second.body.id])).rows[0];
    assert(money(a.paid_amount) === 42.5 && money(a.remaining_amount) === 1157.5, 'Acumulado flexible incorrecto en A', a);
    assert(money(b.paid_amount) === 0 && money(b.remaining_amount) === 360, 'Pago de A afectó B', b);
    const paidB = await call(loanController.registerPayment, { body: { loan_id: second.body.id, amount: 18 }, user });
    assert(paidB.statusCode === 201, 'Falló pago por loan_id en B', paidB.body);
    b = (await pool.query(`SELECT paid_amount,remaining_amount FROM loans WHERE id=$1`, [second.body.id])).rows[0];
    assert(money(b.paid_amount) === 18 && money(b.remaining_amount) === 342, 'Saldo B incorrecto', b);

    const reverted = await call(loanController.revertLastPayment, { params: { id: first.body.id }, body: {}, user });
    assert(reverted.statusCode === 200, 'Falló reversión A', reverted.body);
    a = (await pool.query(`SELECT paid_amount,remaining_amount FROM loans WHERE id=$1`, [first.body.id])).rows[0];
    b = (await pool.query(`SELECT paid_amount,remaining_amount FROM loans WHERE id=$1`, [second.body.id])).rows[0];
    assert(money(a.paid_amount) === 35 && money(a.remaining_amount) === 1165, 'Reversión A incorrecta', a);
    assert(money(b.paid_amount) === 18 && money(b.remaining_amount) === 342, 'Reversión A afectó B', b);

    const alertsBeforePaid = await call(loanController.getAlerts, { query: {}, user });
    assert(alertsBeforePaid.statusCode === 200, 'Falló endpoint alertas', alertsBeforePaid.body);
    const ownAlertsBeforePaid = alertsBeforePaid.body.filter(x => x.clientId === clientId || x.client_id === clientId);
    assert(ownAlertsBeforePaid.some(x => String(x.loanId || x.loan_id) === String(second.body.id) && x.type === 'DUE_TOMORROW'), 'Préstamo que vence mañana no generó DUE_TOMORROW', ownAlertsBeforePaid);
    assert(!ownAlertsBeforePaid.some(x => String(x.loanId || x.loan_id) === String(first.body.id)), 'Préstamo a 8 días generó alerta', ownAlertsBeforePaid);

    const overpay = await call(loanController.registerPayment, { body: { loanId: second.body.id, amount: 343 }, user });
    assert(overpay.statusCode === 400, 'Sobrepago no fue rechazado', overpay.body);
    const finish = await call(loanController.registerPayment, { body: { loanId: second.body.id, amount: 342 }, user });
    assert(finish.statusCode === 201 && finish.body.loan.status === 'PAID', 'Pago total no marcó solo B como PAID', finish.body);
    a = (await pool.query(`SELECT status FROM loans WHERE id=$1`, [first.body.id])).rows[0];
    assert(a.status !== 'PAID', 'Finalizar B modificó estado A', a);

    const invalid = await call(loanController.createClientAndLoan, { body: { ...base, capital: -1 }, user });
    assert(invalid.statusCode === 422, 'Capital negativo no fue rechazado', invalid.body);
    const badDate = await call(loanController.createClientAndLoan, { body: { ...base, capital: 100, dueDate: '2000-01-01' }, user });
    assert(badDate.statusCode === 422, 'Fecha inválida no fue rechazada', badDate.body);

    const concurrent = await call(loanController.createClientAndLoan, { body: { ...base, capital: 100, interestRate: 20, dueDate: dates[0].later }, user });
    assert(concurrent.statusCode === 201, 'No creó préstamo de concurrencia', concurrent.body); createdLoanIds.push(String(concurrent.body.id));
    const concurrentResults = await Promise.all([
      call(loanController.registerPayment, { body: { loanId: concurrent.body.id, amount: 30 }, user }),
      call(loanController.registerPayment, { body: { loanId: concurrent.body.id, amount: 50 }, user }),
    ]);
    assert(concurrentResults.every(x => x.statusCode === 201), 'Falló pago concurrente', concurrentResults.map(x => x.body));
    const concurrentLoan = (await pool.query(`SELECT paid_amount,remaining_amount FROM loans WHERE id=$1`, [concurrent.body.id])).rows[0];
    assert(money(concurrentLoan.paid_amount) === 80 && money(concurrentLoan.remaining_amount) === 40, 'Lost update concurrente', concurrentLoan);

    const alertsAfterPaid = await call(loanController.getAlerts, { query: {}, user });
    const ownAlertsAfterPaid = alertsAfterPaid.body.filter(x => x.clientId === clientId || x.client_id === clientId);
    assert(!ownAlertsAfterPaid.some(x => String(x.loanId || x.loan_id) === String(second.body.id)), 'Préstamo PAID siguió generando alerta', ownAlertsAfterPaid);

    results.multipleLoans = { count: loansForClient.body.length, distinctIds: true };
    results.flexiblePaymentsA = { paid: 42.5, remaining: 1157.5, afterRevertPaid: 35, afterRevertRemaining: 1165 };
    results.independentLoanB = { after18Paid: 18, after18Remaining: 342, finalStatus: 'PAID' };
    results.overpaymentRejected = true;
    results.concurrentPayments = { paid: 80, remaining: 40 };
    results.invalidInputsRejected = true;
    results.alertsPerLoan = { dueTomorrowIncluded: true, beyondOneDayExcluded: true, paidExcluded: true };
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await pool.query(`DELETE FROM payments WHERE client_id::text=$1`, [clientId]);
    await pool.query(`DELETE FROM loans WHERE client_id::text=$1`, [clientId]);
    await pool.query(`DELETE FROM clients WHERE id::text=$1 AND name=$2`, [clientId, clientName]);
    const cleanup = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM clients WHERE id::text=$1)::int clients,
        (SELECT COUNT(*) FROM loans WHERE client_id::text=$1)::int loans,
        (SELECT COUNT(*) FROM payments WHERE client_id::text=$1)::int payments
    `, [clientId]);
    console.log(JSON.stringify({ cleanup: cleanup.rows[0] }));
    await pool.end();
  }
}
main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });