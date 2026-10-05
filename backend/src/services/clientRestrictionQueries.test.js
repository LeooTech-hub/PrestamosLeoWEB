import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRestrictionScope, restrictionSql } from './clientRestrictionQueries.js';

test('defaults loan visibility to non-restricted clients', () => {
  assert.equal(parseRestrictionScope(undefined), 'active');
  assert.equal(parseRestrictionScope(''), 'active');
  assert.equal(restrictionSql('active', 'c'), 'COALESCE(c.is_restricted, FALSE) = FALSE');
});

test('supports restricted and all historical scopes', () => {
  assert.equal(parseRestrictionScope('restricted'), 'restricted');
  assert.equal(parseRestrictionScope('RESTRICTED'), 'restricted');
  assert.equal(parseRestrictionScope('all'), 'all');
  assert.equal(restrictionSql('restricted', 'client'), 'COALESCE(client.is_restricted, FALSE) = TRUE');
  assert.equal(restrictionSql('all', 'client'), null);
});

test('rejects invalid restriction scopes and unsafe SQL aliases', () => {
  assert.throws(() => parseRestrictionScope('unknown'), (error) => error.statusCode === 422);
  assert.throws(() => restrictionSql('active', 'c; DROP TABLE clients'), /Alias SQL inválido/);
});
