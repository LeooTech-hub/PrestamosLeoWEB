'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation, TabType } from '@/components/Navigation';
import { DashboardView } from '@/components/Dashboard/DashboardView';
import { CalculatorView } from '@/components/LoanCalculator/CalculatorView';
import { DailyRouteView } from '@/components/DailyRoute/DailyRouteView';
import { LoansListView } from '@/components/Loans/LoansListView';
import { FinancialReportView } from '@/components/Reports/FinancialReportView';
import { ClientsView } from '@/components/Clients/ClientsView';
import { QuickCreateLoanModal } from '@/components/Modals/QuickCreateLoanModal';
import { UserManagementModal } from '@/components/Modals/UserManagementModal';
import { CollectorManagementView } from '@/components/Collectors/CollectorManagementView';
import { LoginScreen } from '@/components/Auth/LoginScreen';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopbar } from '@/components/AdminTopbar';
import { loanService } from '@/services/loanService';
import { AuthUser, clearAuth, getStoredToken, getStoredUser } from '@/lib/auth';
import {
  Client,
  Loan,
  Payment,
  DashboardSummary,
  NewClientLoanFormData,
  FinancialReportData,
  ReportPeriod,
  ExpenseCategory,
  AlertNotification,
} from '@/types';

const defaultDashboardSummary: DashboardSummary = {
  totalCapitalLent: 0,
  totalEstimatedProfit: 0,
  collectedToday: 0,
  pendingClientsTodayCount: 0,
  totalActiveLoansCount: 0,
  overdueCount: 0,
  expiringSoonCount: 0,
  collectionProgressPercent: 100,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<'ADMIN' | 'COBRADOR'>('COBRADOR');
  const isAdmin = userRole === 'ADMIN';

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(defaultDashboardSummary);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('WEEKLY');
  const [financialReport, setFinancialReport] = useState<FinancialReportData | null>(null);
  const [todayCollections, setTodayCollections] = useState<
    { loan: Loan; isPaidToday: boolean; amountPaidToday: number }[]
  >([]);
  const [isQuickCreateLoanOpen, setIsQuickCreateLoanOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCollectors, setShowCollectors] = useState(false);

  const loadData = useCallback(async () => {
    if (!getStoredToken()) return;

    setIsLoading(true);
    try {
      const fetchSafe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await fn();
        } catch (err) {
          console.error('Error cargando información:', err);
          return fallback;
        }
      };

      const [cList, lList, pList, sum, todayCol, alertList, report] = await Promise.all([
        fetchSafe(() => loanService.getClients(), []),
        fetchSafe(() => loanService.getLoans(), []),
        fetchSafe(() => loanService.getPayments(), []),
        fetchSafe(() => loanService.getDashboardSummary(), defaultDashboardSummary),
        fetchSafe(() => loanService.getTodayCollections(), []),
        fetchSafe(() => loanService.getAlerts(), []),
        fetchSafe(
          () => loanService.getFinancialReport(reportPeriod),
          {
            period: reportPeriod,
            periodLabel: 'Semanal',
            startDate: '',
            endDate: '',
            capitalInvested: 0,
            realCollected: 0,
            projectedCollection: 0,
            interestCollected: 0,
            totalExpenses: 0,
            netProfit: 0,
            remainingToCollect: 0,
            expensesList: [],
          }
        ),
      ]);

      setClients(cList);
      setLoans(lList);
      setPayments(pList);
      setSummary(sum || defaultDashboardSummary);
      setTodayCollections(todayCol);
      setAlerts(alertList);
      setFinancialReport(report);
    } finally {
      setIsLoading(false);
    }
  }, [reportPeriod]);

  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredToken();

    if (user && token) {
      setAuthUser(user);
      setUserRole(user.role);
    } else {
      clearAuth();
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authUser || !getStoredToken()) return;
    void loadData();
  }, [authUser, loadData]);

  const handleAuthenticated = (user: AuthUser) => {
    setAuthUser(user);
    setUserRole(user.role);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearAuth();
    setAuthUser(null);
    setUserRole('COBRADOR');
    setClients([]);
    setLoans([]);
    setPayments([]);
    setAlerts([]);
    setSummary(defaultDashboardSummary);
  };

  const handleCreateLoan = async (formData: NewClientLoanFormData) => {
    await loanService.createClientAndLoan(formData);
    await loadData();
    setActiveTab('loans');
  };

  const handleRegisterPayment = async (
    loanId: string,
    amount: number,
    notes?: string,
    lateFee?: number
  ) => {
    const result = await loanService.registerPayment(loanId, amount, notes, lateFee);
    await loadData();
    return result;
  };

  const handleReorderClients = async (orderedClientIds: string[]) => {
    await loanService.reorderClients(orderedClientIds);
    await loadData();
  };

  const handleDeletePayment = async (paymentId: string) => {
    await loanService.deletePayment(paymentId);
    await loadData();
  };

  const handleUpdatePayment = async (
    id: string,
    data: { amount?: number; date?: string; notes?: string }
  ) => {
    await loanService.updatePayment(id, data);
    await loadData();
  };

  const handleUpdateClient = async (
    id: string,
    data: { name: string; phone: string; address: string; identification?: string; notes?: string }
  ) => {
    await loanService.updateClient(id, data);
    await loadData();
  };

  const handleUpdateLoan = async (id: string, data: any) => {
    const result = await loanService.updateLoan(id, data);
    await loadData();
    return result;
  };

  const handleDeleteLoan = async (loanId: string, mode: 'ARCHIVE' | 'PERMANENT') => {
    await loanService.deleteLoan(loanId, mode);
    await loadData();
  };

  const handleDeleteClient = async (clientId: string, mode: 'ARCHIVE' | 'PERMANENT') => {
    await loanService.deleteClient(clientId, mode);
    await loadData();
  };

  const handleAddExpense = async (
    amount: number,
    category: ExpenseCategory,
    description: string
  ) => {
    await loanService.addExpense({
      amount,
      category,
      description,
      date: new Date().toISOString().split('T')[0],
    });
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    await loanService.deleteExpense(id);
    await loadData();
  };

  const handleUpdateExpense = async (
    id: string,
    data: { amount?: number; category?: ExpenseCategory; description?: string; date?: string }
  ) => {
    await loanService.updateExpense(id, data);
    await loadData();
  };

  const handlePeriodChange = async (period: ReportPeriod) => {
    setReportPeriod(period);
    try {
      setFinancialReport(await loanService.getFinancialReport(period));
    } catch (err) {
      console.error('Error cargando reporte:', err);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf9]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b40000] border-t-transparent" />
      </div>
    );
  }

  if (!authUser || !getStoredToken()) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#242424] dark:bg-[#151412] dark:text-[#f3eee8] transition-colors duration-300 lg:flex">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenCollectors={() => setShowCollectors(true)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userName={authUser.name || authUser.role}
      />

      <div className="min-w-0 flex-1">
        <AdminTopbar
          alerts={alerts}
          userName={authUser.name || authUser.role}
          userRole={userRole}
        />

        <div className="lg:hidden">
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingCountToday={summary.pendingClientsTodayCount}
            overdueCount={summary.overdueCount}
            isAdmin={isAdmin}
            onOpenUserManagement={() => setIsUserManagementOpen(true)}
          />
        </div>

        <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-5 lg:px-7 lg:py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b40000] border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-[#777]">Cargando PrestamosLeo...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  summary={summary || defaultDashboardSummary}
                  recentLoans={loans}
                  recentPayments={payments}
                  setActiveTab={setActiveTab}
                  isAdmin={isAdmin}
                  onOpenUserManagement={() => setIsUserManagementOpen(true)}
                />
              )}

              {activeTab === 'dailyRoute' && (
                <DailyRouteView
                  todayCollections={todayCollections}
                  onRegisterPayment={handleRegisterPayment}
                  onReorderClients={handleReorderClients}
                />
              )}

              {activeTab === 'loans' && (
                <LoansListView
                  loans={loans}
                  onRegisterPayment={handleRegisterPayment}
                  onUpdateLoan={handleUpdateLoan}
                  onDeleteLoan={handleDeleteLoan}
                  isAdmin={isAdmin}
                />
              )}

              {activeTab === 'newClient' && (
                <CalculatorView
                  clients={clients}
                  onSubmitLoan={handleCreateLoan}
                />
              )}

              {activeTab === 'reports' && (
                <FinancialReportView
                  report={financialReport}
                  period={reportPeriod}
                  onPeriodChange={handlePeriodChange}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsView
                  clients={clients}
                  loans={loans}
                  payments={payments}
                  onNewLoanForClient={() => setActiveTab('newClient')}
                  onOpenNewLoanModal={() => setActiveTab('newClient')}
                  onUpdateClient={handleUpdateClient}
                  onUpdateLoan={handleUpdateLoan}
                  onDeleteClient={handleDeleteClient}
                  onDeletePayment={handleDeletePayment}
                  onUpdatePayment={handleUpdatePayment}
                  isAdmin={isAdmin}
                />
              )}
            </>
          )}
        </main>
      </div>

      {showCollectors && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fbfaf8] dark:bg-[#151412]">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setShowCollectors(false)}
                className="rounded-xl border border-[#e5ded6] bg-white px-4 py-2 text-sm font-semibold text-[#555] transition-all hover:border-[#d5a43b] hover:text-[#111]"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-black">Panel de Cobradores</h1>
            </div>
            <CollectorManagementView isAdmin={isAdmin} />
          </div>
        </div>
      )}

      <QuickCreateLoanModal
        clients={clients}
        isOpen={isQuickCreateLoanOpen}
        onClose={() => setIsQuickCreateLoanOpen(false)}
        onSubmitLoan={handleCreateLoan}
        onRedirectToNewClient={() => {
          setIsQuickCreateLoanOpen(false);
          setActiveTab('newClient');
        }}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />
    </div>
  );
}
