'use client';

import React, { useState } from 'react';
import { Loan } from '@/types';
import { calculateCustomLoan, formatCurrency, formatDatePE } from '@/services/loanService';
import { X, CheckCircle2, CalendarDays, Percent } from 'lucide-react';

/* ─────────────────────────────────────────────── types ── */
interface EditLoanModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEditLoan: (
    id: string,
    data: {
      capital: number;
      amount?: number;
      amount_borrowed?: number;
      interestRate: number;
      interest_rate: number;
      interes?: number;
      interest_amount?: number;
      paymentDays: number;
      payment_days?: number;
      days?: number;
      days_agreed?: number;
      duration_days?: number;
      startDate: string;
      dueDate?: string;
      due_date?: string;
      commission?: number;
      interest?: number;
      penaltyAmount?: number;
      penalty_amount?: number;
      mora?: number;
      total_amount?: number;
      total_to_pay?: number;
      totalPay?: number;
      totalToPay?: number;
      remaining_amount?: number;
      daily_amount?: number;
      daily_payment?: number;
      daily_payment_amount?: number;
      notes?: string;
    }
  ) => Promise<void>;
}

/* ─────────────────────────────────────── helpers ── */
/** YYYY-MM-DD from a Date */
function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function toUTCDate(dateISO: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/** startDate + days → dueDate (YYYY-MM-DD) */
function addDays(startISO: string, days: number): string {
  if (!startISO || !days) return '';
  const d = toUTCDate(startISO);
  if (!d) return '';
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

/** dueDate − startDate → days (integer) */
function diffDays(startISO: string, dueISO: string): number {
  if (!startISO || !dueISO) return 20;
  const start = toUTCDate(startISO)?.getTime();
  const due = toUTCDate(dueISO)?.getTime();
  if (start === undefined || due === undefined) return 20;
  return Math.max(1, Math.round((due - start) / 86_400_000));
}

function getLoanInterestRate(loan: Loan | null): number {
  if (!loan) return 20;
  const explicitRate = Number(loan.interestRate ?? loan.interest_rate ?? loan.interes);
  const interestAmount = Number(loan.interestAmount ?? loan.interest_amount ?? loan.interest ?? 0);
  const capital = Number(loan.capital ?? loan.amount ?? 0);

  if (Number.isFinite(explicitRate) && (explicitRate > 0 || interestAmount <= 0)) {
    return explicitRate;
  }
  if (capital > 0 && interestAmount > 0) {
    return Number(((interestAmount / capital) * 100).toFixed(2));
  }
  return 20;
}

/* ─────────────────────────────────────── component ── */
export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  loan,
  isOpen,
  onClose,
  onConfirmEditLoan,
}) => {
  /* ── local state ── */
  const [capital, setCapital] = useState<number>(loan?.capital || 0);
  const [paymentDaysInput, setPaymentDaysInput] = useState<string>(
    String(loan?.paymentDays || 20)
  );
  const [startDate, setStartDate] = useState<string>(loan?.startDate || '');
  const [dueDateInput, setDueDateInput] = useState<string>(loan?.dueDate || '');
  const [interestRate, setInterestRate] = useState<number>(getLoanInterestRate(loan));
  const [penaltyInput, setPenaltyInput] = useState<string>(String(loan?.penaltyAmount || 0));
  const [notes, setNotes] = useState<string>(loan?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  /* ── sync state when a new loan is opened ── */
  if (loan && loan.id !== prevId) {
    setPrevId(loan.id);
    setCapital(loan.capital);
    setPaymentDaysInput(String(loan.paymentDays || 20));
    setStartDate(loan.startDate);
    setDueDateInput(loan.dueDate || addDays(loan.startDate, loan.paymentDays || 20));
    setInterestRate(getLoanInterestRate(loan));
    setPenaltyInput(String(loan.penaltyAmount || 0));
    setNotes(loan.notes || '');
  }

  if (!isOpen || !loan) return null;

  const parsedPaymentDays = Math.max(1, parseInt(paymentDaysInput, 10) || 1);

  /* ── Handlers for bidirectional date & days sync ── */
  const handleDaysChange = (val: string) => {
    setPaymentDaysInput(val);
    const days = Math.max(1, parseInt(val, 10) || 1);
    if (startDate) {
      setDueDateInput(addDays(startDate, days));
    }
  };

  const handleDueDateChange = (val: string) => {
    setDueDateInput(val);
    if (startDate && val) {
      const days = diffDays(startDate, val);
      setPaymentDaysInput(String(days));
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && parsedPaymentDays) {
      setDueDateInput(addDays(val, parsedPaymentDays));
    }
  };

  /* ── Live summary calculations ── */
  const breakdown = calculateCustomLoan(capital, parsedPaymentDays, interestRate);
  const effectiveInterest = breakdown.interestAmount;
  const moraNum = Math.max(0, parseFloat(penaltyInput) || 0);

  const totalToPay = Number((breakdown.totalToPay + moraNum).toFixed(2));
  const dailyPayment = parsedPaymentDays > 0
    ? Number((totalToPay / parsedPaymentDays).toFixed(2))
    : 0;

  /* ── Computed dueDate for display ── */
  const computedDueDate = dueDateInput || addDays(startDate, parsedPaymentDays);

  /* ── Submit ── */
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
        amount: capital,
        amount_borrowed: capital,
        interestRate,
        interest_rate: interestRate,
        interes: interestRate,
        interest_amount: effectiveInterest,
        paymentDays: parsedPaymentDays,
        payment_days: parsedPaymentDays,
        days: parsedPaymentDays,
        days_agreed: parsedPaymentDays,
        duration_days: parsedPaymentDays,
        startDate,
        dueDate: computedDueDate || undefined,
        due_date: computedDueDate || undefined,
        interest: effectiveInterest,
        penaltyAmount: moraNum,
        penalty_amount: moraNum,
        mora: moraNum,
        total_amount: totalToPay,
        total_to_pay: totalToPay,
        totalPay: totalToPay,
        totalToPay,
        remaining_amount: Number(Math.max(
          0,
          totalToPay - Number(loan.paidAmount ?? loan.paid_amount ?? 0)
        ).toFixed(2)),
        daily_amount: dailyPayment,
        daily_payment: dailyPayment,
        daily_payment_amount: dailyPayment,
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

  /* ── Shared input className ── */
  const inputCls =
    'w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40 focus:border-[#D96B27] dark:focus:border-[#E07A5F]';
  const labelCls = 'block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#26221F] rounded-3xl max-w-lg w-full p-6 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow-lg relative overflow-hidden max-h-[92vh] overflow-y-auto transition-colors duration-300">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#3D352E] pb-4 mb-4">
          <div>
            <span className="text-xs font-bold text-[#D96B27] dark:text-[#E07A5F] uppercase tracking-wider">
              Edición de Condiciones
            </span>
            <h3 className="text-lg font-extrabold text-[#2C221E] dark:text-[#EAE0D5]">
              {loan.clientName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Capital ── */}
          <div>
            <label className={labelCls}>Monto Prestado en Soles (S/.):</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-[#D96B27] dark:text-[#E07A5F]">
                S/.
              </span>
              <input
                type="number"
                step="any"
                min="1"
                value={capital || ''}
                onChange={(e) =>
                  setCapital(e.target.value === '' ? 0 : Number(e.target.value))
                }
                className="w-full pl-11 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-base font-extrabold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                required
              />
            </div>
          </div>

          {/* ── Días de Pago ── */}
          <div>
            <label className={labelCls}>Días de Pago Acordados:</label>
            <input
              type="number"
              min="1"
              max="365"
              value={paymentDaysInput}
              onChange={(e) => handleDaysChange(e.target.value)}
              placeholder="Número de días (1 – 365)"
              className={inputCls}
              required
            />
          </div>

          {/* ── Fechas: Inicio + Vencimiento (ambas editables) ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-[#D96B27] dark:text-[#E07A5F]" />
              <span className="text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wider">
                Fechas del Préstamo
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fecha de Inicio */}
              <div>
                <label className={labelCls}>Fecha de Inicio:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Fecha de Vencimiento — EDITABLE DIRECTAMENTE */}
              <div>
                <label className={labelCls}>
                  Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  value={computedDueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  min={startDate || undefined}
                  className={inputCls}
                  required
                />
                {computedDueDate && (
                  <p className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
                    Vence: {formatDatePE(computedDueDate)} · {parsedPaymentDays} días
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Tasa de interés ── */}
          <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#E89D4F]" />
                <span className="text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wider">
                  Tasa de interés
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInterestRate(20)}
                className="text-[10px] font-black px-2.5 py-1 rounded-full border transition-all cursor-pointer bg-white dark:bg-[#26221F] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:border-[#E89D4F] hover:text-[#E89D4F]"
              >
                Restaurar 20%
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="20"
                className="w-full px-3 pr-9 py-2.5 bg-white dark:bg-[#26221F] border border-[#E89D4F]/50 rounded-xl text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#E89D4F]/40 focus:border-[#E89D4F]"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#E89D4F]">%</span>
            </div>
            <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-2">
              Interés calculado: <strong className="text-[#E89D4F]">{formatCurrency(effectiveInterest)}</strong>
            </p>
          </div>

          {/* ── Mora / Cargo Adicional ── */}
          <div>
            <label className={labelCls}>Mora / Cargo Adicional (S/.):</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#C84B31]">
                S/.
              </span>
              <input
                type="number"
                step="any"
                min="0"
                value={penaltyInput}
                onChange={(e) => setPenaltyInput(e.target.value)}
                placeholder="0.00 (opcional)"
                className="w-full pl-11 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-sm font-bold text-[#C84B31] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40 focus:border-[#C84B31]"
              />
            </div>
          </div>

          {/* ── Resumen en vivo en tiempo real ── */}
          <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-4 text-xs space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A89B92] dark:text-[#6E615A] mb-1 border-b border-[#E6DCD2] dark:border-[#3D352E] pb-1">
              Resumen en Tiempo Real
            </p>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A] dark:text-[#C2B29F]">Capital:</span>
              <strong className="text-[#2C221E] dark:text-[#EAE0D5]">
                {formatCurrency(capital)}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A] dark:text-[#C2B29F]">
                Interés / Comisión ({interestRate}%):
              </span>
              <strong className="text-[#E89D4F]">+{formatCurrency(effectiveInterest)}</strong>
            </div>

            {moraNum > 0 && (
              <div className="flex justify-between items-center text-[#C84B31]">
                <span>Mora / Cargo Adicional:</span>
                <strong className="font-extrabold">+{formatCurrency(moraNum)}</strong>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-[#E6DCD2] dark:border-[#3D352E] pt-2">
              <span className="text-[#6E615A] dark:text-[#C2B29F] font-semibold">
                Total a Cobrar:
              </span>
              <strong className="text-[#2C221E] dark:text-[#EAE0D5] font-black text-sm">
                {formatCurrency(totalToPay)}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A] dark:text-[#C2B29F] font-semibold">
                Cuota Diaria Estimada:
              </span>
              <strong className="text-[#2D7A5D] dark:text-[#3D9970] font-black text-sm">
                {formatCurrency(dailyPayment)} / día
              </strong>
            </div>
          </div>

          {/* ── Notas ── */}
          <div>
            <label className={labelCls}>Notas / Observaciones:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones opcionales..."
              className={inputCls}
            />
          </div>

          {/* ── Actions ── */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] font-bold text-xs hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Préstamo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
