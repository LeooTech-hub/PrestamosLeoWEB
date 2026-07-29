import React, { useState, useEffect } from 'react';
import { formatCurrency, calculate20PercentLoan } from '../utils/loanHelpers';
import { X, Calendar, FileText, CheckCircle2, Calculator } from 'lucide-react';

export function EditLoanModal({ loan, isOpen, onClose, onConfirmEditLoan }) {
  const [capital, setCapital] = useState(500);
  const [paymentDays, setPaymentDays] = useState(20);
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      setCapital(loan.capital);
      setPaymentDays(loan.paymentDays);
      setStartDate(loan.startDate);
      setNotes(loan.notes || '');
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const calculated = calculate20PercentLoan(capital || 0, paymentDays || 20);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capital || capital <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirmEditLoan(loan.id, {
        capital,
        paymentDays,
        startDate,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden">
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
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Monto del Capital (S/.):
            </label>
            <input
              type="number"
              required
              min={50}
              step={50}
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Días de Pago Acordados:
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 15, 20, 30].map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setPaymentDays(days)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    paymentDays === days
                      ? 'terracotta-gradient text-white border-transparent'
                      : 'bg-[#FAF8F5] text-[#2C221E] border-[#E6DCD2] hover:bg-[#FDF3ED]'
                  }`}
                >
                  {days} Días
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Fecha de Inicio:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#FDF3ED] rounded-2xl border border-[#D96B27]/20 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6E615A]">Interés (20% Fijo):</span>
              <strong className="text-[#D96B27]">{formatCurrency(calculated.interestAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E615A]">Total a Cobrar:</span>
              <strong className="text-[#2C221E]">{formatCurrency(calculated.totalToPay)}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#D96B27]/10 font-bold">
              <span className="text-[#2C221E]">Cuota Diaria Estimada:</span>
              <span className="text-[#2D7A5D]">{formatCurrency(calculated.dailyPaymentAmount)} / día</span>
            </div>
          </div>

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
                placeholder="Observaciones..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="border-t border-[#E6DCD2] pt-4 mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-xs hover:brightness-110"
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
