import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import pool from '../config/db.js';
import controller from './loanController.js';

const migrationPath = new URL('../../migrations/20261008_add_money_methods.sql', import.meta.url);
const migration = () => existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : '';
const res = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test('migration is repeatable, preserves historical nulls and rejects unsupported methods', async t => {
  const db = new PGlite({ parsers: { 1082: value => value } }); t.after(() => db.close());
  await db.exec(`CREATE TABLE loans (id TEXT PRIMARY KEY, capital NUMERIC, start_date DATE);
    CREATE TABLE payments (id TEXT PRIMARY KEY, amount NUMERIC, payment_date DATE);
    INSERT INTO loans VALUES ('old-loan', 90, '2024-03-01');
    INSERT INTO payments VALUES ('old-payment', 110, '2024-03-16');`);
  await db.exec(migration());
  const columns = await db.query(`SELECT column_name FROM information_schema.columns WHERE column_name IN ('disbursement_method','payment_method') ORDER BY column_name`);
  assert.deepEqual(columns.rows.map(r => r.column_name), ['disbursement_method', 'payment_method']);
  await db.exec(migration());
  assert.deepEqual((await db.query('SELECT * FROM loans')).rows, [{ id: 'old-loan', capital: '90', start_date: '2024-03-01', disbursement_method: null }]);
  assert.equal((await db.query('SELECT payment_method FROM payments')).rows[0].payment_method, null);
  await assert.rejects(db.exec(`UPDATE loans SET disbursement_method = 'CARD'`), /check constraint/i);
  await assert.rejects(db.exec(`UPDATE payments SET payment_method = 'CARD'`), /check constraint/i);
});

test('PostgreSQL roundtrip: distinct loan/payment methods, dates, edits and combined history filters', async t => {
  const db = new PGlite({ parsers: { 1082: value => value } }); t.after(() => db.close());
  const source = readFileSync(new URL('../config/initDb.js', import.meta.url), 'utf8');
  for (const match of source.matchAll(/CREATE TABLE IF NOT EXISTS [\s\S]*?\n      \)/g)) await db.exec(match[0]);
  for (const match of source.matchAll(/await safeAddColumn\('([^']+)', '([^']+)', (?:'([^']*)'|"([^"]*)")\)/g)) {
    await db.exec(`ALTER TABLE ${match[1]} ADD COLUMN IF NOT EXISTS ${match[2]} ${match[3] ?? match[4]}`);
  }
  await db.exec(`ALTER TABLE loans ADD COLUMN operation_number TEXT DEFAULT 'OP-000101';
    INSERT INTO users (id,name,email,password_hash,role) VALUES ('admin','Admin','test@example.test','test','ADMIN'),('other','Other','other@example.test','test','COBRADOR');
    INSERT INTO clients (id,name,phone,address) VALUES ('c1','Ana','999999999','Lima');`);
  await db.exec(migration());
  const originals = { query: pool.query, connect: pool.connect };
  pool.query = (sql, params) => db.query(sql, params);
  pool.connect = async () => ({ query: pool.query, release() {} });
  t.after(() => { pool.query = originals.query; pool.connect = originals.connect; });
  const user = { id: 'admin', role: 'ADMIN' };
  for (const [delivery, payment] of [['YAPE', 'CASH'], ['CASH', 'YAPE']]) {
    const created = res();
    await controller.createClientAndLoan({ user, body: { clientId: 'c1', capital: 100, interestRate: 20, paymentDays: 20,
      startDate: '2026-10-01', dueDate: '2026-10-21', disbursementMethod: delivery } }, created);
    assert.equal(created.statusCode, 201);
    assert.equal(created.body.disbursementMethod, delivery);
    const paid = res();
    await controller.registerPayment({ user, body: { loanId: created.body.id, amount: 80, payment_date: '2026-10-06', paymentMethod: payment } }, paid);
    assert.equal(paid.statusCode, 201);
    assert.equal(paid.body.payment.paymentMethod, payment);
    assert.equal(paid.body.loan.disbursementMethod, delivery);
  }
  // Simulate reload via the actual GET handlers and SQL, not the creation response.
  const loans = res(); await controller.getLoans({ user, query: {} }, loans);
  assert.deepEqual(loans.body.map(l => l.disbursementMethod).sort(), ['CASH', 'YAPE']);
  for (const method of ['YAPE', 'CASH']) {
    const history = res();
    await controller.getPaymentHistory({ user, query: { start_date: '2026-10-01', end_date: '2026-10-06', collector_id: 'admin', payment_method: method } }, history);
    assert.equal(history.body.length, 1);
    assert.equal(history.body[0].paymentMethod, method);
    assert.equal(history.body[0].loanStartDate, '2026-10-01');
    assert.equal(history.body[0].payment_date, '2026-10-06');
    assert.equal(history.body[0].amount, 80);
  }
  for (const query of [{ start_date: '2026-10-07' }, { end_date: '2026-10-05' }, { collector_id: 'other' }]) {
    const history = res(); await controller.getPaymentHistory({ user, query }, history);
    assert.equal(history.body.length, 0);
  }
  const all = res(); await controller.getPaymentHistory({ user, query: {} }, all);
  const edited = res(); await controller.updatePayment({ user, params: { id: all.body[0].id }, body: { paymentMethod: 'CASH' } }, edited);
  assert.equal(edited.statusCode, 200);
  assert.equal(edited.body.payment.paymentMethod, 'CASH');
  assert.equal(edited.body.payment.amount, 80);
  assert.equal(edited.body.payment.payment_date, '2026-10-06');

  // Old records without civil payment dates still belong to their stored Lima day.
  await db.query(`UPDATE payments SET payment_date = NULL, date = NULL,
    created_at = '2026-10-07 03:00:00' WHERE id = $1`, [all.body[0].id]);
  const beforeMidnight = res();
  await controller.getPaymentHistory({ user, query: { start_date: '2026-10-06', end_date: '2026-10-06' } }, beforeMidnight);
  assert.equal(beforeMidnight.body.length, 2);
  assert.equal(beforeMidnight.body.find(p => p.id === all.body[0].id).payment_date, '2026-10-06');
  const nextDay = res();
  await controller.getPaymentHistory({ user, query: { start_date: '2026-10-07', end_date: '2026-10-07' } }, nextDay);
  assert.equal(nextDay.body.length, 0);
  await db.exec(`ALTER TABLE payments ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'UTC'`);
  const timezoneAware = res();
  await controller.getPaymentHistory({ user, query: { start_date: '2026-10-06', end_date: '2026-10-06' } }, timezoneAware);
  assert.equal(timezoneAware.body.length, 2);
  const reloaded = res(); await controller.getPayments({ user }, reloaded);
  assert.equal(reloaded.body.find(p => p.id === all.body[0].id).payment_date, '2026-10-06');
  const legacyEdit = res();
  await controller.updatePayment({ user, params: { id: all.body[0].id }, body: { paymentMethod: 'YAPE' } }, legacyEdit);
  assert.equal(legacyEdit.body.payment.payment_date, '2026-10-06');
});
