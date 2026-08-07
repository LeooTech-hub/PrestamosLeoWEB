import React, { useState } from 'react';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import { X, Receipt, Share2, Copy, Check, MessageSquare, AlertCircle } from 'lucide-react';

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  client,
  loan,
}) {
  const [copied, setCopied] = useState(false);

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
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#E6DCD2] warm-shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2C221E] to-[#3D302A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D7A5D]/30 border border-[#2D7A5D]/40 flex items-center justify-center text-[#2D7A5D] shadow-xs">
              <Receipt className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Constancia de Pago
              </h3>
              <p className="text-xs text-[#D5C8BC]">Resumen y envío de comprobante</p>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main Receipt Card */}
          <div className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#2D7A5D] bg-[#EEF6F2] px-2.5 py-1 rounded-full border border-[#2D7A5D]/20">
                📌 CONSTANCIA DE PAGO - PRESTAMOSLEO
              </span>
              {payment.dayNumber && (
                <span className="text-[10px] font-bold text-[#D96B27] bg-[#FDF3ED] px-2 py-0.5 rounded-md border border-[#D96B27]/20">
                  Día {payment.dayNumber}
                </span>
              )}
            </div>

            <div className="pt-1">
              <span className="text-xs text-[#6E615A] block">Cliente</span>
              <strong className="text-[#2C221E] text-base font-extrabold block">
                👤 {clientName}
              </strong>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E6DCD2]/70 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#6E615A] block">Abono Recibido:</span>
                <strong className="text-[#2D7A5D] text-lg font-black block">
                  +{formatCurrency(amount)}
                </strong>
                {lateFee > 0 && (
                  <span className="text-[11px] font-bold text-[#C84B31] block">
                    + Mora: {formatCurrency(lateFee)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-[#6E615A] block">Fecha de Pago:</span>
                <span className="text-xs font-bold text-[#2C221E] block">
                  📅 {formattedDate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#6E615A] block">Detalle / Nota:</span>
                <strong className="text-[#2C221E] block truncate">{notes}</strong>
              </div>
              <div>
                <span className="text-[#6E615A] block">Saldo Pendiente:</span>
                <strong className="text-[#C84B31] block font-bold">
                  {formatCurrency(remainingAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Pre-formatted Message Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6E615A] flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#D96B27]" />
              Mensaje preformateado (WhatsApp):
            </label>
            <div className="bg-white border border-[#E6DCD2] rounded-xl p-3 text-xs text-[#2C221E] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {receiptMessage}
            </div>
          </div>

          {/* Validation Notice for missing phone */}
          {!hasPhone && (
            <div className="bg-[#FDF6EE] border border-[#E89D4F]/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#8C5319]">
              <AlertCircle className="w-4 h-4 text-[#E89D4F] shrink-0 mt-0.5" />
              <span>
                El cliente no tiene un teléfono registrado. Puedes copiar la constancia al portapapeles.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DCD2] flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-[#E6DCD2] hover:bg-[#F5F0EB] text-[#2C221E] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#2D7A5D]" />
                <span className="text-[#2D7A5D]">¡Comprobante Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#D96B27]" />
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
            className="w-full sm:w-auto px-3 py-2.5 text-xs text-[#6E615A] hover:text-[#2C221E] font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
