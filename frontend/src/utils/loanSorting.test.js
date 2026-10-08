import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLoanDueDateSortValue,
  compareLoansByDueDate,
  sortLoansForDisplay,
} from './loanHelpers.js';

test('Caso 1: dueDate 31/10/2026, 15/10/2026, 22/10/2026 se ordenan en 15/10/2026, 22/10/2026, 31/10/2026', () => {
  const loans = [
    { id: 'loan-1', clientName: 'Cliente A', dueDate: '31/10/2026', status: 'ACTIVE' },
    { id: 'loan-2', clientName: 'Cliente B', dueDate: '15/10/2026', status: 'ACTIVE' },
    { id: 'loan-3', clientName: 'Cliente C', dueDate: '22/10/2026', status: 'ACTIVE' },
  ];

  const sorted = sortLoansForDisplay(loans, 'ACTIVE');

  assert.deepEqual(
    sorted.map((l) => l.dueDate),
    ['15/10/2026', '22/10/2026', '31/10/2026']
  );
  assert.deepEqual(
    sorted.map((l) => l.id),
    ['loan-2', 'loan-3', 'loan-1']
  );
});

test('Caso 1 (formato ISO): 2026-10-31, 2026-10-15, 2026-10-22 se ordenan ascendentemente', () => {
  const loans = [
    { id: 'loan-1', dueDate: '2026-10-31', status: 'ACTIVE' },
    { id: 'loan-2', dueDate: '2026-10-15', status: 'ACTIVE' },
    { id: 'loan-3', dueDate: '2026-10-22', status: 'ACTIVE' },
  ];

  const sorted = sortLoansForDisplay(loans, 'ACTIVE');

  assert.deepEqual(
    sorted.map((l) => l.dueDate),
    ['2026-10-15', '2026-10-22', '2026-10-31']
  );
});

test('Caso 2: dos préstamos con la misma fecha mantienen un orden estable', () => {
  const loanA = { id: 'loan-w1', clientName: 'Walter Sebastian A', dueDate: '31/10/2026', status: 'ACTIVE', operationNumber: 'OP-001' };
  const loanB = { id: 'loan-w2', clientName: 'Walter Sebastian B', dueDate: '31/10/2026', status: 'ACTIVE', operationNumber: 'OP-002' };

  // Secuencia original A seguido de B
  const sortedAB = sortLoansForDisplay([loanA, loanB], 'ACTIVE');
  assert.equal(sortedAB[0].id, 'loan-w1');
  assert.equal(sortedAB[1].id, 'loan-w2');

  // Secuencia inversa B seguido de A mantiene su estabilidad correspondiente
  const sortedBA = sortLoansForDisplay([loanB, loanA], 'ACTIVE');
  assert.equal(sortedBA[0].id, 'loan-w2');
  assert.equal(sortedBA[1].id, 'loan-w1');
});

test('Caso 3: un préstamo sin vencimiento válido queda al final', () => {
  const loans = [
    { id: 'loan-1', clientName: 'Con fecha tardía', dueDate: '31/10/2026', status: 'ACTIVE' },
    { id: 'loan-2', clientName: 'Sin fecha de vencimiento', dueDate: null, status: 'ACTIVE' },
    { id: 'loan-3', clientName: 'Con fecha cercana', dueDate: '15/10/2026', status: 'ACTIVE' },
    { id: 'loan-4', clientName: 'Con fecha vacía', dueDate: '', status: 'ACTIVE' },
  ];

  const sorted = sortLoansForDisplay(loans, 'ACTIVE');

  assert.equal(sorted[0].id, 'loan-3'); // 15/10/2026
  assert.equal(sorted[1].id, 'loan-1'); // 31/10/2026
  assert.equal(sorted[2].id, 'loan-2'); // Sin fecha (al final en orden estable)
  assert.equal(sorted[3].id, 'loan-4'); // Sin fecha (al final en orden estable)
});

test('Caso 4: los filtros Vigentes / Mora / Cancelados y TODOS funcionan según reglas', () => {
  const loans = [
    { id: 'v1', clientName: 'Vigente Lejano', dueDate: '31/10/2026', status: 'ACTIVE' },
    { id: 'v2', clientName: 'Vigente Cercano', dueDate: '15/10/2026', status: 'ACTIVE' },
    { id: 'm1', clientName: 'Mora 1', dueDate: '01/10/2026', status: 'OVERDUE' },
    { id: 'm2', clientName: 'Mora 2', dueDate: '05/10/2026', status: 'OVERDUE' },
    { id: 'c1', clientName: 'Cancelado 1', dueDate: '20/09/2026', status: 'PAID' },
    { id: 'c2', clientName: 'Cancelado 2', dueDate: '25/09/2026', status: 'PAID' },
  ];

  // 1. Pestaña VIGENTES: solo vigentes ordenados por dueDate ASC
  const vigentesFiltered = loans.filter((l) => l.status === 'ACTIVE');
  const sortedVigentes = sortLoansForDisplay(vigentesFiltered, 'ACTIVE');
  assert.deepEqual(sortedVigentes.map((l) => l.id), ['v2', 'v1']);

  // 2. Pestaña EN MORA: conserva su orden actual
  const moraFiltered = loans.filter((l) => l.status === 'OVERDUE');
  const sortedMora = sortLoansForDisplay(moraFiltered, 'OVERDUE');
  assert.deepEqual(sortedMora.map((l) => l.id), ['m1', 'm2']);

  // 3. Pestaña CANCELADOS: conserva su orden actual
  const paidFiltered = loans.filter((l) => l.status === 'PAID');
  const sortedPaid = sortLoansForDisplay(paidFiltered, 'PAID');
  assert.deepEqual(sortedPaid.map((l) => l.id), ['c1', 'c2']);

  // 4. Pestaña TODOS: Prioridad 1º Vigentes (dueDate ASC), 2º Mora (orden actual), 3º Cancelados (orden actual)
  const sortedTodos = sortLoansForDisplay(loans, 'ALL');
  assert.deepEqual(sortedTodos.map((l) => l.id), ['v2', 'v1', 'm1', 'm2', 'c1', 'c2']);
});

