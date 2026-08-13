import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDatePE, formatDueDate } from '../utils/loanHelpers';
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  Plus,
  Route,
  CreditCard,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';

import { EditPaymentModal } from '../components/EditPaymentModal';

const PERU_TIME_ZONE = 'America/Lima';

function dateKeyInPeru(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text.split('T')[0];
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function VistaDashboard({
  summary = {},
  recentLoans = [],
  recentPayments = [],
  onUpdatePayment,
  onDeletePayment,
  onOpenUserManagement,
  onRefreshData,
  user,
}) {
  const navigate = useNavigate();
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  useEffect(() => {
    if (onRefreshData) {
      onRefreshData();
    }
  }, [user?.id, user?.role]);

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = String(currentUser?.role || '').toUpperCase() === 'ADMIN';

  const handleDeletePaymentClick = async (payment) => {
    if (!onDeletePayment) return;
    const confirmMsg = `¿Deseas anular este pago de ${formatCurrency(payment.amount)} de ${payment.clientName}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingPaymentId(payment.id);
      await onDeletePayment(payment.id);
    } catch (err) {
      console.error('Error al anular pago:', err);
      alert(err.response?.data?.error || err.message || 'Error al anular el pago');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const formatDateWithTime = (dateStr, createdAtStr) => {
    if (!createdAtStr) return dateStr ? formatDatePE(dateStr) : '';
    const str = createdAtStr;
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d.getTime())) return dateStr || '';
    const day = d.toLocaleString('es-PE', { timeZone: PERU_TIME_ZONE, day: 'numeric' });
    const month = d.toLocaleString('es-PE', { timeZone: PERU_TIME_ZONE, month: 'long' });
    const time = d.toLocaleString('es-PE', {
      timeZone: PERU_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${day} ${month} || ${time.toLowerCase()}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="terracotta-gradient text-white p-4 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative z-10 space-y-1">
          <span className="hidden sm:inline-block bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            PRESTAMOS LEITOTECH
          </span>
          <h2 className="text-xl sm:text-2xl uppercase font-extrabold tracking-wide text-white">
            PANEL DE PRÉSTAMOS
          </h2>
          <p className="hidden sm:block text-xs sm:text-sm text-white/90 max-w-xl">
            Resumen de prestamos, ingresos y gastos
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <button
            onClick={() => navigate('/nuevo-cliente')}
            className="bg-white text-[#D96B27] px-5 py-3 rounded-2xl font-extrabold text-xs shadow-sm hover:bg-[#FAF8F5] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Préstamo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1E1E1E] p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-2 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] dark:text-[#E5E7EB] uppercase tracking-wider">
            MONTO PRESTAMOS TOTALES
            </span>
            <div className="p-2 rounded-xl bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F] font-black text-xs leading-none flex items-center justify-center min-w-[32px] h-[32px]">
              S/.
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2C221E] dark:text-[#F3F4F6]">
            {formatCurrency(summary.totalCapitalLent)}
          </div>
          <p className="text-[11px] text-[#6E615A] dark:text-[#E5E7EB] flex items-center gap-1">
            <span>Monto total prestado hasta la fecha</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-2 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] dark:text-[#E5E7EB] uppercase tracking-wider">
              Ganancia
            </span>
            <div className="p-2 rounded-xl bg-[#EEF6F2] dark:bg-[#1E2D27] text-[#2D7A5D] dark:text-[#3D9970]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2D7A5D] dark:text-[#3D9970]">
            {formatCurrency(summary.totalEstimatedProfit)}
          </div>
          <p className="text-[11px] text-[#6E615A] dark:text-[#E5E7EB]">
            Utilidad proyectada (20%)
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-2 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] dark:text-[#E5E7EB] uppercase tracking-wider">
              Recaudado Hoy
            </span>
            <div className="p-2 rounded-xl bg-[#EEF6F2] dark:bg-[#1E2D27] text-[#2D7A5D] dark:text-[#3D9970]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2D7A5D] dark:text-[#3D9970]">
            {formatCurrency(summary.collectedToday)}
          </div>
          <p className="text-[11px] text-[#6E615A] dark:text-[#E5E7EB]">
            Pagos ingresados durante el día
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-2 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] dark:text-[#E5E7EB] uppercase tracking-wider">
              Clientes Activos
            </span>
            <div className="p-2 rounded-xl bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2C221E] dark:text-[#F3F4F6]">
            {summary.totalActiveLoansCount}
          </div>
          <p className="text-[11px] text-[#6E615A] dark:text-[#E5E7EB]">
            Préstamos vigentes en cartera
          </p>
        </div>
      </div>

      {/* Quick Action Route Bar */}
      <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
        <div className="flex-1 w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-[#2C221E] dark:text-[#F3F4F6]">Progreso de Cobranza del Día</span>
            <span className="text-[#D96B27] dark:text-[#E07A5F]">{summary.collectionProgressPercent || 100}%</span>
          </div>
          <div className="w-full h-3 bg-[#FAF8F5] dark:bg-[#24211E] rounded-full overflow-hidden border border-[#E6DCD2] dark:border-[#332F2C]">
            <div
              className="h-full terracotta-gradient transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, summary.collectionProgressPercent || 100))}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={() => navigate('/ruta-diaria')}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-[#2C221E] dark:bg-[#332F2C] text-white font-extrabold text-xs shadow-xs hover:bg-[#D96B27] dark:hover:bg-[#E07A5F] transition-all flex items-center justify-center gap-2"
        >
          <Route className="w-4 h-4" />
          <span>Ir a Ruta Diaria ({summary.pendingClientsTodayCount || 0} pendientes)</span>
        </button>
      </div>

      {/* Tables Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#2C221E] dark:text-[#F3F4F6] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
              <span>Últimos Préstamos Registrados</span>
            </h3>
            <button
              onClick={() => navigate('/prestamos')}
              className="text-xs font-bold text-[#D96B27] dark:text-[#E07A5F] hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {recentLoans.slice(0, 4).map((loan) => (
              <div
                key={loan.id}
                className="p-3 bg-[#FAF8F5] dark:bg-[#24211E] rounded-2xl border border-[#E6DCD2]/60 dark:border-[#332F2C] flex items-center justify-between text-xs transition-colors duration-300 gap-2"
              >
                <div className="min-w-0 flex-1">
                  <strong className="text-[#2C221E] dark:text-[#F3F4F6] block font-bold truncate">
                    {loan.clientName}
                  </strong>
                  <span className="text-[#6E615A] dark:text-[#E5E7EB]">
                    {formatCurrency(loan.capital)} + 20% = {formatCurrency(loan.totalToPay)} ({loan.paymentDays} días)
                  </span>
                </div>

                <div className="flex flex-col items-end text-right shrink-0">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold rounded-full border mb-1 shrink-0 ${
                      loan.status === 'OVERDUE'
                        ? 'bg-[#FDF2F0] dark:bg-[#3D2522] text-[#C84B31] dark:text-[#E57373] border-[#C84B31]/30'
                        : loan.status === 'PAID'
                        ? 'bg-[#EEF6F2] dark:bg-[#1E2D27] text-[#2D7A5D] dark:text-[#3D9970] border-[#2D7A5D]/30'
                        : 'bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F] border-[#D96B27]/30'
                    }`}
                  >
                    {loan.status === 'OVERDUE' ? 'En Mora' : loan.status === 'PAID' ? 'Cancelado' : 'Vigente'}
                  </span>
                  <span className="text-[10px] text-[#6E615A] dark:text-[#E5E7EB] font-medium whitespace-nowrap">
                    {formatDueDate(loan.dueDate || loan.due_date || loan.vencimiento)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2D7A5D]" />
              <span>Últimos Cobros Realizados</span>
            </h3>
            <button
              onClick={() => navigate('/ruta-diaria')}
              className="text-xs font-bold text-[#2D7A5D] hover:underline"
            >
              Ruta Diaria
            </button>
          </div>

          <div className="space-y-2">
            {(() => {
              const summaryPayments = Array.isArray(summary?.recentPayments)
                ? summary.recentPayments
                : summary?.cobros || summary?.payments || summary?.recent_payments;
              const peruToday = dateKeyInPeru(new Date());
              const rawPayments = Array.isArray(summaryPayments)
                ? summaryPayments
                : (recentPayments || []).filter((payment) => (
                  dateKeyInPeru(payment?.payment_date || payment?.date || payment?.createdAt || payment?.created_at) === peruToday
                ));
              const uniquePayments = Array.from(new Map(rawPayments.map((payment, index) => {
                const key = payment?.id || `${payment?.loanId || payment?.loan_id || 'unknown'}_${payment?.payment_date || payment?.date || 'unknown'}_${payment?.amount || 0}_${index}`;
                return [String(key), payment];
              })).values());
              const sortedPayments = uniquePayments.sort((a, b) => {
                const dateA = new Date(a?.createdAt || a?.created_at || a?.payment_date || a?.date || 0).getTime();
                const dateB = new Date(b?.createdAt || b?.created_at || b?.payment_date || b?.date || 0).getTime();
                if (dateB !== dateA) return dateB - dateA;
                const idA = String(a?.id || '');
                const idB = String(b?.id || '');
                return idB.localeCompare(idA, undefined, { numeric: true });
              });

              if (!sortedPayments || sortedPayments.length === 0) {
                return (
                  <div className="p-6 text-center text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] bg-[#FAF8F5] dark:bg-[#24211E] rounded-2xl border border-[#E6DCD2]/60 dark:border-[#332F2C]">
                    No hay cobros registrados hoy
                  </div>
                );
              }
              return sortedPayments.slice(0, 5).map((payment, index) => (
                <div
                  key={payment.id || `pay_${payment.loanId || payment.loan_id || 'unknown'}_${payment.payment_date || payment.date || 'unknown'}_${index}`}
                  className="p-3 bg-[#FAF8F5] dark:bg-[#24211E] rounded-2xl border border-[#E6DCD2]/60 dark:border-[#332F2C] flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-[#2C221E] dark:text-[#F3F4F6] block font-bold">
                      {payment.clientName || payment.client_name || payment.name || 'Cliente'}
                    </strong>
                    <span className="text-[#6E615A] dark:text-[#E5E7EB] flex items-center gap-1 flex-wrap">
                      <span>Día {payment.dayNumber ?? payment.day_number ?? 1} • {payment.notes || payment.comment || 'Pago registrado'}</span>
                      {isAdmin && (payment.collectorName || payment.collector_name) && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-[#E89D4F]/20 text-[#D96B27] rounded-md font-bold border border-[#E89D4F]/30">
                          👤 {payment.collectorName || payment.collector_name}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <strong className="text-[#2D7A5D] dark:text-[#3D9970] font-extrabold block text-sm">
                        +{formatCurrency(payment.amount)}
                      </strong>
                      <span className="text-[10px] text-[#6E615A] dark:text-[#E5E7EB]">
                        {formatDateWithTime(payment.date || payment.payment_date, payment.createdAt || payment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onUpdatePayment && (
                        <button
                          type="button"
                          onClick={() => setEditingPayment(payment)}
                          className="p-1 rounded-lg text-[#6E615A] hover:text-[#D96B27] hover:bg-white border border-transparent hover:border-[#E6DCD2] transition-all cursor-pointer"
                          title="Editar Pago"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeletePayment && (
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentClick(payment)}
                          disabled={deletingPaymentId === payment.id}
                          className="p-1 rounded-lg text-[#A89B92] hover:text-[#DC2626] hover:bg-[#FDF2F0] border border-transparent hover:border-[#DC2626]/20 transition-all cursor-pointer disabled:opacity-50"
                          title="Anular Pago"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${deletingPaymentId === payment.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <EditPaymentModal
        payment={editingPayment}
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        onConfirmEditPayment={onUpdatePayment}
      />
    </div>
  );
}
