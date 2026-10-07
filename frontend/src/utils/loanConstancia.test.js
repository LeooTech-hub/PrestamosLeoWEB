import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseDateParts,
  addDaysSafe,
  diffDaysSafe,
  formatDateShortSpanish,
  formatScheduleAmount,
  distributeAmountAcrossInstallments,
  isWeeklyLoan,
  getWeeklyInstallmentCount,
  generateWeeklyPaymentSchedule,
  generateLoanConstanciaMessage,
  getLoanPaymentTerms,
} from './loanHelpers.js';

test('1. Préstamo semanal de 3 cuotas: calcula fechas exactas y montos consistentes', () => {
  const loan = {
    clientName: 'Juan Perez',
    operationNumber: 'OP-001001',
    startDate: '2026-10-01',
    dueDate: '2026-10-22',
    capital: 200,
    interestAmount: 40,
    totalToPay: 240,
    paymentFrequency: 'WEEKLY',
  };

  const scheduleResult = generateWeeklyPaymentSchedule(loan);
  assert.equal(scheduleResult.isWeekly, true);
  assert.equal(scheduleResult.isConsistent, true);
  assert.equal(scheduleResult.hasInconsistency, false);
  assert.equal(scheduleResult.installmentsCount, 3);
  assert.equal(scheduleResult.schedule.length, 3);

  // Cuota 1: 08/10/2026 — S/ 80.00
  assert.equal(scheduleResult.schedule[0].installmentNumber, 1);
  assert.equal(scheduleResult.schedule[0].dueDate, '2026-10-08');
  assert.equal(scheduleResult.schedule[0].formattedDate, '08/10/2026');
  assert.equal(scheduleResult.schedule[0].formattedShortDate, '08 oct 2026');
  assert.equal(scheduleResult.schedule[0].amount, 80.00);
  assert.equal(scheduleResult.schedule[0].formattedAmount, 'S/ 80.00');

  // Cuota 2: 15/10/2026 — S/ 80.00
  assert.equal(scheduleResult.schedule[1].installmentNumber, 2);
  assert.equal(scheduleResult.schedule[1].dueDate, '2026-10-15');
  assert.equal(scheduleResult.schedule[1].formattedDate, '15/10/2026');
  assert.equal(scheduleResult.schedule[1].formattedShortDate, '15 oct 2026');
  assert.equal(scheduleResult.schedule[1].amount, 80.00);

  // Cuota 3: 22/10/2026 — S/ 80.00 (Coincide con vencimiento)
  assert.equal(scheduleResult.schedule[2].installmentNumber, 3);
  assert.equal(scheduleResult.schedule[2].dueDate, '2026-10-22');
  assert.equal(scheduleResult.schedule[2].formattedDate, '22/10/2026');
  assert.equal(scheduleResult.schedule[2].formattedShortDate, '22 oct 2026');
  assert.equal(scheduleResult.schedule[2].amount, 80.00);
  assert.equal(scheduleResult.schedule[2].dueDate, loan.dueDate);

  // Suma exacta igual a totalToPay
  const totalSum = scheduleResult.schedule.reduce((acc, c) => acc + c.amount, 0);
  assert.equal(totalSum, 240);
});

test('2. Préstamo semanal de 4 cuotas: intervalos de 7 días y vencimiento contractual', () => {
  const loan = {
    clientName: 'Maria Rodriguez',
    operationNumber: 'OP-001002',
    startDate: '2026-10-01',
    dueDate: '2026-10-29',
    capital: 333.33,
    interestAmount: 66.67,
    totalToPay: 400.00,
    paymentFrequency: 'WEEKLY',
  };

  const scheduleResult = generateWeeklyPaymentSchedule(loan);
  assert.equal(scheduleResult.isConsistent, true);
  assert.equal(scheduleResult.installmentsCount, 4);
  assert.equal(scheduleResult.schedule.length, 4);

  assert.equal(scheduleResult.schedule[0].formattedDate, '08/10/2026');
  assert.equal(scheduleResult.schedule[1].formattedDate, '15/10/2026');
  assert.equal(scheduleResult.schedule[2].formattedDate, '22/10/2026');
  assert.equal(scheduleResult.schedule[3].formattedDate, '29/10/2026');
  assert.equal(scheduleResult.schedule[3].dueDate, loan.dueDate);

  const totalSum = Number(scheduleResult.schedule.reduce((acc, c) => acc + c.amount, 0).toFixed(2));
  assert.equal(totalSum, 400.00);
});

