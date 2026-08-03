import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from './api';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { QuickCreateLoanModal } from './components/QuickCreateLoanModal';
import { TrashModal } from './components/TrashModal';

import { VistaLogin } from './pages/VistaLogin';
import { VistaResetPassword } from './pages/VistaResetPassword';
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
  const location = useLocation();

  // Estados de Autenticación
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Estados Operativos
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(defaultDashboardSummary);
  const [alerts, setAlerts] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('WEEKLY');
  const [financialReport, setFinancialReport] = useState(null);
  const [todayCollections, setTodayCollections] = useState([]);

  const [isQuickCreateLoanOpen, setIsQuickCreateLoanOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cerrar sesión
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    navigate('/');
  }, [navigate]);

  // Escuchar evento de token no autorizado
  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [handleLogout]);

  // Verificar sesión con /api/auth/me al iniciar
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setIsAuthChecking(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (isMounted && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Sesión no válida o expirada:', err.message);
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken('');
          setUser(null);
        }
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Carga de datos de negocio tras autenticación
  const loadData = useCallback(async (period = reportPeriod) => {
    if (!token) return;
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
        fetchSafe(`/reports/financial?period=${period}`, null),
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
  }, [reportPeriod, token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [loadData, reportPeriod, token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    navigate('/');
  };

  // Handlers operacionales de préstamos, clientes, pagos
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

  const handleDeletePayment = async (paymentId) => {
    try {
      const res = await api.delete(`/payments/${paymentId}`);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error anulando pago:', err);
      throw err;
    }
  };

  const handleUpdatePayment = async (id, data) => {
    try {
      const res = await api.put(`/payments/${id}`, data);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error actualizando pago:', err);
      throw err;
    }
  };

  const handleUpdateExpense = async (id, data) => {
    try {
      const res = await api.put(`/expenses/${id}`, data);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error actualizando gasto:', err);
      throw err;
    }
  };

  const handleRevertPayment = async (loanId) => {
    try {
      const res = await api.post(`/loans/${loanId}/revert-payment`);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error revirtiendo pago:', err);
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

  // Si la ruta actual es /reset-password (por el enlace del correo)
  if (location.pathname === '/reset-password') {
    return <VistaResetPassword />;
  }

  // Mientras verifica sesión
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-[#6E615A]">Verificando sesión segura...</p>
      </div>
    );
  }

  // Si no está autenticado, renderiza VistaLogin
  if (!token || !user) {
    return <VistaLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Top Header con datos del usuario e icono de cerrar sesión */}
      <Header
        alerts={alerts}
        onRefresh={() => loadData()}
        onResetDemo={handleResetDemoData}
        onOpenQuickCreateLoan={() => setIsQuickCreateLoanOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        user={user}
        onLogout={handleLogout}
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
            <p className="text-xs font-semibold text-[#6E615A]">Cargando datos de PrestamosLeoWEB (S/.)...</p>
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
                  onUpdatePayment={handleUpdatePayment}
                  onDeletePayment={handleDeletePayment}
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
                  onRevertPayment={handleRevertPayment}
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
                  onUpdateExpense={handleUpdateExpense}
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
                  onDeletePayment={handleDeletePayment}
                  onUpdatePayment={handleUpdatePayment}
                />
              }
            />
            <Route path="/reset-password" element={<VistaResetPassword />} />
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

      {/* Recycle Bin Trash Modal */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onDataChanged={loadData}
      />

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-[#E6DCD2] text-center text-xs text-[#6E615A] bg-white">
        <p>PrestamosLeoWEB ©2026 Todos los Derechos Reservados (S/.).</p>
      </footer>
    </div>
  );
}