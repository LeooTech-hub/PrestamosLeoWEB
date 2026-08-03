'use client';

import React, { useState, useEffect } from 'react';
import { ExpenseCategory } from '@/types';
import { X, CheckCircle2, DollarSign, Tag, FileText, Calendar } from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = ['COMBUSTIBLE', 'TRANSPORTE', 'IMPRESIONES', 'ALIMENTACION', 'OTROS'];

interface EditExpenseModalProps {
  expense: {
    id: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEditExpense?: (
    id: string,
    data: { amount?: number; category?: ExpenseCategory; description?: string; date?: string }
  ) => Promise<void>;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onConfirmEditExpense,
}) => {
  const [amount, setAmount] = useState<number | string>(expense?.amount || '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'OTROS');
  const [description, setDescription] = useState<string>(expense?.description || '');
  const [date, setDate] = useState<string>(expense?.date || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setCategory(expense.category);
      setDescription(expense.description);
      setDate(expense.date);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingrese un monto de gasto válido');
      return;
    }

    if (!onConfirmEditExpense) return;

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
      alert('Ocurrió un error al actualizar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                Editar Gasto Operativo
              </h3>
              <p className="text-xs text-[#6E615A] font-semibold">
                Actualiza el concepto o monto del gasto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#E89D4F]" />
              Concepto / Descripción:
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Combustible moto, Papelería..."
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#E89D4F]" />
              Categoría:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#E89D4F]" />
              Monto del Gasto (S/.):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-extrabold text-[#C84B31]">
                S/.
              </span>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#E89D4F]" />
              Fecha del Gasto:
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
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
};