test('3. Cambio de mes: cruza correctamente fin de mes de octubre a noviembre', () => {
  const loan = {
    startDate: '2026-10-22',
    dueDate: '2026-11-12',
    totalToPay: 300,
    paymentFrequency: 'WEEKLY',
  };

  const scheduleResult = generateWeeklyPaymentSchedule(loan);
  assert.equal(scheduleResult.isConsistent, true);
  assert.equal(scheduleResult.schedule.length, 3);

  assert.equal(scheduleResult.schedule[0].dueDate, '2026-10-29');
  assert.equal(scheduleResult.schedule[0].formattedShortDate, '29 oct 2026');

  // Cambio de mes: 29 oct + 7 días = 05 nov
  assert.equal(scheduleResult.schedule[1].dueDate, '2026-11-05');
  assert.equal(scheduleResult.schedule[1].formattedShortDate, '05 nov 2026');

  assert.equal(scheduleResult.schedule[2].dueDate, '2026-11-12');
  assert.equal(scheduleResult.schedule[2].formattedShortDate, '12 nov 2026');
  assert.equal(scheduleResult.schedule[2].dueDate, loan.dueDate);
});

test('4. Cambio de año: cruza correctamente de diciembre a enero', () => {
  const loan = {
    startDate: '2026-12-18',
    dueDate: '2027-01-08',
    totalToPay: 300,
    paymentFrequency: 'WEEKLY',
  };

  const scheduleResult = generateWeeklyPaymentSchedule(loan);
  assert.equal(scheduleResult.isConsistent, true);
  assert.equal(scheduleResult.schedule.length, 3);

  assert.equal(scheduleResult.schedule[0].dueDate, '2026-12-25');
  assert.equal(scheduleResult.schedule[0].formattedShortDate, '25 dic 2026');

  // Cambio de año: 25 dic + 7 días = 01 ene 2027
  assert.equal(scheduleResult.schedule[1].dueDate, '2027-01-01');
  assert.equal(scheduleResult.schedule[1].formattedShortDate, '01 ene 2027');

  assert.equal(scheduleResult.schedule[2].dueDate, '2027-01-08');
  assert.equal(scheduleResult.schedule[2].formattedShortDate, '08 ene 2027');
  assert.equal(scheduleResult.schedule[2].dueDate, loan.dueDate);
});

test('5. Años bisiestos: reconoce correctamente el 29 de febrero en 2028', () => {
  // Año bisiesto 2028: febrero tiene 29 días
  const loanBisiesto = {
    startDate: '2028-02-17',
    dueDate: '2028-03-09',
    totalToPay: 300,
    paymentFrequency: 'WEEKLY',
  };

  const scheduleBisiesto = generateWeeklyPaymentSchedule(loanBisiesto);
  assert.equal(scheduleBisiesto.isConsistent, true);
  assert.equal(scheduleBisiesto.schedule[0].dueDate, '2028-02-24');
  // 24 Feb + 7 días en año bisiesto = 02 Mar (24, 25, 26, 27, 28, 29 Feb, 1, 2 Mar)
  assert.equal(scheduleBisiesto.schedule[1].dueDate, '2028-03-02');
  assert.equal(scheduleBisiesto.schedule[1].formattedShortDate, '02 mar 2028');
  assert.equal(scheduleBisiesto.schedule[2].dueDate, '2028-03-09');

  // Comparación contra año no bisiesto 2026 (febrero 28 días)
  const loanNoBisiesto = {
    startDate: '2026-02-17',
    dueDate: '2026-03-10',
    totalToPay: 300,
    paymentFrequency: 'WEEKLY',
  };
  const scheduleNoBisiesto = generateWeeklyPaymentSchedule(loanNoBisiesto);
  assert.equal(scheduleNoBisiesto.schedule[1].dueDate, '2026-03-03'); // 03 de marzo en año no bisiesto
});

