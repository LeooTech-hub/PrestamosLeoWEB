'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation, TabType } from '@/components/Navigation';
import { DashboardView } from '@/components/Dashboard/DashboardView';
import { CalculatorView } from '@/components/LoanCalculator/CalculatorView';
import { DailyRouteView } from '@/components/DailyRoute/DailyRouteView';
import { LoansListView } from '@/components/Loans/LoansListView';
import { FinancialReportView } from '@/components/Reports/FinancialReportView';
import { ClientsView } from '@/components/Clients/ClientsView';
import { QuickCreateLoanModal } from '@/components/Modals/QuickCreateLoanModal';
import { loanService } from '@/services/loanService';
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
  const [isQuickCreateLoanOpen, setIsQuickCreateLoanOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load all app data with fast fault tolerance and zero-delay rendering
  const loadData = useCallback(async () => {
    try {
      const fetchSafe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await fn();
        } catch (err) {
          console.error('Error cargando iniciales:', err);
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
    } catch (error) {
      console.error('Error cargando iniciales (global catch):', error);
      setSummary(defaultDashboardSummary);
    } finally {
      setIsLoading(false);
    }
  }, [reportPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new client & loan handler
  const handleCreateLoan = async (formData: NewClientLoanFormData) => {
    await loanService.createClientAndLoan(formData);
    await loadData();
    setActiveTab('loans');
  };

  // Register payment handler
  const handleRegisterPayment = async (
    loanId: string,
    amount: number,
    notes?: string
  ) => {
    const result = await loanService.registerPayment(loanId, amount, notes);
    await loadData();
    return result;
  };

  // Edit client handler
  const handleUpdateClient = async (
    id: string,
    data: { name: string; phone: string; address: string; identification?: string; notes?: string }
  ) => {
    await loanService.updateClient(id, data);
    await loadData();
  };

  // Edit loan handler
  const handleUpdateLoan = async (
    id: string,
    data: { capital: number; paymentDays: number; startDate: string; notes?: string }
  ) => {
    await loanService.updateLoan(id, data);
    await loadData();
  };

  // Smart delete loan handler
  const handleDeleteLoan = async (loanId: string, mode: 'ARCHIVE' | 'PERMANENT') => {
    await loanService.deleteLoan(loanId, mode);
    await loadData();
  };

  // Smart delete client handler
  const handleDeleteClient = async (clientId: string, mode: 'ARCHIVE' | 'PERMANENT') => {
    await loanService.deleteClient(clientId, mode);
    await loadData();
  };

  // Add operational expense handler
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

  // Delete expense handler
  const handleDeleteExpense = async (id: string) => {
    await loanService.deleteExpense(id);
    await loadData();
  };

  // Change financial report period
  const handlePeriodChange = async (period: ReportPeriod) => {
    setReportPeriod(period);
    try {
      const report = await loanService.getFinancialReport(period);
      setFinancialReport(report);
    } catch (err) {
      console.error('Error cargando iniciales (reporte):', err);
    }
  };

  // Reset to demo data
  const handleResetDemoData = async () => {
    if (confirm('¿Deseas restablecer los datos con la información de ejemplo (Perú S/.)?')) {
      await loanService.resetToDemoData();
      await loadData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Top Header */}
      <Header
        alerts={alerts}
        onRefresh={loadData}
        onResetDemo={handleResetDemoData}
        onOpenQuickCreateLoan={() => setIsQuickCreateLoanOpen(true)}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCountToday={summary?.pendingClientsTodayCount || 0}
        overdueCount={summary?.overdueCount || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#6E615A]">Cargando PrestamosLeoWEB (Perú)...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                summary={summary || defaultDashboardSummary}
                recentLoans={loans}
                recentPayments={payments}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'dailyRoute' && (
              <DailyRouteView
                todayCollections={todayCollections}
                onRegisterPayment={handleRegisterPayment}
              />
            )}

            {activeTab === 'loans' && (
              <LoansListView
                loans={loans}
                onRegisterPayment={handleRegisterPayment}
                onUpdateLoan={handleUpdateLoan}
                onDeleteLoan={handleDeleteLoan}
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
              />
            )}
          </>
        )}
      </main>

      {/* Quick Create Loan Modal with Autocomplete */}
      <QuickCreateLoanModal
        clients={clients}
        isOpen={isQuickCreateLoanOpen}
        onClose={() => setIsQuickCreateLoanOpen(false)}
        onSubmitLoan={handleCreateLoan}
        onRedirectToNewClient={() => setActiveTab('newClient')}
      />

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-[#E6DCD2] text-center text-xs text-[#6E615A] bg-white">
        <p>PrestamosLeoWEB (Perú) — Gestión de Préstamos del 20% en Soles (S/.) por Días de Pago</p>
      </footer>
    </div>
  );
}
