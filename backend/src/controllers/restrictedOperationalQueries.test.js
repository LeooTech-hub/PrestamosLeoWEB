import test from 'node:test';
import assert from 'node:assert/strict';

import pool from '../config/db.js';
import loanController, { buildDashboardSummary } from './loanController.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function capturePoolQueries(t, action) {
  const originalQuery = pool.query;
  const calls = [];
  pool.query = async (sql) => {
    calls.push(String(sql));
    return { rows: [] };
  };
  t.after(() => { pool.query = originalQuery; });
  await action();
  return calls;
}

test('today collections excludes restricted clients in SQL', async (t) => {
  const res = responseRecorder();
  const calls = await capturePoolQueries(t, () => loanController.getTodayCollections({}, res));
  assert.equal(res.statusCode, 200);
  assert.match(calls[0], /COALESCE\(c\.is_restricted, FALSE\) = FALSE/i);
});

test('alerts exclude restricted clients before notification generation', async (t) => {
  const res = responseRecorder();
  const calls = await capturePoolQueries(t, () => loanController.getAlerts({ user: { id: 'admin-1', role: 'ADMIN' } }, res));
  assert.equal(res.statusCode, 200);
  assert.match(calls[0], /COALESCE\(c\.is_restricted, FALSE\) = FALSE/i);
});

test('dashboard loan metrics exclude restricted clients', async () => {
  const calls = [];
  const db = {
    async query(sql) {
      calls.push(String(sql));
      if (/business_date/i.test(sql)) return { rows: [{ total: 0, business_date: '2026-10-05' }] };
      return { rows: [] };
    },
  };
  await buildDashboardSummary(db);
  assert.match(calls[0], /COALESCE\(c\.is_restricted, FALSE\) = FALSE/i);
});

test('financial report keeps restricted historical loans and payments', async (t) => {
  const res = responseRecorder();
  const calls = await capturePoolQueries(t, () => loanController.getFinancialReport({ query: {} }, res));
  assert.equal(res.statusCode, 200);
  assert.match(calls[0], /SELECT \* FROM loans/i);
  assert.doesNotMatch(calls.join('\n'), /is_restricted/i);
});
