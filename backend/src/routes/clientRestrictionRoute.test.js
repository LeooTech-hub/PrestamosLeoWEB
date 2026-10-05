import test from 'node:test';
import assert from 'node:assert/strict';

import pool from '../config/db.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import router from './apiRoutes.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('registers restriction endpoint behind token and database-backed admin middleware', () => {
  const layer = router.stack.find((entry) => entry.route?.path === '/clients/:id/restriction');
  assert.ok(layer, 'restriction route must be registered');
  assert.deepEqual(layer.route.methods, { put: true });
  assert.deepEqual(layer.route.stack.map((entry) => entry.handle.name), ['verifyToken', 'requireAdmin', 'setClientRestriction']);
});

test('rejects a collector even when the token payload claims ADMIN', async (t) => {
  const originalQuery = pool.query;
  t.after(() => { pool.query = originalQuery; });
  pool.query = async () => ({ rows: [{ role: 'COBRADOR' }] });
  const req = { user: { id: 'user-1', role: 'ADMIN' } };
  const res = responseRecorder();
  let nextCalled = false;

  await requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: 'Acceso restringido a administradores' });
});

test('allows a user whose current database role is ADMIN', async (t) => {
  const originalQuery = pool.query;
  t.after(() => { pool.query = originalQuery; });
  pool.query = async () => ({ rows: [{ role: 'ADMIN' }] });
  const req = { user: { id: 'admin-1', role: 'COBRADOR' } };
  const res = responseRecorder();
  let nextCalled = false;

  await requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
