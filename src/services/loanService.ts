import {
  ReportPeriod,
  ExpenseCategory,
  NewClientLoanFormData,
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
    fetchAPI('/clients-with-loan', { method: 'POST', body: JSON.stringify(data) }),

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
  registerPayment: (loanId: string, amount: number, notes?: string, lateFee?: number) =>
    fetchAPI('/payments', {
      method: 'POST',
      body: JSON.stringify({ loanId, amount, notes, lateFee }),
    }),
  updatePayment: (id: string, data: { amount?: number; date?: string; notes?: string }) =>
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
export function calculate20PercentLoan(capital: number, paymentDays: number) {
  const cap = Number(capital) || 0;
  const interestRate = 20;
  const interestAmount = Number((cap * 0.20).toFixed(2));
  const totalToPay = Number((cap + interestAmount).toFixed(2));
  const days = paymentDays && paymentDays > 0 ? Number(paymentDays) : 20;
  const dailyPaymentAmount = Math.ceil(totalToPay / days);

  return {
    capital: cap,
    interestRate,
    interestAmount,
    totalToPay,
    paymentDays: days,
    dailyPaymentAmount,
  };
}

export function formatCurrency(amount?: number) {
  return `S/. ${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)}`;
}

export function formatDatePE(dateStr?: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

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
  } else if (diffDays === 1) {
    return {
      label: 'Vence mañana (1 día)',
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
}) {
  const dateStr = formatDatePE(new Date().toISOString().split('T')[0]);
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

  const text = `📄 *COMPROBANTE DE PAGO - PRESTAMOS LEO*
---------------------------------------
👤 *Cliente:* ${params.clientName}
💰 *Monto Recibido:* ${formatCurrency(params.paymentAmount)}
📅 *Fecha:* ${dateStr}

📊 *ESTADO DE LA CUENTA:*
- *Días Pagados:* ${params.paidDaysCount} de ${params.totalPaymentDays} días
- *Saldo Restante:* ${formatCurrency(params.remainingAmount)}
- *Total Préstamo:* ${formatCurrency(params.totalToPay)}

¡Muchas gracias por su puntualidad! 🙏✨`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
}

export function generateLoanConstanciaMessage(loan: any) {
  if (!loan) return '';
  const clientName = loan.clientName || 'Cliente';
  const startDate = formatDatePE(loan.startDate);
  const capital = formatCurrency(loan.capital);
  const interestVal = loan.interestAmount != null
    ? loan.interestAmount
    : Number(((loan.capital || 0) * 0.20).toFixed(2));
  const interest = formatCurrency(interestVal);
  const penalty = loan.penaltyAmount && loan.penaltyAmount > 0 ? `\n⚠️ *Mora / Cargo Adicional:* ${formatCurrency(loan.penaltyAmount)}` : '';
  const totalToPay = formatCurrency(loan.totalToPay);
  const dueDate = formatDatePE(loan.dueDate);
  const dailyPayment = formatCurrency(loan.dailyPaymentAmount);
  const days = loan.paymentDays || 20;

  return `📄 *CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO*

👤 *Cliente:* ${clientName}
📅 *Fecha de Emisión:* ${startDate}
💰 *Monto Prestado:* ${capital}
📈 *Interés / Comisión:* ${interest}${penalty}
💵 *Monto Total a Pagar:* ${totalToPay}
📆 *Fecha de Vencimiento:* ${dueDate}
📌 *Cuota Diaria:* ${dailyPayment} (${days} días)

_Gracias por su confianza. Ante cualquier consulta estamos para atenderle._`;
}

export default loanService;