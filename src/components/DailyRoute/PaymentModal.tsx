'use client';

import React, { useState } from 'react';
import { Loan } from '@/types';
import { formatCurrency, generateWhatsAppMessage } from '@/services/loanService';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, DollarSign, MessageCircle } from 'lucide-react';

interface PaymentModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (
    loanId: string,
    amount: number,
    notes?: string,
    lateFee?: number
  ) => Promise<{ updatedLoan: Loan }>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  loan,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  const [paymentType, setPaymentType] = useState<'FULL' | 'CUSTOM'>('FULL');
  const [customAmount, setCustomAmount] = useState<number>(loan?.dailyPaymentAmount || 0);
  const [lateFee, setLateFee] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedWhatsAppUrl, setCompletedWhatsAppUrl] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  const targetAmount = paymentType === 'FULL' ? loan.dailyPaymentAmount : customAmount;

  const handleRegister = async () => {
    if (!targetAmount || targetAmount <= 0) {
      alert('Por favor ingrese un monto de pago válido');
      return;
    }

    try {
      setIsSubmitting(true);
      const { updatedLoan } = await onConfirmPayment(loan.id, targetAmount, notes, lateFee || 0);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.5 },
          colors: ['#2D7A5D', '#E89D4F', '#D96B27'],
        });
      } catch (err) {
        console.log('Confetti error', err);
      }

      // Generate WhatsApp link
      const waUrl = generateWhatsAppMessage({
        clientName: updatedLoan.clientName,
        phone: updatedLoan.clientPhone,
        paymentAmount: targetAmount + (lateFee || 0),
        remainingAmount: updatedLoan.remainingAmount,
        totalToPay: updatedLoan.totalToPay,
        paidDaysCount: updatedLoan.paidDaysCount,
        totalPaymentDays: updatedLoan.paymentDays,
      });

      setCompletedWhatsAppUrl(waUrl);
    } catch (error) {
      console.error('Error en el pago', error);
      alert('Ocurrió un error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setCompletedWhatsAppUrl(null);
    setNotes('');
    setPaymentType('FULL');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#26221F] rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow-lg relative overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#3D352E] pb-4">
          <div>
            <span className="text-xs font-bold text-[#D96B27] dark:text-[#E07A5F] uppercase tracking-wider">
              Cobro en Ruta (Perú S/.)
            </span>
            <h3 className="text-lg font-extrabold text-[#2C221E] dark:text-[#EAE0D5]">
              {loan.clientName}
            </h3>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedWhatsAppUrl ? (
          /* Payment Success */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-[#EEF6F2] dark:bg-[#3D9970]/20 text-[#2D7A5D] dark:text-[#3D9970] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#EEF6F2]/50 dark:ring-[#3D9970]/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#2C221E] dark:text-[#EAE0D5]">¡Pago Registrado!</h4>
              <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-1">
                Recaudados <strong className="text-[#2D7A5D] dark:text-[#3D9970] font-bold">{formatCurrency(targetAmount)}</strong> correctamente.
              </p>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-4 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6E615A] dark:text-[#C2B29F]">Saldo restante:</span>
                <strong className="text-[#2C221E] dark:text-[#EAE0D5]">{formatCurrency(Math.max(0, loan.remainingAmount - targetAmount))}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E615A] dark:text-[#C2B29F]">Días pagados:</span>
                <strong className="text-[#2D7A5D] dark:text-[#3D9970]">
                  {Math.min(loan.paymentDays, loan.paidDaysCount + 1)} de {loan.paymentDays} días
                </strong>
              </div>
            </div>

            <a
              href={completedWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#1EBE57] transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar Recibo por WhatsApp</span>
            </a>

            <button
              onClick={handleCloseModal}
              className="w-full py-2.5 text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5]"
            >
              Cerrar y Continuar Ruta
            </button>
          </div>
        ) : (
          /* Payment Form */
          <div className="py-5 space-y-4">
            {/* Loan info */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-3.5 text-xs flex justify-between items-center">
              <div>
                <span className="text-[#6E615A] dark:text-[#C2B29F] block">Plazo / Progreso:</span>
                <strong className="text-[#2C221E] dark:text-[#EAE0D5]">
                  {loan.paymentDays} Días ({loan.paidDaysCount}/{loan.paymentDays} días)
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[#6E615A] dark:text-[#C2B29F] block">Saldo pendiente:</span>
                <strong className="text-[#C84B31]">{formatCurrency(loan.remainingAmount)}</strong>
              </div>
            </div>

            {/* Select Payment Type */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-2">
                Tipo de Pago:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('FULL')}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                    paymentType === 'FULL'
                      ? 'sage-gradient text-white border-transparent shadow-sm'
                      : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] border-[#E6DCD2] dark:border-[#3D352E]'
                  }`}
                >
                  <span>Monto Diario Completo</span>
                  <span className="block text-[11px] opacity-90 mt-0.5">
                    {formatCurrency(loan.dailyPaymentAmount)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('CUSTOM')}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                    paymentType === 'CUSTOM'
                      ? 'amber-gradient text-white border-transparent shadow-sm'
                      : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] border-[#E6DCD2] dark:border-[#3D352E]'
                  }`}
                >
                  <span>Abono Parcial</span>
                  <span className="block text-[11px] opacity-90 mt-0.5">Monto diferente</span>
                </button>
              </div>
            </div>

            {/* Custom Amount */}
            {paymentType === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                  Ingrese Valor del Abono (S/.):
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={loan.remainingAmount}
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                    required
                  />
                </div>
              </div>
            )}

            {/* Mora / Penalidad */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                Mora <span className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] font-normal">(Opcional)</span>:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={lateFee || ''}
                onChange={(e) => setLateFee(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs font-bold text-[#C84B31] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/40"
              />
            </div>

            {lateFee > 0 && (
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl text-xs space-y-1 font-semibold text-[#2C221E] dark:text-[#EAE0D5]">
                <div className="flex justify-between text-[#6E615A] dark:text-[#C2B29F]">
                  <span>Cuota Principal:</span>
                  <span>{formatCurrency(targetAmount)}</span>
                </div>
                <div className="flex justify-between text-[#C84B31]">
                  <span>Mora / Penalidad:</span>
                  <span>+{formatCurrency(lateFee)}</span>
                </div>
                <div className="flex justify-between font-extrabold border-t border-[#E6DCD2] dark:border-[#3D352E] pt-1 text-[#2D7A5D] dark:text-[#3D9970]">
                  <span>Total Cobrado:</span>
                  <span>{formatCurrency(targetAmount + lateFee)}</span>
                </div>
              </div>
            )}

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                Nota o Comentario (Opcional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas del cobro"
                className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] font-bold text-xs hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRegister}
                className="flex-1 py-3 rounded-2xl sage-gradient text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
