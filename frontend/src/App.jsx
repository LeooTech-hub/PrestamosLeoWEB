import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from './api';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { QuickCreateLoanModal } from './components/QuickCreateLoanModal';

import { VistaDashboard } from './pages/VistaDashboard';
import { VistaRutaDiaria } from './pages/VistaRutaDiaria';
import { VistaPrestamos } from './pages/VistaPrestamos';
import { VistaNuevoCliente } from './pages/VistaNuevoCliente';
import { VistaReportes } from './pages/VistaReportes';
import { VistaClientes } from './pages/VistaClientes';

const defaultDashboardSummary = {
  totalCapitalLent: 0,
  totalEstimatedProfit: 0,
  collectedToday: 0,
  pendingClientsTodayCount: 0,
  totalActiveLoansCount: 0,
  overdueCount: 0,
  expiringSoonCount: 0,
  collectionProgressPercent: 100,
};

export default function App() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(defaultDashboardSummary);
  const [alerts, setAlerts] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('WEEKLY');
  const [financialReport, setFinancialReport] = useState(null);
  const [todayCollections, setTodayCollections] = useState([]);

  const [isQuickCreateLoanOpen, setIsQuickCreateLoanOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Express REST API
  const loadData = useCallback(async () => {
    try {
      const fetchSafe = async (url, fallback) => {
        try {
          const res = await api.get(url);
          return res.data;
        } catch (err) {
          console.error(`Error cargando ${url}:`, err.message);
          return fallback;
        }
      };

      const [cList, lList, pList, sum, todayCol, alertList, report] = await Promise.all([
        fetchSafe('/clients', []),
        fetchSafe('/loans', []),
        fetchSafe('/payments', []),
        fetchSafe('/dashboard/summary', defaultDashboardSummary),
        fetchSafe('/today-collections', []),
        fetchSafe('/alerts', []),
        fetchSafe(`/reports/financial?period=${reportPeriod}`, null),
      ]);

      setClients(cList || []);
      setLoans(lList || []);
      setPayments(pList || []);
      setSummary(sum || defaultDashboardSummary);
      setTodayCollections(todayCol || []);
      setAlerts(alertList || []);
      setFinancialReport(report);
    } catch (error) {
      console.error('Error cargando datos del backend:', error);
      setSummary(defaultDashboardSummary);
    } finally {
      setIsLoading(false);
    }
  }, [reportPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers communicating with REST API
  const handleCreateLoan = async (formData) => {
    try {
      await api.post('/loans', formData);
      await loadData();
      navigate('/prestamos');
    } catch (err) {
      console.error('Error registrando préstamo:', err);
    }
  };

  const handleRegisterPayment = async (loanId, amount, notes) => {
    try {
      const res = await api.post('/payments', { loanId, amount, notes });
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error registrando pago:', err);
      throw err;
    }
  };

  const handleUpdateClient = async (id, data) => {
    try {
      await api.put(`/clients/${id}`, data);
      await loadData();
    } catch (err) {
      console.error('Error actualizando cliente:', err);
    }
  };

  const handleUpdateLoan = async (id, data) => {
    try {
      await api.put(`/loans/${id}`, data);
      await loadData();
    } catch (err) {
      console.error('Error actualizando préstamo:', err);
    }
  };

  const handleDeleteLoan = async (loanId, mode) => {
    try {
      await api.delete(`/loans/${loanId}?mode=${mode}`);
      await loadData();
    } catch (err) {
      console.error('Error eliminando préstamo:', err);
    }
  };

  const handleDeleteClient = async (clientId, mode) => {
    try {
      await api.delete(`/clients/${clientId}?mode=${mode}`);
      await loadData();
    } catch (err) {
      console.error('Error eliminando cliente:', err);
    }
  };

  const handleAddExpense = async (amount, category, description) => {
    try {
      await api.post('/expenses', {
        amount,
        category,
        description,
        date: new Date().toISOString().split('T')[0],
      });
      await loadData();
    } catch (err) {
      console.error('Error registrando gasto:', err);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      await loadData();
    } catch (err) {
      console.error('Error eliminando gasto:', err);
    }
  };

  const handlePeriodChange = async (period) => {
    setReportPeriod(period);
    try {
      const res = await api.get(`/reports/financial?period=${period}`);
      setFinancialReport(res.data);
    } catch (err) {
      console.error('Error cargando reporte:', err);
    }
  };

  const handleResetDemoData = async () => {
    if (confirm('¿Deseas restablecer los datos de ejemplo con Express.js y TiDB Cloud (S/.)?')) {
      try {
        await api.post('/seed');
        await loadData();
      } catch (err) {
        console.error('Error restableciendo semilla:', err);
      }
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

      {/* Router Navigation Tabs */}
      <Navigation
        pendingCountToday={summary?.pendingClientsTodayCount || 0}
        overdueCount={summary?.overdueCount || 0}
      />

      {/* Main Content Pages Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#6E615A]">Cargando PrestamosLeoWEB (Vite + Express)...</p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <VistaDashboard
                  summary={summary || defaultDashboardSummary}
                  recentLoans={loans}
                  recentPayments={payments}
                  onOpenQuickCreateLoan={() => setIsQuickCreateLoanOpen(true)}
                />
              }
            />
            <Route
              path="/ruta-diaria"
              element={
                <VistaRutaDiaria
                  todayCollections={todayCollections}
                  onRegisterPayment={handleRegisterPayment}
                />
              }
            />
            <Route
              path="/prestamos"
              element={
                <VistaPrestamos
                  loans={loans}
                  onRegisterPayment={handleRegisterPayment}
                  onUpdateLoan={handleUpdateLoan}
                  onDeleteLoan={handleDeleteLoan}
                />
              }
            />
            <Route
              path="/nuevo-cliente"
              element={
                <VistaNuevoCliente
                  clients={clients}
                  onSubmitLoan={handleCreateLoan}
                />
              }
            />
            <Route
              path="/reportes"
              element={
                <VistaReportes
                  report={financialReport}
                  period={reportPeriod}
                  onPeriodChange={handlePeriodChange}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              }
            />
            <Route
              path="/clientes"
              element={
                <VistaClientes
                  clients={clients}
                  loans={loans}
                  payments={payments}
                  onUpdateClient={handleUpdateClient}
                  onUpdateLoan={handleUpdateLoan}
                  onDeleteClient={handleDeleteClient}
                />
              }
            />
          </Routes>
        )}
      </main>

      {/* Quick Create Loan Modal */}
      <QuickCreateLoanModal
        clients={clients}
        isOpen={isQuickCreateLoanOpen}
        onClose={() => setIsQuickCreateLoanOpen(false)}
        onSubmitLoan={handleCreateLoan}
      />

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-[#E6DCD2] text-center text-xs text-[#6E615A] bg-white">
        <p>PrestamosLeoWEB ©2026 Todos los Derechos Reservados.</p>
      </footer>
    </div>
  );
}
