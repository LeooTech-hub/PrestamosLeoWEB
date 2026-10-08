import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../config/db.js';
import controller from './loanController.js';

const loan = { id: 'loan-1', client_id: 'client-1', client_name: 'Ana', capital: 100,
  total_to_pay: 120, payment_days: 20, daily_payment_amount: 6, start_date: '2026-10-01',
  due_date: '2026-10-21', status: 'ACTIVE', operation_number: 'OP-000101' };
const body = { clientId: 'client-1', capital: 100, interestRate: 20, paymentDays: 20,
  startDate: '2026-10-01', dueDate: '2026-10-21' };
const user = { id: 'admin-1', role: 'ADMIN' };
const response = () => ({ statusCode: 200, body: null,
  status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } });

// Only the external database boundary is replaced. Exercise real controller validation,
// parameterized writes and response mapping; re-read the rows captured from INSERT.
function database(t) {
  const original = { connect: pool.connect, query: pool.query };
  const state = { loan: { ...loan }, payments: [], calls: [] };
  const query = async (sql, params = []) => {
    state.calls.push({ sql, params });
    if (/INSERT INTO (loans|payments)/.test(sql)) {
      const table = /INSERT INTO (\w+)/.exec(sql)[1];
      const columns = /INSERT INTO \w+\s*\(([^)]+)\)/.exec(sql)[1].split(',').map(s => s.trim());
      const values = /VALUES\s*\(([^)]+)\)/.exec(sql)[1].split(',').map(s => s.trim());
      const row = Object.fromEntries(columns.map((c, i) => [c, values[i].startsWith('$') ? params[Number(values[i].slice(1)) - 1] : Number(values[i])]));
      if (table === 'loans') state.loan = row; else state.payments.push(row);
      return { rows: [row] };
    }
    if (/SELECT id, name/.test(sql)) return { rows: [{ id: 'client-1', name: 'Ana', is_restricted: false }] };
    if (/SELECT phone, address/.test(sql)) return { rows: [{ phone: '999999999', address: 'Lima' }] };
    if (/AS today/.test(sql)) return { rows: [{ today: '2026-10-06' }] };
    if (/SUM\(amount\)/.test(sql) && !/UPDATE loans/.test(sql)) return { rows: [{ paid_amount: 0 }] };
    if (/FROM payments/.test(sql) && !/UPDATE loans/.test(sql)) return { rows: state.payments.map(p => ({ ...p, loan_start_date: state.loan.start_date })) };
    if (/FROM loans|UPDATE loans/.test(sql)) return { rows: [state.loan] };
    return { rows: [] };
  };
  pool.connect = async () => ({ query, release() {} });
  pool.query = query;
  t.after(() => { pool.connect = original.connect; pool.query = original.query; });
  return state;
}

for (const value of [undefined, '', null, 'CARD']) {
  test(`loan creation rejects missing/invalid disbursement method ${value}`, async t => {
    const state = database(t); const res = response();
    await controller.createClientAndLoan({ body: { ...body, disbursementMethod: value }, user }, res);
    assert.equal(res.statusCode, 422);
    assert.match(res.body.error, /método de entrega/i);
    assert.equal(state.calls.some(c => /INSERT INTO (loans|clients)/.test(c.sql)), false);
  });
  test(`payment registration rejects missing/invalid payment method ${value}`, async t => {
    const state = database(t); const res = response();
    await controller.registerPayment({ body: { loanId: 'loan-1', amount: 6, paymentMethod: value }, user }, res);
    assert.equal(res.statusCode, 422);
    assert.match(res.body.error, /método de pago/i);
    assert.equal(state.calls.some(c => /INSERT INTO payments|UPDATE loans/.test(c.sql)), false);
  });
}

for (const method of ['YAPE', 'CASH']) {
  test(`loan ${method} is stored and survives a subsequent GET`, async t => {
    const state = database(t); const res = response();
    await controller.createClientAndLoan({ body: { ...body, disbursement_method: method }, user }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(state.loan.disbursement_method, method);
    assert.equal(res.body.disbursementMethod, method);
    const read = response(); await controller.getLoans({ query: {}, user }, read);
    assert.equal(read.body[0].disbursement_method, method);
  });
  test(`payment ${method} is stored and history preserves both dates and amount`, async t => {
    const state = database(t); const res = response();
    await controller.registerPayment({ body: { loanId: 'loan-1', amount: 6, payment_method: method }, user }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(state.payments[0].payment_method, method);
    assert.equal(res.body.payment.paymentMethod, method);
    const read = response(); await controller.getPaymentHistory({ query: {}, user }, read);
    assert.equal(read.body[0].payment_method, method);
    assert.equal(read.body[0].loanStartDate, '2026-10-01');
    assert.equal(read.body[0].payment_date, '2026-10-06');
    assert.equal(read.body[0].amount, 6);
  });
}

test('historical records keep null methods and never invent a payment date', async t => {
  const state = database(t); state.payments.push({ id: 'old', amount: 80 });
  const loans = response(); await controller.getLoans({ query: {}, user }, loans);
  assert.equal(loans.body[0].disbursementMethod, null);
  const payments = response(); await controller.getPaymentHistory({ query: {}, user }, payments);
  assert.equal(payments.body[0].paymentMethod, null);
  assert.equal(payments.body[0].date, null);
});

test('history combines date, collector and method in parameterized SQL and joins loan start date', async t => {
  const state = database(t); const res = response();
  await controller.getPaymentHistory({ query: { start_date: '2026-10-01', end_date: '2026-10-06', collector_id: 'c-1', payment_method: 'YAPE' }, user }, res);
  const { sql, params } = state.calls[0];
  assert.match(sql, /l.start_date AS loan_start_date/);
  assert.match(sql, /COALESCE\(p.payment_date, p.date[\s\S]*? >= \$1/);
  assert.match(sql, /COALESCE\(p.payment_date, p.date[\s\S]*? <= \$2/);
  assert.match(sql, /p.collected_by_user_id::text = \$3/);
  assert.match(sql, /p.payment_method = \$4/);
  assert.deepEqual(params, ['2026-10-01', '2026-10-06', 'c-1', 'YAPE']);
});

test('collector history remains scoped to the authenticated collector', async t => {
  const state = database(t); const res = response();
  await controller.getPaymentHistory({ query: { collector_id: 'other' }, user: { id: 'self', role: 'COBRADOR' } }, res);
  assert.deepEqual(state.calls[0].params, ['self']);
});

test('history rejects impossible calendar dates before querying PostgreSQL', async t => {
  const state = database(t); const res = response();
  await controller.getPaymentHistory({ query: { start_date: '2026-02-31' }, user }, res);
  assert.equal(res.statusCode, 422);
  assert.equal(state.calls.length, 0);
});
