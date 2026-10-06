import test from 'node:test';
import assert from 'node:assert/strict';
import loanController from './loanController.js';
import pool from '../config/db.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('Financial Report: WEEKLY, BIWEEKLY, MONTHLY return exact mathematical metrics', async () => {
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
    assert.equal(typeof data.totalMoras, 'number');
    assert.equal(typeof data.realCollected, 'number');
    assert.equal(typeof data.grossProfit, 'number');
    assert.equal(typeof data.totalExpenses, 'number');
    assert.equal(typeof data.netProfit, 'number');
    assert.equal(typeof data.remainingToCollect, 'number');
    assert.equal(typeof data.projectedCollection, 'number');
    assert.ok(Array.isArray(data.expensesList), 'expensesList debe ser un array');

    // Mathematical identity: principalCollected + interestCollected + totalMoras == realCollected
    const sumComponents = Math.round((data.principalCollected + data.interestCollected + data.totalMoras) * 100) / 100;
    const diff = Math.abs(sumComponents - data.realCollected);
    assert.ok(diff <= 0.01, `Discrepancia en suma para ${period}: componentes=${sumComponents}, realCollected=${data.realCollected}`);

    // Gross profit identity: grossProfit == interestCollected + totalMoras
    const expectedGross = Math.round((data.interestCollected + data.totalMoras) * 100) / 100;
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
