'use me';
'use server';

import { dbPool, initDbSchema } from '@/lib/db';
import { seedDatabaseIfEmpty } from '@/lib/seed';
import {
  Client,
  Loan,
  Payment,
  Expense,
  DashboardSummary,
  NewClientLoanFormData,
  FinancialReportData,
  ReportPeriod,
  AlertNotification,
  AlertType,
  LoanStatus,
  ExpenseCategory,
} from '@/types';

// Utility helper to map SQL row to Client
function mapRowToClient(row: any): Client {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    address: String(row.address),
    identification: row.identification ? String(row.identification) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
    status: row.status as 'ACTIVE' | 'INACTIVE',
  };
}

// Utility helper to map SQL row to Loan
function mapRowToLoan(row: any): Loan {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    clientName: String(row.client_name),
    clientPhone: String(row.client_phone),
    clientAddress: row.client_address ? String(row.client_address) : undefined,
    capital: Number(row.capital),
    interestRate: Number(row.interest_rate),
    interestAmount: Number(row.interest_amount),
    totalToPay: Number(row.total_to_pay),
    paymentDays: Number(row.payment_days),
    dailyPaymentAmount: Number(row.daily_payment_amount),
    startDate: String(row.start_date),
    dueDate: String(row.due_date),
    status: row.status as LoanStatus,
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    paidDaysCount: Number(row.paid_days_count),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
    lastPaymentDate: row.last_payment_date ? String(row.last_payment_date) : undefined,
    isArchived: Boolean(row.is_archived),
  };
}

