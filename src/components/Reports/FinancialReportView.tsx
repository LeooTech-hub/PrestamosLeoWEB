'use client';

import React, { useState } from 'react';
import { FinancialReportData, ReportPeriod, ExpenseCategory, OperationalExpense } from '@/types';
import { formatCurrency, formatDatePE } from '@/services/loanService';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  MinusCircle,
  PlusCircle,
  Calendar,
  PieChart,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';

interface FinancialReportViewProps {
  report: FinancialReportData | null;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  onAddExpense: (amount: number, category: ExpenseCategory, description: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const FinancialReportView: React.FC<FinancialReportViewProps> = ({
  report,
  period,
  onPeriodChange,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [category, setCategory] = useState<ExpenseCategory>('COMBUSTIBLE');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!report) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D96B27]"></div>
      </div>
    );
  }

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Por favor ingrese un monto de gasto válido');
      return;
    }
    if (!description.trim()) {
      alert('Por favor ingrese una descripción del gasto');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddExpense(amount, category, description.trim());
      setDescription('');
      setAmount(10);
    } catch (error) {
      console.error('Error al guardar gasto', error);
      alert('Ocurrió un error al registrar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const collectionPercent =
    report.projectedCollection > 0
      ? Math.round((report.realCollected / report.projectedCollection) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header & Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C221E] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#D96B27]" />
            Reporte Financiero
          </h2>
          <p className="text-xs sm:text-sm text-[#6E615A] mt-0.5">
            Balance de caja, recaudo real vs. proyectado, gastos operativos y ganancia neta en Soles (S/.).
          </p>
        </div>

        {/* Period Pills */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-[#E6DCD2] warm-shadow">
          <button
            onClick={() => onPeriodChange('WEEKLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'WEEKLY'
                ? 'terracotta-gradient text-white shadow-xs'
                : 'text-[#6E615A] hover:text-[#2C221E]'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => onPeriodChange('BIWEEKLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'BIWEEKLY'
                ? 'terracotta-gradient text-white shadow-xs'
                : 'text-[#6E615A] hover:text-[#2C221E]'
            }`}
          >
            Quincenal
          </button>
          <button
            onClick={() => onPeriodChange('MONTHLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'MONTHLY'
                ? 'terracotta-gradient text-white shadow-xs'
                : 'text-[#6E615A] hover:text-[#2C221E]'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {/* Period Banner info */}
      <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#E6DCD2] flex items-center justify-between text-xs text-[#6E615A]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#E89D4F]" />
          <span>Período evaluado: <strong className="text-[#2C221E]">{report.periodLabel}</strong></span>
        </div>
        <div>
          <span>{report.startDate} — {report.endDate}</span>
        </div>
      </div>

      {/* Primary KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capital Invertido */}
        <div className="bg-white rounded-3xl p-5 border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E615A]">Capital Invertido</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2C221E]">
            {formatCurrency(report.capitalInvested)}
          </p>
          <span className="text-[11px] text-[#6E615A] block">
            Dinero prestado en el período
          </span>
        </div>

        {/* Card 2: Recaudo Real */}
        <div className="bg-white rounded-3xl p-5 border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E615A]">Recaudo Real</span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF6F2] text-[#2D7A5D] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#2D7A5D]">
            {formatCurrency(report.realCollected)}
          </p>
          <span className="text-[11px] text-[#6E615A] block">
            Efectivo ingresado a caja
          </span>
        </div>

        {/* Card 3: Gastos Operativos */}
        <div className="bg-white rounded-3xl p-5 border border-[#E6DCD2] warm-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E615A]">Gastos Operativos</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center">
              <MinusCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#C84B31]">
            {formatCurrency(report.totalExpenses)}
          </p>
          <span className="text-[11px] text-[#6E615A] block">
            {report.expensesList.length} egresos registrados
          </span>
        </div>

        {/* Card 4: Ganancia Neta */}
        <div className="bg-gradient-to-br from-[#2C221E] to-[#382C27] text-white rounded-3xl p-5 shadow-lg space-y-2 border border-[#4A3B35]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D5C8BC]">Ganancia Neta</span>
            <div className="w-8 h-8 rounded-xl bg-[#E89D4F]/20 text-[#E89D4F] flex items-center justify-center border border-[#E89D4F]/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#E89D4F]">
            {formatCurrency(report.netProfit)}
          </p>
          <span className="text-[11px] text-[#D5C8BC] block">
            Intereses (20%) - Gastos
          </span>
        </div>
      </div>

      {/* Recaudo Real vs. Proyectado Comparison */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6DCD2] warm-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6DCD2]/60 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#D96B27]" />
              Recaudo Real vs. Proyectado
            </h3>
            <p className="text-xs text-[#6E615A]">
              Comparativa del dinero ingresado a caja frente al total esperado.
            </p>
          </div>
          <span className="bg-[#EEF6F2] text-[#2D7A5D] font-extrabold text-sm px-3 py-1 rounded-full border border-[#2D7A5D]/30">
            {collectionPercent}% Cobrado
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-[#E6DCD2] rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#E89D4F] to-[#2D7A5D] h-4 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]">
              <span className="text-[#6E615A] block">Recaudo Real Ingresado:</span>
              <strong className="text-base text-[#2D7A5D] font-black">{formatCurrency(report.realCollected)}</strong>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]">
              <span className="text-[#6E615A] block">Recaudo Proyectado (Total):</span>
              <strong className="text-base text-[#2C221E] font-black">{formatCurrency(report.projectedCollection)}</strong>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]">
              <span className="text-[#6E615A] block">Faltante por Recaudar:</span>
              <strong className="text-base text-[#C84B31] font-black">{formatCurrency(report.remainingToCollect)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Expenses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Expense Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6DCD2] warm-shadow space-y-4">
          <div className="border-b border-[#E6DCD2]/60 pb-3">
            <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2">
              <MinusCircle className="w-5 h-5 text-[#C84B31]" />
              Registrar Gasto Operativo
            </h3>
            <p className="text-xs text-[#6E615A] mt-0.5">
              Gastos de ruta (combustible, transporte, copias, alimentación, etc.).
            </p>
          </div>

          <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Monto del Gasto (S/.):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-[#C84B31]">
                  S/.
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Monto"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-sm font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Categoría:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-semibold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40"
              >
                <option value="COMBUSTIBLE">⛽ Combustible / Gasolina</option>
                <option value="TRANSPORTE">🛵 Pasajes / Transporte</option>
                <option value="IMPRESIONES">📄 Impresiones / Papelería</option>
                <option value="ALIMENTACION">🍲 Alimentación / Refrigerio</option>
                <option value="OTROS">📦 Otros Gastos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Descripción / Detalle:
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del gasto"
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-[#C84B31] text-white font-extrabold text-xs shadow-md hover:bg-[#AA3D26] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Guardar Gasto Operativo</span>
            </button>
          </form>
        </div>

        {/* Expense History Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#E6DCD2] warm-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCD2]/60 pb-3">
            <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#6E615A]" />
              Gastos Registrados ({report.expensesList.length})
            </h3>
            <span className="text-xs font-bold text-[#C84B31]">
              Total: {formatCurrency(report.totalExpenses)}
            </span>
          </div>

          {report.expensesList.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6E615A]">
              No hay gastos registrados en este período.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {report.expensesList.map((exp: OperationalExpense) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FDF2F0]/60 border border-[#C84B31]/20 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#2C221E]">
                        {exp.description}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#C84B31] border border-[#C84B31]/30">
                        {exp.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6E615A] block">
                      {formatDatePE(exp.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <strong className="text-[#C84B31] text-sm font-extrabold">
                      -{formatCurrency(exp.amount)}
                    </strong>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg hover:bg-white text-[#C84B31] transition-all"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
