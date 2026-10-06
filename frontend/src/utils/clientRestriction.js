export const RESTRICTED_CLIENT_LOAN_MESSAGE = 'Este cliente está restringido. Un administrador debe quitar la restricción antes de registrar un nuevo préstamo.';

export function isClientRestricted(client) {
  const value = client?.isRestricted ?? client?.is_restricted ?? false;
  return value === true || value === 1 || String(value).toLowerCase() === 'true';
}

export function filterClientsByRestriction(clients, scope = 'ALL') {
  const normalizedScope = String(scope || 'ALL').toUpperCase();
  if (normalizedScope === 'ACTIVE') return (clients || []).filter((client) => !isClientRestricted(client));
  if (normalizedScope === 'RESTRICTED') return (clients || []).filter(isClientRestricted);
  return [...(clients || [])];
}

export function availableLoanClients(clients) {
  return filterClientsByRestriction(clients, 'ACTIVE');
}

export function isLoanClientRestricted(loan) {
  const value = loan?.clientIsRestricted ?? loan?.client_is_restricted ?? false;
  return value === true || value === 1 || String(value).toLowerCase() === 'true';
}

export function filterLoansByRestriction(loans, scope = 'ACTIVE') {
  const normalizedScope = String(scope || 'ACTIVE').toUpperCase();
  if (normalizedScope === 'RESTRICTED') return (loans || []).filter(isLoanClientRestricted);
  if (normalizedScope === 'ALL') return [...(loans || [])];
  return (loans || []).filter((loan) => !isLoanClientRestricted(loan));
}
