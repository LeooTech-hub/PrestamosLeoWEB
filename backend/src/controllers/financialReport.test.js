import test from 'node:test';
import assert from 'node:assert/strict';
import loanController, { calculateRealizedFinancialMetrics } from './loanController.js';
import pool from '../config/db.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

// =========================================================================
// PRUEBAS OBLIGATORIAS: REGLAS DE NEGOCIO DE "COMISIÓN REALIZADA"
// =========================================================================

test('Caso 1: Préstamo 300 + 60 = 360 completado hoy -> Comisión realizada = 60', () => {
  const today = '2026-10-06';
  const loans = [{
    id: 'loan-caso-1',
    capital: 300,
    interest_amount: 60,
    total_to_pay: 360
  }];
  const payments = [{
    id: 'pay-1',
    loan_id: 'loan-caso-1',
    amount: 360,
    payment_date: today
  }];

  const metrics = calculateRealizedFinancialMetrics({
    loans,
    payments,
    startDate: today,
    endDate: today
  });

  assert.equal(metrics.commissionRealized, 60, 'La comisión realizada debe ser exactamente S/. 60');
  assert.equal(metrics.realCollected, 360, 'El efectivo cobrado en caja debe ser S/. 360');
  assert.equal(metrics.grossProfit, 60, 'La ganancia bruta debe ser S/. 60');
  assert.equal(metrics.principalCollected, 300, 'El capital recuperado debe mantenerse separado en S/. 300');
});

test('Caso 2: Mismo préstamo completado ayer -> Reporte de hoy: Comisión realizada = 0', () => {
  const yesterday = '2026-10-05';
  const today = '2026-10-06';
  const loans = [{
    id: 'loan-caso-2',
    capital: 300,
    interest_amount: 60,
    total_to_pay: 360
  }];
  const payments = [{
    id: 'pay-2',
    loan_id: 'loan-caso-2',
    amount: 360,
    payment_date: yesterday
  }];

  const metrics = calculateRealizedFinancialMetrics({
    loans,
    payments,
    startDate: today,
    endDate: today
  });

  assert.equal(metrics.commissionRealized, 0, 'No debe reconocerse comisión en el reporte de hoy si se canceló ayer');
  assert.equal(metrics.realCollected, 0, 'No hubo cobranza hoy');
  assert.equal(metrics.grossProfit, 0, 'Ganancia bruta de hoy debe ser 0');
});

test('Caso 3: Préstamo parcialmente pagado -> Comisión realizada = 0', () => {
  const today = '2026-10-06';
  const loans = [{
    id: 'loan-caso-3',
    capital: 300,
    interest_amount: 60,
    total_to_pay: 360
  }];
  const payments = [{
    id: 'pay-3',
    loan_id: 'loan-caso-3',
    amount: 180,
    payment_date: today
  }];

  const metrics = calculateRealizedFinancialMetrics({
    loans,
    payments,
    startDate: today,
    endDate: today
  });

  assert.equal(metrics.commissionRealized, 0, 'Un préstamo parcialmente pagado no debe reconocer comisión realizada');
  assert.equal(metrics.realCollected, 180, 'El recaudo real en caja debe reflejar los S/. 180 abonados');
  assert.equal(metrics.grossProfit, 0, 'Ganancia bruta debe ser 0 al no haberse liquidado');
});

test('Caso 4: Dos préstamos completados hoy (comisión 60 + comisión 50) -> Comisión realizada = 110', () => {
  const today = '2026-10-06';
  const loans = [
    {
      id: 'loan-caso-4a',
      capital: 300,
      interest_amount: 60,
      total_to_pay: 360
    },
    {
      id: 'loan-caso-4b',
      capital: 250,
      interest_amount: 50,
      total_to_pay: 300
    }
  ];
  const payments = [
    {
      id: 'pay-4a',
      loan_id: 'loan-caso-4a',
      amount: 360,
      payment_date: today
    },
    {
      id: 'pay-4b',
      loan_id: 'loan-caso-4b',
      amount: 300,
      payment_date: today
    }
  ];

  const metrics = calculateRealizedFinancialMetrics({
    loans,
    payments,
    startDate: today,
    endDate: today
  });

  assert.equal(metrics.commissionRealized, 110, 'La comisión realizada sumada debe ser 60 + 50 = S/. 110');
  assert.equal(metrics.realCollected, 660, 'Cobranza total en caja debe ser S/. 660');
  assert.equal(metrics.grossProfit, 110, 'Ganancia bruta debe ser S/. 110');
});

