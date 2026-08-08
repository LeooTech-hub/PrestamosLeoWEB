'use client';

import React, { useState } from 'react';
import { Client, Loan, Payment } from '@/types';
import { formatCurrency, formatDatePE } from '@/services/loanService';
import { X, Receipt, Share2, Copy, Check, MessageSquare, AlertCircle } from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  client: Client | null;
  loan: Loan | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  client,
  loan,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !payment) return null;

  const clientName = client?.name || payment.clientName || 'Cliente';
  const clientPhone = client?.phone || '';
  const amount = payment.amount || 0;
  const paymentDate = payment.date || payment.paymentDate || new Date().toISOString().split('T')[0];
  const notes = payment.notes && payment.notes.trim() ? payment.notes.trim() : 'Abono de préstamo';
  
  const lateFee = payment.lateFee || 0;
  const remainingAmount = loan ? loan.remainingAmount : 0;

  const formattedDate = formatDatePE(paymentDate);

  const receiptMessage = `📌 *CONSTANCIA DE PAGO - PRESTAMOSLEO*
👤 *Cliente:* ${clientName}
💵 *Abono Principal:* ${formatCurrency(amount)}${lateFee > 0 ? `\n⚠️ *Mora/Penalidad:* ${formatCurrency(lateFee)}\n💰 *Total Cobrado:* ${formatCurrency(amount + lateFee)}` : ''}
📅 *Fecha:* ${formattedDate}
📝 *Detalle/Nota:* ${notes}
📊 *Saldo Pendiente:* ${formatCurrency(remainingAmount)}
¡Gracias por su pago!`;

  const cleanPhone = clientPhone.replace(/\D/g, '');
  const hasPhone = cleanPhone.length > 0;
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const whatsappUrl = hasPhone
    ? `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(receiptMessage)}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#1E1C1A] rounded-3xl max-w-md w-full border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2C221E] to-[#3D302A] dark:from-[#181614] dark:to-[#242220] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D7A5D]/30 border border-[#2D7A5D]/40 flex items-center justify-center text-[#2D7A5D] shadow-xs">
              <Receipt className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Constancia de Pago
              </h3>
              <p className="text-xs text-[#D5C8BC] dark:text-[#A8A19B]">Resumen y envío de comprobante</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-[#2C221E] dark:text-[#F3F1EF]">
          {/* Main Receipt Card */}
          <div className="bg-[#FAF8F5] dark:bg-[#121110] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#2D7A5D] dark:text-[#3D9970] bg-[#EEF6F2] dark:bg-[#3D9970]/20 px-2.5 py-1 rounded-full border border-[#2D7A5D]/20 dark:border-[#3D9970]/30">
                📌 CONSTANCIA DE PAGO - PRESTAMOSLEO
              </span>
              {payment.dayNumber && (
                <span className="text-[10px] font-bold text-[#D96B27] dark:text-[#E07A5F] bg-[#FDF3ED] dark:bg-[#E07A5F]/15 px-2 py-0.5 rounded-md border border-[#D96B27]/20 dark:border-[#E07A5F]/30">
                  Día {payment.dayNumber}
                </span>
              )}
            </div>

            <div className="pt-1">
              <span className="text-xs text-[#6E615A] dark:text-[#A8A19B] block">Cliente</span>
              <strong className="text-[#2C221E] dark:text-[#F3F1EF] text-base font-extrabold block">
                👤 {clientName}
              </strong>
            </div>

            <div className="bg-white dark:bg-[#1E1C1A] p-3 rounded-xl border border-[#E6DCD2]/70 dark:border-[#332F2C] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#6E615A] dark:text-[#A8A19B] block">Abono Recibido:</span>
                <strong className="text-[#2D7A5D] dark:text-[#3D9970] text-lg font-black block">
                  +{formatCurrency(amount)}
                </strong>
                {lateFee > 0 && (
                  <span className="text-[11px] font-bold text-[#C84B31] block">
                    + Mora: {formatCurrency(lateFee)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-[#6E615A] dark:text-[#A8A19B] block">Fecha de Pago:</span>
                <span className="text-xs font-bold text-[#2C221E] dark:text-[#F3F1EF] block">
                  📅 {formattedDate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#6E615A] dark:text-[#A8A19B] block">Detalle / Nota:</span>
                <strong className="text-[#2C221E] dark:text-[#F3F1EF] block truncate">{notes}</strong>
              </div>
              <div>
                <span className="text-[#6E615A] dark:text-[#A8A19B] block">Saldo Pendiente:</span>
                <strong className="text-[#C84B31] block font-bold">
                  {formatCurrency(remainingAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Pre-formatted Message Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6E615A] dark:text-[#A8A19B] flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#D96B27] dark:text-[#E07A5F]" />
              Mensaje preformateado (WhatsApp):
            </label>
            <div className="bg-white dark:bg-[#121110] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl p-3 text-xs text-[#2C221E] dark:text-[#F3F1EF] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {receiptMessage}
            </div>
          </div>

          {/* Validation Notice for missing phone */}
          {!hasPhone && (
            <div className="bg-[#FDF6EE] dark:bg-[#E89D4F]/15 border border-[#E89D4F]/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#8C5319] dark:text-[#E89D4F]">
              <AlertCircle className="w-4 h-4 text-[#E89D4F] shrink-0 mt-0.5" />
              <span>
                El cliente no tiene un teléfono registrado. Puedes copiar la constancia al portapapeles.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] dark:bg-[#121110] border-t border-[#E6DCD2] dark:border-[#332F2C] flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#1E1C1A] border border-[#E6DCD2] dark:border-[#332F2C] hover:bg-[#F5F0EB] dark:hover:bg-[#332F2C]/50 text-[#2C221E] dark:text-[#F3F1EF] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#2D7A5D] dark:text-[#3D9970]" />
                <span className="text-[#2D7A5D] dark:text-[#3D9970]">¡Comprobante Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
                <span>Copiar Comprobante</span>
              </>
            )}
          </button>

          {hasPhone && (
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-2.5 text-xs text-[#6E615A] dark:text-[#A8A19B] hover:text-[#2C221E] dark:hover:text-[#F3F1EF] font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
