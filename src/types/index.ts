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
  amount?: number;
  monto?: number;
  loan_amount?: number;
  capital?: number;
  total_amount?: number;
  totalAmount?: number;
  due_date?: string;
  dueDate?: string;
  fecha_vencimiento?: string;
  end_date?: string;
  isPaidToday?: boolean;
  is_paid_today?: boolean;
  todayPaidAmount?: number;
  today_paid_amount?: number;
  todayStatus?: 'COBRADO' | 'PENDIENTE';
  today_status?: 'COBRADO' | 'PENDIENTE';
  activeLoan?: Partial<Loan> | null;
  active_loan?: Partial<Loan> | null;
  loansCount?: number;
  totalLoansCount?: number;
  total_loans_count?: number;
  activeLoansCount?: number;
  active_loans_count?: number;
  totalActiveCapital?: number;
  total_active_capital?: number;
  totalRemainingAmount?: number;
  total_remaining_amount?: number;
  nextDueDate?: string;
  next_due_date?: string;
}

export interface Loan {
  id: string;
  clientId: string;
  client_id?: string;
  clientName: string;
  client_name?: string;
  clientAlias?: string;
  clientPhone: string;
  clientAddress?: string;
  routeOrder?: number;
  capital: number;
  amount?: number;
  amount_borrowed?: number;
  monto?: number;
  interestRate?: number;
  interest_rate?: number;
  interestAmount: number;
  interest_amount?: number;
  interest?: number;
  interes?: number;
  penaltyAmount?: number;
  penalty_amount?: number;
  mora?: number;
  totalToPay: number;
  totalAmount?: number;
  total_amount?: number;
  total_to_pay?: number;
  dailyPaymentAmount: number;
  daily_amount?: number;
  dailyPayment?: number;
  daily_payment?: number;
  daily_payment_amount?: number;
  paymentDays: number;
  payment_days?: number;
  days_agreed?: number;
  days?: number;
  duration?: number;
  total_installments?: number;
  duration_days?: number;
  paidAmount: number;
  paid_amount?: number;
  total_paid?: number;
  remainingAmount: number;
  remaining_amount?: number;
  paidDaysCount: number;
  paid_days_count?: number;
  remainingDays?: number;
  remaining_days?: number;
  startDate: string;
  start_date?: string;
  dueDate: string;
  due_date?: string;
  fecha_vencimiento?: string;
  end_date?: string;
  notes?: string;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE' | 'EXPIRED';
  isArchived?: boolean;
  createdAt?: string;
}

export interface Payment {
  id: string;
  loanId: string;
  loan_id?: string;
  clientId: string;
  client_id?: string;
  clientName: string;
  amount: number;
  lateFee?: number;
  dayNumber?: number;
  paymentDate?: string;
  payment_date?: string;
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
  type: 'OVERDUE' | 'DUE_TODAY' | 'DUE_TOMORROW';
  title?: string;
  message?: string;
  date?: string;
  loanId?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  remainingAmount?: number;
  remaining_amount?: number;
  totalToPay?: number;
  total_to_pay?: number;
  dueDate?: string;
  due_date?: string;
  daysRemaining?: number;
  days_remaining?: number;
  daysDifference?: number;
}
