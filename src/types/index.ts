export type LoanStatus = 'ACTIVE' | 'PAID' | 'OVERDUE';

export type PaymentType = 'FULL_DAY' | 'PARTIAL' | 'ADVANCE' | 'FULL_PAYOFF';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type ReportPeriod = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export type ExpenseCategory = 'TRANSPORTE' | 'COMBUSTIBLE' | 'IMPRESIONES' | 'ALIMENTACION' | 'OTROS';

export type AlertType = 'DUE_TODAY' | 'EXPIRING_SOON' | 'OVERDUE';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  identification?: string;
  notes?: string;
  createdAt: string;
  status: ClientStatus;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  capital: number; // Monto prestado en S/.
  interestRate: number; // 20%
  interestAmount: number; // S/. capital * 0.20
  totalToPay: number; // S/. capital + interestAmount
  paymentDays: number; // Número de días de pago
  dailyPaymentAmount: number; // S/. (totalToPay / paymentDays)
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: LoanStatus;
  paidAmount: number;
  remainingAmount: number;
  paidDaysCount: number;
  notes?: string;
  createdAt: string;
  lastPaymentDate?: string;
  isArchived?: boolean;
}

export interface Payment {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  type: PaymentType;
  dayNumber: number;
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalCapitalLent: number;
  totalEstimatedProfit: number;
  collectedToday: number;
  pendingClientsTodayCount: number;
  totalActiveLoansCount: number;
  overdueCount: number;
  expiringSoonCount: number;
  collectionProgressPercent: number;
}

export interface NewClientLoanFormData {
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientIdentification?: string;
  capital: number;
  paymentDays: number;
  startDate: string;
  notes?: string;
}

export interface FinancialReportData {
  period: ReportPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  capitalInvested: number;
  realCollected: number;
  projectedCollection: number;
  interestCollected: number;
  totalExpenses: number;
  netProfit: number;
  remainingToCollect: number;
  expensesList: Expense[];
}

export interface AlertNotification {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  type: AlertType;
  daysDifference: number; // 0 = hoy, 1 = mañana, <0 = vencido
  remainingAmount: number;
  totalToPay: number;
  dueDate: string;
}
