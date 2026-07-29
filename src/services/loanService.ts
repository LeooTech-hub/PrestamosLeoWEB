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
} from '@/types';
import {
  getClientsAction,
  createClientAction,
  updateClientAction,
  deleteClientAction,
  getLoansAction,
  createClientAndLoanAction,
  updateLoanAction,
  deleteLoanAction,
  getPaymentsAction,
  registerPaymentAction,
  getExpensesAction,
  addExpenseAction,
  deleteExpenseAction,
  getTodayCollectionsAction,
  getDashboardSummaryAction,
  getAlertsAction,
  getFinancialReportAction,
  resetToDemoDataAction,
} from '@/actions/loanActions';

/**
 * Database-Connected Service Layer for PrestamosLeoWEB (Peru S/. 20% Modality).
 * Uses Server Actions & @libsql/client (Turso / LibSQL / SQLite) for persistence.
 */
class LoanDatabaseService {
  async getClients(): Promise<Client[]> {
    return getClientsAction();
  }

  async getClientById(id: string): Promise<{ client: Client; loans: Loan[]; payments: Payment[] } | null> {
    const clients = await this.getClients();
    const client = clients.find((c) => c.id === id);
    if (!client) return null;

    const loans = (await this.getLoans()).filter((l) => l.clientId === id);
    const payments = (await this.getPayments()).filter((p) => p.clientId === id);

    return { client, loans, payments };
  }

  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'status'>): Promise<Client> {
    return createClientAction(data);
  }

  async updateClient(
    id: string,
    data: { name: string; phone: string; address: string; identification?: string; notes?: string }
  ): Promise<Client> {
    await updateClientAction(id, data);
    const clients = await this.getClients();
    return clients.find((c) => c.id === id)!;
  }

  async deleteClient(clientId: string, mode: 'ARCHIVE' | 'PERMANENT'): Promise<void> {
    return deleteClientAction(clientId, mode);
  }

  async getLoans(): Promise<Loan[]> {
    return getLoansAction();
  }

  async getLoanById(id: string): Promise<Loan | null> {
    const loans = await this.getLoans();
    return loans.find((l) => l.id === id) || null;
  }

  async createClientAndLoan(formData: NewClientLoanFormData): Promise<Loan> {
    return createClientAndLoanAction(formData);
  }

  async updateLoan(
    id: string,
    data: { capital: number; paymentDays: number; startDate: string; notes?: string }
  ): Promise<Loan> {
    await updateLoanAction(id, data);
    const loans = await this.getLoans();
    return loans.find((l) => l.id === id)!;
  }

  async deleteLoan(loanId: string, mode: 'ARCHIVE' | 'PERMANENT'): Promise<void> {
    return deleteLoanAction(loanId, mode);
  }

  async getPayments(): Promise<Payment[]> {
    return getPaymentsAction();
  }

  async registerPayment(
    loanId: string,
    amount: number,
    notes?: string
  ): Promise<{ payment: Payment; updatedLoan: Loan }> {
    return registerPaymentAction(loanId, amount, notes);
  }

  async getExpenses(): Promise<Expense[]> {
    return getExpensesAction();
  }

  async addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return addExpenseAction(data);
  }

  async deleteExpense(id: string): Promise<void> {
    return deleteExpenseAction(id);
  }

  async getTodayCollections(): Promise<
    { loan: Loan; isPaidToday: boolean; amountPaidToday: number }[]
  > {
    return getTodayCollectionsAction();
  }

  async getAlerts(): Promise<AlertNotification[]> {
    return getAlertsAction();
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return getDashboardSummaryAction();
  }

  async getFinancialReport(period: ReportPeriod): Promise<FinancialReportData> {
    return getFinancialReportAction(period);
  }

  async resetToDemoData(): Promise<void> {
    return resetToDemoDataAction();
  }
}

export const loanService = new LoanDatabaseService();

// --- 20% Interest Calculation Helper ---
export function calculate20PercentLoan(capital: number, paymentDays: number) {
  const interestRate = 20; // 20% fijo
  const interestAmount = Math.round(capital * 0.20);
  const totalToPay = capital + interestAmount;
  const days = paymentDays && paymentDays > 0 ? paymentDays : 20;
  const dailyPaymentAmount = Math.round(totalToPay / days);

  return {
    capital,
    interestRate,
    interestAmount,
    totalToPay,
    paymentDays: days,
    dailyPaymentAmount,
  };
}

// --- Format Currency in Peruvian Soles S/. ---
export function formatCurrency(amount: number): string {
  return `S/. ${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

// --- Format Date to Local Peruvian Standard (DD/MM/AAAA) ---
export function formatDatePE(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// --- Compute Remaining Days Badge Text & Color ---
export function getDaysDifferenceInfo(dueDateStr: string): { label: string; color: 'RED' | 'YELLOW' | 'GREEN' | 'GRAY'; diffDays: number } {
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

// --- Generate WhatsApp Reminder Message ---
export function generateWhatsAppReminderMessage(params: {
  clientName: string;
  phone: string;
  remainingAmount: number;
  totalToPay: number;
  dueDate: string;
  daysDifference: number;
}): string {
  const cleanPhone = params.phone.replace(/\D/g, '');
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const dueDateFormatted = formatDatePE(params.dueDate);

  let statusHeader = '';
  if (params.daysDifference < 0) {
    statusHeader = `⚠️ *RECORDATORIO DE PRÉSTAMO VENCIDO*`;
  } else if (params.daysDifference === 0) {
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

// --- Generate WhatsApp Receipt ---
export function generateWhatsAppMessage(params: {
  clientName: string;
  phone: string;
  paymentAmount: number;
  remainingAmount: number;
  totalToPay: number;
  paidDaysCount: number;
  totalPaymentDays: number;
}): string {
  const dateStr = formatDatePE(new Date().toISOString().split('T')[0]);

  const cleanPhone = params.phone.replace(/\D/g, '');
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
