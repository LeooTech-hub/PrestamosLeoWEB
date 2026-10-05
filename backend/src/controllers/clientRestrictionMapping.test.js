import test from 'node:test';
import assert from 'node:assert/strict';

import { mapRowToClient } from './loanController.js';

test('maps a restricted client without changing its financial fields', () => {
  const row = {
    id: 'client-1',
    name: 'Juan Pérez',
    is_restricted: true,
    restricted_at: '2026-10-05T15:00:00.000Z',
    restricted_by: 'admin-1',
    restriction_reason: 'deuda incobrable',
    loan_remaining_amount: '650.00',
    loan_status: 'OVERDUE',
  };

  const client = mapRowToClient(row);

  assert.equal(client.isRestricted, true);
  assert.equal(client.is_restricted, true);
  assert.equal(client.restrictedAt, '2026-10-05T15:00:00.000Z');
  assert.equal(client.restricted_at, '2026-10-05T15:00:00.000Z');
  assert.equal(client.restrictedBy, 'admin-1');
  assert.equal(client.restricted_by, 'admin-1');
  assert.equal(client.restrictionReason, 'deuda incobrable');
  assert.equal(client.restriction_reason, 'deuda incobrable');
  assert.equal(client.remainingAmount, 650);
  assert.equal(client.status, 'ACTIVE');
});

test('maps a legacy client as unrestricted', () => {
  const client = mapRowToClient({ id: 'client-2', name: 'Ana' });

  assert.equal(client.isRestricted, false);
  assert.equal(client.is_restricted, false);
  assert.equal(client.restrictedAt, null);
  assert.equal(client.restrictedBy, null);
  assert.equal(client.restrictionReason, null);
});
