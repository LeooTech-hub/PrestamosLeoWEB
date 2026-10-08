import test from 'node:test';
import assert from 'node:assert/strict';

import pool from '../config/db.js';
import loanController from './loanController.js';

const RESTRICTED_MESSAGE = 'Este cliente está restringido. Un administrador debe quitar la restricción antes de registrar un nuevo préstamo.';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function validBody(overrides = {}) {
  return {
    clientId: 'client-1', name: 'Juan', phone: '999999999', address: 'Lima',
    amount: 500, interestRate: 20, paymentDays: 20, paymentFrequency: 'DAILY',
    startDate: '2026-10-05', dueDate: '2026-10-25', disbursementMethod: 'YAPE', ...overrides,
  };
}

function installFakeConnection(t, queryHandler) {
  const originalConnect = pool.connect;
  const calls = [];
  const connection = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      return queryHandler(String(sql), params, calls);
    },
    release() {},
  };
  pool.connect = async () => connection;
  t.after(() => { pool.connect = originalConnect; });
  return calls;
}

test('rejects a restricted client selected by id before inserting a loan', async (t) => {
  const calls = installFakeConnection(t, async (sql) => {
    if (/SELECT id, name/i.test(sql)) return { rows: [{ id: 'client-1', name: 'Juan', is_restricted: true }] };
    return { rows: [] };
  });
  const res = responseRecorder();

  await loanController.createClientAndLoan({ body: validBody(), user: { id: 'admin-1', role: 'ADMIN' } }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, RESTRICTED_MESSAGE);
  assert.equal(calls.some((call) => /INSERT INTO loans/i.test(call.sql)), false);
});

test('rejects a restricted existing client resolved by identity before inserting a loan', async (t) => {
  const calls = installFakeConnection(t, async (sql) => {
    if (/FROM clients[\s\S]*regexp_replace/i.test(sql)) {
      return { rows: [{ id: 'client-2', name: 'Ana', is_restricted: true }] };
    }
    return { rows: [] };
  });
  const res = responseRecorder();

  await loanController.createClientAndLoan({
    body: validBody({ clientId: undefined, dni: '12345678', name: 'Ana' }),
    user: { id: 'admin-1', role: 'ADMIN' },
  }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, RESTRICTED_MESSAGE);
  assert.equal(calls.some((call) => /INSERT INTO loans/i.test(call.sql)), false);
});
