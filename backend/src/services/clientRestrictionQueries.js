export class RestrictionScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RestrictionScopeError';
    this.statusCode = 422;
  }
}

export function parseRestrictionScope(value) {
  const scope = String(value ?? '').trim().toLowerCase() || 'active';
  if (!['active', 'restricted', 'all'].includes(scope)) {
    throw new RestrictionScopeError('Filtro de restricción inválido');
  }
  return scope;
}

export function restrictionSql(scope, clientAlias = 'c') {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(clientAlias)) {
    throw new Error('Alias SQL inválido');
  }
  if (scope === 'all') return null;
  if (scope === 'restricted') return `COALESCE(${clientAlias}.is_restricted, FALSE) = TRUE`;
  if (scope === 'active') return `COALESCE(${clientAlias}.is_restricted, FALSE) = FALSE`;
  throw new RestrictionScopeError('Filtro de restricción inválido');
}
