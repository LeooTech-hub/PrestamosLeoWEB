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
import { UserManagementModal } from '@/components/Modals/UserManagementModal';
import { CollectorManagementView } from '@/components/Collectors/CollectorManagementView';
import { Users } from 'lucide-react';
import { loanService } from '@/services/loanService';
import { getStoredUser } from '@/lib/auth';
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
  const [userRole, setUserRole] = useState<'ADMIN' | 'COBRADOR'>('COBRADOR');
  const isAdmin = userRole === 'ADMIN';
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
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
  const [showCollectors, setShowCollectors] = useState<boolean>(false);

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

      console.log("CLIENT DATA:", cList);
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
    const user = getStoredUser();
    if (user?.role) {
      setUserRole(user.role as 'ADMIN' | 'COBRADOR');
    }
    const handleAuth = () => {
      const u = getStoredUser();
      setUserRole((u?.role as 'ADMIN' | 'COBRADOR') || 'COBRADOR');
    };
    window.addEventListener('auth:updated', handleAuth);
    
    let isMounted = true;
    const initLoad = async () => {
      if (isMounted) {
        await loadData();
      }
    };
    initLoad();
    
    return () => {
      isMounted = false;
      window.removeEventListener('auth:updated', handleAuth);
    };
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

  // Delete payment handler
  const handleDeletePayment = async (paymentId: string) => {
    await loanService.deletePayment(paymentId);
    await loadData();
  };

  // Edit payment handler
  const handleUpdatePayment = async (
    id: string,
    data: { amount?: number; date?: string; notes?: string }
  ) => {
    await loanService.updatePayment(id, data);
    await loadData();
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
    data: any
  ) => {
    const result = await loanService.updateLoan(id, data);
    await loadData();
    return result;
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

  // Update expense handler
  const handleUpdateExpense = async (
    id: string,
    data: { amount?: number; category?: ExpenseCategory; description?: string; date?: string }
  ) => {
    await loanService.updateExpense(id, data);
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
    <div className="min-h-screen flex flex-col bg-[#FBFAF8] dark:bg-[#171514] text-[#211E1C] dark:text-[#F4EEE8] transition-colors duration-300">
      {/* Top Header */}
      <Header
        alerts={alerts}
        onRefresh={loadData}
        onResetDemo={handleResetDemoData}
        onOpenQuickCreateLoan={() => setIsQuickCreateLoanOpen(true)}
        onOpenTrash={() => alert('Historial de borrados')}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        userRole={userRole}
      />

      {/* Navigation Tabs Bar en page.tsx con Pestañas ["Dashboard", "Ruta Diaria", "Préstamos", "Nuevo Cliente", "Reportes", "Clientes", "Usuarios"] */}
      <nav className="bg-white/95 dark:bg-[#171514]/95 backdrop-blur-xl border-b border-[#EEE5DC] dark:border-[#3A312B] px-6 transition-colors duration-300 shadow-[0_8px_24px_rgba(70,45,20,0.04)]">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', adminOnly: false, cobradorHide: false },
            { id: 'dailyRoute', label: 'Ruta Diaria', adminOnly: false, cobradorHide: false },
            { id: 'loans', label: 'Préstamos', adminOnly: false, cobradorHide: false },
            { id: 'newClient', label: 'Nuevo Cliente', adminOnly: false, cobradorHide: false },
            { id: 'reports', label: 'Reportes', adminOnly: false, cobradorHide: true },
            { id: 'clients', label: 'Clientes', adminOnly: false, cobradorHide: false },
            { id: 'users', label: 'Usuarios', adminOnly: false, cobradorHide: true },
            { id: 'collectors', label: '👥 Cobradores', adminOnly: true, cobradorHide: true },
          ].filter(tab => {
            if (userRole === 'COBRADOR' && tab.cobradorHide) return false;
            if (tab.adminOnly && userRole !== 'ADMIN') return false;
            return true;
          }).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'users') {
                  setIsUserManagementOpen(true);
                } else if (tab.id === 'collectors') {
                  setShowCollectors(true);
                } else {
                  setActiveTab(tab.id as TabType);
                }
              }}
              className={`flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition-all relative whitespace-nowrap ${
                (activeTab === tab.id) || (tab.id === 'users' && isUserManagementOpen) || (tab.id === 'collectors' && showCollectors)
                  ? 'border-[#B40000] dark:border-[#F06A5C] text-[#B40000] dark:text-[#F06A5C] bg-[#FFF4F4] dark:bg-[#3B201C]/70 font-semibold'
                  : 'border-transparent text-[#69615C] dark:text-[#CBBDB2] hover:text-[#B40000] dark:hover:text-[#F06A5C]'
              }`}
            >
              {tab.id === 'users' ? (
                <Users className="w-4 h-4 text-[#B40000] dark:text-[#F06A5C]" />
              ) : null}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Container */}
      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-[1500px]">
        {/* Banner with Quick Action button */}
        <div className="premium-hero mb-6 p-5 sm:p-6 rounded-[28px] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_18px_50px_rgba(120,0,0,0.14)] border border-[#D7A93D]/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-bold shadow-inner">
              💰
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Sistema de Gestión PrestamosLeoWEB</h2>
              <p className="text-xs text-white/80">Control integral de préstamos, cobros diarios y rutas en Soles (S/.)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsQuickCreateLoanOpen(true)}
              className="premium-action bg-white/14 hover:bg-white/22 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer border border-white/25 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              + Crear Nuevo Préstamo
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowCollectors(true)}
                className="premium-action bg-white/14 hover:bg-white/22 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer border border-white/25 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                👥 Panel Cobradores
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#D96B27] dark:border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]">Cargando PrestamosLeoWEB (Perú)...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                summary={summary || defaultDashboardSummary}
                recentLoans={loans}
                recentPayments={payments}
                setActiveTab={setActiveTab}
                isAdmin={userRole === 'ADMIN'}
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
                isAdmin={userRole === 'ADMIN'}
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
                isAdmin={userRole === 'ADMIN'}
              />
            )}

            {showCollectors && userRole === 'ADMIN' && (
              <div className="fixed inset-0 z-40 bg-[#FAF8F5] dark:bg-[#1C1917] overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 py-6">
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setShowCollectors(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] hover:bg-[#FAF8F5] dark:hover:bg-[#242120] transition-all text-sm font-medium"
                    >
                      ← Volver
                    </button>
                    <h1 className="text-xl font-bold text-[#2C221E] dark:text-[#EAE0D5]">Panel de Cobradores</h1>
                  </div>
                  <CollectorManagementView isAdmin={userRole === 'ADMIN'} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <QuickCreateLoanModal
        clients={clients}
        isOpen={isQuickCreateLoanOpen}
        onClose={() => setIsQuickCreateLoanOpen(false)}
        onSubmitLoan={handleCreateLoan}
        onRedirectToNewClient={() => setActiveTab('newClient')}
      />
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-[#EEE5DC] dark:border-[#3A312B] text-center text-xs text-[#746B65] dark:text-[#BFAFA3] bg-white dark:bg-[#171514] transition-colors duration-300">
        <p>PrestamosLeoWEB</p>
      </footer>
    </div>
  );
}
