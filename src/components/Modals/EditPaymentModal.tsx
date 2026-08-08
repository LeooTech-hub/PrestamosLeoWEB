'use client';

import React, { useState } from 'react';
import { Payment } from '@/types';
import { X, CheckCircle2, DollarSign, Calendar, FileText } from 'lucide-react';

interface EditPaymentModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEditPayment?: (
    id: string,
    data: { amount?: number; date?: string; notes?: string }
  ) => Promise<void>;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  payment,
  isOpen,
  onClose,
  onConfirmEditPayment,
}) => {
  const [amount, setAmount] = useState<number | string>(payment?.amount || '');
  const [date, setDate] = useState<string>(payment?.date || '');
  const [notes, setNotes] = useState<string>(payment?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  if (payment && payment.id !== prevId) {
    setPrevId(payment.id);
    setAmount(payment.amount);
    setDate(payment.date || payment.paymentDate || '');
    setNotes(payment.notes || '');
  }

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    if (!onConfirmEditPayment) return;

    setIsSubmitting(true);
    try {
      await onConfirmEditPayment(payment.id, {
        amount: numAmount,
        date,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error al editar pago:', err);
      alert('Ocurrió un error al actualizar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#26221F] rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow-lg relative overflow-hidden transition-colors duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#3D352E] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] dark:bg-[#E07A5F]/15 text-[#D96B27] dark:text-[#E07A5F] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E] dark:text-[#EAE0D5]">
                Editar Abono / Pago
              </h3>
              <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] font-semibold">
                Cliente: {payment.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] mb-1">
              Monto del Abono (S/.):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-extrabold text-[#D96B27] dark:text-[#E07A5F]">
                S/.
              </span>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-sm font-extrabold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:border-[#D96B27] dark:focus:border-[#E07A5F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#E89D4F]" />
              Fecha del Pago:
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs font-semibold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:border-[#D96B27] dark:focus:border-[#E07A5F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#E89D4F]" />
              Observaciones / Nota:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas u observaciones del cobro"
              className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:border-[#D96B27] dark:focus:border-[#E07A5F]"
            />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-[#E6DCD2] dark:border-[#3D352E] pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] hover:bg-[#F5F0EB] dark:hover:bg-[#3D352E]/50"
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