test('Caso 5: Préstamo completado hoy con mora cobrada de 10 -> Ganancia bruta = comisión + 10', () => {
  const today = '2026-10-06';
  const loans = [{
    id: 'loan-caso-5',
    capital: 300,
    interest_amount: 60,
    penalty_amount: 10,
    total_to_pay: 370
  }];
  const payments = [{
    id: 'pay-5',
    loan_id: 'loan-caso-5',
    amount: 370,
    payment_date: today
  }];

  const metrics = calculateRealizedFinancialMetrics({
    loans,
    payments,
    startDate: today,
    endDate: today
  });

  assert.equal(metrics.commissionRealized, 60, 'Comisión realizada debe ser S/. 60');
  assert.equal(metrics.totalMoras, 10, 'Mora cobrada debe ser S/. 10');
  assert.equal(metrics.grossProfit, 70, 'Ganancia bruta debe ser comisión + mora = 60 + 10 = S/. 70');
});

test('Caso 6: Gasto de 25 en el mismo período. Si grossProfit = 110 -> netProfit = 85', () => {
  const today = '2026-10-06';
  const loans = [
    { id: 'loan-6a', capital: 300, interest_amount: 60, total_to_pay: 360 },
    { id: 'loan-6b', capital: 250, interest_amount: 50, total_to_pay: 300 }
  ];
  const payments = [
    { id: 'pay-6a', loan_id: 'loan-6a', amount: 360, payment_date: today },
    { id: 'pay-6b', loan_id: 'loan-6b', amount: 300, payment_date: today }
  ];
  const expenses = [
    { id: 'exp-6', amount: 25, expense_date: today, description: 'Combustible' }
  ];

  const metrics = calculateRealizedFinancialMetrics({
    loans,
    payments,
    expenses,
    startDate: today,
    endDate: today
  });

  assert.equal(metrics.grossProfit, 110, 'Ganancia bruta debe ser S/. 110');
  assert.equal(metrics.totalExpenses, 25, 'Total de gastos operativos debe ser S/. 25');
  assert.equal(metrics.netProfit, 85, 'Ganancia neta debe ser 110 - 25 = S/. 85');
});

