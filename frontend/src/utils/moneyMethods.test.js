import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLoanConstanciaMessage } from './loanHelpers.js';

for (const [method, label] of [['YAPE', 'Yape'], ['CASH', 'Efectivo'], [undefined, 'No registrado']]) {
  test(`constancia uses saved disbursement ${label}, independently of payment method`, () => {
    const message = generateLoanConstanciaMessage({ disbursement_method: method, payment_method: 'YAPE',
      clientName: 'Ana', startDate: '2026-10-01', dueDate: '2026-10-21', capital: 100,
      interestAmount: 20, totalToPay: 120, paymentDays: 20 });
    assert.ok(message.includes(`*Préstamo efectuado en:* ${label}`));
  });
}
