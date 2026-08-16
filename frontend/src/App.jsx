import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from './api';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { QuickCreateLoanModal } from './components/QuickCreateLoanModal';
import { TrashModal } from './components/TrashModal';
import { UserManagementModal } from './components/UserManagementModal';
import { WelcomeModal } from './components/WelcomeModal';
import { PrivateRoute } from './components/PrivateRoute';

import { VistaLogin } from './pages/VistaLogin';
import { VistaResetPassword } from './pages/VistaResetPassword';
import { VistaDashboard } from './pages/VistaDashboard';
import { VistaRutaDiaria } from './pages/VistaRutaDiaria';
import { VistaPrestamos } from './pages/VistaPrestamos';
import { VistaNuevoCliente } from './pages/VistaNuevoCliente';
import { VistaReportes } from './pages/VistaReportes';
import { VistaClientes } from './pages/VistaClientes';
import { VistaCobros } from './pages/VistaCobros';

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

  // Estados de Autenticación iniciales desde localStorage ('token' o 'jwt')
  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('jwt') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Estado booleano de autenticación
  const isAuthenticated = Boolean(token && user);

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
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Función para cerrar sesión y redirigir a Login
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Escuchar evento 401 'auth:unauthorized' emitido por el interceptor de api.js
  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [handleLogout]);

  // GUARDIÁN INICIAL: Al iniciar la aplicación, verificar si existe token ('token' o 'jwt').
  // Si NO existe token, NO ejecutar ninguna función de carga inicial ('loadData', etc.) y renderizar directamente 'VistaLogin.jsx'.
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('jwt');

      if (!storedToken) {
        if (isMounted) {
          setToken('');
          setUser(null);
          setIsAuthChecking(false);
        }
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (isMounted && response.data?.user) {
          setUser(response.data.user);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Error al verificar sesión inicial (401 / Token expirado):', err.message);
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('jwt');
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
  }, []);

  // Carga de datos de negocio tras verificación de token válido
  const loadData = useCallback(async (period = reportPeriod) => {
    const activeToken = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (!activeToken) return;

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

      setClients(Array.isArray(cList) ? cList : (cList?.clients || cList?.data || []));
      setLoans(Array.isArray(lList) ? lList : (lList?.loans || lList?.data || []));
      setPayments(Array.isArray(pList) ? pList : (pList?.payments || pList?.data || []));
      setSummary(sum && typeof sum === 'object' ? sum : defaultDashboardSummary);
      setTodayCollections(Array.isArray(todayCol) ? todayCol : (todayCol?.collections || todayCol?.todayCollections || todayCol?.data || []));
      setAlerts(Array.isArray(alertList) ? alertList : (alertList?.alerts || alertList?.data || []));
      setFinancialReport(report);
    } catch (error) {
      console.error('Error cargando datos del backend:', error);
      setSummary(defaultDashboardSummary);
    } finally {
      setIsLoading(false);
    }
  }, [reportPeriod]);

  // Carga reactiva de datos al autenticar o cambiar reportPeriod utilizando bandera de montaje (isMounted)
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      const executeLoad = async () => {
        if (isMounted) {
          await loadData();
        }
      };
      executeLoad();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, loadData]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setShowWelcomeModal(true);
    navigate('/');
  };

  // Handlers operacionales de préstamos, clientes, pagos
  const handleCreateClient = async (clientData) => {
    try {
      const res = await api.post('/clients', clientData);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error registrando cliente:', err);
      throw err;
    }
  };

  const handleCreateLoan = async (formData) => {
    try {
      const res = await api.post('/loans', formData);
      await loadData();
      navigate('/prestamos');
      return res.data;
    } catch (err) {
      console.error('Error registrando préstamo:', err);
      throw err;
    }
  };

  const handleRegisterPayment = async (loanId, amount, notes, lateFee) => {
    try {
      const res = await api.post('/payments', { loanId, amount, notes, lateFee });
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error registrando pago:', err);
      throw err;
    }
  };

  const handleReorderClients = async (orders) => {
    try {
      await api.put('/clients/reorder', { orders });
      await loadData();
    } catch (err) {
      console.error('Error reordenando clientes:', err);
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
      const res = await api.put(`/clients/${id}`, data);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error actualizando cliente:', err);
      throw err;
    }
  };

  const handleUpdateLoan = async (id, data) => {
    try {
      const res = await api.put(`/loans/${id}`, data);
      await loadData();
      return res.data;
    } catch (err) {
      console.error('Error actualizando préstamo:', err);
      throw err;
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

  // Enlace de recuperación de contraseña enviado al correo
  if (location.pathname === '/reset-password') {
    return <VistaResetPassword />;
  }

  // Spinner breve mientras verifica token en inicio
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-[#6E615A]">Verificando sesión segura (S/.)...</p>
      </div>
    );
  }

  // GUARDIÁN DE RUTAS: Si NO existe estado autenticado, renderizar directamente la VistaLogin
  if (!isAuthenticated) {
    return <VistaLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#181614] text-[#2C221E] dark:text-[#F3F4F6] transition-colors duration-300">
      {/* Modal / Notificación de Bienvenida Animada */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        user={user}
        onComplete={() => setShowWelcomeModal(false)}
      />

      {/* Top Header con datos del usuario e icono de cerrar sesión */}
      <Header
        alerts={alerts}
        onRefresh={() => loadData()}
        onResetDemo={handleResetDemoData}
        onOpenQuickCreateLoan={() => setIsQuickCreateLoanOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Router Navigation Tabs */}
      <Navigation
        pendingCountToday={summary?.pendingClientsTodayCount || 0}
        overdueCount={summary?.overdueCount || 0}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        user={user}
      />

      {/* Main Content Pages Area (Dashboard y Vistas Encapsuladas bajo isAuthenticated) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#6E615A]">Cargando datos de PrestamosLeoWEB (S/.)...</p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <VistaLogin onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            <Route
              path="/"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  <VistaDashboard
                    summary={summary || defaultDashboardSummary}
                    recentLoans={loans}
                    recentPayments={payments}
                    onOpenQuickCreateLoan={() => setIsQuickCreateLoanOpen(true)}
                    onOpenUserManagement={() => setIsUserManagementOpen(true)}
                    onUpdatePayment={handleUpdatePayment}
                    onDeletePayment={handleDeletePayment}
                    onRefreshData={loadData}
                    user={user}
                  />
                </PrivateRoute>
              }
            />

            <Route
              path="/ruta-diaria"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  <VistaRutaDiaria
                    todayCollections={todayCollections}
                    onRegisterPayment={handleRegisterPayment}
                    onReorderClients={handleReorderClients}
                  />
                </PrivateRoute>
              }
            />

            <Route
              path="/prestamos"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  <VistaPrestamos
                    loans={loans}
                    onRegisterPayment={handleRegisterPayment}
                    onUpdateLoan={handleUpdateLoan}
                    onDeleteLoan={handleDeleteLoan}
                    onRevertPayment={handleRevertPayment}
                  />
                </PrivateRoute>
              }
            />

            <Route
              path="/nuevo-cliente"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  <VistaNuevoCliente
                    clients={clients}
                    onSubmitLoan={handleCreateLoan}
                    onCreateClient={handleCreateClient}
                    onRefresh={loadData}
                    fetchClients={loadData}
                  />
                </PrivateRoute>
              }
            />

            <Route
              path="/reportes"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  {user?.role === 'COBRADOR' ? (
                    <Navigate to="/ruta-diaria" replace />
                  ) : (
                    <VistaReportes
                      report={financialReport}
                      period={reportPeriod}
                      onPeriodChange={handlePeriodChange}
                      onAddExpense={handleAddExpense}
                      onUpdateExpense={handleUpdateExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  )}
                </PrivateRoute>
              }
            />

            <Route
              path="/cobros"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  {user?.role === 'ADMIN' ? (
                    <VistaCobros
                      user={user}
                      onUpdatePayment={handleUpdatePayment}
                      onDeletePayment={handleDeletePayment}
                      onRefreshData={loadData}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )}
                </PrivateRoute>
              }
            />

            <Route
              path="/clientes"
              element={
                <PrivateRoute token={token} user={user} onLoginSuccess={handleLoginSuccess}>
                  <VistaClientes
                    clients={clients}
                    loans={loans}
                    payments={payments}
                    onUpdateClient={handleUpdateClient}
                    onUpdateLoan={handleUpdateLoan}
                    onDeleteClient={handleDeleteClient}
                    onDeletePayment={handleDeletePayment}
                    onUpdatePayment={handleUpdatePayment}
                    onAssignPortfolio={loadData}
                    onCreateClient={handleCreateClient}
                    onRefresh={loadData}
                    fetchClients={loadData}
                    onRefreshData={loadData}
                    user={user}
                  />
                </PrivateRoute>
              }
            />

            <Route path="/reset-password" element={<VistaResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

      {/* Recycle Bin Trash Modal */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onDataChanged={loadData}
      />

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-[#E6DCD2] dark:border-[#332F2C] text-center text-xs text-[#6E615A] dark:text-[#E5E7EB] bg-white dark:bg-[#1E1E1E] transition-colors duration-300">
        <p>PrestamosLeoWEB ©2026 Todos los Derechos Reservados</p>
      </footer>
    </div>
  );
}