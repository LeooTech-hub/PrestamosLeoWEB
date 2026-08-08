import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Tag, FileText, Calendar } from 'lucide-react';

const CATEGORIES = ['TRANSPORTE', 'ALIMENTACION', 'PAPELERIA', 'COMISIONES', 'OTROS'];

export function EditExpenseModal({ expense, isOpen, onClose, onConfirmEditExpense }) {
  const [amount, setAmount] = useState(() => expense?.amount || '');
  const [category, setCategory] = useState(() => expense?.category || 'OTROS');
  const [description, setDescription] = useState(() => expense?.description || '');
  const [date, setDate] = useState(() => expense?.date || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingresa un monto de gasto válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmEditExpense(expense.id, {
        amount: numAmount,
        category,
        description: description.trim(),
        date,
      });
      onClose();
    } catch (err) {
      console.error('Error al editar gasto:', err);
      alert(err.response?.data?.error || err.message || 'Error al actualizar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow-lg relative overflow-hidden transition-colors duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#332F2C] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F0] dark:bg-[#3D2522] text-[#C84B31] dark:text-[#E57373] flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E] dark:text-[#F3F4F6]">
                Editar Gasto Operativo
              </h3>
              <p className="text-xs text-[#6E615A] dark:text-[#E5E7EB] font-semibold">
                Actualiza el concepto o monto del gasto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#24211E] text-[#6E615A] dark:text-[#E5E7EB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#E89D4F]" />
              Concepto / Descripción:
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#E89D4F]" />
              Categoría:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-xs font-bold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#E89D4F]" />
              Monto del Gasto (S/.):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-extrabold text-[#C84B31] dark:text-[#E57373]">
                S/.
              </span>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-sm font-extrabold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#E89D4F]" />
              Fecha del Gasto:
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-[#E6DCD2] pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A] hover:bg-[#F5F0EB]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl terracotta-gradient text-white text-xs font-extrabold shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
