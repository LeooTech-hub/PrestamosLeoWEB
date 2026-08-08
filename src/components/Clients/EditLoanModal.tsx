'use client';

import React, { useState, useCallback } from 'react';
import { Loan } from '@/types';
import { formatCurrency, formatDatePE } from '@/services/loanService';
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
      paymentDays: number;
      startDate: string;
      dueDate?: string;
      commission?: number;
      notes?: string;
    }
  ) => Promise<void>;
}

/* ─────────────────────────────────────── helpers ── */
/** YYYY-MM-DD from a Date */
function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

/** startDate + days → dueDate (YYYY-MM-DD) */
function addDays(startISO: string, days: number): string {
  if (!startISO || !days) return '';
  const d = new Date(startISO);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** dueDate − startDate → days (integer) */
function diffDays(startISO: string, dueISO: string): number {
  if (!startISO || !dueISO) return 0;
  const start = new Date(startISO).getTime();
  const due = new Date(dueISO).getTime();
  return Math.max(1, Math.round((due - start) / 86_400_000));
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
  const [commissionInput, setCommissionInput] = useState<string>('');
  const [useCustomCommission, setUseCustomCommission] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(loan?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  /* ── sync state when a new loan is opened ── */
  if (loan && loan.id !== prevId) {
    setPrevId(loan.id);
    setCapital(loan.capital);
    setPaymentDaysInput(String(loan.paymentDays));
    setStartDate(loan.startDate);
    setDueDateInput(loan.dueDate);
    setNotes(loan.notes || '');
    setCommissionInput('');
    setUseCustomCommission(false);
  }

  if (!isOpen || !loan) return null;

  const parsedPaymentDays = Math.max(1, parseInt(paymentDaysInput, 10) || 1);

  /* ── Handlers for bidirectional sync ── */
  const handleDaysChange = useCallback(
    (val: string) => {
      setPaymentDaysInput(val);
      const days = Math.max(1, parseInt(val, 10) || 1);
      if (startDate) {
        setDueDateInput(addDays(startDate, days));
      }
    },
    [startDate]
  );

  const handleDueDateChange = useCallback(
    (val: string) => {
      setDueDateInput(val);
      if (startDate && val) {
        const days = diffDays(startDate, val);
        setPaymentDaysInput(String(days));
      }
    },
    [startDate]
  );

  const handleStartDateChange = useCallback(
    (val: string) => {
      setStartDate(val);
      // Recalculate dueDate keeping days fixed
      if (val && parsedPaymentDays) {
        setDueDateInput(addDays(val, parsedPaymentDays));
      }
    },
    [parsedPaymentDays]
  );

  /* ── Live summary calculations ── */
  const defaultInterest = Math.round(capital * 0.2);
  const customCommission = parseFloat(commissionInput) || 0;
  const effectiveInterest = useCustomCommission ? customCommission : defaultInterest;
  const totalToPay = capital + effectiveInterest;
  const dailyPayment = parsedPaymentDays > 0 ? totalToPay / parsedPaymentDays : 0;

  /* ── Computed dueDate for display (fallback to derived if blank) ── */
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
        paymentDays: parsedPaymentDays,
        startDate,
        dueDate: computedDueDate || undefined,
        commission: useCustomCommission ? customCommission : undefined,
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
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] transition-colors"
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

              {/* Fecha de Vencimiento / Fin — EDITABLE */}
              <div>
                <label className={labelCls}>
                  Fecha de Vencimiento / Fin:
                </label>
                <input
                  type="date"
                  value={computedDueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  min={startDate || undefined}
                  className={inputCls}
                />
                {computedDueDate && (
                  <p className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
                    {formatDatePE(computedDueDate)} · {parsedPaymentDays} días
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Comisión / Interés Personalizado ── */}
          <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#E89D4F]" />
                <span className="text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wider">
                  Comisión / Interés
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseCustomCommission((v) => !v);
                  if (!useCustomCommission && !commissionInput) {
                    setCommissionInput(String(defaultInterest));
                  }
                }}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                  useCustomCommission
                    ? 'bg-[#E89D4F] text-white border-[#E89D4F]'
                    : 'bg-white dark:bg-[#26221F] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:border-[#E89D4F] hover:text-[#E89D4F]'
                }`}
              >
                {useCustomCommission ? 'Personalizado ✓' : 'Auto (20%)'}
              </button>
            </div>

            {useCustomCommission ? (
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#E89D4F]">
                  S/.
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                  placeholder="Ingrese comisión personalizada"
                  className="w-full pl-11 pr-3 py-2.5 bg-white dark:bg-[#26221F] border border-[#E89D4F]/50 rounded-xl text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#E89D4F]/40 focus:border-[#E89D4F]"
                />
              </div>
            ) : (
              <p className="text-xs text-[#6E615A] dark:text-[#C2B29F]">
                Se aplicará el interés estándar del{' '}
                <strong className="text-[#E89D4F]">20%</strong> sobre el capital
                prestado:{' '}
                <strong className="text-[#2C221E] dark:text-[#EAE0D5]">
                  {formatCurrency(defaultInterest)}
                </strong>
              </p>
            )}
          </div>

          {/* ── Resumen en vivo ── */}
          <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-4 text-xs space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A89B92] dark:text-[#6E615A] mb-1">
              Resumen del Préstamo
            </p>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A] dark:text-[#C2B29F]">Capital:</span>
              <strong className="text-[#2C221E] dark:text-[#EAE0D5]">
                {formatCurrency(capital)}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A] dark:text-[#C2B29F]">
                {useCustomCommission ? 'Comisión Personalizada:' : 'Interés (20%):'}
              </span>
              <strong className="text-[#E89D4F]">+{formatCurrency(effectiveInterest)}</strong>
            </div>

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
              <strong className="text-[#D96B27] dark:text-[#E07A5F] font-black text-sm">
                {formatCurrency(Math.ceil(dailyPayment))} / día
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
              className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] font-bold text-xs hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
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