test('Determinación auditable del pago cancelatorio y prevención de doble contabilización futura', () => {
  // Préstamo pagado en 3 cuotas en días distintos
  const loans = [{
    id: 'loan-multi-pay',
    capital: 300,
    interest_amount: 60,
    total_to_pay: 360
  }];
  const payments = [
    { id: 'p1', loan_id: 'loan-multi-pay', amount: 100, payment_date: '2026-10-01', created_at: '2026-10-01T10:00:00Z' },
    { id: 'p2', loan_id: 'loan-multi-pay', amount: 150, payment_date: '2026-10-03', created_at: '2026-10-03T10:00:00Z' },
    { id: 'p3', loan_id: 'loan-multi-pay', amount: 110, payment_date: '2026-10-06', created_at: '2026-10-06T10:00:00Z' }
  ];

  // 1. Reporte del día 1 (2026-10-01): préstamo no completado (100 < 360)
  const repDay1 = calculateRealizedFinancialMetrics({ loans, payments, startDate: '2026-10-01', endDate: '2026-10-01' });
  assert.equal(repDay1.commissionRealized, 0, 'Día 1: no se reconoce comisión');
  assert.equal(repDay1.realCollected, 100);

  // 2. Reporte del día 3 (2026-10-03): préstamo no completado (250 < 360)
  const repDay3 = calculateRealizedFinancialMetrics({ loans, payments, startDate: '2026-10-03', endDate: '2026-10-03' });
  assert.equal(repDay3.commissionRealized, 0, 'Día 3: no se reconoce comisión');
  assert.equal(repDay3.realCollected, 150);

  // 3. Reporte del día 6 (2026-10-06): pago cancelatorio p3 ocurre hoy (acumulado 360 >= 360)
  const repDay6 = calculateRealizedFinancialMetrics({ loans, payments, startDate: '2026-10-06', endDate: '2026-10-06' });
  assert.equal(repDay6.commissionRealized, 60, 'Día 6: se reconoce la comisión completa de S/. 60');
  assert.equal(repDay6.realCollected, 110, 'Recaudo del día 6 es la cuota final de S/. 110');

  const payoffInfo = repDay6.loanPayoffInfo.get('loan-multi-pay');
  assert.ok(payoffInfo, 'Debe existir registro auditable');
  assert.equal(payoffInfo.payoffPayment.id, 'p3', 'El pago cancelatorio exacto debe ser p3');
  assert.equal(payoffInfo.payoffDate, '2026-10-06', 'La fecha de cancelación debe ser 2026-10-06');

  // 4. Reporte de períodos futuros (2026-10-07 al 2026-10-15): NO contabilizar dos veces
  const repFuture = calculateRealizedFinancialMetrics({ loans, payments, startDate: '2026-10-07', endDate: '2026-10-15' });
  assert.equal(repFuture.commissionRealized, 0, 'Período futuro: comisión debe ser 0 (no duplicar)');
  assert.equal(repFuture.realCollected, 0, 'Período futuro: recaudo 0');
});

// =========================================================================
// PRUEBAS DE INTEGRACIÓN CON BASE DE DATOS REAL
// =========================================================================

test('Financial Report: WEEKLY, BIWEEKLY, MONTHLY return exact mathematical metrics on real database', async () => {
  const periods = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ALL'];

  for (const period of periods) {
    const res = responseRecorder();
    await loanController.getFinancialReport({ query: { period } }, res);

    assert.equal(res.statusCode, 200);
    const data = res.body;

    // Check all required contract fields exist
    assert.ok(data.period, 'Falta period');
    assert.ok(data.startDate, 'Falta startDate');
    assert.ok(data.endDate, 'Falta endDate');
    assert.ok(data.periodLabel, 'Falta periodLabel');
    assert.equal(typeof data.capitalInvested, 'number');
    assert.equal(typeof data.principalCollected, 'number');
    assert.equal(typeof data.interestCollected, 'number');
    assert.equal(typeof data.commissionRealized, 'number');
    assert.equal(typeof data.totalMoras, 'number');
    assert.equal(typeof data.realCollected, 'number');
    assert.equal(typeof data.grossProfit, 'number');
    assert.equal(typeof data.totalExpenses, 'number');
    assert.equal(typeof data.netProfit, 'number');
    assert.equal(typeof data.remainingToCollect, 'number');
    assert.equal(typeof data.projectedCollection, 'number');
    assert.ok(Array.isArray(data.expensesList), 'expensesList debe ser un array');

    // Mathematical identity: principalCollected + commissionRealized + totalMoras == realCollected
    const sumComponents = Math.round((data.principalCollected + data.commissionRealized + data.totalMoras) * 100) / 100;
    const diff = Math.abs(sumComponents - data.realCollected);
    assert.ok(diff <= 0.01, `Discrepancia en suma para ${period}: componentes=${sumComponents}, realCollected=${data.realCollected}`);

    // Gross profit identity: grossProfit == commissionRealized + totalMoras
    const expectedGross = Math.round((data.commissionRealized + data.totalMoras) * 100) / 100;
    assert.equal(data.grossProfit, expectedGross, `Ganancia bruta incorrecta en ${period}`);

    // Net profit identity: netProfit == grossProfit - totalExpenses
    const expectedNet = Math.round((data.grossProfit - data.totalExpenses) * 100) / 100;
    assert.equal(data.netProfit, expectedNet, `Ganancia neta incorrecta en ${period}`);

    // Projected collection identity: projectedCollection == realCollected + remainingToCollect
    const expectedProjected = Math.round((data.realCollected + data.remainingToCollect) * 100) / 100;
    assert.equal(data.projectedCollection, expectedProjected, `Recaudo proyectado incorrecto en ${period}`);
  }
});

