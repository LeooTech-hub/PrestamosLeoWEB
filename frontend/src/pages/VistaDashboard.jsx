import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import {
  TrendingUp,
  Coins,
  Users,
  ArrowUpRight,
  Plus,
  Route,
  CreditCard,
  Percent,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';

import { EditPaymentModal } from '../components/EditPaymentModal';

export function VistaDashboard({
  summary = {},
  recentLoans = [],
  recentPayments = [],
  onOpenQuickCreateLoan,
  onUpdatePayment,
  onDeletePayment,
}) {
  const navigate = useNavigate();
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="terracotta-gradient text-white p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative z-10 space-y-1">
          <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            PRESTAMOS LEITOTECH
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            PANEL DE ADMINISTRACION DE PRESTAMOS
          </h2>
          <p className="text-xs sm:text-sm text-white/90 max-w-xl">
            Resumen de prestamos, ingresos y gastos
          </p>
        </div>

        <button
          onClick={() => navigate('/nuevo-cliente')}
          className="relative z-10 bg-white text-[#D96B27] px-5 py-3 rounded-2xl font-extrabold text-xs shadow-sm hover:bg-[#FAF8F5] active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Préstamo</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] uppercase tracking-wider">
            MONTO PRESTAMOS TOTALES
            </span>
            <div className="p-2 rounded-xl bg-[#FDF3ED] text-[#D96B27] font-black text-xs leading-none flex items-center justify-center min-w-[32px] h-[32px]">
              S/.
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2C221E]">
            {formatCurrency(summary.totalCapitalLent)}
          </div>
          <p className="text-[11px] text-[#6E615A] flex items-center gap-1">
            <span>Monto total prestado hasta la fecha</span>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] uppercase tracking-wider">
              Ganancia
            </span>
            <div className="p-2 rounded-xl bg-[#EEF6F2] text-[#2D7A5D]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2D7A5D]">
            {formatCurrency(summary.totalEstimatedProfit)}
          </div>
          <p className="text-[11px] text-[#2D7A5D] font-semibold">
            +20% Ganancia bruta
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] uppercase tracking-wider">
              Cobrado Hoy
            </span>
            <div className="p-2 rounded-xl bg-[#FDF3ED] text-[#D96B27]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2C221E]">
            {formatCurrency(summary.collectedToday)}
          </div>
          <p className="text-[11px] text-[#6E615A]">
            {summary.pendingClientsTodayCount || 0} clientes pendientes por cobrar hoy
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6E615A] uppercase tracking-wider">
              Préstamos Activos
            </span>
            <div className="p-2 rounded-xl bg-[#FAF8F5] text-[#2C221E]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-[#2C221E]">
            {summary.totalActiveLoansCount || 0}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {summary.overdueCount > 0 && (
              <span className="text-[#C84B31] font-bold">
                {summary.overdueCount} en mora
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Route Shortcut Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6DCD2] warm-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 flex-1 w-full">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-[#2C221E]">Progreso de Cobranza del Día</span>
            <span className="text-[#D96B27]">{summary.collectionProgressPercent || 100}%</span>
          </div>
          <div className="w-full h-3 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6DCD2]">
            <div
              className="h-full terracotta-gradient transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, summary.collectionProgressPercent || 100))}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={() => navigate('/ruta-diaria')}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-[#2C221E] text-white font-extrabold text-xs shadow-xs hover:bg-[#D96B27] transition-all flex items-center justify-center gap-2"
        >
          <Route className="w-4 h-4" />
          <span>Ir a Ruta Diaria ({summary.pendingClientsTodayCount || 0} pendientes)</span>
        </button>
      </div>

      {/* Tables Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D96B27]" />
              <span>Últimos Préstamos Registrados</span>
            </h3>
            <button
              onClick={() => navigate('/prestamos')}
              className="text-xs font-bold text-[#D96B27] hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {recentLoans.slice(0, 4).map((loan) => (
              <div
                key={loan.id}
                className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/60 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-[#2C221E] block font-bold">
                    {loan.clientName}
                  </strong>
                  <span className="text-[#6E615A]">
                    {formatCurrency(loan.capital)} + 20% = {formatCurrency(loan.totalToPay)} ({loan.paymentDays} días)
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border block mb-1 ${
                      loan.status === 'OVERDUE'
                        ? 'bg-[#FDF2F0] text-[#C84B31] border-[#C84B31]/30'
                        : loan.status === 'PAID'
                        ? 'bg-[#EEF6F2] text-[#2D7A5D] border-[#2D7A5D]/30'
                        : 'bg-[#FDF3ED] text-[#D96B27] border-[#D96B27]/30'
                    }`}
                  >
                    {loan.status === 'OVERDUE' ? 'En Mora' : loan.status === 'PAID' ? 'Cancelado' : 'Vigente'}
                  </span>
                  <span className="text-[10px] text-[#6E615A]">
                    Vence: {formatDatePE(loan.dueDate)}
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
            {recentPayments.slice(0, 4).map((payment) => (
              <div
                key={payment.id}
                className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/60 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-[#2C221E] block font-bold">
                    {payment.clientName}
                  </strong>
                  <span className="text-[#6E615A]">
                    Día {payment.dayNumber} • {payment.notes || 'Abono'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <strong className="text-[#2D7A5D] font-extrabold block text-sm">
                      +{formatCurrency(payment.amount)}
                    </strong>
                    <span className="text-[10px] text-[#6E615A]">
                      {formatDatePE(payment.date)}
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
            ))}
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