test('6. Montos con céntimos y divisiones no exactas: ajusta redondeo en última cuota', () => {
  // Caso A: S/ 100 en 3 cuotas -> 33.33, 33.33, 33.34
  const amountsA = distributeAmountAcrossInstallments(100.00, 3);
  assert.deepEqual(amountsA, [33.33, 33.33, 33.34]);
  assert.equal(Number((amountsA[0] + amountsA[1] + amountsA[2]).toFixed(2)), 100.00);

  // Caso B: S/ 200 en 3 cuotas -> 66.67, 66.67, 66.66
  const amountsB = distributeAmountAcrossInstallments(200.00, 3);
  assert.deepEqual(amountsB, [66.67, 66.67, 66.66]);
  assert.equal(Number((amountsB[0] + amountsB[1] + amountsB[2]).toFixed(2)), 200.00);

  // Caso C: S/ 250.50 en 4 cuotas
  const amountsC = distributeAmountAcrossInstallments(250.50, 4);
  assert.deepEqual(amountsC, [62.63, 62.63, 62.63, 62.61]);
  assert.equal(Number(amountsC.reduce((a, b) => a + b, 0).toFixed(2)), 250.50);

  // Caso D: En schedule completo
  const loan = {
    startDate: '2026-10-01',
    dueDate: '2026-10-22',
    totalToPay: 100.00,
    paymentFrequency: 'WEEKLY',
  };
  const schedule = generateWeeklyPaymentSchedule(loan);
  assert.equal(schedule.schedule[0].amount, 33.33);
  assert.equal(schedule.schedule[1].amount, 33.33);
  assert.equal(schedule.schedule[2].amount, 33.34);
  const totalCalculado = schedule.schedule.reduce((acc, c) => acc + c.amount, 0);
  assert.equal(Number(totalCalculado.toFixed(2)), 100.00);
});

test('7. Préstamos históricos: no utiliza fecha actual y ancla estrictamente a fecha de emisión', () => {
  const historicalLoan = {
    clientName: 'Cliente Antiguo',
    startDate: '2024-03-01',
    dueDate: '2024-03-22',
    totalToPay: 240,
    paymentFrequency: 'WEEKLY',
  };

  const schedule = generateWeeklyPaymentSchedule(historicalLoan);
  assert.equal(schedule.isConsistent, true);
  assert.equal(schedule.schedule[0].dueDate, '2024-03-08');
  assert.equal(schedule.schedule[1].dueDate, '2024-03-15');
  assert.equal(schedule.schedule[2].dueDate, '2024-03-22');
  assert.equal(schedule.schedule[2].dueDate, historicalLoan.dueDate);

  // Las fechas originales del préstamo no fueron alteradas
  assert.equal(historicalLoan.startDate, '2024-03-01');
  assert.equal(historicalLoan.dueDate, '2024-03-22');
});

test('8. Fechas inconsistentes: detecta inconsistencia sin inventar fechas ni alterar contrato', () => {
  // Caso A: Vencimiento de 19 días (no divisible entre 7)
  const inconsistentLoanA = {
    startDate: '2026-10-01',
    dueDate: '2026-10-20',
    totalToPay: 240,
    paymentFrequency: 'WEEKLY',
  };

  const scheduleA = generateWeeklyPaymentSchedule(inconsistentLoanA);
  assert.equal(scheduleA.isConsistent, false);
  assert.equal(scheduleA.hasInconsistency, true);
  assert.equal(scheduleA.schedule.length, 0); // No inventa fechas
  assert.match(scheduleA.inconsistencyReason, /Inconsistencia contractual/);

  // El mensaje de constancia para fechas inconsistentes no inventa fechas y alerta con seguridad
  const messageA = generateLoanConstanciaMessage(inconsistentLoanA);
  assert.doesNotMatch(messageA, /📌 \*FECHAS DE CANCELACIÓN:\*/);
  assert.match(messageA, /⚠️ \*Aviso de Fechas:\*/);
  assert.match(messageA, /20\/10\/2026/); // Muestra la fecha contractual real

  // Caso B: Vencimiento menor o igual a fecha de emisión
  const inconsistentLoanB = {
    startDate: '2026-10-10',
    dueDate: '2026-10-05',
    totalToPay: 240,
    paymentFrequency: 'WEEKLY',
  };
  const scheduleB = generateWeeklyPaymentSchedule(inconsistentLoanB);
  assert.equal(scheduleB.hasInconsistency, true);
  assert.equal(scheduleB.schedule.length, 0);

  // Caso C: Cuotas especificadas no compatibles con vencimiento
  const inconsistentLoanC = {
    startDate: '2026-10-01',
    dueDate: '2026-10-22', // 21 días = 3 semanas
    cuotas: 4, // 4 semanas deberían ser 28 días
    totalToPay: 240,
    paymentFrequency: 'WEEKLY',
  };
  const scheduleC = generateWeeklyPaymentSchedule(inconsistentLoanC);
  assert.equal(scheduleC.hasInconsistency, true);
  assert.equal(scheduleC.schedule.length, 0);
});

