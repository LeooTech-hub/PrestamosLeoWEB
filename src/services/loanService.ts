import {
  ReportPeriod,
  ExpenseCategory,
  NewClientLoanFormData,
  MoneyMethod,
} from '@/types';

const API_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:5000/api';

// Helper function for HTTP requests with automatic Bearer token injection
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('jwt')) : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options?.method || 'GET').toUpperCase();
  let url = `${API_URL}${endpoint}`;
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_t=${Date.now()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Service functions
export const loanService = {
  getClients: () => fetchAPI('/clients'),
  createClient: (data: Record<string, unknown>) =>
    fetchAPI('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  restoreClient: (id: string) =>
    fetchAPI(`/clients/${id}/restore`, { method: 'PUT' }),
  deleteClient: (id: string, mode: 'ARCHIVE' | 'PERMANENT') =>
    fetchAPI(`/clients/${id}?mode=${mode}`, { method: 'DELETE' }),

  getLoans: () => fetchAPI('/loans'),
  createLoan: (data: Record<string, unknown>) =>
    fetchAPI('/loans', { method: 'POST', body: JSON.stringify(data) }),
  updateLoan: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/loans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  restoreLoan: (id: string) =>
    fetchAPI(`/loans/${id}/restore`, { method: 'PUT' }),
  deleteLoan: (id: string, mode: 'ARCHIVE' | 'PERMANENT') =>
    fetchAPI(`/loans/${id}?mode=${mode}`, { method: 'DELETE' }),

  getTrash: () => fetchAPI('/trash'),

  createClientAndLoan: (data: NewClientLoanFormData) =>
    fetchAPI('/loans', { method: 'POST', body: JSON.stringify(data) }),

  reorderClients: (orderedClientIds: string[] | { id: string; routeOrder: number }[]) => {
    const orders = orderedClientIds.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: item, routeOrder: idx };
      }
      return { id: item.id, routeOrder: item.routeOrder ?? idx };
    });
    return fetchAPI('/clients/reorder', { method: 'PUT', body: JSON.stringify({ orders }) });
  },

  getPayments: () => fetchAPI('/payments'),
  registerPayment: (loanId: string, amount: number, notes?: string, lateFee?: number, paymentMethod?: MoneyMethod) =>
    fetchAPI('/payments', {
      method: 'POST',
      body: JSON.stringify({ loanId, amount, notes, lateFee, paymentMethod }),
    }),
  updatePayment: (id: string, data: { amount?: number; date?: string; notes?: string; paymentMethod?: MoneyMethod }) =>
    fetchAPI(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePayment: (id: string) =>
    fetchAPI(`/payments/${id}`, {
      method: 'DELETE',
    }),
  revertLastPayment: (loanId: string) =>
    fetchAPI(`/loans/${loanId}/revert-payment`, {
      method: 'POST',
    }),

  getDashboardSummary: () => fetchAPI('/dashboard/summary'),
  getTodayCollections: () => fetchAPI('/today-collections'),
  getAlerts: () => fetchAPI('/alerts'),
  getFinancialReport: (period: ReportPeriod) => fetchAPI(`/reports/financial?period=${period}`),
  addExpense: (data: { amount: number; category: ExpenseCategory; description: string; date: string }) =>
    fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: { amount?: number; category?: ExpenseCategory; description?: string; date?: string }) =>
    fetchAPI(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),
  resetToDemoData: () => fetchAPI('/demo/reset', { method: 'POST' }),
};

// Calculations & Helpers
export const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '--';
  const parts = parseDateParts(dateStr);
  if (parts) {
    const dd = String(parts.day).padStart(2, '0');
    const mm = String(parts.month).padStart(2, '0');
    return `${dd}/${mm}/${parts.year}`;
  }
  return '--';
};

export function calculateCustomLoan(capital: number, paymentDays: number, interestRate: number = 20) {
  const cap = Number(capital) || 0;
  const rate = interestRate !== undefined && !isNaN(Number(interestRate)) ? Number(interestRate) : 20;
  const interestAmount = Number((cap * (rate / 100)).toFixed(2));
  const totalToPay = Number((cap + interestAmount).toFixed(2));
  const days = paymentDays && paymentDays > 0 ? Number(paymentDays) : 20;
  const dailyPaymentAmount = Number((totalToPay / (days || 1)).toFixed(2));

  return {
    capital: cap,
    interestRate: rate,
    interestAmount,
    totalToPay,
    paymentDays: days,
    dailyPaymentAmount,
  };
}

