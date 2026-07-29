'use client';

import React, { useState, useEffect } from 'react';
import { Loan } from '@/types';
import { calculate20PercentLoan, formatCurrency, formatDatePE } from '@/services/loanService';
import { X, CheckCircle2, DollarSign, Calendar, CalendarCheck, Percent, TrendingUp } from 'lucide-react';

interface EditLoanModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEditLoan: (
    id: string,
    data: { capital: number; paymentDays: number; startDate: string; notes?: string }
  ) => Promise<void>;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  loan,
  isOpen,
  onClose,
  onConfirmEditLoan,
}) => {
  if (!isOpen || !loan) return null;

  const [capital, setCapital] = useState<number>(loan.capital);
  const [paymentDaysInput, setPaymentDaysInput] = useState<string>(String(loan.paymentDays));
  const [startDate, setStartDate] = useState<string>(loan.startDate);
  const [notes, setNotes] = useState<string>(loan.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (loan) {
      setCapital(loan.capital);
      setPaymentDaysInput(String(loan.paymentDays));
      setStartDate(loan.startDate);
      setNotes(loan.notes || '');
    }
  }, [loan]);

  const daysPresets = [10, 15, 20, 30];
  const parsedPaymentDays = Math.max(1, parseInt(paymentDaysInput, 10) || 1);

  // Compute due date: startDate + parsedPaymentDays
  const computeDueDate = (): string => {
    if (!startDate || !parsedPaymentDays) return '';
    const start = new Date(startDate);
    const due = new Date(start);
    due.setDate(due.getDate() + parsedPaymentDays);
    return due.toISOString().split('T')[0];
  };

  const dueDate = computeDueDate();
  const breakdown = calculate20PercentLoan(capital, parsedPaymentDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!capital || capital <= 0) {
      alert('Por favor ingrese un monto de capital válido');
      return;
    }
    if (!parsedPaymentDays || parsedPaymentDays <= 0) {
      alert('Por favor ingrese un número válido de días de pago');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmEditLoan(loan.id, {
        capital,
        paymentDays: parsedPaymentDays,
        startDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Error al editar préstamo', error);
      alert('Ocurrió un error al actualizar las condiciones del préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
          <div>
            <span className="text-xs font-bold text-[#D96B27] uppercase tracking-wider">
              Edición de Condiciones del Préstamo
            </span>
            <h3 className="text-lg font-extrabold text-[#2C221E]">
              {loan.clientName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Capital Input */}
          <div>
            <label className="block text-xs font-semibold text-[#6E615A] mb-1">
              Monto Prestado en Soles (S/.):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-[#D96B27]">
                S/.
              </span>
              <input
                type="number"
                step="10"
                min="10"
                value={capital || ''}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full pl-11 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-base font-extrabold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                required
              />
            </div>
          </div>

          {/* Días de pago acordados */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#6E615A]">
              Días de Pago Acordados:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {daysPresets.map((days) => {
                const isSelected = parsedPaymentDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setPaymentDaysInput(String(days))}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#2C221E] text-white border-[#2C221E] shadow-sm'
                        : 'bg-[#FAF8F5] text-[#6E615A] border-[#E6DCD2] hover:bg-[#F5F0EB]'
                    }`}
                  >
                    {days} Días
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                O ingrese días personalizados (ej. 12, 18, 24 días):
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={paymentDaysInput}
                onChange={(e) => setPaymentDaysInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Fecha de Inicio:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Vencimiento (+{parsedPaymentDays} días):
              </label>
              <div className="px-3 py-2 bg-[#EEF6F2] border border-[#2D7A5D]/30 rounded-xl text-xs font-black text-[#2D7A5D]">
                {formatDatePE(dueDate)}
              </div>
            </div>
          </div>

          {/* Live Recalculated Breakdown */}
          <div className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#6E615A]">Interés (20%):</span>
              <strong className="text-[#E89D4F]">+{formatCurrency(breakdown.interestAmount)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6E615A]">Total a Cancelar:</span>
              <strong className="text-[#2C221E] font-black text-sm">{formatCurrency(breakdown.totalToPay)}</strong>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#E6DCD2]">
              <span className="text-[#6E615A] font-semibold">Nuevo Cobro Diario Sugerido:</span>
              <strong className="text-[#D96B27] font-black text-sm">
                {formatCurrency(breakdown.dailyPaymentAmount)} / día
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] mb-1">
              Notas / Observaciones:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] text-[#6E615A] font-bold text-xs hover:bg-[#FAF8F5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Préstamo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
