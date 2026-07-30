import React, { useState, useEffect } from 'react';
import { formatCurrency, generateWhatsAppMessage } from '../utils/loanHelpers';
import { X, DollarSign, Send, CheckCircle2 } from 'lucide-react';

export function PaymentModal({ loan, isOpen, onClose, onConfirmPayment }) {
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (loan) {
      setAmount(loan.dailyPaymentAmount || 0);
      setNotes('');
      setSuccessData(null);
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const result = await onConfirmPayment(loan.id, amount, notes);
      setSuccessData(result);
    } catch (err) {
      console.error('Error registrando pago:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                Registrar Cobro / Abono
              </h3>
              <p className="text-xs text-[#6E615A] font-semibold">
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
                .
              </p>
            </div>

            <a
              href={generateWhatsAppMessage({
                clientName: loan.clientName,
                phone: loan.clientPhone,
                paymentAmount: successData.payment.amount,
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
              Cerrar y Volver a la Ruta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Monto del Abono Diarios (S/.):
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
                  Día Completo ({formatCurrency(loan.dailyPaymentAmount)})
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
                  Liquidación Total ({formatCurrency(loan.remainingAmount)})
                </button>
              </div>

              <input
                type="number"
                required
                min={1}
                step={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

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