export function calculate20PercentLoan(capital: number, paymentDays: number, interestRate: number = 20) {
  return calculateCustomLoan(capital, paymentDays, interestRate);
}

export function formatCurrency(amount?: number) {
  return `S/. ${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)}`;
}

export function formatDatePE(dateStr?: string | null) {
  return formatDate(dateStr);
}

/**
 * Obtiene o calcula la fecha de vencimiento. Si due_date/fecha_vencimiento
 * no viene presente en la respuesta de la API, la calcula automáticamente sumando
 * la duración/plazo del préstamo a la fecha de inicio (start_date).
 */
export function getOrCalculateDueDate(loanOrClient: any): string | null {
  if (!loanOrClient) return null;
  if (typeof loanOrClient === 'string') {
    return loanOrClient.split('T')[0];
  }

  const target = loanOrClient.activeLoan || loanOrClient.active_loan || loanOrClient;

  let rawDueDate =
    target.loan_due_date ||
    target.due_date ||
    target.fecha_vencimiento ||
    target.fechaVencimiento ||
    target.dueDate ||
    target.vencimiento ||
    target.end_date ||
    target.fecha_fin ||
    loanOrClient.loan_due_date ||
    loanOrClient.due_date ||
    loanOrClient.fecha_vencimiento ||
    loanOrClient.fechaVencimiento ||
    loanOrClient.dueDate ||
    loanOrClient.vencimiento ||
    loanOrClient.end_date ||
    loanOrClient.fecha_fin;

  if (!rawDueDate) {
    const rawStartDate =
      target.loan_start_date ||
      target.start_date ||
      target.fecha_inicio ||
      target.startDate ||
      target.fechaInicio ||
      target.createdAt ||
      target.created_at ||
      loanOrClient.loan_start_date ||
      loanOrClient.start_date ||
      loanOrClient.fecha_inicio ||
      loanOrClient.startDate ||
      loanOrClient.fechaInicio ||
      loanOrClient.createdAt ||
      loanOrClient.created_at;

    const rawDuration =
      target.duration ??
      target.duracion ??
      target.plazo ??
      target.term ??
      target.paymentDays ??
      target.payment_days ??
      target.total_installments ??
      target.days ??
      target.dias ??
      loanOrClient.duration ??
      loanOrClient.duracion ??
      loanOrClient.plazo ??
      loanOrClient.term ??
      loanOrClient.paymentDays ??
      loanOrClient.payment_days ??
      loanOrClient.total_installments ??
      loanOrClient.days ??
      loanOrClient.dias;

    const duration = rawDuration !== undefined && rawDuration !== null && !isNaN(Number(rawDuration)) && Number(rawDuration) > 0
      ? Number(rawDuration)
      : 20;

    if (rawStartDate) {
      try {
        const cleanDateStr = String(rawStartDate).split('T')[0].split(' ')[0];
        const parts = cleanDateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() + duration);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            rawDueDate = `${yyyy}-${mm}-${dd}`;
          }
        } else {
          const d = new Date(rawStartDate);
          if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() + duration);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            rawDueDate = `${yyyy}-${mm}-${dd}`;
          }
        }
      } catch (_) {}
    }
  }

  return rawDueDate ? String(rawDueDate).split('T')[0] : null;
}

export function getDueDateFormattedSpanish(loanOrClient: any): string {
  if (!loanOrClient) return 'Sin fecha';

  const rawDueDateStr =
    loanOrClient.loan_due_date ||
    loanOrClient.due_date ||
    loanOrClient.fecha_vencimiento ||
    loanOrClient.fechaVencimiento ||
    loanOrClient.dueDate ||
    loanOrClient.vencimiento ||
    loanOrClient.end_date ||
    loanOrClient.activeLoan?.loan_due_date ||
    loanOrClient.activeLoan?.due_date ||
    loanOrClient.activeLoan?.fecha_vencimiento ||
    loanOrClient.active_loan?.loan_due_date ||
    loanOrClient.active_loan?.due_date ||
    loanOrClient.active_loan?.fecha_vencimiento ||
    getOrCalculateDueDate(loanOrClient);

  if (!rawDueDateStr) return 'Sin fecha';

  try {
    const cleanStr = String(rawDueDateStr).split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    let dateObj: Date;
    if (parts.length === 3 && parts[0].length === 4) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(rawDueDateStr);
    }
    if (isNaN(dateObj.getTime())) return 'Sin fecha';

    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (_) {
    return 'Sin fecha';
  }
}