test('Caso 5: los contadores de las pestañas no cambian por el ordenamiento', () => {
  const loans = [
    { id: 'l1', status: 'ACTIVE', dueDate: '31/10/2026' },
    { id: 'l2', status: 'ACTIVE', dueDate: '15/10/2026' },
    { id: 'l3', status: 'OVERDUE', dueDate: '01/10/2026' },
    { id: 'l4', status: 'PAID', dueDate: '20/09/2026' },
  ];

  const countActiveBefore = loans.filter((l) => l.status === 'ACTIVE').length;
  const countOverdueBefore = loans.filter((l) => l.status === 'OVERDUE').length;
  const countPaidBefore = loans.filter((l) => l.status === 'PAID').length;
  const countTotalBefore = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;

  const sorted = sortLoansForDisplay(loans, 'ALL');

  const countActiveAfter = sorted.filter((l) => l.status === 'ACTIVE').length;
  const countOverdueAfter = sorted.filter((l) => l.status === 'OVERDUE').length;
  const countPaidAfter = sorted.filter((l) => l.status === 'PAID').length;
  const countTotalAfter = sorted.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;

  assert.equal(countActiveBefore, countActiveAfter);
  assert.equal(countOverdueBefore, countOverdueAfter);
  assert.equal(countPaidBefore, countPaidAfter);
  assert.equal(countTotalBefore, countTotalAfter);
  assert.equal(sorted.length, loans.length);
});

test('Caso 6: no se muta el array original', () => {
  const loans = [
    { id: 'loan-1', dueDate: '31/10/2026', status: 'ACTIVE' },
    { id: 'loan-2', dueDate: '15/10/2026', status: 'ACTIVE' },
    { id: 'loan-3', dueDate: '22/10/2026', status: 'ACTIVE' },
  ];

  const snapshotBefore = [...loans];
  const sorted = sortLoansForDisplay(loans, 'ACTIVE');

  // El array retornado no es la misma referencia
  assert.notEqual(sorted, loans);

  // El array original conserva exactamente sus elementos y orden inicial
  assert.deepEqual(loans, snapshotBefore);
  assert.equal(loans[0].id, 'loan-1');
  assert.equal(loans[1].id, 'loan-2');
  assert.equal(loans[2].id, 'loan-3');
});

test('Ejemplo real del usuario: Fidel (15/10/2026, 8 días) aparece antes que Walter (31/10/2026, 24 días)', () => {
  const realLoans = [
    {
      id: 'walter-1',
      clientName: 'WALTER SEBASTIAN...',
      dueDate: '2026-10-31',
      status: 'ACTIVE',
      operationNumber: 'OP-000001',
    },
    {
      id: 'walter-2',
      clientName: 'WALTER SEBASTIAN...',
      dueDate: '2026-10-31',
      status: 'ACTIVE',
      operationNumber: 'OP-000002',
    },
    {
      id: 'fidel',
      clientName: 'FIDEL CHRISTOPHER...',
      dueDate: '2026-10-15',
      status: 'ACTIVE',
      operationNumber: 'OP-000003',
    },
  ];

  const sorted = sortLoansForDisplay(realLoans, 'ACTIVE');

  assert.equal(sorted[0].id, 'fidel');
  assert.equal(sorted[0].clientName, 'FIDEL CHRISTOPHER...');
  assert.equal(sorted[0].dueDate, '2026-10-15');

  assert.equal(sorted[1].id, 'walter-1');
  assert.equal(sorted[1].dueDate, '2026-10-31');

  assert.equal(sorted[2].id, 'walter-2');
  assert.equal(sorted[2].dueDate, '2026-10-31');
});

test('Compatibilidad con campos alternativos: due_date, fecha_vencimiento, vencimiento y cálculo por startDate', () => {
  const l1 = { id: 'l1', due_date: '2026-10-31', status: 'ACTIVE' };
  const l2 = { id: 'l2', fecha_vencimiento: '2026-10-15', status: 'ACTIVE' };
  const l3 = { id: 'l3', vencimiento: '2026-10-22', status: 'ACTIVE' };
  const l4 = { id: 'l4', startDate: '2026-10-01', paymentDays: 9, status: 'ACTIVE' }; // vence 2026-10-10

  const sorted = sortLoansForDisplay([l1, l2, l3, l4], 'ACTIVE');

  assert.deepEqual(
    sorted.map((l) => l.id),
    ['l4', 'l2', 'l3', 'l1'] // 10/10, 15/10, 22/10, 31/10
  );
});
