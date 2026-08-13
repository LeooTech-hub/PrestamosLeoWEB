import React, { useState, useEffect } from 'react';
import { formatCurrency, generateWhatsAppMessage } from '../utils/loanHelpers';
import { X, DollarSign, Send, CheckCircle2 } from 'lucide-react';

export function PaymentModal({ loan, isOpen, onClose, onConfirmPayment }) {
  const [amount, setAmount] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (loan) {
      const defaultAmt = loan.remainingAmount < loan.dailyPaymentAmount ? loan.remainingAmount : (loan.dailyPaymentAmount || 0);
      queueMicrotask(() => {
        setAmount(defaultAmt);
        setLateFee(0);
        setNotes('');
        setSuccessData(null);
      });
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loan?.id || !amount || Number(amount) <= 0) return;
    if (Number(amount) > Number(loan.remainingAmount ?? loan.remaining_amount ?? 0)) {
      alert('El monto supera el saldo restante. Máximo a cobrar: ' + formatCurrency(loan.remainingAmount ?? loan.remaining_amount ?? 0) + '.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onConfirmPayment(loan.id, Number(amount), notes, Number(lateFee) || 0);
      const payment = result?.payment || result;
      const updatedLoan = result?.updatedLoan || result?.loan;
      if (!payment?.amount || !updatedLoan?.id) {
        throw new Error('La respuesta del pago no contiene payment y updatedLoan');
      }
      setSuccessData({ payment, updatedLoan });
      onClose();
    } catch (err) {
      console.error('Error registrando pago:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = loan.status === 'OVERDUE' || (loan.dueDate && new Date(loan.dueDate) < new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow-lg relative overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#332F2C] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E] dark:text-[#F3F4F6]">
                Registrar Cobro / Abono
              </h3>
              <p className="text-xs text-[#6E615A] dark:text-[#E5E7EB] font-semibold">
                Cliente: {loan.clientName} {loan.clientAlias ? `(${loan.clientAlias})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#24211E] text-[#6E615A] dark:text-[#E5E7EB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          <div className="space-y-4 text-center py-2 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#EEF6F2] text-[#2D7A5D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-[#2C221E]">
                ¡Pago Registrado con Éxito!
              </h4>
              <p className="text-xs text-[#6E615A] mt-1">
                Se registró el cobro de{' '}
                <strong className="text-[#2D7A5D]">
                  {formatCurrency(successData.payment.amount)}
                </strong>
                {successData.payment.lateFee > 0 && (
                  <span className="text-[#C84B31] block mt-0.5 font-bold">
                    + Mora: {formatCurrency(successData.payment.lateFee)} (Total: {formatCurrency(successData.payment.amount + successData.payment.lateFee)})
                  </span>
                )}
                .
              </p>
            </div>

            <a
              href={generateWhatsAppMessage({
                clientName: loan.clientName,
                phone: loan.clientPhone,
                paymentAmount: successData.payment.amount + (successData.payment.lateFee || 0),
                remainingAmount: successData.updatedLoan.remainingAmount,
                totalToPay: successData.updatedLoan.totalToPay,
                paidDaysCount: successData.updatedLoan.paidDaysCount,
                totalPaymentDays: successData.updatedLoan.paymentDays,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-extrabold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Comprobante por WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A]"
            >
              Cerrar y Volver
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isOverdue && (
              <div className="p-3 bg-[#FDF2F0] border border-[#C84B31]/30 rounded-2xl text-xs text-[#C84B31] font-bold flex items-center gap-2">
                <span>⚠️ Préstamo Vencido / En Mora. Puedes calcular e ingresar una mora o penalidad adicional.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Monto del Abono Principal (S/.):
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAmount(loan.dailyPaymentAmount)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    amount === loan.dailyPaymentAmount
                      ? 'terracotta-gradient text-white border-transparent'
                      : 'bg-[#FAF8F5] text-[#2C221E] border-[#E6DCD2]'
                  }`}
                >
                  Día ({formatCurrency(loan.dailyPaymentAmount)})
                </button>

                <button
                  type="button"
                  onClick={() => setAmount(loan.remainingAmount)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    amount === loan.remainingAmount
                      ? 'bg-[#2D7A5D] text-white border-transparent'
                      : 'bg-[#FAF8F5] text-[#2C221E] border-[#E6DCD2]'
                  }`}
                >
                  Liquidación ({formatCurrency(loan.remainingAmount)})
                </button>
              </div>

              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={Number(loan.remainingAmount ?? loan.remaining_amount ?? 0)}
                value={amount || ''}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Mora <span className="text-[10px] text-[#6E615A] font-normal">(Opcional)</span>:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={lateFee || ''}
                onChange={(e) => setLateFee(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#C84B31] focus:outline-none focus:border-[#C84B31]"
              />
            </div>

            {Number(lateFee) > 0 && (
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs space-y-1.5 font-semibold text-[#2C221E]">
                <div className="flex justify-between text-[#6E615A]">
                  <span>Cuota Principal:</span>
                  <span>{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between text-[#C84B31]">
                  <span>Mora / Penalidad:</span>
                  <span>+{formatCurrency(Number(lateFee))}</span>
                </div>
                <div className="flex justify-between font-extrabold border-t border-[#E6DCD2] pt-1.5 text-[#2D7A5D]">
                  <span>Total Cobrado:</span>
                  <span>{formatCurrency(Number(amount) + Number(lateFee))}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Observaciones (Opcional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de cobro"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div className="border-t border-[#E6DCD2] pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl terracotta-gradient text-white text-xs font-extrabold shadow-sm hover:brightness-110"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registrando...' : 'Confirmar Cobro'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
