export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  identification?: string;
  notes?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  capital: number;
  interestAmount: number;
  totalToPay: number;
  dailyPaymentAmount: number;
  paymentDays: number;
  paidAmount: number;
  remainingAmount: number;
  paidDaysCount: number;
  startDate: string;
  dueDate: string;
  notes?: string;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE' | 'EXPIRED';
  isArchived?: boolean;
  createdAt?: string;
}

export interface Payment {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentDate?: string;
  date?: string;
  notes?: string;
  paymentMethod?: string;
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

export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL';
export type ExpenseCategory = 'COMBUSTIBLE' | 'TRANSPORTE' | 'IMPRESIONES' | 'ALIMENTACION' | 'OTROS';

export interface OperationalExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
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
  expensesList: OperationalExpense[];
}

export interface AlertNotification {
  id: string;
  type: 'OVERDUE' | 'EXPIRING_SOON' | 'DUE_TODAY' | 'INFO';
  title: string;
  message: string;
  date: string;
  loanId?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  remainingAmount?: number;
  totalToPay?: number;
  dueDate?: string;
  daysDifference?: number;
}
