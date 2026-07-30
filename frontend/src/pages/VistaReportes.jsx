import React, { useState } from 'react';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import { BarChart3, Plus, Trash2, Receipt } from 'lucide-react';

export function VistaReportes({ report, period = 'WEEKLY', onPeriodChange, onAddExpense, onDeleteExpense }) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('OTROS');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddExpense(amount, category, description);
      setAmount(0);
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!report) {
    return (
      <div className="text-center py-20 text-xs font-semibold text-[#6E615A]">
        Cargando reporte financiero...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#2C221E]">
              Reporte Financiero De Ingresos y Egresos
            </h2>
            <p className="text-xs text-[#6E615A]">
              Análisis de ingresos, gastos y ganancias netas por período seleccionado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-2xl border border-[#E6DCD2]">
          <button
            onClick={() => onPeriodChange('WEEKLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'WEEKLY'
                ? 'terracotta-gradient text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => onPeriodChange('BIWEEKLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'BIWEEKLY'
                ? 'terracotta-gradient text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-white'
            }`}
          >
            Quincenal
          </button>
          <button
            onClick={() => onPeriodChange('MONTHLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'MONTHLY'
                ? 'terracotta-gradient text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-white'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Cobranza Real Recaudada
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#2D7A5D]">
            {formatCurrency(report.realCollected)}
          </div>
          <p className="text-[11px] text-[#6E615A]">
            Ingreso real recaudado
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Ganancia Bruta
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#D96B27]">
            {formatCurrency(report.interestCollected)}
          </div>
          <p className="text-[11px] text-[#6E615A]">
            Interés bruto correspondiente
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Gastos Operativos
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#C84B31]">
            {formatCurrency(report.totalExpenses)}
          </div>
          <p className="text-[11px] text-[#C84B31] font-semibold">
            {(report.expensesList || []).length} egresos registrados
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Ganancia Neta Limpia
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#2C221E]">
            {formatCurrency(report.netProfit)}
          </div>
          <p className="text-[11px] text-[#2D7A5D] font-bold">
            Interés bruto - Gastos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-4">
          <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2 border-b border-[#E6DCD2] pb-3">
            <Receipt className="w-4 h-4 text-[#D96B27]" />
            <span>Registrar Gasto Operativo</span>
          </h3>

          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Monto del Gasto (S/.):
              </label>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="25"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Categoría:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              >
                <option value="COMBUSTIBLE">Combustible / Moto</option>
                <option value="TRANSPORTE">Pasajes / Transporte</option>
                <option value="ALIMENTACION">Alimentación</option>
                <option value="IMPRESIONES">Impresiones / Papelería</option>
                <option value="OTROS">Otros Gastos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Descripción:
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del gasto"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl terracotta-gradient text-white font-extrabold text-xs shadow-xs hover:brightness-110 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Agregar Gasto'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-4">
          <h3 className="font-extrabold text-base text-[#2C221E] flex items-center justify-between border-b border-[#E6DCD2] pb-3">
            <span>Lista de Gastos Registrados</span>
            <span className="text-xs font-normal text-[#6E615A]">
              Total: {formatCurrency(report.totalExpenses)}
            </span>
          </h3>

          {(report.expensesList || []).length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6E615A]">
              No hay egresos registrados en este período.
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {report.expensesList.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-[#2C221E] block font-bold">
                      {exp.description}
                    </strong>
                    <span className="text-[#6E615A] text-[11px]">
                      {exp.category} • {formatDatePE(exp.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <strong className="text-[#C84B31] font-extrabold text-sm">
                      -{formatCurrency(exp.amount)}
                    </strong>

                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-xl text-[#6E615A] hover:bg-[#FDF2F0] hover:text-[#C84B31] transition-all"
                      title="Eliminar Gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
}
