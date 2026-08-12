'use client';

import React from 'react';
import { DashboardSummary, Loan, Payment } from '@/types';
import { formatCurrency, formatDatePE } from '@/services/loanService';
import {
  Coins,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserPlus,
  Zap,
  AlertTriangle,
  Users,
  ChevronRight,
  ArrowUpRight,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { TabType } from '../Navigation';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  recentLoans: Loan[];
  recentPayments: Payment[];
  setActiveTab: (tab: TabType) => void;
  isAdmin?: boolean;
  onOpenUserManagement?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  recentLoans,
  recentPayments,
  setActiveTab,
  isAdmin = true,
  onOpenUserManagement,
}) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D96B27]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#D96B27] via-[#C25A19] to-[#2C221E] dark:from-[#B85324] dark:via-[#9C431B] dark:to-[#26221F] text-white rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden transition-colors duration-300">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-[#FFFFFF] border border-white/30 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FFFFFF]" />
              <span>Resumen de Cobranzas Hoy</span>
            </div>
            <h2 className="text-xl sm:text-2xl uppercase font-extrabold tracking-wide text-white">
              PANEL DE PRÉSTAMOS
            </h2>
            <p className="hidden md:block text-xs sm:text-sm text-[#FFFFFF] opacity-95 mt-0.5 sm:mt-1 max-w-md">
              Control de préstamos del 20% en Soles (S/.) por días de pago.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => setActiveTab('newClient')}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-[#FFFFFF] border border-white/30 text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              <UserPlus className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#FFFFFF]" />
              <span>+ Crear Nuevo Préstamo</span>
            </button>
            <button
              onClick={() => setActiveTab('dailyRoute')}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white text-[#2C221E] dark:text-[#1C1917] hover:bg-[#FAF8F5] text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              <Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#D96B27]" />
              <span>Cobro Rápido</span>
            </button>
          </div>
        </div>

        {/* Collection Progress */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/20">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-[#FFFFFF] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#FFFFFF]" />
              Meta de recaudo del día
            </span>
            <span className="font-bold text-[#FFFFFF]">
              {summary.collectionProgressPercent}% completado
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="bg-white h-2 sm:h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.collectionProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Capital Prestado */}
        <div className="bg-white dark:bg-[#26221F] rounded-2xl p-3 sm:p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow hover:border-[#D96B27]/40 dark:hover:border-[#E07A5F]/40 transition-colors duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">TOTAL PRESTADO</span>
            <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-xl bg-[#FDF3ED] dark:bg-[#E07A5F]/15 text-[#D96B27] dark:text-[#E07A5F] flex items-center justify-center shrink-0">
              <Coins className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold sm:font-black text-[#2C221E] dark:text-[#EAE0D5] tracking-tight truncate">
            {formatCurrency(summary.totalCapitalLent)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-[#6E615A] dark:text-[#C2B29F] flex items-center gap-1 mt-1 truncate">
            <Users className="w-3 h-3 text-[#E89D4F] shrink-0" />
            <span>{summary.totalActiveLoansCount} CLIENTES</span>
          </span>
        </div>

        {/* Card 2: Ganancia Estimada (20%) */}
        {isAdmin && (
        <div className="bg-white dark:bg-[#26221F] rounded-2xl p-3 sm:p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow hover:border-[#E89D4F]/40 dark:hover:border-[#E89D4F]/40 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F4EBE1] dark:bg-[#3D352E] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D96B27] dark:text-[#E07A5F]" />
            </div>
            <h3 className="text-[11px] sm:text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wider">
              GANANCIA (20%)
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#D96B27] dark:text-[#E07A5F] tracking-tight">
              {formatCurrency(summary.totalEstimatedProfit)}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#8C7A70] dark:text-[#A8988C] mt-1.5 font-medium leading-tight">
            Interés esperado del capital activo
          </p>
        </div>
        )}

        {/* Card 3: Cobrado Hoy */}
        <div className="bg-white dark:bg-[#26221F] rounded-2xl p-3 sm:p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow hover:border-[#2D7A5D]/40 dark:hover:border-[#3D9970]/40 transition-colors duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">RECAUDADO HOY</span>
            <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-xl bg-[#EEF6F2] dark:bg-[#3D9970]/15 text-[#2D7A5D] dark:text-[#3D9970] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold sm:font-black text-[#2D7A5D] dark:text-[#3D9970] tracking-tight truncate">
            {formatCurrency(summary.collectedToday)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-[#6E615A] dark:text-[#C2B29F] mt-1 block truncate">
            Ingresado hoy
          </span>
        </div>

        {/* Card 4: Clientes Pendientes Hoy */}
        <div className="bg-white dark:bg-[#26221F] rounded-2xl p-3 sm:p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow hover:border-[#C84B31]/40 dark:hover:border-[#C84B31]/40 transition-colors duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">PENDIENTES HOY</span>
            <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-xl bg-[#FDF2F0] dark:bg-[#C84B31]/15 text-[#C84B31] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 truncate">
            <p className="text-lg sm:text-2xl font-bold sm:font-black text-[#C84B31] tracking-tight">
              {summary.pendingClientsTodayCount}
            </p>
            <span className="text-[11px] sm:text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]">CLIENTES</span>
          </div>
          {summary.overdueCount > 0 ? (
            <span className="text-[10px] sm:text-[11px] text-[#C84B31] font-medium flex items-center gap-1 mt-1 truncate">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{summary.overdueCount} en mora</span>
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] text-[#2D7A5D] dark:text-[#3D9970] font-medium mt-1 block truncate">
              Sin mora atrasada
            </span>
          )}
        </div>
      </div>

      {/* Middle Section: Active Loans Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#26221F] rounded-3xl p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#2C221E] dark:text-[#EAE0D5]">Préstamos Recientes</h3>
              <p className="text-xs text-[#6E615A] dark:text-[#C2B29F]">Progreso de cancelación por días acordados</p>
            </div>
            <button
              onClick={() => setActiveTab('clients')}
              className="text-xs font-semibold text-[#D96B27] dark:text-[#E07A5F] hover:text-[#C25A19] dark:hover:text-[#E07A5F] flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {recentLoans.length === 0 ? (
            <div className="text-center py-8 text-[#6E615A] dark:text-[#C2B29F] text-sm">
              No hay préstamos registrados aún.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLoans.slice(0, 4).map((loan) => {
                const percent = Math.round((loan.paidAmount / loan.totalToPay) * 100);
                return (
                  <div
                    key={loan.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2]/80 dark:border-[#3D352E] hover:border-[#D96B27]/40 dark:hover:border-[#E07A5F]/40 transition-colors duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2C221E] dark:text-[#EAE0D5] truncate">
                          {loan.client_name || loan.clientName || (loan as any).client?.name || 'Sin Nombre'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            loan.status === 'OVERDUE'
                              ? 'bg-[#FDF2F0] dark:bg-[#C84B31]/20 text-[#C84B31] border border-[#C84B31]/30'
                              : loan.status === 'PAID'
                              ? 'bg-[#EEF6F2] dark:bg-[#3D9970]/20 text-[#2D7A5D] dark:text-[#3D9970] border border-[#2D7A5D]/30 dark:border-[#3D9970]/30'
                              : 'bg-[#FDF6EE] dark:bg-[#3D261A] text-[#E89D4F] dark:text-[#E07A5F] border border-[#E89D4F]/30 dark:border-[#E07A5F]/30'
                          }`}
                        >
                          {loan.status === 'OVERDUE'
                            ? 'EN MORA'
                            : loan.status === 'PAID'
                            ? 'PAGADO'
                            : `${loan.paymentDays} DÍAS`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6E615A] dark:text-[#C2B29F] mt-1">
                        <span>Capital: <strong className="text-[#2C221E] dark:text-[#EAE0D5]">S/. {Number(loan.amount || loan.capital || (loan as any).total_amount || 0).toFixed(2)}</strong></span>
                        <span>Total: <strong className="text-[#D96B27] dark:text-[#E07A5F]">S/. {Number(loan.totalToPay || loan.totalAmount || 0).toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <div className="w-full sm:w-44 text-right">
                      <div className="flex justify-between sm:justify-end gap-2 text-xs font-semibold mb-1">
                        <span className="text-[#6E615A] dark:text-[#C2B29F]">
                          Día {loan.paidDaysCount}/{loan.paymentDays}
                        </span>
                        <span className="text-[#2D7A5D] dark:text-[#3D9970]">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#E6DCD2] dark:bg-[#3D352E] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#2D7A5D] dark:bg-[#3D9970] h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments Feed */}
        <div className="bg-white dark:bg-[#26221F] rounded-3xl p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
                Cobros Recientes
              </h3>
              <p className="text-xs text-[#6E615A] dark:text-[#C2B29F]">Últimos pagos de la ruta</p>
            </div>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-[#6E615A] dark:text-[#C2B29F] text-xs">
              Aún no se registraron pagos hoy.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#EEF6F2]/60 dark:bg-[#3D9970]/10 border border-[#2D7A5D]/20 dark:border-[#3D9970]/20 text-xs transition-colors duration-300"
                >
                  <div>
                    <span className="font-semibold text-[#2C221E] dark:text-[#EAE0D5] block truncate max-w-[140px]">
                      {pay.clientName}
                    </span>
                    <span className="text-[#6E615A] dark:text-[#C2B29F] text-[11px]">
                      {formatDatePE(pay.date)}
                    </span>
                  </div>
                  <strong className="text-[#2D7A5D] dark:text-[#3D9970] font-black text-sm">
                    +{formatCurrency(pay.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
