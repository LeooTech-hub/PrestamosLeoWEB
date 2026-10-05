import test from 'node:test';
import assert from 'node:assert/strict';

import { setClientRestriction } from './clientRestrictionService.js';

function createDb(existingClient) {
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      if (/SELECT c\.\*,/i.test(sql)) return { rows: existingClient ? [existingClient] : [] };
      if (/UPDATE clients/i.test(sql)) {
        return {
          rows: [{
            ...existingClient,
            is_restricted: params[0],
            restricted_at: params[0] ? '2026-10-05T20:00:00.000Z' : null,
            restricted_by: params[0] ? params[1] : null,
            restriction_reason: params[0] ? params[2] : null,
          }],
        };
      }
      return { rows: [] };
    },
    release() { calls.push({ sql: 'RELEASE', params: [] }); },
  };
  return { db: { async connect() { return client; } }, calls };
}

test('restricts a client and audits the optional reason', async () => {
  const { db, calls } = createDb({ id: 'client-1', name: 'Juan', is_restricted: false });

  const result = await setClientRestriction(db, {
    clientId: 'client-1', isRestricted: true, reason: '  deuda incobrable  ',
    adminId: 'admin-1', adminName: 'Admin', ip: '127.0.0.1',
  });

  assert.equal(result.is_restricted, true);
  assert.equal(result.restriction_reason, 'deuda incobrable');
  const update = calls.find((call) => /UPDATE clients/i.test(call.sql));
  assert.deepEqual(update.params.slice(0, 3), [true, 'admin-1', 'deuda incobrable']);
  const audit = calls.find((call) => /INSERT INTO activity_logs/i.test(call.sql));
  assert.match(audit.params[3], /deuda incobrable/);
  assert.equal(audit.params[5], 'client-1');
  assert.ok(calls.findIndex((call) => /UPDATE clients/i.test(call.sql)) < calls.findIndex((call) => /INSERT INTO activity_logs/i.test(call.sql)));
});

test('audits the previous reason before clearing all restriction metadata', async () => {
  const { db, calls } = createDb({
    id: 'client-1', name: 'Juan', is_restricted: true,
    restriction_reason: 'cliente no ubicable', restricted_by: 'admin-old',
  });

  const result = await setClientRestriction(db, {
    clientId: 'client-1', isRestricted: false,
    adminId: 'admin-2', adminName: 'Nueva Admin', ip: '127.0.0.2',
  });

  assert.equal(result.is_restricted, false);
  assert.equal(result.restricted_at, null);
  assert.equal(result.restricted_by, null);
  assert.equal(result.restriction_reason, null);
  const audit = calls.find((call) => /INSERT INTO activity_logs/i.test(call.sql));
  assert.match(audit.params[3], /cliente no ubicable/);
  assert.ok(calls.findIndex((call) => /SELECT c\.\*,/i.test(call.sql)) < calls.findIndex((call) => /UPDATE clients/i.test(call.sql)));
});

test('throws a typed not-found error without updating history', async () => {
  const { db, calls } = createDb(null);

  await assert.rejects(
    setClientRestriction(db, { clientId: 'missing', isRestricted: true, adminId: 'admin-1' }),
    (error) => error.statusCode === 404 && error.message === 'Cliente no encontrado',
  );
  assert.equal(calls.some((call) => /UPDATE clients|INSERT INTO activity_logs/i.test(call.sql)), false);
});
