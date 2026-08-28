import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import { X, Calendar, FileText, CheckCircle2, Calculator, Percent, AlertCircle } from 'lucide-react';

function addDays(startISO, days) {
  if (!startISO || !days) return '';
  const d = new Date(startISO);
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split('T')[0];
}

function diffDays(startISO, dueISO) {
  if (!startISO || !dueISO) return 20;
  const start = new Date(startISO).getTime();
  const due = new Date(dueISO).getTime();
  return Math.max(1, Math.round((due - start) / (1000 * 60 * 60 * 24)));
}

export function EditLoanModal({ loan, isOpen, onClose, onConfirmEditLoan }) {
  const [capital, setCapital] = useState(500);
  const [paymentDays, setPaymentDays] = useState(20);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [useCustomCommission, setUseCustomCommission] = useState(false);
  const [commissionInput, setCommissionInput] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      queueMicrotask(() => {
        setCapital(loan.capital || 0);
        const days = loan.paymentDays || 20;
        setPaymentDays(days);
        const start = loan.startDate || new Date().toISOString().split('T')[0];
        setStartDate(start);
        setDueDate(loan.dueDate || addDays(start, days));
        setPenaltyAmount(loan.penaltyAmount || 0);
        setNotes(loan.notes || '');
        if (loan.interestAmount != null && loan.interestAmount !== Math.round((loan.capital || 0) * 0.20)) {
          setUseCustomCommission(true);
          setCommissionInput(String(loan.interestAmount));
        } else {
          setUseCustomCommission(false);
          setCommissionInput('');
        }
      });
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  // Handlers para sincronización bidireccional entre fechas y días
  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (val && paymentDays) {
      setDueDate(addDays(val, paymentDays));
    }
  };

  const handleDueDateChange = (val) => {
    setDueDate(val);
    if (startDate && val) {
      const derivedDays = diffDays(startDate, val);
      setPaymentDays(derivedDays);
    }
  };

  const handleDaysChange = (val) => {
    const rawVal = val === '' ? '' : parseInt(val, 10);
    const numDays = rawVal === '' ? 1 : Math.max(1, Math.min(365, rawVal || 1));
    setPaymentDays(numDays);
    if (startDate) {
      setDueDate(addDays(startDate, numDays));
    }
  };

  // Cálculos en tiempo real
  const capNum = Number(capital) || 0;
  const defaultInterest = Math.round(capNum * 0.20);
  const customCommission = parseFloat(commissionInput) || 0;
  const effectiveInterest = useCustomCommission ? customCommission : defaultInterest;
  const moraNum = Math.max(0, Number(penaltyAmount) || 0);

  const totalToPay = capNum + effectiveInterest + moraNum;
  const dailyPaymentAmount = Math.ceil(totalToPay / (paymentDays || 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capNum || capNum <= 0) return;

    setIsSubmitting(true);
    try {
      // El backend acepta una tasa; este formulario trabaja con un monto de
      // comisión. Enviamos ambos valores para que la edición conserve siempre
      // el interés mostrado, incluso en préstamos antiguos.
      const interestRate = capNum > 0
        ? Number(((effectiveInterest / capNum) * 100).toFixed(6))
        : 0;

      await onConfirmEditLoan(loan.id, {
        capital: capNum,
        amount: capNum,
        amount_borrowed: capNum,
        paymentDays,
        payment_days: paymentDays,
        days_agreed: paymentDays,
        days: paymentDays,
        duration_days: paymentDays,
        startDate,
        start_date: startDate,
        dueDate,
        due_date: dueDate,
        interestRate,
        interest_rate: interestRate,
        commission: useCustomCommission ? customCommission : undefined,
        interest_amount: effectiveInterest,
        interest: effectiveInterest,
        penaltyAmount: moraNum,
        penalty_amount: moraNum,
        mora: moraNum,
        total_amount: totalToPay,
        totalToPay,
        remaining_amount: Math.max(0, totalToPay - (loan.paidAmount || 0)),
        daily_amount: dailyPaymentAmount,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error al actualizar el préstamo:', err);
      alert(err?.response?.data?.error || err?.message || 'No se pudo actualizar el préstamo. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                Editar Préstamo
              </h3>
              <p className="text-xs text-[#6E615A]">
                Cliente: {loan.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Monto del Capital */}
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Monto del Capital (S/.):
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={capital}
              onChange={(e) => setCapital(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          {/* Días de Pago Acordados */}
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Días de Pago Acordados:
            </label>
            <input
              type="number"
              required
              min="1"
              max="365"
              value={paymentDays}
              onChange={(e) => handleDaysChange(e.target.value)}
              placeholder="Número de días (1 - 365)"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          {/* Fechas: Inicio y Vencimiento */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Fecha de Inicio:
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#E89D4F] absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Fecha de Vencimiento:
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#D96B27] absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={startDate || undefined}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>
          </div>
          {dueDate && (
            <p className="text-[10px] text-[#6E615A] text-right font-medium -mt-1">
              Vence: <strong>{formatDatePE(dueDate)}</strong> ({paymentDays} días)
            </p>
          )}

          {/* Comisión / Interés Personalizado */}
          <div className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#6E615A] flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#E89D4F]" />
                Comisión / Interés (S/.):
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseCustomCommission((v) => !v);
                  if (!useCustomCommission && !commissionInput) {
                    setCommissionInput(String(defaultInterest));
                  }
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                  useCustomCommission
                    ? 'bg-[#E89D4F] text-white border-[#E89D4F]'
                    : 'bg-white text-[#6E615A] border-[#E6DCD2] hover:border-[#E89D4F]'
                }`}
              >
                {useCustomCommission ? 'Personalizado ✓' : 'Auto 20%'}
              </button>
            </div>

            {useCustomCommission ? (
              <input
                type="number"
                step="any"
                min="0"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                placeholder="Monto de comisión en S/."
                className="w-full px-3 py-2 bg-white border border-[#E89D4F]/60 rounded-xl text-xs font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            ) : (
              <div className="text-xs text-[#6E615A] flex justify-between">
                <span>Calculado (20% del capital):</span>
                <strong className="text-[#D96B27]">{formatCurrency(defaultInterest)}</strong>
              </div>
            )}
          </div>

          {/* Mora / Cargo Adicional */}
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Mora / Cargo Adicional (S/.):
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={penaltyAmount}
              onChange={(e) => setPenaltyAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="S/. 0 (opcional)"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#C84B31] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          {/* Resumen del Préstamo en Tiempo Real */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2] text-xs space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#6E615A] border-b border-[#E6DCD2]/60 pb-1 mb-1">
              Resumen en Tiempo Real
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A]">Capital:</span>
              <strong className="text-[#2C221E]">{formatCurrency(capNum)}</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#6E615A]">
                {useCustomCommission ? 'Comisión Personalizada:' : 'Interés / Comisión (20%):'}
              </span>
              <strong className="text-[#D96B27]">+{formatCurrency(effectiveInterest)}</strong>
            </div>

            {moraNum > 0 && (
              <div className="flex justify-between items-center text-[#C84B31]">
                <span>Mora / Cargo Adicional:</span>
                <strong className="font-extrabold">+{formatCurrency(moraNum)}</strong>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5 border-t border-[#E6DCD2]/80 font-black">
              <span className="text-[#2C221E]">Total a Cobrar:</span>
              <strong className="text-[#2C221E] text-sm">{formatCurrency(totalToPay)}</strong>
            </div>

            <div className="flex justify-between items-center pt-1 font-extrabold">
              <span className="text-[#6E615A]">Cuota Diaria Estimada:</span>
              <span className="text-[#2D7A5D] text-xs">{formatCurrency(dailyPaymentAmount)} / día</span>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Notas adicionales:
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de cobro"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="border-t border-[#E6DCD2] pt-4 mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A] hover:bg-[#F5F0EB] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl terracotta-gradient text-white text-xs font-extrabold shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Actualizar Préstamo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}