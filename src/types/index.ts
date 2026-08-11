export interface Client {
  id: string;
  name: string;
  alias?: string;
  phone: string;
  address: string;
  dni?: string;
  documento?: string;
  identification?: string;
  notes?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  routeOrder?: number;
  createdAt?: string;
  assignedTo?: string;
  createdBy?: string;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  clientAlias?: string;
  clientPhone: string;
  clientAddress?: string;
  routeOrder?: number;
  capital: number;
  amount?: number;
  interestAmount: number;
  interest?: number;
  penaltyAmount?: number;
  penalty_amount?: number;
  mora?: number;
  totalToPay: number;
  total_amount?: number;
  dailyPaymentAmount: number;
  daily_amount?: number;
  paymentDays: number;
  duration_days?: number;
  paidAmount: number;
  total_paid?: number;
  remainingAmount: number;
  remaining_amount?: number;
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
  lateFee?: number;
  dayNumber?: number;
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
  clientAlias?: string;
  alias?: string;
  clientPhone: string;
  clientAddress: string;
  clientIdentification?: string;
  capital: number;
  amount?: number;
  interest_rate?: number;
  interestRate?: number;
  paymentDays: number;
  days?: number;
  startDate: string;
  dueDate?: string;
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
  principalCollected?: number;
  totalMoras?: number;
  projectedCollection: number;
  interestCollected: number;
  grossProfit?: number;
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
