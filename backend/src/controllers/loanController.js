import pool from '../config/db.js';
import crypto from 'crypto';

// payment_date es la fecha civil del negocio. Supabase opera en UTC, por lo
// que toda consulta de hoy debe fijar explícitamente la zona horaria de Perú.
const PERU_TODAY_SQL = `(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date`;

function generateUUID() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `loan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstNonZeroNumber(values, fallback = 0) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed !== 0) return parsed;
  }
  return fallback;
}

function firstFiniteNumber(values, fallback = 0) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const text = String(value).split('T')[0].split(' ')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : text;
}

function addDays(dateValue, daysValue) {
  const dateOnly = toDateOnly(dateValue);
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Math.max(0, finiteNumber(daysValue, 20)));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeLoanStatus(value, fallback = 'ACTIVE') {
  const status = String(value || fallback).trim().toUpperCase();
  if (status === 'VIGENTE') return 'ACTIVE';
  if (status === 'VENCIDO' || status === 'MORA') return 'OVERDUE';
  if (status === 'PAGADO' || status === 'CANCELADO') return 'PAID';
  return ['ACTIVE', 'OVERDUE', 'PAID', 'INACTIVE'].includes(status) ? status : fallback;
}

async function synchronizeLoanFromPayments(db, loanId) {
  const { rows } = await db.query(`
    WITH payment_totals AS (
      SELECT
        COALESCE(SUM(amount), 0)::numeric AS paid_amount,
        MAX(COALESCE(payment_date, date)) AS last_payment_date
      FROM payments
      WHERE loan_id::text = $1
    )
    UPDATE loans AS l
    SET
      paid_amount = LEAST(
        COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0),
        payment_totals.paid_amount
      ),
      remaining_amount = GREATEST(
        0,
        COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0)
          - payment_totals.paid_amount
      ),
      paid_days_count = LEAST(
        COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20),
        FLOOR(
          payment_totals.paid_amount
          / GREATEST(
              COALESCE(NULLIF(l.daily_amount, 0), NULLIF(l.daily_payment_amount, 0), NULLIF(l.daily_payment, 0), 1),
              0.01
            )
        )::integer
      ),
      remaining_days = GREATEST(
        0,
        COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)
          - LEAST(
              COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20),
              FLOOR(
                payment_totals.paid_amount
                / GREATEST(
                    COALESCE(NULLIF(l.daily_amount, 0), NULLIF(l.daily_payment_amount, 0), NULLIF(l.daily_payment, 0), 1),
                    0.01
                  )
              )::integer
            )
      ),
      last_payment_date = payment_totals.last_payment_date,
      status = CASE
        WHEN payment_totals.paid_amount >= COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0)
          THEN 'PAID'
        WHEN COALESCE(
          l.due_date,
          l.start_date + COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)
        ) < CURRENT_DATE THEN 'OVERDUE'
        ELSE 'ACTIVE'
      END
    FROM payment_totals
    WHERE l.id::text = $1
    RETURNING l.*
  `, [String(loanId)]);
  return rows[0] || null;
}

// ==========================================
// MAPEADORES COMPATIBLES CON REACT & POSTGRES
// ==========================================

function mapRowToClient(row) {
  const dniVal = row.dni ?? row.documento ?? row.identification ?? undefined;
  const aliasVal = row.alias ?? row.client_alias ?? undefined;

  const numericAmount = firstNonZeroNumber([
    row.loan_amount, row.loan_capital, row.amount, row.capital, row.amount_borrowed, row.monto
  ], 0);

  const numericTotalAmount = firstNonZeroNumber([
    row.loan_total_amount, row.loan_total_to_pay, row.total_amount, row.total_to_pay
  ], 0);

  const numericDailyAmount = firstNonZeroNumber([
    row.loan_daily_amount, row.loan_daily_payment_amount, row.daily_amount,
    row.daily_payment_amount, row.daily_payment
  ], 0);

  const numericInterestRate = firstFiniteNumber([
    row.loan_interest_rate, row.interest_rate, row.interes
  ], 20);

  const daysNum = Math.max(1, Math.round(firstNonZeroNumber([
    row.loan_days, row.loan_payment_days, row.payment_days, row.days_agreed,
    row.duration, row.total_installments, row.days
  ], 20)));
  
  const rawStartDate = row.loan_start_date || row.start_date || row.created_at;
  let rawDueDate = row.loan_due_date || row.due_date || row.fecha_vencimiento || row.end_date;

  // Cálculo automático de fecha de vencimiento si no viene en BD
  if (!rawDueDate && rawStartDate) {
    const startDateStr = String(rawStartDate).split('T')[0].split(' ')[0];
    try {
      const parts = startDateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + daysNum);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          rawDueDate = `${yyyy}-${mm}-${dd}`;
        }
      }
    } catch (_) {}
  }

  const dueDateFormatted = rawDueDate ? String(rawDueDate).split('T')[0] : null;
  const startDateFormatted = rawStartDate ? String(rawStartDate).split('T')[0] : null;

  // Calcular días restantes de forma dinámica si row.loan_remaining_days es NULL
  let calculatedRemainingDays = finiteNumber(row.loan_remaining_days ?? row.remaining_days, 0);
  if ((row.loan_remaining_days === null || row.loan_remaining_days === undefined) && dueDateFormatted) {
    const due = new Date(dueDateFormatted);
    if (!isNaN(due.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      calculatedRemainingDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (isNaN(calculatedRemainingDays)) calculatedRemainingDays = 0;
    }
  }

  const numericPenaltyAmount = Math.max(0, finiteNumber(
    row.loan_penalty_amount ?? row.loan_mora ?? row.penalty_amount ?? row.penaltyAmount ?? row.mora ?? row.late_fee ?? row.lateFee ?? row.recargo,
    0
  ));

  const hasActiveLoan = Boolean(row.loan_id);
  const activeLoan = hasActiveLoan ? {
    id: String(row.loan_id),
    amount: numericAmount,
    monto: numericAmount,
    capital: numericAmount,
    interestRate: numericInterestRate,
    interest_rate: numericInterestRate,
    interes: numericInterestRate,
    penaltyAmount: numericPenaltyAmount,
    penalty_amount: numericPenaltyAmount,
    mora: numericPenaltyAmount,
    lateFee: numericPenaltyAmount,
    late_fee: numericPenaltyAmount,
    recargo: numericPenaltyAmount,
    totalAmount: numericTotalAmount,
    total_amount: numericTotalAmount,
    totalToPay: numericTotalAmount,
    paidAmount: Math.max(0, finiteNumber(row.loan_paid_amount, 0)),
    paid_amount: Math.max(0, finiteNumber(row.loan_paid_amount, 0)),
    remainingAmount: Math.max(0, finiteNumber(row.loan_remaining_amount, numericTotalAmount)),
    remaining_amount: Math.max(0, finiteNumber(row.loan_remaining_amount, numericTotalAmount)),
    dailyAmount: numericDailyAmount,
    dailyPaymentAmount: numericDailyAmount,
    days: daysNum,
    paymentDays: daysNum,
    duration: daysNum,
    total_installments: daysNum,
    remainingDays: calculatedRemainingDays,
    remaining_days: calculatedRemainingDays,
    startDate: startDateFormatted,
    start_date: startDateFormatted,
    dueDate: dueDateFormatted,
    due_date: dueDateFormatted,
    fecha_vencimiento: dueDateFormatted,
    end_date: dueDateFormatted,
    status: normalizeLoanStatus(row.loan_status)
  } : {
    id: null,
    amount: 0,
    monto: 0,
    capital: 0,
    interestRate: 20,
    interest_rate: 20,
    interes: 20,
    penaltyAmount: 0,
    penalty_amount: 0,
    mora: 0,
    lateFee: 0,
    late_fee: 0,
    recargo: 0,
    totalAmount: 0,
    total_amount: 0,
    totalToPay: 0,
    dailyAmount: 0,
    dailyPaymentAmount: 0,
    days: 0,
    paymentDays: 0,
    duration: 0,
    total_installments: 0,
    remainingDays: 0,
    remaining_days: 0,
    startDate: null,
    start_date: null,
    dueDate: null,
    due_date: null,
    fecha_vencimiento: null,
    end_date: null,
    status: 'NONE'
  };

  const todayPaidAmount = Number(row.today_paid_amount || 0);
  const todayPaymentsCount = Number(row.today_payments_count || 0);
  const isPaidToday = todayPaymentsCount > 0 && todayPaidAmount > 0;
  const paidAmount = Math.max(0, finiteNumber(row.loan_paid_amount, 0));
  const remainingAmount = Math.max(0, finiteNumber(row.loan_remaining_amount, numericTotalAmount));

  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    alias: aliasVal ? String(aliasVal).trim() : undefined,
    apodo: aliasVal ? String(aliasVal).trim() : undefined,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    dni: dniVal ? String(dniVal) : undefined,
    documento: dniVal ? String(dniVal) : undefined,
    identification: dniVal ? String(dniVal) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    status: normalizeLoanStatus(row.status),
    routeOrder: Number(row.route_order ?? 0),
    assignedTo: row.assigned_to_user_id ? String(row.assigned_to_user_id) : undefined,
    assignedToName: row.assigned_to_name || 'Sin Asignar',

    amount: numericAmount,
    monto: numericAmount,
    capital: numericAmount,
    loan_amount: numericAmount,

    penaltyAmount: numericPenaltyAmount,
    penalty_amount: numericPenaltyAmount,
    mora: numericPenaltyAmount,
    lateFee: numericPenaltyAmount,
    late_fee: numericPenaltyAmount,
    recargo: numericPenaltyAmount,

    total_amount: numericTotalAmount,
    totalAmount: numericTotalAmount,
    total_to_pay: numericTotalAmount,
    totalToPay: numericTotalAmount,
    paidAmount,
    paid_amount: paidAmount,
    remainingAmount,
    remaining_amount: remainingAmount,

    interestRate: numericInterestRate,
    interest_rate: numericInterestRate,
    interes: numericInterestRate,

    days: daysNum,
    paymentDays: daysNum,
    duration: daysNum,
    plazo: daysNum,

    loan_start_date: startDateFormatted,
    start_date: startDateFormatted,
    startDate: startDateFormatted,

    loan_due_date: dueDateFormatted,
    due_date: dueDateFormatted,
    dueDate: dueDateFormatted,
    fecha_vencimiento: dueDateFormatted,
    end_date: dueDateFormatted,

    todayPaidAmount,
    today_paid_amount: todayPaidAmount,
    isPaidToday,
    is_paid_today: isPaidToday,
    todayStatus: isPaidToday ? 'COBRADO' : 'PENDIENTE',
    today_status: isPaidToday ? 'COBRADO' : 'PENDIENTE',

    activeLoan,
    active_loan: activeLoan,
    loansCount: hasActiveLoan ? 1 : 0
  };
}

function mapRowToLoan(row) {
  const capital = firstNonZeroNumber([
    row.amount, row.capital, row.amount_borrowed, row.monto
  ], 0);

  const storedInterestRate = firstFiniteNumber([
    row.interest_rate, row.interes
  ], 20);
  const storedInterestAmount = firstNonZeroNumber([row.interest_amount], 0);
  const interestRate = storedInterestRate > 0 || storedInterestAmount <= 0 || capital <= 0
    ? storedInterestRate
    : Number(((storedInterestAmount / capital) * 100).toFixed(2));

  const interestAmount = firstNonZeroNumber([
    row.interest_amount
  ], Number((capital * (interestRate / 100)).toFixed(2)));

  const penaltyAmount = Math.max(0, finiteNumber(
    row.penalty_amount ?? row.penaltyAmount ?? row.mora ?? row.late_fee ?? row.lateFee ?? row.recargo,
    0
  ));

  const totalToPay = firstNonZeroNumber([
    row.total_amount, row.total_to_pay
  ], Number((capital + interestAmount + penaltyAmount).toFixed(2)));

  const paymentDays = Math.max(1, Math.round(firstNonZeroNumber([
    row.payment_days, row.days_agreed, row.days, row.duration, row.total_installments
  ], 20)));

  const dailyPaymentAmount = firstNonZeroNumber([
    row.daily_amount, row.daily_payment_amount, row.daily_payment
  ], Number((totalToPay / paymentDays).toFixed(2)));

  const clientName = String(row.client_name || row.joined_client_name || row.name || 'Cliente');
  const rawAlias = row.client_alias || row.joined_client_alias || row.alias || '';
  const clientAlias = rawAlias ? String(rawAlias).trim() : undefined;

  const startDateFormatted = toDateOnly(row.start_date || row.created_at);
  const dueDateFormatted = toDateOnly(row.due_date || row.fecha_vencimiento || row.end_date)
    || (startDateFormatted ? addDays(startDateFormatted, paymentDays) : null);

  const paidAmount = Math.max(0, finiteNumber(row.paid_amount, 0));
  const remainingAmount = Math.max(0, Number((totalToPay - paidAmount).toFixed(2)));

  const paidDaysCount = Math.max(0, Math.floor(finiteNumber(row.paid_days_count, 0)));
  const remainingDays = Math.max(0, paymentDays - paidDaysCount);

  return {
    id: String(row.id || ''),
    clientId: String(row.client_id || ''),
    client_id: String(row.client_id || ''),
    clientName,
    clientAlias,
    client_alias: clientAlias,
    alias: clientAlias,
    apodo: clientAlias,
    clientPhone: String(row.client_phone || row.phone || ''),
    clientAddress: String(row.client_address || row.address || ''),

    capital,
    amount: capital,
    monto: capital,
    amount_borrowed: capital,

    interestRate,
    interest_rate: interestRate,
    interes: interestRate,
    interestAmount,
    interest_amount: interestAmount,
    interest: interestAmount,

    penaltyAmount,
    penalty_amount: penaltyAmount,
    mora: penaltyAmount,
    lateFee: penaltyAmount,
    late_fee: penaltyAmount,
    recargo: penaltyAmount,

    totalToPay,
    totalAmount: totalToPay,
    total_amount: totalToPay,
    total_to_pay: totalToPay,

    paymentDays,
    payment_days: paymentDays,
    days_agreed: paymentDays,
    days: paymentDays,
    duration: paymentDays,
    total_installments: paymentDays,

    dailyPaymentAmount,
    daily_payment_amount: dailyPaymentAmount,
    daily_payment: dailyPaymentAmount,
    dailyAmount: dailyPaymentAmount,
    daily_amount: dailyPaymentAmount,

    paidAmount,
    paid_amount: paidAmount,
    remainingAmount,
    remaining_amount: remainingAmount,
    paidDaysCount,
    paid_days_count: paidDaysCount,
    remainingDays,
    remaining_days: remainingDays,

    startDate: startDateFormatted,
    start_date: startDateFormatted,
    dueDate: dueDateFormatted,
    due_date: dueDateFormatted,
    fecha_vencimiento: dueDateFormatted,
    end_date: dueDateFormatted,

    status: normalizeLoanStatus(row.status),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    assignedTo: row.assigned_to_user_id ? String(row.assigned_to_user_id) : undefined,
    assignedToName: row.collector_name || 'Admin'
  };
}

function mapRowToPayment(row) {
  const paymentDate = String(row.payment_date || row.date || row.created_at || new Date().toISOString().split('T')[0]).split('T')[0];
  const clientName = String(row.joined_client_name || row.client_name || row.name || 'Cliente sin Nombre');
  const collectorName = String(row.collector_name || row.user_name || 'Admin');

  return {
    id: String(row.id || ''),
    loanId: String(row.loan_id || ''),
    loan_id: String(row.loan_id || ''),
    clientId: String(row.client_id || ''),
    client_id: String(row.client_id || ''),
    clientName: clientName,
    client_name: clientName,
    joined_client_name: clientName,
    name: clientName,
    amount: Number(row.amount || 0),
    lateFee: Number(row.late_fee || 0),
    late_fee: Number(row.late_fee || 0),
    date: paymentDate,
    payment_date: paymentDate,
    type: row.type || 'FULL_DAY',
    dayNumber: Number(row.day_number || 1),
    day_number: Number(row.day_number || 1),
    notes: row.notes ? String(row.notes) : '',
    createdAt: row.created_at || undefined,
    created_at: row.created_at || undefined,
    collectedBy: row.collected_by_user_id ? String(row.collected_by_user_id) : undefined,
    collectorName: collectorName,
    collector_name: collectorName
  };
}

function mapRowToExpense(row) {
  return {
    id: String(row.id || ''),
    amount: Number(row.amount || 0),
    category: row.category || 'OTROS',
    description: String(row.description || ''),
    date: String(row.expense_date || row.date || new Date().toISOString().split('T')[0]),
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

export async function buildDashboardSummary(db = pool) {
  const loanResult = await db.query(`
    SELECT l.*, COALESCE(c.name, l.client_name, 'Cliente') AS client_name
    FROM loans l
    LEFT JOIN clients c ON l.client_id::text = c.id::text
    ORDER BY l.created_at DESC NULLS LAST, l.id DESC
  `);
  const totalsResult = await db.query(`
    SELECT
      COALESCE(SUM(amount), 0) AS total,
      ${PERU_TODAY_SQL}::text AS business_date
    FROM payments
    WHERE COALESCE(payment_date, date) = ${PERU_TODAY_SQL}
  `);
  const recentPaymentsResult = await db.query(`
    SELECT
      p.*,
      COALESCE(c.name, p.client_name, 'Cliente sin Nombre') AS joined_client_name,
      COALESCE(u.name, 'Admin') AS collector_name
    FROM payments p
    LEFT JOIN clients c ON p.client_id::text = c.id::text
    LEFT JOIN users u ON p.collected_by_user_id::text = u.id::text
    WHERE COALESCE(p.payment_date, p.date) = ${PERU_TODAY_SQL}
    ORDER BY p.created_at DESC NULLS LAST, p.id DESC
    LIMIT 10
  `);

  const loans = (loanResult.rows || []).map(mapRowToLoan);
  const totalCapitalLent = loans.reduce((sum, loan) => sum + Number(loan.capital || 0), 0);
  const totalEstimatedProfit = loans.reduce((sum, loan) => sum + Number(loan.interestAmount || 0), 0);
  const collectedToday = Math.round(
    finiteNumber(totalsResult.rows[0]?.total, 0) * 100
  ) / 100;
  const recentPayments = (recentPaymentsResult.rows || []).map(mapRowToPayment);

  return {
    totalCapitalLent,
    totalEstimatedProfit,
    collectedToday,
    todayCollected: collectedToday,
    totalActiveLoansCount: loans.filter((loan) => loan.status === 'ACTIVE').length,
    businessDate: totalsResult.rows[0]?.business_date,
    timeZone: 'America/Lima',
    recentLoans: loans.slice(0, 10),
    recentPayments,
    payments: recentPayments,
  };
}

// ==========================================
// CONTROLADOR
// ==========================================

const loanController = {

  // 1. CLIENTES
  async getClients(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const isTodos = req.query.filter === 'TODOS' || req.query.assignedTo === 'TODOS';
      const userId = req.user ? req.user.id : null;
      
      const query = `
        SELECT
          c.*,
          COALESCE(u.name, 'Sin Asignar') AS assigned_to_name,
          l.id AS loan_id,
          COALESCE(NULLIF(l.amount, 0), NULLIF(l.capital, 0), NULLIF(l.amount_borrowed, 0), 0) AS loan_amount,
          COALESCE(NULLIF(l.amount, 0), NULLIF(l.capital, 0), NULLIF(l.amount_borrowed, 0), 0) AS loan_capital,
          COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0) AS loan_total_amount,
          COALESCE(NULLIF(l.daily_amount, 0), NULLIF(l.daily_payment_amount, 0), NULLIF(l.daily_payment, 0), 0) AS loan_daily_amount,
          COALESCE(l.interest_rate, 20) AS loan_interest_rate,
          COALESCE(l.penalty_amount, l.mora, c.mora, 0) AS loan_penalty_amount,
          COALESCE(l.mora, l.penalty_amount, c.mora, 0) AS loan_mora,
          COALESCE(l.paid_amount, 0) AS loan_paid_amount,
          GREATEST(
            0,
            COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0)
              - COALESCE(l.paid_amount, 0)
          ) AS loan_remaining_amount,
          COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer AS loan_days,
          GREATEST(
            0,
            COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
            - COALESCE(l.paid_days_count, 0)::integer
          ) AS loan_remaining_days,
          COALESCE(l.start_date, l.created_at::date, c.created_at::date) AS loan_start_date,
          COALESCE(l.start_date, l.created_at::date, c.created_at::date) AS start_date,
          COALESCE(
            l.due_date,
            COALESCE(l.start_date, l.created_at::date, c.created_at::date)
              + COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
          ) AS loan_due_date,
          COALESCE(
            l.due_date,
            COALESCE(l.start_date, l.created_at::date, c.created_at::date)
              + COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
          ) AS due_date,
          COALESCE(
            l.due_date,
            COALESCE(l.start_date, l.created_at::date, c.created_at::date)
              + COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
          ) AS fecha_vencimiento,
          l.status AS loan_status,
          COALESCE(ls.active_loans_count, 0) AS active_loan_count,
          COALESCE(ls.active_loans_count, 0) AS active_loans_count,
          COALESCE(ls.total_loans_count, 0) AS total_loans_count,
          COALESCE(ls.total_active_capital, 0) AS total_active_capital,
          COALESCE(ls.total_remaining_amount, 0) AS total_remaining_amount,
          ls.next_due_date,
          COALESCE(p_today.today_paid_amount, 0) AS today_paid_amount,
          COALESCE(p_today.today_payments_count, 0) AS today_payments_count
        FROM clients c
        LEFT JOIN users u ON c.assigned_to_user_id::text = u.id::text
        LEFT JOIN (
          SELECT DISTINCT ON (client_id::text)
            loans.*,
            COUNT(*) OVER (PARTITION BY client_id::text) AS active_loan_count
          FROM loans
          WHERE COALESCE(is_archived, 0) = 0
            AND UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
          ORDER BY
            client_id::text,
            created_at DESC
        ) l ON l.client_id::text = c.id::text
        LEFT JOIN (
          SELECT
            client_id::text AS client_id,
            COUNT(*) FILTER (
              WHERE UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
            )::integer AS active_loans_count,
            COUNT(*)::integer AS total_loans_count,
            COALESCE(SUM(
              CASE WHEN UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
                THEN COALESCE(NULLIF(amount, 0), NULLIF(capital, 0), NULLIF(amount_borrowed, 0), 0)
                ELSE 0 END
            ), 0) AS total_active_capital,
            COALESCE(SUM(
              CASE WHEN UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
                THEN GREATEST(0, COALESCE(NULLIF(total_amount, 0), NULLIF(total_to_pay, 0), 0) - COALESCE(paid_amount, 0))
                ELSE 0 END
            ), 0) AS total_remaining_amount,
            MIN(COALESCE(
              due_date,
              start_date + COALESCE(NULLIF(payment_days, 0), NULLIF(days_agreed, 0), NULLIF(days, 0), 20)::integer
            )) FILTER (
              WHERE UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
                AND GREATEST(0, COALESCE(NULLIF(total_amount, 0), NULLIF(total_to_pay, 0), 0) - COALESCE(paid_amount, 0)) > 0
            ) AS next_due_date
          FROM loans
          WHERE COALESCE(is_archived, 0) = 0
          GROUP BY client_id::text
        ) ls ON ls.client_id = c.id::text
        LEFT JOIN (
          SELECT
            client_id::text,
            SUM(amount) AS today_paid_amount,
            COUNT(id) AS today_payments_count
          FROM payments
          WHERE COALESCE(payment_date, date) = ${PERU_TODAY_SQL}
            AND amount > 0
          GROUP BY client_id::text
        ) p_today ON p_today.client_id::text = c.id::text
        ${isCobrador && userId && !isTodos ? 'WHERE c.assigned_to_user_id::text = $1' : ''}
        ORDER BY c.created_at DESC
      `;
      const params = (isCobrador && userId && !isTodos) ? [String(userId)] : [];
      const { rows } = await pool.query(query, params);

      const mappedRows = (rows || []).map(row => {
        const mapped = mapRowToClient ? mapRowToClient(row) : row;

        const calculatedDueDate = toDateOnly(row.loan_due_date || mapped.loan_due_date || mapped.due_date);
        const effectiveMora = Number(row.loan_mora || row.loan_penalty_amount || row.penalty_amount || row.mora || mapped.mora || 0);

        return {
          ...mapped,
          loan_id: row.loan_id,
          loan_amount: Number(row.loan_amount || 0),
          loan_capital: Number(row.loan_capital || 0),
          loan_total_amount: Number(row.loan_total_amount || 0),
          loan_daily_amount: Number(row.loan_daily_amount || 0),
          loan_penalty_amount: effectiveMora,
          loan_mora: effectiveMora,
          penaltyAmount: effectiveMora,
          penalty_amount: effectiveMora,
          mora: effectiveMora,
          lateFee: effectiveMora,
          late_fee: effectiveMora,
          loan_start_date: row.loan_start_date,
          loan_due_date: calculatedDueDate,
          due_date: calculatedDueDate,
          loan_status: normalizeLoanStatus(row.loan_status),
          loansCount: Number(row.total_loans_count || 0),
          totalLoansCount: Number(row.total_loans_count || 0),
          total_loans_count: Number(row.total_loans_count || 0),
          activeLoansCount: Number(row.active_loans_count || 0),
          active_loans_count: Number(row.active_loans_count || 0),
          totalActiveCapital: Number(row.total_active_capital || 0),
          total_active_capital: Number(row.total_active_capital || 0),
          totalRemainingAmount: Number(row.total_remaining_amount || 0),
          total_remaining_amount: Number(row.total_remaining_amount || 0),
          nextDueDate: toDateOnly(row.next_due_date),
          next_due_date: toDateOnly(row.next_due_date),
          today_paid_amount: Number(row.today_paid_amount || 0),
          today_payments_count: Number(row.today_payments_count || 0)
        };
      });

      return res.json(mappedRows);
    } catch (error) {
      console.error("[ERROR GET /api/clients]:", error);
      return res.status(500).json({ error: 'No se pudieron cargar los clientes', details: error.message });
    }
  },
  
  async createClient(req, res) {
    try {
      const name = req.body.name || req.body.nombre || '';
      const alias = req.body.alias || req.body.apodo || '';
      const phone = req.body.phone || req.body.telefono || '';
      const dni = req.body.dni || req.body.documento || '';
      const address = req.body.address || req.body.direccion || '';
      const notes = req.body.notes || req.body.observaciones || '';
      const assigned_to_user_id = req.body.assigned_to_user_id || req.body.assignedTo || req.user?.id || null;
      if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
      const query = `
        INSERT INTO clients (id, name, alias, phone, dni, address, notes, assigned_to_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const result = await pool.query(query, [
        generateUUID(), name.trim(), alias.trim(), phone.trim(), dni.trim(), address.trim(), notes.trim(),
        assigned_to_user_id ? String(assigned_to_user_id) : null
      ]);
      return res.status(201).json(mapRowToClient(result.rows[0]));
    } catch (error) {
      console.error('[ERROR POST /api/clients]:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async updateClient(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const name = req.body.name || req.body.nombre || '';
      const alias = req.body.alias || req.body.apodo || '';
      const phone = req.body.phone || req.body.telefono || '';
      const address = req.body.address || req.body.direccion || '';
      const dni = req.body.dni || req.body.documento || req.body.identification || '';
      const notes = req.body.notes || req.body.observaciones || '';
      const moraRaw = req.body.mora ?? req.body.late_fee ?? req.body.lateFee ?? req.body.recargo ?? req.body.penalty ?? req.body.penalty_amount ?? req.body.penaltyAmount;
      const moraVal = (moraRaw !== undefined && moraRaw !== null && moraRaw !== '') ? Math.max(0, parseFloat(moraRaw) || 0) : null;

      await client.query('BEGIN');

      const query = `
        UPDATE clients SET 
          name = $1, 
          alias = $2, 
          phone = $3, 
          address = $4, 
          dni = $5, 
          notes = $6,
          mora = COALESCE($7, mora),
          penalty_amount = COALESCE($7, penalty_amount)
        WHERE id::text = $8 RETURNING *
      `;
      const result = await client.query(query, [
        name.trim(),
        alias.trim(),
        phone.trim(),
        address.trim(),
        dni.trim(),
        notes.trim(),
        moraVal,
        String(id)
      ]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      await client.query(`
        UPDATE loans SET
          client_name = $1,
          client_phone = $2,
          client_address = $3
        WHERE client_id::text = $4
      `, [name.trim(), phone.trim(), address.trim(), String(id)]);

      if (moraVal !== null) {
        const activeLoansRes = await client.query(`
          SELECT * FROM loans
          WHERE client_id::text = $1
            AND COALESCE(is_archived, 0) = 0
            AND UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
          ORDER BY created_at DESC
        `, [String(id)]);

        if (activeLoansRes.rows.length > 0) {
          const loanRow = activeLoansRes.rows[0];
          const capital = Math.max(0, firstNonZeroNumber([loanRow.capital, loanRow.amount, loanRow.amount_borrowed], 0));
          const storedInterestRate = firstFiniteNumber([loanRow.interest_rate, loanRow.interes], 20);
          const storedInterestAmount = firstNonZeroNumber([loanRow.interest_amount], 0);
          const interestRate = storedInterestRate > 0 || storedInterestAmount <= 0 || capital <= 0
            ? storedInterestRate
            : Number(((storedInterestAmount / capital) * 100).toFixed(2));
          const interestAmount = firstNonZeroNumber([loanRow.interest_amount], Number((capital * (interestRate / 100)).toFixed(2)));

          const newPenalty = moraVal;
          const newTotalAmount = Number((capital + interestAmount + newPenalty).toFixed(2));
          const days = Math.max(1, Math.round(firstNonZeroNumber([loanRow.payment_days, loanRow.days_agreed, loanRow.days], 20)));
          const dailyPayment = Number((newTotalAmount / days).toFixed(2));
          const paidAmount = Math.max(0, finiteNumber(loanRow.paid_amount, 0));
          const remainingAmount = Math.max(0, Number((newTotalAmount - paidAmount).toFixed(2)));
          const paidDaysCount = Math.min(days, Math.max(0, Math.floor(paidAmount / Math.max(dailyPayment, 0.01))));
          const remainingDays = Math.max(0, days - paidDaysCount);

          await client.query(`
            UPDATE loans SET
              penalty_amount = $1::numeric,
              mora = $1::numeric,
              total_amount = $2::numeric,
              total_to_pay = $2::numeric,
              daily_payment_amount = $3::numeric,
              daily_payment = $3::numeric,
              daily_amount = $3::numeric,
              remaining_amount = $4::numeric,
              remaining_days = $5::integer,
              paid_days_count = $6::integer,
              status = CASE
                WHEN $4::numeric <= 0::numeric THEN 'PAID'
                WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
                WHEN $1::numeric > 0 AND status = 'OVERDUE' THEN 'OVERDUE'
                ELSE status
              END
            WHERE id::text = $7::text
          `, [newPenalty, newTotalAmount, dailyPayment, remainingAmount, remainingDays, paidDaysCount, String(loanRow.id)]);
        }
      }

      await client.query('COMMIT');

      const fullClientRes = await pool.query(`
        SELECT
          c.*,
          COALESCE(u.name, 'Sin Asignar') AS assigned_to_name,
          l.id AS loan_id,
          COALESCE(NULLIF(l.amount, 0), NULLIF(l.capital, 0), NULLIF(l.amount_borrowed, 0), 0) AS loan_amount,
          COALESCE(NULLIF(l.amount, 0), NULLIF(l.capital, 0), NULLIF(l.amount_borrowed, 0), 0) AS loan_capital,
          COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0) AS loan_total_amount,
          COALESCE(NULLIF(l.daily_amount, 0), NULLIF(l.daily_payment_amount, 0), NULLIF(l.daily_payment, 0), 0) AS loan_daily_amount,
          COALESCE(l.interest_rate, 20) AS loan_interest_rate,
          COALESCE(l.penalty_amount, l.mora, c.mora, 0) AS loan_penalty_amount,
          COALESCE(l.mora, l.penalty_amount, c.mora, 0) AS loan_mora,
          COALESCE(l.paid_amount, 0) AS loan_paid_amount,
          GREATEST(
            0,
            COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0)
              - COALESCE(l.paid_amount, 0)
          ) AS loan_remaining_amount,
          COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer AS loan_days,
          GREATEST(
            0,
            COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
            - COALESCE(l.paid_days_count, 0)::integer
          ) AS loan_remaining_days,
          COALESCE(l.start_date, l.created_at::date, c.created_at::date) AS loan_start_date,
          COALESCE(l.start_date, l.created_at::date, c.created_at::date) AS start_date,
          COALESCE(
            l.due_date,
            COALESCE(l.start_date, l.created_at::date, c.created_at::date)
              + COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
          ) AS loan_due_date,
          COALESCE(
            l.due_date,
            COALESCE(l.start_date, l.created_at::date, c.created_at::date)
              + COALESCE(NULLIF(l.payment_days, 0), NULLIF(l.days_agreed, 0), NULLIF(l.days, 0), 20)::integer
          ) AS due_date,
          l.status AS loan_status
        FROM clients c
        LEFT JOIN users u ON c.assigned_to_user_id::text = u.id::text
        LEFT JOIN (
          SELECT DISTINCT ON (client_id::text)
            loans.*
          FROM loans
          WHERE COALESCE(is_archived, 0) = 0
            AND UPPER(status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
          ORDER BY
            client_id::text,
            created_at DESC
        ) l ON l.client_id::text = c.id::text
        WHERE c.id::text = $1
      `, [String(id)]);

      const clientRow = fullClientRes.rows[0] || result.rows[0];
      const mapped = mapRowToClient(clientRow);
      const effectiveMora = Number(clientRow.loan_mora ?? clientRow.mora ?? moraVal ?? 0);
      return res.json({ 
        success: true, 
        client: {
          ...mapped,
          loan_penalty_amount: effectiveMora,
          loan_mora: effectiveMora,
          penaltyAmount: effectiveMora,
          penalty_amount: effectiveMora,
          mora: effectiveMora,
          late_fee: effectiveMora,
          lateFee: effectiveMora,
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR PUT /api/clients/:id]:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async assignClients(req, res) {
    const client = await pool.connect();
    try {
      const { clientIds, collectorId } = req.body;
      if (!Array.isArray(clientIds) || clientIds.length === 0) return res.status(400).json({ error: 'clientIds debe ser arreglo' });
      const assignedVal = collectorId && collectorId !== 'unassigned' ? String(collectorId) : null;

      await client.query('BEGIN');
      for (const cid of clientIds) {
        await client.query(`UPDATE clients SET assigned_to_user_id = $1 WHERE id::text = $2`, [assignedVal, String(cid)]);
        await client.query(`UPDATE loans SET assigned_to_user_id = $1 WHERE client_id::text = $2`, [assignedVal, String(cid)]);
      }
      await client.query('COMMIT');
      return res.json({ success: true, assignedCount: clientIds.length });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async updateRouteOrders(req, res) {
    const client = await pool.connect();
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) return res.status(400).json({ error: 'Formato inválido' });
      await client.query('BEGIN');
      for (const item of orders) {
        if (item.id) {
          await client.query(`UPDATE clients SET route_order = $1 WHERE id::text = $2`, [Number(item.routeOrder) || 0, String(item.id)]);
        }
      }
      await client.query('COMMIT');
      return res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async restoreClient(req, res) {
    try {
      await pool.query(`UPDATE clients SET status = 'ACTIVE' WHERE id::text = $1`, [String(req.params.id)]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async deleteClient(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query('BEGIN');
      await client.query(`DELETE FROM payments WHERE client_id::text = $1`, [String(id)]);
      await client.query(`DELETE FROM loans WHERE client_id::text = $1`, [String(id)]);
      await client.query(`DELETE FROM clients WHERE id::text = $1`, [String(id)]);
      await client.query('COMMIT');
      return res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // 2. PRÉSTAMOS
  async getLoans(req, res) {
    try {
      const clientIdFilter = req.query.clientId || req.query.client_id;
      const statusFilter = req.query.status;
      const searchFilter = req.query.search;
      const params = [];
      const conditions = [];
      let queryStr = `
        SELECT l.*, 
               COALESCE(c.name, 'Cliente sin Nombre') AS client_name,
               c.alias AS client_alias,
               c.alias AS joined_client_alias,
               COALESCE(c.phone, '') AS client_phone,
               COALESCE(c.address, '') AS client_address,
               COALESCE(u.name, 'Admin') AS collector_name
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        LEFT JOIN users u ON l.assigned_to_user_id::text = u.id::text
      `;
      if (clientIdFilter) {
        conditions.push(`l.client_id::text = $${params.length + 1}`);
        params.push(String(clientIdFilter));
      }
      if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'TODOS') {
        conditions.push(`l.status = $${params.length + 1}`);
        params.push(statusFilter);
      }
      if (searchFilter && searchFilter.trim() !== '') {
        conditions.push(`(c.name ILIKE $${params.length + 1} OR c.alias ILIKE $${params.length + 2})`);
        params.push(`%${searchFilter.trim()}%`, `%${searchFilter.trim()}%`);
      }
      if (conditions.length > 0) {
        queryStr += ` WHERE ` + conditions.join(' AND ');
      }
      queryStr += ` ORDER BY l.created_at DESC`;
      const { rows } = await pool.query(queryStr, params);
      return res.json((rows || []).map(mapRowToLoan));
    } catch (error) {
      console.error("[ERROR GET /api/loans]:", error);
      return res.status(500).json({ error: 'No se pudieron cargar los préstamos', details: error.message });
    }
  },

  async createClientAndLoan(req, res) {
    const client = await pool.connect();
    let transactionStarted = false;
    try {
      await client.query('BEGIN');
      transactionStarted = true;

      let rawClientId = req.body.client_id ?? req.body.clientId;
      if (typeof rawClientId === 'object' && rawClientId !== null) rawClientId = rawClientId.id;
      let finalClientId = (rawClientId && String(rawClientId) !== '[object Object]') ? String(rawClientId) : null;
      let clientName = String(
        req.body.name ?? req.body.nombre ?? req.body.client_name ?? req.body.clientName ?? ''
      ).trim();
      const clientPhone = String(
        req.body.phone ?? req.body.telefono ?? req.body.client_phone ?? req.body.clientPhone ?? ''
      ).trim();
      const clientAddress = String(
        req.body.address ?? req.body.direccion ?? req.body.client_address ?? req.body.clientAddress ?? ''
      ).trim();
      const clientIdentification = String(
        req.body.dni ?? req.body.documento ?? req.body.identification ?? req.body.clientIdentification ?? ''
      ).trim();
      const clientAlias = String(
        req.body.alias ?? req.body.apodo ?? req.body.client_alias ?? req.body.clientAlias ?? ''
      ).trim();
      const notes = String(req.body.notes ?? req.body.observaciones ?? '').trim();
      const assignedToUserId = req.body.assigned_to_user_id ?? req.body.assignedToUserId ?? req.body.assignedTo
        ? String(req.body.assigned_to_user_id ?? req.body.assignedToUserId ?? req.body.assignedTo)
        : (req.user?.id ? String(req.user.id) : null);

      const rawAmount = req.body.amount ?? req.body.capital ?? req.body.amount_borrowed ?? req.body.monto;
      const rawInterestRate = req.body.interest_rate ?? req.body.interestRate ?? req.body.interes ?? 20;
      const rawDays = req.body.payment_days ?? req.body.paymentDays ?? req.body.days_agreed ?? req.body.days;
      const validatedAmount = Number(rawAmount);
      const validatedInterestRate = Number(rawInterestRate);
      const validatedDays = Number(rawDays);
      if (!Number.isFinite(validatedAmount) || validatedAmount <= 0) {
        await client.query('ROLLBACK'); transactionStarted = false;
        return res.status(422).json({ error: 'El capital debe ser un número mayor a 0' });
      }
      if (!Number.isFinite(validatedInterestRate) || validatedInterestRate < 0) {
        await client.query('ROLLBACK'); transactionStarted = false;
        return res.status(422).json({ error: 'La tasa de interés debe ser un número mayor o igual a 0' });
      }
      if (!Number.isInteger(validatedDays) || validatedDays <= 0) {
        await client.query('ROLLBACK'); transactionStarted = false;
        return res.status(422).json({ error: 'Los días de pago deben ser un entero mayor a 0' });
      }
      if (finalClientId) {
        const existingClient = await client.query(
          `SELECT id, name FROM clients WHERE id::text = $1 LIMIT 1`,
          [finalClientId]
        );
        if (existingClient.rows.length === 0) {
          await client.query('ROLLBACK');
          transactionStarted = false;
          return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        clientName = String(existingClient.rows[0].name);
      } else {
        if (!clientName) {
          await client.query('ROLLBACK');
          transactionStarted = false;
          return res.status(400).json({ error: 'El nombre o client_id es obligatorio' });
        }
        const existingClientRes = await client.query(
          `SELECT id, name
           FROM clients
           WHERE ($1 <> '' AND TRIM(COALESCE(dni, '')) = $1)
              OR ($2 <> '' AND regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = regexp_replace($2, '\\D', '', 'g'))
              OR LOWER(TRIM(name)) = LOWER(TRIM($3))
           ORDER BY CASE
             WHEN $1 <> '' AND TRIM(COALESCE(dni, '')) = $1 THEN 1
             WHEN $2 <> '' AND regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = regexp_replace($2, '\\D', '', 'g') THEN 2
             ELSE 3
           END
           LIMIT 1`,
          [clientIdentification, clientPhone, clientName]
        );
        if (existingClientRes.rows.length > 0) {
          finalClientId = String(existingClientRes.rows[0].id);
          clientName = String(existingClientRes.rows[0].name || clientName);
        } else {
          const clientRes = await client.query(`
            INSERT INTO clients (id, name, alias, phone, dni, address, notes, assigned_to_user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
          `, [
            generateUUID(), clientName, clientAlias, clientPhone, clientIdentification,
            clientAddress, notes, assignedToUserId
          ]);
          finalClientId = String(clientRes.rows[0].id);
        }
      }

      const amount = validatedAmount;
      const interestRate = validatedInterestRate;
      const interestAmount = Number((amount * (interestRate / 100)).toFixed(2));
      const totalAmount = Number((amount + interestAmount).toFixed(2));
      const days = validatedDays;
      const dailyAmount = Number((totalAmount / days).toFixed(2));
      const status = normalizeLoanStatus(req.body.status, 'ACTIVE');
      const startDate = toDateOnly(req.body.start_date ?? req.body.startDate)
        || new Date().toISOString().split('T')[0];
      const dueDate = toDateOnly(
        req.body.due_date ?? req.body.dueDate ?? req.body.fecha_vencimiento
      ) || addDays(startDate, days);
      if (dueDate < startDate) {
        await client.query('ROLLBACK'); transactionStarted = false;
        return res.status(422).json({ error: 'La fecha de vencimiento no puede ser anterior a la fecha de inicio' });
      }

      const clientSnapshot = await client.query(
        `SELECT phone, address FROM clients WHERE id::text = $1 LIMIT 1`,
        [String(finalClientId)]
      );
      const loanClientPhone = clientSnapshot.rows[0]?.phone || clientPhone;
      const loanClientAddress = clientSnapshot.rows[0]?.address || clientAddress;

      const loanId = generateUUID();
      const loanRes = await client.query(`
        INSERT INTO loans (
          id, client_id, client_name, client_phone, client_address,
          amount, capital, amount_borrowed,
          interest_rate, interest_amount,
          total_amount, total_to_pay,
          payment_days, days_agreed, days,
          daily_payment_amount, daily_payment, daily_amount,
          paid_amount, remaining_amount, paid_days_count, remaining_days,
          start_date, due_date, status, assigned_to_user_id, assigned_to, is_archived
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $6, $6,
          $7, $8,
          $9, $9,
          $10, $10, $10,
          $11, $11, $11,
          0, $9, 0, $10,
          $12, $13, $14, $15, $16, 0
        ) RETURNING *
      `, [
        loanId, finalClientId, clientName, loanClientPhone, loanClientAddress,
        amount, interestRate, interestAmount, totalAmount,
        days, dailyAmount, startDate, dueDate, status, assignedToUserId, assignedToUserId
      ]);
      const fullLoanRes = await client.query(`
        SELECT l.*, COALESCE(c.name, 'Cliente') AS client_name, c.alias AS client_alias, c.phone AS client_phone, c.address AS client_address
        FROM loans l LEFT JOIN clients c ON l.client_id::text = c.id::text WHERE l.id::text = $1
      `, [String(loanRes.rows[0].id)]);
      await client.query('COMMIT');
      transactionStarted = false;
      return res.status(201).json(mapRowToLoan(fullLoanRes.rows[0]));
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('[ERROR ROLLBACK POST /api/loans]:', rollbackError);
        }
      }
      console.error('[ERROR POST /api/loans]:', error);
      return res.status(500).json({
        error: 'No se pudo crear el préstamo',
        details: error.message,
      });
    } finally {
      client.release();
    }
  },

  async updateLoan(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query('BEGIN');
      const currentRes = await client.query(
        `SELECT * FROM loans WHERE id::text = $1 LIMIT 1 FOR UPDATE`,
        [String(id)]
      );
      if (currentRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      const current = currentRes.rows[0];
      const requestedAmount = req.body.amount ?? req.body.capital ?? req.body.amount_borrowed;
      const requestedInterest = req.body.interest_rate ?? req.body.interestRate ?? req.body.interes;
      const requestedDays = req.body.payment_days ?? req.body.paymentDays ?? req.body.days_agreed ?? req.body.days;
      if (requestedAmount !== undefined && (!Number.isFinite(Number(requestedAmount)) || Number(requestedAmount) <= 0)) {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'El capital debe ser un número mayor a 0' });
      }
      if (requestedInterest !== undefined && (!Number.isFinite(Number(requestedInterest)) || Number(requestedInterest) < 0)) {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'La tasa de interés debe ser mayor o igual a 0' });
      }
      if (requestedDays !== undefined && (!Number.isInteger(Number(requestedDays)) || Number(requestedDays) <= 0)) {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'Los días deben ser un entero mayor a 0' });
      }
      const amount = Math.max(0, firstNonZeroNumber([
        req.body.amount, req.body.capital, req.body.amount_borrowed,
        current.amount, current.capital, current.amount_borrowed,
      ], 0));
      const currentInterestRate = finiteNumber(current.interest_rate, 0);
      const currentInterestAmount = finiteNumber(current.interest_amount, 0);
      const currentCapital = firstNonZeroNumber([
        current.amount, current.capital, current.amount_borrowed,
      ], amount);
      const inferredCurrentRate = currentInterestRate > 0 || currentInterestAmount <= 0 || currentCapital <= 0
        ? currentInterestRate
        : Number(((currentInterestAmount / currentCapital) * 100).toFixed(2));
      const interestRate = Math.max(0, finiteNumber(
        requestedInterest ?? inferredCurrentRate,
        20
      ));
      const interestAmount = Number((amount * (interestRate / 100)).toFixed(2));
      const penaltyAmount = Math.max(0, finiteNumber(
        req.body.penalty_amount ?? req.body.penaltyAmount ?? req.body.mora
          ?? current.penalty_amount ?? current.mora,
        0
      ));
      const totalAmount = Number((amount + interestAmount + penaltyAmount).toFixed(2));
      const days = Math.max(1, Math.round(firstNonZeroNumber([
        req.body.payment_days, req.body.paymentDays, req.body.days_agreed, req.body.days,
        current.payment_days, current.days_agreed, current.days,
      ], 20)));
      const dailyAmount = Number((totalAmount / days).toFixed(2));
      const startDate = toDateOnly(
        req.body.start_date ?? req.body.startDate ?? current.start_date
      ) || new Date().toISOString().split('T')[0];
      const explicitDueDate = toDateOnly(
        req.body.due_date ?? req.body.dueDate ?? req.body.fecha_vencimiento
      );
      const dueDate = explicitDueDate || addDays(startDate, days);
      if (dueDate < startDate) {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'La fecha de vencimiento no puede ser anterior a la fecha de inicio' });
      }
      const paymentTotals = await client.query(`
        SELECT COALESCE(SUM(amount), 0)::numeric AS paid_amount
        FROM payments
        WHERE loan_id::text = $1
      `, [String(id)]);
      // Preserve legacy paid balances even when their historical payment rows
      // were not migrated. A payment sum can raise this value, never reset it.
      const paidAmount = Math.max(
        0,
        finiteNumber(current.paid_amount, 0),
        finiteNumber(paymentTotals.rows[0]?.paid_amount, 0)
      );
      if (paidAmount > totalAmount + 0.001) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `El nuevo total S/ ${totalAmount.toFixed(2)} no puede ser menor que lo ya pagado S/ ${paidAmount.toFixed(2)}`,
        });
      }
      const paidDaysCount = Math.min(days, Math.max(0, Math.floor(paidAmount / Math.max(dailyAmount, 0.01))));
      const remainingAmount = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
      const remainingDays = Math.max(0, days - paidDaysCount);
      const status = normalizeLoanStatus(req.body.status ?? current.status, 'ACTIVE');
      const notes = String(req.body.notes ?? req.body.observaciones ?? current.notes ?? '').trim();

      const { rows } = await client.query(`
        UPDATE loans SET
          amount = $1::numeric,
          capital = $1::numeric,
          amount_borrowed = $1::numeric,
          interest_rate = $2::numeric,
          interest_amount = $3::numeric,
          penalty_amount = $4::numeric,
          mora = $4::numeric,
          total_amount = $5::numeric,
          total_to_pay = $5::numeric,
          payment_days = $6::integer,
          days_agreed = $6::integer,
          days = $6::integer,
          daily_payment_amount = $7::numeric,
          daily_payment = $7::numeric,
          daily_amount = $7::numeric,
          start_date = $8::date,
          due_date = $9::date,
          remaining_amount = $10::numeric,
          remaining_days = $11::integer,
          paid_amount = $12::numeric,
          paid_days_count = $13::integer,
          notes = $14::text,
          status = CASE
            WHEN $15::numeric <= 0::numeric THEN 'PAID'
            WHEN $16::text = 'INACTIVE' THEN 'INACTIVE'
            WHEN $17::date < CURRENT_DATE THEN 'OVERDUE'
            ELSE 'ACTIVE'
          END
        WHERE id::text = $18::text
        RETURNING *
      `, [
        amount, interestRate, interestAmount, penaltyAmount, totalAmount, days, dailyAmount,
        startDate, dueDate, remainingAmount, remainingDays, paidAmount, paidDaysCount, notes,
        remainingAmount, status, dueDate, String(id)
      ]);

      await client.query('COMMIT');
      return res.json({ success: true, loan: mapRowToLoan(rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR UPDATE LOAN]:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async restoreLoan(req, res) {
    try {
      await pool.query(`UPDATE loans SET status = 'ACTIVE' WHERE id::text = $1`, [String(req.params.id)]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async deleteLoan(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      await client.query('BEGIN');
      await client.query(`DELETE FROM payments WHERE loan_id::text = $1`, [String(id)]);
      await client.query(`DELETE FROM loans WHERE id::text = $1`, [String(id)]);
      await client.query('COMMIT');
      return res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // GET /api/payments
  async getPayments(req, res) {
    try {
      const query = `
        SELECT p.*, 
               COALESCE(c.name, p.client_name, 'Cliente sin Nombre') AS joined_client_name,
               COALESCE(u.name, 'Admin') AS collector_name
        FROM payments p
        LEFT JOIN clients c ON p.client_id::text = c.id::text
        LEFT JOIN users u ON p.collected_by_user_id::text = u.id::text
        ORDER BY COALESCE(p.payment_date, p.date) DESC, p.created_at DESC NULLS LAST, p.id DESC
      `;
      const { rows } = await pool.query(query);
      return res.json((rows || []).map(mapRowToPayment));
    } catch (error) {
      console.error('[ERROR GET /api/payments]:', error);
      return res.status(500).json({ error: 'No se pudieron cargar los pagos', details: error.message });
    }
  },

  // GET /api/payments/history
  async getPaymentHistory(req, res) {
    try {
      const query = `
        SELECT p.*, 
               COALESCE(c.name, p.client_name, 'Cliente sin Nombre') AS joined_client_name,
               COALESCE(u.name, 'Admin') AS collector_name
        FROM payments p
        LEFT JOIN clients c ON p.client_id::text = c.id::text
        LEFT JOIN users u ON p.collected_by_user_id::text = u.id::text
        ORDER BY COALESCE(p.payment_date, p.date) DESC, p.created_at DESC NULLS LAST, p.id DESC
      `;
      const { rows } = await pool.query(query);
      return res.json((rows || []).map(mapRowToPayment));
    } catch (error) {
      console.error('[ERROR GET /api/payments/history]:', error);
      return res.status(500).json({ error: 'No se pudo cargar el historial de pagos', details: error.message });
    }
  },

  async registerPayment(req, res) {
    const client = await pool.connect();
    try {
      const userId = req.user?.id;
      const { loanId, loan_id, amount, notes, lateFee } = req.body;
      const targetLoanId = loanId || loan_id;
      const numericAmount = finiteNumber(amount, 0);

      if (numericAmount <= 0) return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
      if (!targetLoanId) return res.status(400).json({ error: 'loanId es obligatorio' });
      if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });
      await client.query('BEGIN');
      const resLoan = await client.query(`SELECT * FROM loans WHERE id::text = $1 FOR UPDATE`, [String(targetLoanId)]);
      if (resLoan.rows.length === 0) await client.query('ROLLBACK');
      if (resLoan.rows.length === 0) return res.status(404).json({ error: 'Préstamo no encontrado' });

      const loan = resLoan.rows[0];
      const totals = await client.query(`
        SELECT COALESCE(SUM(amount), 0)::numeric AS paid_amount
        FROM payments WHERE loan_id::text = $1
      `, [String(targetLoanId)]);
      const totalToPay = firstNonZeroNumber([loan.total_amount, loan.total_to_pay], 0);
      const previousPaid = finiteNumber(totals.rows[0]?.paid_amount, 0);
      const previousRemaining = Math.max(0, totalToPay - previousPaid);
      if (numericAmount > previousRemaining + 0.001) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `El pago excede el saldo restante de S/ ${previousRemaining.toFixed(2)}` });
      }
      const newPaidAmount = previousPaid + numericAmount;
      const newRemainingAmount = Math.max(0, totalToPay - newPaidAmount);
      const dailyAmount = Math.max(0.01, firstNonZeroNumber([
        loan.daily_amount, loan.daily_payment_amount, loan.daily_payment,
      ], numericAmount));
      const paymentDays = Math.max(1, Math.round(firstNonZeroNumber([
        loan.payment_days, loan.days_agreed, loan.days,
      ], 20)));
      const newPaidDaysCount = Math.min(paymentDays, Math.floor(newPaidAmount / dailyAmount));
      const paymentDateResult = await client.query(`SELECT ${PERU_TODAY_SQL}::text AS today`);
      const todayStr = toDateOnly(req.body.payment_date ?? req.body.date)
        || paymentDateResult.rows[0].today;
      const paymentRes = await client.query(`
        INSERT INTO payments (
          id, loan_id, client_id, client_name, amount, payment_date, date,
          type, day_number, late_fee, notes, collected_by_user_id, collected_by, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $11, $11)
        RETURNING *
      `, [
        generateUUID(), String(loan.id), String(loan.client_id), loan.client_name || 'Cliente', numericAmount,
        todayStr,
        newRemainingAmount <= 0 ? 'FULL_PAYOFF' : (numericAmount >= dailyAmount ? 'FULL_DAY' : 'PARTIAL'),
        newPaidDaysCount,
        finiteNumber(lateFee, 0), notes || '', String(userId)
      ]);
      const synchronizedLoan = await synchronizeLoanFromPayments(client, loan.id);
      await client.query('COMMIT');
      const payment = mapRowToPayment(paymentRes.rows[0]);
      const updatedLoan = mapRowToLoan(synchronizedLoan);
      return res.status(201).json({
        ...payment,
        payment,
        loan: updatedLoan,
        updatedLoan,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async revertLastPayment(req, res) {
    const client = await pool.connect();
    try {
      const loanId = req.params.id || req.body.loanId || req.body.loan_id;
      if (!loanId) return res.status(400).json({ error: 'Loan ID requerido' });

      await client.query('BEGIN');
      const loanResult = await client.query(
        `SELECT id FROM loans WHERE id::text = $1 FOR UPDATE`,
        [String(loanId)]
      );
      if (loanResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }
      const resPay = await client.query(`SELECT * FROM payments WHERE loan_id::text = $1 ORDER BY created_at DESC LIMIT 1`, [String(loanId)]);
      if (resPay.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Sin pagos' });
      }

      await client.query(`DELETE FROM payments WHERE id::text = $1`, [String(resPay.rows[0].id)]);
      const synchronizedLoan = await synchronizeLoanFromPayments(client, loanId);
      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Pago revertido',
        loan: mapRowToLoan(synchronizedLoan),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async updatePayment(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { amount, date, notes } = req.body;
      await client.query('BEGIN');
      const current = await client.query(`SELECT * FROM payments WHERE id::text = $1 FOR UPDATE`, [String(id)]);
      if (current.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Pago no encontrado' });
      }
      const numericAmount = amount === undefined ? finiteNumber(current.rows[0].amount, 0) : finiteNumber(amount, 0);
      if (numericAmount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
      }
      const loanId = String(current.rows[0].loan_id);
      const loanResult = await client.query(
        `SELECT * FROM loans WHERE id::text = $1 FOR UPDATE`,
        [loanId]
      );
      if (loanResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'El pago está asociado a un préstamo inexistente' });
      }
      const otherPayments = await client.query(`
        SELECT COALESCE(SUM(amount), 0)::numeric AS paid_amount
        FROM payments
        WHERE loan_id::text = $1 AND id::text <> $2
      `, [loanId, String(id)]);
      const loanTotal = firstNonZeroNumber([
        loanResult.rows[0].total_amount,
        loanResult.rows[0].total_to_pay,
      ], 0);
      const alreadyPaidByOthers = finiteNumber(otherPayments.rows[0]?.paid_amount, 0);
      const maximumEditableAmount = Math.max(0, loanTotal - alreadyPaidByOthers);
      if (numericAmount > maximumEditableAmount + 0.001) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `El pago excede el máximo permitido de S/ ${maximumEditableAmount.toFixed(2)}`,
        });
      }
      const paymentDate = toDateOnly(date) || toDateOnly(current.rows[0].payment_date || current.rows[0].date);
      const { rows } = await client.query(`
        UPDATE payments
        SET amount = $1, payment_date = $2, date = $2, notes = $3
        WHERE id::text = $4
        RETURNING *
      `, [numericAmount, paymentDate, notes ?? current.rows[0].notes ?? '', String(id)]);
      const synchronizedLoan = await synchronizeLoanFromPayments(client, current.rows[0].loan_id);
      await client.query('COMMIT');
      return res.json({
        success: true,
        payment: mapRowToPayment(rows[0]),
        loan: mapRowToLoan(synchronizedLoan),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async deletePayment(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const deleted = await client.query(
        `DELETE FROM payments WHERE id::text = $1 RETURNING loan_id`,
        [String(req.params.id)]
      );
      if (deleted.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Pago no encontrado' });
      }
      const synchronizedLoan = await synchronizeLoanFromPayments(client, deleted.rows[0].loan_id);
      await client.query('COMMIT');
      return res.json({ success: true, loan: mapRowToLoan(synchronizedLoan) });
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // 4. RUTA DIARIA & DASHBOARD
  async getTodayCollections(req, res) {
    try {
      const { rows: loans } = await pool.query(`
        SELECT l.*, COALESCE(c.name, 'Cliente') AS client_name, c.alias AS client_alias, c.phone AS client_phone, c.address AS client_address
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE UPPER(l.status) IN ('ACTIVE', 'OVERDUE', 'VIGENTE', 'VENCIDO', 'MORA')
          AND COALESCE(l.is_archived, 0) = 0
        ORDER BY c.route_order ASC, l.created_at DESC
      `);
      const { rows: paymentsToday } = await pool.query(`
        SELECT loan_id::text, client_id::text, SUM(amount) AS total_paid
        FROM payments 
        WHERE COALESCE(payment_date, date) = ${PERU_TODAY_SQL} AND amount > 0
        GROUP BY loan_id::text, client_id::text
      `);

      const paidMap = new Map();
      paymentsToday.forEach(p => {
        const val = Number(p.total_paid || 0);
        if (p.loan_id) paidMap.set(String(p.loan_id), val);
      });

      const result = (loans || []).map(row => {
        const mappedLoan = mapRowToLoan(row);
        const amountPaidToday = paidMap.get(mappedLoan.id) || 0;
        const isPaidToday = amountPaidToday > 0;
        return {
          loan: mappedLoan,
          isPaidToday,
          amountPaidToday
        };
      });

      return res.json(result);
    } catch (error) {
      console.error("[ERROR GET /api/today-collections]:", error);
      return res.status(500).json({ error: 'No se pudo cargar la ruta diaria', details: error.message });
    }
  },

  async getAlerts(req, res) {
    try {
      const isCobrador = String(req.user?.role || '').toUpperCase() === 'COBRADOR';
      const userId = req.user?.id ? String(req.user.id) : null;
      const params = isCobrador && userId ? [userId] : [];
      const collectorFilter = isCobrador && userId
        ? 'AND l.assigned_to_user_id::text = $1'
        : '';

      const { rows } = await pool.query(`
        WITH alert_candidates AS (
          SELECT
            l.id,
            l.client_id,
            COALESCE(c.name, l.client_name, 'Cliente sin Nombre') AS client_name,
            COALESCE(c.dni, c.documento, '') AS client_dni,
            COALESCE(c.phone, l.client_phone, '') AS client_phone,
            COALESCE(
              l.due_date,
              l.start_date + COALESCE(
                NULLIF(l.payment_days, 0),
                NULLIF(l.days_agreed, 0),
                NULLIF(l.days, 0),
                20
              )::integer
            ) AS effective_due_date,
            COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0) AS total_to_pay,
            COALESCE(l.paid_amount, 0) AS paid_amount,
            CASE
              WHEN l.remaining_amount IS NOT NULL
                AND l.remaining_amount > 0
                AND ABS(
                  l.remaining_amount
                    - GREATEST(
                        0,
                        COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0)
                          - COALESCE(l.paid_amount, 0)
                      )
                ) <= 0.01
              THEN l.remaining_amount
              ELSE GREATEST(
                0,
                COALESCE(NULLIF(l.total_amount, 0), NULLIF(l.total_to_pay, 0), 0)
                  - COALESCE(l.paid_amount, 0)
              )
            END AS remaining_amount
          FROM loans AS l
          LEFT JOIN clients AS c ON l.client_id::text = c.id::text
          WHERE COALESCE(l.is_archived, 0) = 0
            AND UPPER(COALESCE(l.status, 'ACTIVE')) NOT IN ('PAID', 'PAGADO', 'CANCELADO', 'INACTIVE')
            ${collectorFilter}
        )
        SELECT
          *,
          (effective_due_date - CURRENT_DATE)::integer AS days_remaining,
          CASE
            WHEN effective_due_date < CURRENT_DATE THEN 'OVERDUE'
            WHEN effective_due_date = CURRENT_DATE THEN 'DUE_TODAY'
            WHEN effective_due_date = CURRENT_DATE + 1 THEN 'DUE_TOMORROW'
          END AS alert_type
        FROM alert_candidates
        WHERE remaining_amount > 0
          AND effective_due_date IS NOT NULL
          AND effective_due_date <= CURRENT_DATE + 1
        ORDER BY
          CASE
            WHEN effective_due_date < CURRENT_DATE THEN 0
            WHEN effective_due_date = CURRENT_DATE THEN 1
            ELSE 2
          END,
          effective_due_date ASC,
          client_name ASC
      `, params);

      return res.json(rows.map((row) => {
        const dueDate = toDateOnly(row.effective_due_date);
        const remainingAmount = Math.max(0, finiteNumber(row.remaining_amount, 0));
        const totalToPay = Math.max(0, finiteNumber(row.total_to_pay, remainingAmount));
        const daysRemaining = finiteNumber(row.days_remaining, 0);
        return {
          id: `alert_${row.id}`,
          loanId: String(row.id),
          loan_id: String(row.id),
          clientId: String(row.client_id || ''),
          client_id: String(row.client_id || ''),
          clientName: String(row.client_name || 'Cliente sin Nombre'),
          client_name: String(row.client_name || 'Cliente sin Nombre'),
          dni: String(row.client_dni || ''),
          phone: String(row.client_phone || ''),
          clientPhone: String(row.client_phone || ''),
          dueDate,
          due_date: dueDate,
          remainingAmount,
          remaining_amount: remainingAmount,
          totalToPay,
          total_to_pay: totalToPay,
          daysRemaining,
          days_remaining: daysRemaining,
          daysDifference: daysRemaining,
          type: row.alert_type,
        };
      }));
    } catch (error) {
      console.error('[ERROR GET /api/alerts]:', error);
      return res.status(500).json({ error: 'No se pudieron cargar las alertas', details: error.message });
    }
  },

  async getDashboardSummary(req, res) {
    try {
      return res.json(await buildDashboardSummary(pool));
    } catch (error) {
      console.error('[ERROR DASHBOARD SUMMARY]:', error);
      return res.status(500).json({ error: 'No se pudo cargar el resumen', details: error.message });
    }
  },

  async getFinancialReport(req, res) {
    try {
      const { rows: lRows } = await pool.query(`SELECT * FROM loans`);
      const { rows: pRows } = await pool.query(`SELECT * FROM payments`);
      const { rows: eRows } = await pool.query(`SELECT * FROM expenses`);

      const loans = (lRows || []).map(mapRowToLoan);
      const payments = (pRows || []).map(mapRowToPayment);
      const expenses = (eRows || []).map(mapRowToExpense);
      return res.json({
        period: req.query.period || 'WEEKLY',
        capitalInvested: loans.reduce((s, l) => s + Number(l.capital || 0), 0),
        realCollected: payments.reduce((s, p) => s + Number(p.amount || 0), 0),
        totalExpenses: expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
        expensesList: expenses
      });
    } catch (error) {
      console.error('[ERROR GET /api/reports/financial]:', error);
      return res.status(500).json({ error: 'No se pudo generar el reporte financiero' });
    }
  },

  // 5. GASTOS, PAPELERA Y OTROS
  async getExpenses(req, res) {
    try {
      const { rows } = await pool.query('SELECT * FROM expenses ORDER BY id DESC');
      return res.json((rows || []).map(mapRowToExpense));
    } catch (error) {
      console.error('[ERROR GET /api/expenses]:', error);
      return res.status(500).json({ error: 'No se pudieron cargar los gastos' });
    }
  },

  async addExpense(req, res) {
    try {
      const { amount, category, description, date } = req.body;
      const { rows } = await pool.query(`
        INSERT INTO expenses (amount, category, description, expense_date) VALUES ($1, $2, $3, $4) RETURNING *
      `, [Number(amount || 0), category || 'OTROS', description || '', date || new Date().toISOString().split('T')[0]]);
      return res.status(201).json(mapRowToExpense(rows[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const { amount, category, description, date } = req.body;
      const { rows } = await pool.query(`
        UPDATE expenses SET amount = $1, category = $2, description = $3, expense_date = $4 WHERE id::text = $5 RETURNING *
      `, [Number(amount || 0), category || 'OTROS', description || '', date || new Date().toISOString().split('T')[0], String(id)]);
      if (rows.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
      return res.json(mapRowToExpense(rows[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async deleteExpense(req, res) {
    try {
      await pool.query(`DELETE FROM expenses WHERE id::text = $1`, [String(req.params.id)]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getTrash(req, res) {
    try {
      const { rows: cRows } = await pool.query(`SELECT * FROM clients WHERE status = 'INACTIVE' ORDER BY id DESC`);
      const { rows: lRows } = await pool.query(`
        SELECT l.*, c.name AS joined_client_name FROM loans l 
        LEFT JOIN clients c ON l.client_id::text = c.id::text 
        WHERE l.status = 'INACTIVE' ORDER BY l.id DESC
      `);
      return res.json({ clients: (cRows || []).map(mapRowToClient), loans: (lRows || []).map(mapRowToLoan) });
    } catch (error) {
      console.error('[ERROR GET /api/trash]:', error);
      return res.status(500).json({ error: 'No se pudo cargar la papelera' });
    }
  },

  async getCollectorsList(req, res) {
    try {
      const { rows } = await pool.query(`SELECT id, name, email, role, created_at FROM users ORDER BY name ASC`);
      return res.json({ success: true, collectors: rows, users: rows, data: rows });
    } catch (error) {
      return res.json({ success: true, collectors: [], users: [], data: [] });
    }
  },

  async getCollectorStats(req, res) {
    try {
      const { rows } = await pool.query(`SELECT id, name, email, role FROM users WHERE role = 'COBRADOR'`);
      return res.json({ success: true, stats: rows.map(u => ({ ...u, collectedToday: 0, collectedTotal: 0, assignedClients: 0 })) });
    } catch (error) {
      return res.json({ success: true, stats: [] });
    }
  },

  async getCollectorActivity(req, res) {
    return res.json({ success: true, activities: [] });
  },

  async getPortfolioByCollector(req, res) {
    try {
      const { rows: clientRows } = await pool.query(`SELECT * FROM clients ORDER BY id DESC`);
      const { rows: loanRows } = await pool.query(`SELECT * FROM loans ORDER BY id DESC`);
      return res.json({
        success: true,
        clients: (clientRows || []).map(mapRowToClient),
        loans: (loanRows || []).map(mapRowToLoan),
        collectorId: 'ALL'
      });
    } catch (error) {
      return res.json({ success: true, clients: [], loans: [], collectorId: 'ALL' });
    }
  },

  async assignPortfolio(req, res) {
    return res.json({ success: true, message: 'Portfolio asignado' });
  },

  async seedDatabase(req, res) {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
        return res.status(403).json({
          error: 'El borrado de datos de prueba está deshabilitado. Requiere ALLOW_DESTRUCTIVE_SEED=true fuera de producción.',
        });
      }
      await pool.query('DELETE FROM payments');
      await pool.query('DELETE FROM expenses');
      await pool.query('DELETE FROM loans');
      await pool.query('DELETE FROM clients');
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

export default loanController;