test('Financial Report: Adding an expense of S/. 25 updates totalExpenses and netProfit by exactly S/. 25', async () => {
  // 1. Get initial monthly report
  const resBefore = responseRecorder();
  await loanController.getFinancialReport({ query: { period: 'MONTHLY' } }, resBefore);
  const initialExpenses = resBefore.body.totalExpenses;
  const initialNetProfit = resBefore.body.netProfit;

  // 2. Insert expense of S/. 25
  const resAdd = responseRecorder();
  await loanController.addExpense({
    body: {
      amount: 25,
      category: 'OTROS',
      description: 'Gasto prueba automatizada',
      date: new Date().toISOString().split('T')[0]
    }
  }, resAdd);
  assert.equal(resAdd.statusCode, 201);
  const createdExpenseId = resAdd.body.id;
  assert.ok(createdExpenseId, 'El gasto debe tener un id generado');

  try {
    // 3. Get updated monthly report
    const resAfter = responseRecorder();
    await loanController.getFinancialReport({ query: { period: 'MONTHLY' } }, resAfter);
    const newExpenses = resAfter.body.totalExpenses;
    const newNetProfit = resAfter.body.netProfit;

    assert.equal(
      Math.round((newExpenses - initialExpenses) * 100) / 100,
      25,
      'Los gastos operativos deben aumentar exactamente en S/. 25'
    );
    assert.equal(
      Math.round((initialNetProfit - newNetProfit) * 100) / 100,
      25,
      'La ganancia neta debe disminuir exactamente en S/. 25'
    );
  } finally {
    // Clean up test expense
    await pool.query('DELETE FROM expenses WHERE id = $1', [createdExpenseId]);
  }
});

// =========================================================================
// PRUEBAS DE "NÚMERO DE OPERACIÓN" (IMMUTABILIDAD, UNICIDAD Y MAPEO)
// =========================================================================

test('Operation Number: All loans have unique, non-null OP-xxxxxx in database', async () => {
  const statsRes = await pool.query(`
    SELECT
      COUNT(*) AS total_loans,
      COUNT(operation_number) AS with_op_number,
      COUNT(*) - COUNT(operation_number) AS without_op_number,
      COUNT(*) - COUNT(DISTINCT operation_number) AS duplicate_count,
      MIN(operation_number) AS first_op,
      MAX(operation_number) AS last_op
    FROM loans
  `);
  const stats = statsRes.rows[0];
  assert.equal(stats.without_op_number, '0', 'Ningún préstamo debe tener operation_number NULL');
  assert.equal(stats.duplicate_count, '0', 'No deben existir operation_number duplicados');
  assert.ok(stats.first_op.startsWith('OP-'), 'El primer número debe tener prefijo OP-');
  assert.ok(stats.last_op.startsWith('OP-'), 'El último número debe tener prefijo OP-');
});

test('Operation Number: GET /api/loans returns operationNumber for all loans', async () => {
  const res = responseRecorder();
  await loanController.getLoans({ query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);
  for (const loan of res.body) {
    assert.ok(loan.operationNumber, `El préstamo ${loan.id} debe incluir operationNumber`);
    assert.ok(/^OP-[0-9]{6}$/.test(loan.operationNumber), `El operationNumber ${loan.operationNumber} debe coincidir con formato OP-xxxxxx`);
  }
});