export const renderRemainingDays = (client: any): string => {
  if (!client) return 'Sin fecha';
  const dueDateStr =
    client?.activeLoan?.dueDate ||
    client?.activeLoan?.due_date ||
    client?.active_loan?.dueDate ||
    client?.active_loan?.due_date ||
    client?.due_date ||
    client?.dueDate ||
    client?.loan_due_date ||
    client?.fecha_vencimiento ||
    client?.fechaVencimiento ||
    getOrCalculateDueDate(client);

  if (!dueDateStr) return 'Sin fecha';

  let due: Date;
  const cleanStr = String(dueDateStr).split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    due = new Date(dueDateStr);
  }

  if (isNaN(due.getTime())) return 'Sin fecha';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (isNaN(diffDays)) return 'Sin fecha';

  return diffDays >= 0 ? `Quedan ${diffDays} días` : `Venció hace ${Math.abs(diffDays)} días`;
};

export function getDaysDifferenceInfo(dueDateStr: string) {
  if (!dueDateStr) return { label: 'Sin fecha', color: 'GRAY', diffDays: 0 };

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  const due = new Date(dueDateStr);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      label: `Vencido hace ${absDays} día${absDays > 1 ? 's' : ''}`,
      color: 'RED',
      diffDays,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Vence HOY',
      color: 'YELLOW',
      diffDays,
    };

  } else {
    return {
      label: `Quedan ${diffDays} días`,
      color: 'GREEN',
      diffDays,
    };
  }
}

export function generateWhatsAppReminderMessage(params: {
  phone?: string;
  dueDate?: string;
  daysDifference?: number;
  clientName?: string;
  remainingAmount?: number;
  totalToPay?: number;
}) {
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const dueDateFormatted = formatDatePE(params.dueDate);

  const diff = params.daysDifference ?? 0;
  let statusHeader = '';
  if (diff < 0) {
    statusHeader = `⚠️ *RECORDATORIO DE PRÉSTAMO VENCIDO*`;
  } else if (diff === 0) {
    statusHeader = `🔔 *RECORDATORIO DE PRÉSTAMO - VENCE HOY*`;
  } else {
    statusHeader = `🗓️ *RECORDATORIO DE PRÉSTAMO*`;
  }

  const text = `${statusHeader}
---------------------------------------
Estimado(a) *${params.clientName}*, le saludamos de *Prestamos Leo*.

📌 *Estado de su Cuenta:*
- *Saldo Pendiente:* ${formatCurrency(params.remainingAmount)} de ${formatCurrency(params.totalToPay)}
- *Fecha de Vencimiento:* ${dueDateFormatted}

Le invitamos a realizar su abono del día para mantener su crédito al día. ¡Agradecemos su puntualidad! 🙏✨`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppMessage(params: {
  phone: string;
  clientName: string;
  paymentAmount: number;
  paidDaysCount: number;
  totalPaymentDays: number;
  remainingAmount: number;
  totalToPay: number;
  operationNumber?: string;
}) {
  const dateStr = formatDatePE(new Date().toISOString().split('T')[0]);
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const opLine = params.operationNumber ? `\n*Operación:* ${params.operationNumber}` : '';

  const text = `📄 *COMPROBANTE DE PAGO - PRESTAMOS LEO*
---------------------------------------
👤 *Cliente:* ${params.clientName}${opLine}
💰 *Monto Recibido:* ${formatCurrency(params.paymentAmount)}
📅 *Fecha:* ${dateStr}

📊 *ESTADO DE LA CUENTA:*
- *Días Pagados:* ${params.paidDaysCount} de ${params.totalPaymentDays} días
- *Saldo Restante:* ${formatCurrency(params.remainingAmount)}
- *Total Préstamo:* ${formatCurrency(params.totalToPay)}

¡Muchas gracias por su puntualidad! 🙏✨`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
}

export const SPANISH_SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

export function parseDateParts(dateStr: any) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return {
      year: dateStr.getFullYear(),
      month: dateStr.getMonth() + 1,
      day: dateStr.getDate(),
    };
  }
  const clean = String(dateStr).split('T')[0].split(' ')[0].trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10),
    };
  }
  const peMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(clean);
  if (peMatch) {
    return {
      year: parseInt(peMatch[3], 10),
      month: parseInt(peMatch[2], 10),
      day: parseInt(peMatch[1], 10),
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }
  return null;
}