// Utility helper to map SQL row to Payment (using payment_date from TiDB)
function mapRowToPayment(row: any): Payment {
  return {
    id: String(row.id),
    loanId: String(row.loan_id),
    clientId: String(row.client_id),
    clientName: String(row.client_name),
    amount: Number(row.amount),
    date: String(row.payment_date || row.date),
    type: row.type as any,
    dayNumber: Number(row.day_number),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

// Utility helper to map SQL row to Expense (using expense_date from TiDB)
function mapRowToExpense(row: any): Expense {
  return {
    id: String(row.id),
    amount: Number(row.amount),
    category: row.category as ExpenseCategory,
    description: String(row.description),
    date: String(row.expense_date || row.date),
    createdAt: String(row.created_at),
  };
}

function formatDatePE(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

// --- Server Actions for MySQL / TiDB ---

export async function getClientsAction(): Promise<Client[]> {
  await seedDatabaseIfEmpty();
  const [rows]: any = await dbPool.query('SELECT * FROM clients ORDER BY created_at DESC');
  return (rows as any[]).map(mapRowToClient);
}

export async function createClientAction(
  data: Omit<Client, 'id' | 'createdAt' | 'status'>
): Promise<Client> {
  await initDbSchema();
  const id = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();

  await dbPool.execute(
    `INSERT INTO clients (id, name, phone, address, identification, notes, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name.trim(), data.phone.trim(), data.address.trim(), data.identification?.trim() || null, data.notes?.trim() || null, createdAt, 'ACTIVE']
  );

  return {
    id,
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    identification: data.identification?.trim(),
    notes: data.notes?.trim(),
    createdAt,
    status: 'ACTIVE',
  };
}

export async function updateClientAction(
  id: string,
  data: { name: string; phone: string; address: string; identification?: string; notes?: string }
): Promise<void> {
  await initDbSchema();
  const name = data.name.trim();
  const phone = data.phone.trim();
  const address = data.address.trim();
  const identification = data.identification?.trim() || null;
  const notes = data.notes?.trim() || null;

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE clients SET name = ?, phone = ?, address = ?, identification = ?, notes = ? WHERE id = ?`,
      [name, phone, address, identification, notes, id]
    );
    await connection.execute(
      `UPDATE loans SET client_name = ?, client_phone = ?, client_address = ? WHERE client_id = ?`,
      [name, phone, address, id]
    );
    await connection.execute(
      `UPDATE payments SET client_name = ? WHERE client_id = ?`,
      [name, id]
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function deleteClientAction(clientId: string, mode: 'ARCHIVE' | 'PERMANENT'): Promise<void> {
  await initDbSchema();
  if (mode === 'ARCHIVE') {
    await dbPool.execute(`UPDATE clients SET status = 'INACTIVE' WHERE id = ?`, [clientId]);
  } else {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`DELETE FROM payments WHERE client_id = ?`, [clientId]);
      await connection.execute(`DELETE FROM loans WHERE client_id = ?`, [clientId]);
      await connection.execute(`DELETE FROM clients WHERE id = ?`, [clientId]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

export async function getLoansAction(): Promise<Loan[]> {
  await seedDatabaseIfEmpty();
  const [rows]: any = await dbPool.query('SELECT * FROM loans ORDER BY created_at DESC');
  return (rows as any[]).map(mapRowToLoan);
}

export async function createClientAndLoanAction(formData: NewClientLoanFormData): Promise<Loan> {
  await initDbSchema();
  let clientId = formData.clientId;

  let clientName = formData.clientName.trim();
  let clientPhone = formData.clientPhone.trim();
  let clientAddress = formData.clientAddress.trim();

  if (!clientId) {
    const createdClient = await createClientAction({
      name: clientName,
      phone: clientPhone,
      address: clientAddress,
      identification: formData.clientIdentification,
      notes: formData.notes,
    });
    clientId = createdClient.id;
  } else {
    const [rows]: any = await dbPool.execute(`SELECT * FROM clients WHERE id = ?`, [clientId]);
    if (rows.length > 0) {
      const c = mapRowToClient(rows[0]);
      clientName = c.name;
      clientPhone = c.phone;
      clientAddress = c.address;
    }
  }

  const { capital, paymentDays, startDate } = formData;
  const interestRate = 20;
  const interestAmount = Math.round(capital * 0.20);
  const totalToPay = capital + interestAmount;
  const dailyPaymentAmount = Math.round(totalToPay / paymentDays);

  const start = new Date(startDate || Date.now());
  const due = new Date(start);
  due.setDate(due.getDate() + Number(paymentDays));
  const dueDateStr = due.toISOString().split('T')[0];

  const loanId = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();

  await dbPool.execute(
    `INSERT INTO loans (id, client_id, client_name, client_phone, client_address, capital, interest_rate, interest_amount, total_to_pay, payment_days, daily_payment_amount, start_date, due_date, status, paid_amount, remaining_amount, paid_days_count, notes, created_at, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      loanId,
      clientId,
      clientName,
      clientPhone,
      clientAddress,
      capital,
      interestRate,
      interestAmount,
      totalToPay,
      Number(paymentDays),
      dailyPaymentAmount,
      startDate || new Date().toISOString().split('T')[0],
      dueDateStr,
      'ACTIVE',
      0,
      totalToPay,
      0,
      formData.notes?.trim() || null,
      createdAt,
    ]
  );

  return {
    id: loanId,
    clientId,
    clientName,
    clientPhone,
    clientAddress,
    capital,
    interestRate,
    interestAmount,
    totalToPay,
    paymentDays: Number(paymentDays),
    dailyPaymentAmount,
    startDate: startDate || new Date().toISOString().split('T')[0],
    dueDate: dueDateStr,
    status: 'ACTIVE',
    paidAmount: 0,
    remainingAmount: totalToPay,
    paidDaysCount: 0,
    notes: formData.notes?.trim(),
    createdAt,
    isArchived: false,
  };
}

export async function updateLoanAction(
  id: string,
  data: { capital: number; paymentDays: number; startDate: string; notes?: string }
): Promise<void> {
  await initDbSchema();
  const [rows]: any = await dbPool.execute(`SELECT * FROM loans WHERE id = ?`, [id]);
  if (rows.length === 0) throw new Error('Préstamo no encontrado');

  const loan = mapRowToLoan(rows[0]);
  const capital = Number(data.capital);
  const paymentDays = Number(data.paymentDays);
  const startDate = data.startDate;

  const interestRate = 20;
  const interestAmount = Math.round(capital * 0.20);
  const totalToPay = capital + interestAmount;
  const dailyPaymentAmount = Math.round(totalToPay / paymentDays);

  const start = new Date(startDate);
  const due = new Date(start);
  due.setDate(due.getDate() + paymentDays);
  const dueDateStr = due.toISOString().split('T')[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const newRemainingAmount = Math.max(0, totalToPay - loan.paidAmount);
  const newPaidDaysCount = Math.min(paymentDays, Math.floor(loan.paidAmount / dailyPaymentAmount));

  let newStatus: LoanStatus = loan.status;
  if (newRemainingAmount <= 0) {
    newStatus = 'PAID';
  } else if (new Date(dueDateStr) < new Date(todayStr)) {
    newStatus = 'OVERDUE';
  } else {
    newStatus = 'ACTIVE';
  }

  await dbPool.execute(
    `UPDATE loans SET capital = ?, interest_amount = ?, total_to_pay = ?, payment_days = ?, daily_payment_amount = ?, start_date = ?, due_date = ?, remaining_amount = ?, paid_days_count = ?, status = ?, notes = ? WHERE id = ?`,
    [capital, interestAmount, totalToPay, paymentDays, dailyPaymentAmount, startDate, dueDateStr, newRemainingAmount, newPaidDaysCount, newStatus, data.notes?.trim() || null, id]
  );
}

export async function deleteLoanAction(loanId: string, mode: 'ARCHIVE' | 'PERMANENT'): Promise<void> {
  await initDbSchema();
  if (mode === 'ARCHIVE') {
    await dbPool.execute(`UPDATE loans SET is_archived = 1 WHERE id = ?`, [loanId]);
  } else {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`DELETE FROM payments WHERE loan_id = ?`, [loanId]);
      await connection.execute(`DELETE FROM loans WHERE id = ?`, [loanId]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

export async function getPaymentsAction(): Promise<Payment[]> {
  await seedDatabaseIfEmpty();
  const [rows]: any = await dbPool.query('SELECT * FROM payments ORDER BY payment_date DESC');
  return (rows as any[]).map(mapRowToPayment);
}

export async function registerPaymentAction(
  loanId: string,
  amount: number,
  notes?: string
): Promise<{ payment: Payment; updatedLoan: Loan }> {
  await initDbSchema();
  const [rows]: any = await dbPool.execute(`SELECT * FROM loans WHERE id = ?`, [loanId]);
  if (rows.length === 0) throw new Error('Préstamo no encontrado');

  const loan = mapRowToLoan(rows[0]);
  const todayStr = new Date().toISOString().split('T')[0];

  const newPaidAmount = loan.paidAmount + amount;
  const newRemainingAmount = Math.max(0, loan.totalToPay - newPaidAmount);
  const newPaidDaysCount = Math.min(loan.paymentDays, Math.floor(newPaidAmount / loan.dailyPaymentAmount));

  let newStatus: LoanStatus = loan.status;
  if (newRemainingAmount <= 0) {
    newStatus = 'PAID';
  } else if (new Date(loan.dueDate) < new Date(todayStr)) {
    newStatus = 'OVERDUE';
  } else {
    newStatus = 'ACTIVE';
  }

  const updatedLoan: Loan = {
    ...loan,
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    paidDaysCount: newPaidDaysCount,
    status: newStatus,
    lastPaymentDate: todayStr,
  };

  const isFullDay = amount >= loan.dailyPaymentAmount;
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newPayment: Payment = {
    id: paymentId,
    loanId: loan.id,
    clientId: loan.clientId,
    clientName: loan.clientName,
    amount,
    date: todayStr,
    type: newRemainingAmount <= 0 ? 'FULL_PAYOFF' : isFullDay ? 'FULL_DAY' : 'PARTIAL',
    dayNumber: newPaidDaysCount + (isFullDay ? 0 : 1),
    notes: notes || (isFullDay ? 'Pago diario completo' : 'Abono parcial'),
  };

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE loans SET paid_amount = ?, remaining_amount = ?, paid_days_count = ?, status = ?, last_payment_date = ? WHERE id = ?`,
      [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, todayStr, loanId]
    );
    await connection.execute(
      `INSERT INTO payments (id, loan_id, client_id, client_name, amount, payment_date, type, day_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newPayment.id, newPayment.loanId, newPayment.clientId, newPayment.clientName, newPayment.amount, newPayment.date, newPayment.type, newPayment.dayNumber, newPayment.notes || null]
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return { payment: newPayment, updatedLoan };
}

export async function getExpensesAction(): Promise<Expense[]> {
  await seedDatabaseIfEmpty();
  const [rows]: any = await dbPool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
  return (rows as any[]).map(mapRowToExpense);
}

export async function addExpenseAction(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  await initDbSchema();
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();

  await dbPool.execute(
    `INSERT INTO expenses (id, amount, category, description, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.amount, data.category, data.description, data.date, createdAt]
  );

  return {
    id,
    amount: data.amount,
    category: data.category,
    description: data.description,
    date: data.date,
    createdAt,
  };
}

export async function deleteExpenseAction(id: string): Promise<void> {
  await initDbSchema();
  await dbPool.execute(`DELETE FROM expenses WHERE id = ?`, [id]);
}

export async function getTodayCollectionsAction() {
  const loans = await getLoansAction();
  const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);
  const payments = await getPaymentsAction();
  const todayStr = new Date().toISOString().split('T')[0];

  return activeLoans.map((loan) => {
    const todayPayments = payments.filter((p) => p.loanId === loan.id && p.date === todayStr);
    const amountPaidToday = todayPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const isPaidToday = amountPaidToday >= loan.dailyPaymentAmount || loan.remainingAmount === 0;

    return {
      loan,
      isPaidToday,
      amountPaidToday,
    };
  });
}

export async function getAlertsAction(): Promise<AlertNotification[]> {
  const loans = await getLoansAction();
  const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  const alerts: AlertNotification[] = [];

  activeLoans.forEach((loan) => {
    const due = new Date(loan.dueDate);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let type: AlertType | null = null;
    if (diffDays < 0 || loan.status === 'OVERDUE') {
      type = 'OVERDUE';
    } else if (diffDays === 0) {
      type = 'DUE_TODAY';
    } else if (diffDays === 1) {
      type = 'EXPIRING_SOON';
    }

    if (type) {
      alerts.push({
        id: `alert_${loan.id}`,
        loanId: loan.id,
        clientId: loan.clientId,
        clientName: loan.clientName,
        clientPhone: loan.clientPhone,
        type,
        daysDifference: diffDays,
        remainingAmount: loan.remainingAmount,
        totalToPay: loan.totalToPay,
        dueDate: loan.dueDate,
      });
    }
  });

  return alerts.sort((a, b) => a.daysDifference - b.daysDifference);
}

export async function getDashboardSummaryAction(): Promise<DashboardSummary> {
  const loans = await getLoansAction();
  const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);
  const payments = await getPaymentsAction();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalCapitalLent = loans.reduce((sum, l) => sum + l.capital, 0);
  const totalEstimatedProfit = loans.reduce((sum, l) => sum + l.interestAmount, 0);
  const collectedToday = payments.filter((p) => p.date === todayStr).reduce((sum, p) => sum + p.amount, 0);

  const todayCollections = await getTodayCollectionsAction();
  const pendingClientsTodayCount = todayCollections.filter((c) => !c.isPaidToday).length;

  const alerts = await getAlertsAction();
  const overdueCount = alerts.filter((a) => a.type === 'OVERDUE').length;
  const expiringSoonCount = alerts.filter((a) => a.type === 'DUE_TODAY' || a.type === 'EXPIRING_SOON').length;

  const totalTodayTargetCount = todayCollections.length;
  const paidTodayCount = totalTodayTargetCount - pendingClientsTodayCount;
  const collectionProgressPercent =
    totalTodayTargetCount > 0 ? Math.round((paidTodayCount / totalTodayTargetCount) * 100) : 100;

  return {
    totalCapitalLent,
    totalEstimatedProfit,
    collectedToday,
    pendingClientsTodayCount,
    totalActiveLoansCount: activeLoans.length,
    overdueCount,
    expiringSoonCount,
    collectionProgressPercent,
  };
}

export async function getFinancialReportAction(period: ReportPeriod): Promise<FinancialReportData> {
  const loans = await getLoansAction();
  const payments = await getPaymentsAction();
  const expenses = await getExpensesAction();

  const now = new Date();
  let startDate = new Date();
  let periodLabel = 'Semanal';

  if (period === 'WEEKLY') {
    startDate.setDate(now.getDate() - 7);
    periodLabel = 'Última Semana (7 Días)';
  } else if (period === 'BIWEEKLY') {
    startDate.setDate(now.getDate() - 15);
    periodLabel = 'Última Quincena (15 Días)';
  } else if (period === 'MONTHLY') {
    startDate.setDate(now.getDate() - 30);
    periodLabel = 'Último Mes (30 Días)';
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = now.toISOString().split('T')[0];

  const periodLoans = loans.filter((l) => l.startDate >= startDateStr && !l.isArchived);
  const periodPayments = payments.filter((p) => p.date >= startDateStr);
  const periodExpenses = expenses.filter((e) => e.date >= startDateStr);

  const capitalInvested = periodLoans.reduce((sum, l) => sum + l.capital, 0);
  const projectedCollection = periodLoans.reduce((sum, l) => sum + l.totalToPay, 0);
  const realCollected = periodPayments.reduce((sum, p) => sum + p.amount, 0);
  const interestCollected = Math.round(realCollected * (20 / 120));
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = interestCollected - totalExpenses;
  const remainingToCollect = Math.max(0, projectedCollection - realCollected);

  return {
    period,
    periodLabel,
    startDate: formatDatePE(startDateStr),
    endDate: formatDatePE(endDateStr),
    capitalInvested,
    realCollected,
    projectedCollection,
    interestCollected,
    totalExpenses,
    netProfit,
    remainingToCollect,
    expensesList: periodExpenses,
  };
}

export async function resetToDemoDataAction(): Promise<void> {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(`DELETE FROM payments`);
    await connection.execute(`DELETE FROM loans`);
    await connection.execute(`DELETE FROM clients`);
    await connection.execute(`DELETE FROM expenses`);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  await seedDatabaseIfEmpty();
}
