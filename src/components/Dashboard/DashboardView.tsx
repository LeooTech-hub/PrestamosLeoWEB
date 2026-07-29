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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  recentLoans,
  recentPayments,
  setActiveTab,
}) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D96B27]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2C221E] via-[#3D302A] to-[#2C221E] text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#E89D4F_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#E89D4F]/20 text-[#E89D4F] border border-[#E89D4F]/30 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resumen de Cobranzas Hoy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ¡Hola, Leo! 👋
            </h2>
            <p className="text-xs sm:text-sm text-[#D5C8BC] mt-1 max-w-md">
              Control de préstamos del 20% en Soles (S/.) por días de pago.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('newClient')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl terracotta-gradient text-white text-xs sm:text-sm font-semibold shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Cliente</span>
            </button>
            <button
              onClick={() => setActiveTab('dailyRoute')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-[#2C221E] hover:bg-[#FAF8F5] text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 text-[#E89D4F]" />
              <span>Cobro Rápido</span>
            </button>
          </div>
        </div>

        {/* Collection Progress */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-[#D5C8BC] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2D7A5D]" />
              Meta de recaudo del día
            </span>
            <span className="font-bold text-[#E89D4F]">
              {summary.collectionProgressPercent}% completado
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#E89D4F] to-[#2D7A5D] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.collectionProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Capital Prestado */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6DCD2] warm-shadow hover:border-[#D96B27]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6E615A]">Capital Invertido</span>
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#2C221E] tracking-tight truncate">
            {formatCurrency(summary.totalCapitalLent)}
          </p>
          <span className="text-[11px] text-[#6E615A] flex items-center gap-1 mt-1">
            <Users className="w-3 h-3 text-[#E89D4F]" />
            {summary.totalActiveLoansCount} préstamos activos
          </span>
        </div>

        {/* Card 2: Ganancia Estimada (20%) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6DCD2] warm-shadow hover:border-[#E89D4F]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6E615A]">Ganancia (20%)</span>
            <div className="w-9 h-9 rounded-xl bg-[#FDF6EE] text-[#E89D4F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#2C221E] tracking-tight truncate">
            {formatCurrency(summary.totalEstimatedProfit)}
          </p>
          <span className="text-[11px] text-[#2D7A5D] font-medium flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Interés 20%
          </span>
        </div>

        {/* Card 3: Cobrado Hoy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6DCD2] warm-shadow hover:border-[#2D7A5D]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6E615A]">Recaudado Hoy</span>
            <div className="w-9 h-9 rounded-xl bg-[#EEF6F2] text-[#2D7A5D] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#2D7A5D] tracking-tight truncate">
            {formatCurrency(summary.collectedToday)}
          </p>
          <span className="text-[11px] text-[#6E615A] mt-1 block">
            Ingresado a caja hoy
          </span>
        </div>

        {/* Card 4: Clientes Pendientes Hoy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6DCD2] warm-shadow hover:border-[#C84B31]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6E615A]">Pendientes Hoy</span>
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-lg sm:text-2xl font-black text-[#C84B31] tracking-tight">
              {summary.pendingClientsTodayCount}
            </p>
            <span className="text-xs font-semibold text-[#6E615A]">clientes</span>
          </div>
          {summary.overdueCount > 0 ? (
            <span className="text-[11px] text-[#C84B31] font-medium flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />
              {summary.overdueCount} en mora
            </span>
          ) : (
            <span className="text-[11px] text-[#2D7A5D] font-medium mt-1 block">
              Sin mora atrasada
            </span>
          )}
        </div>
      </div>

      {/* Middle Section: Active Loans Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-[#E6DCD2] warm-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#2C221E]">Préstamos Recientes</h3>
              <p className="text-xs text-[#6E615A]">Progreso de cancelación por días acordados</p>
            </div>
            <button
              onClick={() => setActiveTab('clients')}
              className="text-xs font-semibold text-[#D96B27] hover:text-[#C25A19] flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {recentLoans.length === 0 ? (
            <div className="text-center py-8 text-[#6E615A] text-sm">
              No hay préstamos registrados aún.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLoans.slice(0, 4).map((loan) => {
                const percent = Math.round((loan.paidAmount / loan.totalToPay) * 100);
                return (
                  <div
                    key={loan.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6DCD2]/80 hover:border-[#D96B27]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2C221E] truncate">
                          {loan.clientName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            loan.status === 'OVERDUE'
                              ? 'bg-[#FDF2F0] text-[#C84B31] border border-[#C84B31]/30'
                              : loan.status === 'PAID'
                              ? 'bg-[#EEF6F2] text-[#2D7A5D] border border-[#2D7A5D]/30'
                              : 'bg-[#FDF6EE] text-[#E89D4F] border border-[#E89D4F]/30'
                          }`}
                        >
                          {loan.status === 'OVERDUE'
                            ? 'EN MORA'
                            : loan.status === 'PAID'
                            ? 'PAGADO'
                            : `${loan.paymentDays} DÍAS`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6E615A] mt-1">
                        <span>Capital: <strong className="text-[#2C221E]">{formatCurrency(loan.capital)}</strong></span>
                        <span>Total (20%): <strong className="text-[#D96B27]">{formatCurrency(loan.totalToPay)}</strong></span>
                      </div>
                    </div>

                    <div className="w-full sm:w-44 text-right">
                      <div className="flex justify-between sm:justify-end gap-2 text-xs font-semibold mb-1">
                        <span className="text-[#6E615A]">
                          Día {loan.paidDaysCount}/{loan.paymentDays}
                        </span>
                        <span className="text-[#2D7A5D]">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#E6DCD2] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#2D7A5D] h-2 rounded-full"
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
        <div className="bg-white rounded-3xl p-5 border border-[#E6DCD2] warm-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#2C221E] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#D96B27]" />
                Cobros Recientes
              </h3>
              <p className="text-xs text-[#6E615A]">Últimos pagos de la ruta</p>
            </div>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-[#6E615A] text-xs">
              Aún no se registraron pagos hoy.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 5).map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#EEF6F2]/60 border border-[#2D7A5D]/20 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#2C221E] block truncate max-w-[140px]">
                      {pay.clientName}
                    </span>
                    <span className="text-[#6E615A] text-[11px]">
                      {pay.notes || 'Pago del día'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#2D7A5D] text-sm block">
                      +{formatCurrency(pay.amount)}
                    </span>
                    <span className="text-[10px] text-[#6E615A]">{formatDatePE(pay.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