export function addDaysSafe(dateStr: any, daysToAdd: number) {
  const parts = parseDateParts(dateStr);
  if (!parts) return null;
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + Number(daysToAdd));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysSafe(startDateStr: any, endDateStr: any) {
  const p1 = parseDateParts(startDateStr);
  const p2 = parseDateParts(endDateStr);
  if (!p1 || !p2) return null;
  const utc1 = Date.UTC(p1.year, p1.month - 1, p1.day, 12, 0, 0);
  const utc2 = Date.UTC(p2.year, p2.month - 1, p2.day, 12, 0, 0);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function formatDateShortSpanish(dateStr: any) {
  const parts = parseDateParts(dateStr);
  if (!parts) return '--';
  const dd = String(parts.day).padStart(2, '0');
  const monthName = SPANISH_SHORT_MONTHS[parts.month - 1] || '';
  return `${dd} ${monthName} ${parts.year}`;
}

export function formatDateDayMonthSpanish(dateStr: any) {
  const parts = parseDateParts(dateStr);
  if (!parts) return '--';
  const dd = String(parts.day).padStart(2, '0');
  const monthName = SPANISH_SHORT_MONTHS[parts.month - 1] || '';
  return `${dd} ${monthName}`;
}

export function formatScheduleAmount(amount: any) {
  const num = Number(amount) || 0;
  return 'S/ ' + new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPaymentAmount(amount: any) {
  return 'S/. ' + new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function distributeAmountAcrossInstallments(totalAmount: number, count: number) {
  const numInstallments = Math.max(1, parseInt(String(count), 10) || 1);
  const totalCents = Math.round((Number(totalAmount) || 0) * 100);
  if (numInstallments === 1) {
    return [totalCents / 100];
  }
  const baseCents = Math.round(totalCents / numInstallments);
  const amounts = [];
  let sumFirst = 0;
  for (let i = 0; i < numInstallments - 1; i++) {
    amounts.push(baseCents / 100);
    sumFirst += baseCents;
  }
  const lastCents = totalCents - sumFirst;
  amounts.push(lastCents / 100);
  return amounts;
}

export function isWeeklyLoan(loan: any) {
  if (!loan) return false;
  const rawFreq = String(
    loan.paymentFrequency ||
    loan.payment_frequency ||
    loan.frequency ||
    ''
  ).trim().toUpperCase();
  return rawFreq === 'WEEKLY' || rawFreq === 'SEMANAL';
}

export function getWeeklyInstallmentCount(loan: any) {
  if (!loan) return 1;

  // A) Si existe un cronograma contractual REAL almacenado con cuotas reales, utilizar su cantidad.
  const existingSchedule = loan.schedule || loan.cronograma || loan.paymentSchedule || loan.payment_schedule || (Array.isArray(loan.installments) ? loan.installments : null);
  if (Array.isArray(existingSchedule) && existingSchedule.length > 0) {
    return existingSchedule.length;
  }

  // B) Si existe una propiedad explícita que inequívocamente representa cantidad de cuotas (NO plazo en días)
  const explicitCount = Number(
    loan.weeklyInstallments ??
    loan.weekly_installments ??
    loan.numberOfInstallments ??
    loan.number_of_installments ??
    loan.installmentsCount ??
    loan.installments_count ??
    loan.cuotas ??
    loan.weeks ??
    loan.semanas
  );
  if (explicitCount && explicitCount > 0) {
    return explicitCount;
  }

  // C) Si NO existe cantidad explícita de cuotas, para préstamos SEMANALES calcularla mediante:
  //    diffDays(fechaEmision, fechaVencimiento) / 7
  const rawStart = loan.startDate || loan.start_date || loan.fecha_inicio || loan.fechaInicio || loan.createdAt || loan.created_at;
  const rawDue = loan.dueDate || loan.due_date || loan.fecha_vencimiento || loan.fechaVencimiento || (loanService as any)?.getOrCalculateDueDate?.(loan);
  const diff = diffDaysSafe(rawStart, rawDue);

  if (diff && diff > 0) {
    if (diff % 7 === 0) {
      return diff / 7;
    }
    return Math.max(1, Math.round(diff / 7));
  }

  // Fallback si no hay fechas disponibles en el objeto del préstamo:
  // Plazo en días dividido entre 7 (NUNCA usar directamente días como cuotas)
  const rawDays = Number(loan.paymentDays ?? loan.payment_days ?? loan.days ?? loan.duration ?? loan.total_installments ?? loan.totalInstallments);
  if (rawDays && rawDays > 0) {
    if (rawDays % 7 === 0) {
      return rawDays / 7;
    }
    if (rawDays <= 12) {
      return rawDays;
    }
    return Math.max(1, Math.round(rawDays / 7));
  }

  return 1;
}

export function getLoanPaymentTerms(loan: any) {
  if (!loan) {
    return {
      frequency: 'AGREED_DATE',
      periods: 1,
      amount: 0,
      label: 'Pago en Fecha Acordada',
      unit: 'días',
    };
  }
  const isWeekly = isWeeklyLoan(loan);
  const frequency = isWeekly ? 'WEEKLY' : (loan.paymentFrequency || loan.payment_frequency || 'AGREED_DATE');
  const days = Math.max(1, Number(loan.paymentDays ?? loan.payment_days ?? loan.days ?? 20) || 20);
  const total = Math.max(0, Number(loan.totalToPay ?? loan.totalAmount ?? loan.total_amount ?? loan.total_to_pay ?? 0) || 0);
  const periods = isWeekly ? getWeeklyInstallmentCount(loan) : days;
  return {
    frequency,
    periods,
    amount: Number((total / (frequency === 'AGREED_DATE' ? 1 : periods)).toFixed(2)),
    label: frequency === 'DAILY' ? 'Cuota Diaria' : frequency === 'WEEKLY' ? 'Cuota Semanal' : 'Pago en Fecha Acordada',
    unit: frequency === 'DAILY' ? 'días' : 'semanas',
  };
}

export function generateWeeklyPaymentSchedule(loan: any) {
  if (!loan) {
    return {
      isWeekly: false,
      isConsistent: false,
      hasInconsistency: false,
      inconsistencyReason: null as string | null,
      totalAmount: 0,
      installmentsCount: 0,
      schedule: [] as any[],
    };
  }

  const existingSchedule = loan.schedule || loan.cronograma || loan.paymentSchedule || loan.payment_schedule || (Array.isArray(loan.installments) ? loan.installments : null);
  if (Array.isArray(existingSchedule) && existingSchedule.length > 0) {
    const mapped = existingSchedule.map((item: any, idx: number) => {
      const rawDate = item.dueDate || item.due_date || item.date || item.fecha || item.paymentDate;
      const amt = Number(item.amount ?? item.monto ?? item.cuota ?? 0);
      const parts = parseDateParts(rawDate);
      const isoDate = parts ? `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}` : (rawDate ? String(rawDate).split('T')[0] : '');
      return {
        installmentNumber: Number(item.installmentNumber || item.number || item.cuotaNumber || (idx + 1)),
        dueDate: isoDate,
        date: formatDatePE(rawDate),
        amount: amt,
        formattedAmount: formatScheduleAmount(amt),
        formattedPaymentAmount: formatPaymentAmount(amt),
        formattedDate: formatDatePE(rawDate),
        formattedShortDate: formatDateShortSpanish(rawDate),
        whatsappDate: formatDateDayMonthSpanish(rawDate),
      };
    });
    const sum = Number(mapped.reduce((acc: number, curr: any) => acc + curr.amount, 0).toFixed(2));
    return {
      isWeekly: isWeeklyLoan(loan),
      isContractualCustom: true,
      isConsistent: true,
      hasInconsistency: false,
      inconsistencyReason: null as string | null,
      totalAmount: sum,
      weeklyAmount: mapped[0]?.amount || 0,
      installmentAmount: mapped[0]?.amount || 0,
      installmentsCount: mapped.length,
      schedule: mapped,
    };
  }

  const isWeekly = isWeeklyLoan(loan);
  const totalAmount = Math.max(0, Number(
    loan.totalToPay ??
    loan.totalAmount ??
    loan.total_amount ??
    loan.total_to_pay ??
    ((Number(loan.capital) || 0) + (Number(loan.interestAmount) || 0) + (Number(loan.penaltyAmount) || 0))
  ) || 0);

  if (!isWeekly) {
    return {
      isWeekly: false,
      isConsistent: true,
      hasInconsistency: false,
      inconsistencyReason: null as string | null,
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: 0,
      schedule: [] as any[],
    };
  }

  const rawStart = loan.startDate || loan.start_date || loan.fecha_inicio || loan.fechaInicio || loan.createdAt || loan.created_at;
  const rawDue = loan.dueDate || loan.due_date || loan.fecha_vencimiento || loan.fechaVencimiento || (loanService as any)?.getOrCalculateDueDate?.(loan);

  const startParts = parseDateParts(rawStart);
  const dueParts = parseDateParts(rawDue);

  if (!startParts || !dueParts) {
    return {
      isWeekly: true,
      isConsistent: false,
      hasInconsistency: true,
      inconsistencyReason: 'Faltan fechas contractuales para calcular el cronograma semanal.',
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: 0,
      schedule: [] as any[],
    };
  }

  const isoStartDate = `${startParts.year}-${String(startParts.month).padStart(2, '0')}-${String(startParts.day).padStart(2, '0')}`;
  const isoDueDate = `${dueParts.year}-${String(dueParts.month).padStart(2, '0')}-${String(dueParts.day).padStart(2, '0')}`;

  const diffDays = diffDaysSafe(isoStartDate, isoDueDate);

  if (diffDays === null || diffDays <= 0) {
    return {
      isWeekly: true,
      isConsistent: false,
      hasInconsistency: true,
      inconsistencyReason: 'La fecha de vencimiento debe ser posterior a la fecha de emisión.',
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: 0,
      schedule: [] as any[],
    };
  }

  const weeksCount = getWeeklyInstallmentCount(loan);
  const expectedDueDate = addDaysSafe(isoStartDate, weeksCount * 7);
  const isConsistent = expectedDueDate === isoDueDate;

  if (!isConsistent) {
    return {
      isWeekly: true,
      isConsistent: false,
      hasInconsistency: true,
      inconsistencyReason: `Inconsistencia contractual: El vencimiento registrado (${formatDatePE(isoDueDate)}) no coincide con el ciclo de ${weeksCount} semanas desde la emisión (${formatDatePE(expectedDueDate)}).`,
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: weeksCount,
      schedule: [] as any[],
    };
  }

  const amounts = distributeAmountAcrossInstallments(totalAmount, weeksCount);
  const schedule: any[] = [];

  for (let i = 1; i <= weeksCount; i++) {
    const installmentDate = addDaysSafe(isoStartDate, i * 7);
    const amount = amounts[i - 1];
    schedule.push({
      installmentNumber: i,
      dueDate: installmentDate,
      date: formatDatePE(installmentDate),
      amount,
      formattedAmount: formatScheduleAmount(amount),
      formattedPaymentAmount: formatPaymentAmount(amount),
      formattedDate: formatDatePE(installmentDate),
      formattedShortDate: formatDateShortSpanish(installmentDate),
      whatsappDate: formatDateDayMonthSpanish(installmentDate),
    });
  }

  return {
    isWeekly: true,
    isConsistent: true,
    hasInconsistency: false,
    inconsistencyReason: null as string | null,
    totalAmount,
    weeklyAmount: amounts[0] || 0,
    installmentAmount: amounts[0] || 0,
    installmentsCount: weeksCount,
    schedule,
  };
}

export const getLoanPaymentSchedule = generateWeeklyPaymentSchedule;

export function formatMoneyMethod(method?: string | null) {
  return method === 'YAPE' ? 'Yape' : method === 'CASH' ? 'Efectivo' : 'No registrado';
}

export function generateLoanConstanciaMessage(loan: any) {
  if (!loan) return '';
  const clientName = loan.clientName || loan.client_name || loan.name || 'Cliente';
  const opNumber = loan.operationNumber || loan.operation_number || loan.loan_operation_number;
  const opLine = opNumber ? `\n*Operación:* ${opNumber}` : '';
  const startDate = formatDatePE(loan.startDate || loan.start_date || loan.fecha_inicio || loan.fechaInicio || loan.createdAt || loan.created_at);
  const cap = loan.capital != null ? loan.capital : (loan.amount != null ? loan.amount : (loan.amount_borrowed != null ? loan.amount_borrowed : 0));
  const capital = formatCurrency(cap);
  const interestVal = loan.interestAmount != null
    ? loan.interestAmount
    : (loan.interest_amount != null ? loan.interest_amount : Number(((Number(cap) || 0) * 0.20).toFixed(2)));
  const interest = formatCurrency(interestVal);
  const penaltyAmount = loan.penaltyAmount != null ? loan.penaltyAmount : (loan.penalty_amount != null ? loan.penalty_amount : loan.mora);
  const penalty = penaltyAmount && Number(penaltyAmount) > 0 ? `\n⚠️ *Mora / Cargo Adicional:* ${formatCurrency(penaltyAmount)}` : '';
  const totalVal = loan.totalToPay ?? loan.totalAmount ?? loan.total_amount ?? loan.total_to_pay ?? ((Number(cap) || 0) + (Number(interestVal) || 0) + (Number(penaltyAmount) || 0));
  const totalToPay = formatCurrency(totalVal);
  const dueDate = formatDatePE(loan.dueDate || loan.due_date || loan.fecha_vencimiento || loan.fechaVencimiento);
  const terms = getLoanPaymentTerms(loan);
  const isWeekly = isWeeklyLoan(loan);

  const paymentLine = terms.frequency === 'AGREED_DATE'
    ? '📌 *Pago en Fecha Acordada:* ' + formatPaymentAmount(terms.amount)
    : isWeekly
      ? '📌 *Cuota Semanal:* ' + formatPaymentAmount(terms.amount)
        + '\n📌 *Semanas de Pago:* ' + terms.periods
      : '📌 *' + terms.label + ':* ' + formatPaymentAmount(terms.amount)
        + '\n📌 *' + (terms.frequency === 'WEEKLY' ? 'Semanas de Pago' : 'Días de Pago') + ':* ' + terms.periods;

  const scheduleResult = generateWeeklyPaymentSchedule(loan);
  let scheduleSection = '';
  if (scheduleResult.isWeekly && scheduleResult.schedule && scheduleResult.schedule.length > 0) {
    const lines = scheduleResult.schedule.map(
      (item: any) => `${item.installmentNumber}. ${item.whatsappDate || formatDateDayMonthSpanish(item.dueDate)}: ${formatPaymentAmount(item.amount)}`
    );
    scheduleSection = `\n\n📌 *FECHAS DE CANCELACIÓN:*\n\n${lines.join('\n')}`;
  } else if (scheduleResult.isWeekly && scheduleResult.hasInconsistency) {
    scheduleSection = `\n\n⚠️ *Aviso de Fechas:* ${scheduleResult.inconsistencyReason}`;
  }

  const deliverySection = `\n\n*Préstamo efectuado en:* ${formatMoneyMethod(loan.disbursementMethod ?? loan.disbursement_method)}`;
  const yapeSection = '\n\n📲 *Yape:* 906329361 - Leonardo Rod';
  const footerSection = '\n\n_Gracias por su confianza. Ante cualquier consulta estamos para atenderle._';

  return `📄 *CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO*

👤 *Cliente:* ${clientName}${opLine}
📅 *Fecha de Emisión:* ${startDate}
💰 *Monto Prestado:* ${capital}
📈 *Interés / Comisión:* ${interest}${penalty}
💵 *Monto Total a Pagar:* ${totalToPay}
📆 *Fecha de Vencimiento:* ${dueDate}
${paymentLine}${scheduleSection}${deliverySection}${yapeSection}${footerSection}`;
}

export default loanService;