test('9. Mensaje de WhatsApp: incluye todos los campos obligatorios, negritas, Yape y cancelación', () => {
  const loan = {
    clientName: 'Leonardo Rodriguez',
    operationNumber: 'OP-000123',
    startDate: '2026-10-01',
    dueDate: '2026-10-22',
    capital: 200,
    interestAmount: 40,
    totalToPay: 240,
    paymentFrequency: 'WEEKLY',
  };

  const message = generateLoanConstanciaMessage(loan);

  // Validación de campos obligatorios
  assert.match(message, /📄 \*CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO\*/);
  assert.match(message, /👤 \*Cliente:\* Leonardo Rodriguez/);
  assert.match(message, /\*Operación:\* OP-000123/);
  assert.match(message, /📅 \*Fecha de Emisión:\* 01\/10\/2026/);
  assert.match(message, /💰 \*Monto Prestado:\* S\/\. 200/);
  assert.match(message, /📈 \*Interés \/ Comisión:\* S\/\. 40/);
  assert.match(message, /💵 \*Monto Total a Pagar:\* S\/\. 240/);
  assert.match(message, /📆 \*Fecha de Vencimiento:\* 22\/10\/2026/);
  assert.match(message, /📌 \*Cuota Semanal:\* S\/\. 80\.00/);
  assert.match(message, /📌 \*Cantidad de Semanas:\* 3/);

  // Validación de sección de fechas de cancelación
  assert.match(message, /📌 \*FECHAS DE CANCELACIÓN:\*/);
  assert.match(message, /1\. 08 oct 2026: S\/ 80\.00/);
  assert.match(message, /2\. 15 oct 2026: S\/ 80\.00/);
  assert.match(message, /3\. 22 oct 2026: S\/ 80\.00/);

  // Validación de número de Yape y agradecimiento
  assert.match(message, /📲 \*Número de Yape:\* 906329361/);
  assert.match(message, /_Gracias por su confianza\. Ante cualquier consulta estamos para atenderle\._/);
});

test('10. Compatibilidad: no altera préstamos diarios ni acuerdos especiales', () => {
  const dailyLoan = {
    clientName: 'Carlos Gómez',
    operationNumber: 'OP-000088',
    startDate: '2026-10-01',
    dueDate: '2026-10-21',
    capital: 500,
    interestAmount: 100,
    totalToPay: 600,
    paymentDays: 20,
    paymentFrequency: 'DAILY',
  };

  const terms = getLoanPaymentTerms(dailyLoan);
  assert.equal(terms.frequency, 'DAILY');
  assert.equal(terms.label, 'Cuota Diaria');
  assert.equal(terms.periods, 20);

  const schedule = generateWeeklyPaymentSchedule(dailyLoan);
  assert.equal(schedule.isWeekly, false);
  assert.equal(schedule.schedule.length, 0);

  const message = generateLoanConstanciaMessage(dailyLoan);
  assert.match(message, /📌 \*Cuota Diaria:\* S\/\. 30\.00/);
  assert.match(message, /📌 \*Días de Pago:\* 20/);
  assert.doesNotMatch(message, /📌 \*FECHAS DE CANCELACIÓN:\*/);
  assert.match(message, /📲 \*Número de Yape:\* 906329361/);
});

test('11. Cronograma contractual existente: respetado como fuente principal', () => {
  const loanWithCustomSchedule = {
    clientName: 'Ana Perez',
    operationNumber: 'OP-000999',
    startDate: '2026-10-01',
    dueDate: '2026-10-25',
    totalToPay: 200,
    paymentFrequency: 'WEEKLY',
    schedule: [
      { installmentNumber: 1, dueDate: '2026-10-10', amount: 100 },
      { installmentNumber: 2, dueDate: '2026-10-25', amount: 100 },
    ],
  };

  const scheduleResult = generateWeeklyPaymentSchedule(loanWithCustomSchedule);
  assert.equal(scheduleResult.isContractualCustom, true);
  assert.equal(scheduleResult.schedule.length, 2);
  assert.equal(scheduleResult.schedule[0].dueDate, '2026-10-10');
  assert.equal(scheduleResult.schedule[1].dueDate, '2026-10-25');
  assert.equal(scheduleResult.totalAmount, 200);

  const message = generateLoanConstanciaMessage(loanWithCustomSchedule);
  assert.match(message, /1\. 10 oct 2026: S\/ 100\.00/);
  assert.match(message, /2\. 25 oct 2026: S\/ 100\.00/);
});
