import test from 'node:test';
import assert from 'node:assert/strict';

import { filterClientsByRestriction, isClientRestricted } from './clientRestriction.js';

const clients = [
  { id: 'a', name: 'Activo' },
  { id: 'b', name: 'Restringido', isRestricted: true },
  { id: 'c', name: 'Snake', is_restricted: true },
];

test('normalizes client restriction booleans without restricting legacy rows', () => {
  assert.equal(isClientRestricted(clients[0]), false);
  assert.equal(isClientRestricted(clients[1]), true);
  assert.equal(isClientRestricted(clients[2]), true);
  assert.equal(isClientRestricted({ is_restricted: 'true' }), true);
  assert.equal(isClientRestricted(null), false);
});

test('filters clients independently from loan status and preserves order', () => {
  assert.deepEqual(filterClientsByRestriction(clients, 'ALL').map((client) => client.id), ['a', 'b', 'c']);
  assert.deepEqual(filterClientsByRestriction(clients, 'ACTIVE').map((client) => client.id), ['a']);
  assert.deepEqual(filterClientsByRestriction(clients, 'RESTRICTED').map((client) => client.id), ['b', 'c']);
  assert.deepEqual(filterClientsByRestriction(clients, 'UNKNOWN').map((client) => client.id), ['a', 'b', 'c']);
});
