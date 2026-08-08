import React, { useState } from 'react';
import { formatCurrency, formatDatePE, generateLoanConstanciaMessage } from '../utils/loanHelpers';
import { X, FileText, Copy, Check, MessageSquare, AlertCircle } from 'lucide-react';

export function LoanConstanciaModal({
  isOpen,
  onClose,
  loan,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !loan) return null;

  const clientName = loan.clientName || 'Cliente';
  const clientPhone = loan.clientPhone || '';
  const cleanPhone = clientPhone.replace(/\D/g, '');
  const hasPhone = cleanPhone.length > 0;
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

  const constanciaMessage = generateLoanConstanciaMessage(loan);

  const whatsappUrl = hasPhone
    ? `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(constanciaMessage)}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(constanciaMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  };

  const interestVal = loan.interestAmount != null
    ? loan.interestAmount
    : Number(((loan.capital || 0) * 0.20).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#E6DCD2] warm-shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2C221E] to-[#3D302A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D7A5D]/30 border border-[#2D7A5D]/40 flex items-center justify-center text-[#2D7A5D] shadow-xs">
              <FileText className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Constancia de Préstamo
              </h3>
              <p className="text-xs text-[#D5C8BC]">Resumen y envío del crédito emitido</p>
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
          {/* Main Loan Summary Card */}
          <div className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#2D7A5D] bg-[#EEF6F2] px-2.5 py-1 rounded-full border border-[#2D7A5D]/20">
                📄 CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO
              </span>
            </div>

            <div className="pt-1">
              <span className="text-xs text-[#6E615A] block">Cliente</span>
              <strong className="text-[#2C221E] text-base font-extrabold block">
                👤 {clientName}
              </strong>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E6DCD2]/70 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-[#6E615A] block">Monto Prestado:</span>
                <strong className="text-[#2C221E] text-base font-extrabold block">
                  💰 {formatCurrency(loan.capital)}
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#6E615A] block">Interés / Comisión:</span>
                <strong className="text-[#D96B27] text-base font-extrabold block">
                  📈 {formatCurrency(interestVal)}
                </strong>
              </div>
              <div className="pt-1 border-t border-[#E6DCD2]/50">
                <span className="text-xs text-[#6E615A] block">Monto Total a Pagar:</span>
                <strong className="text-[#2D7A5D] text-base font-black block">
                  💵 {formatCurrency(loan.totalToPay)}
                </strong>
              </div>
              <div className="pt-1 border-t border-[#E6DCD2]/50">
                <span className="text-xs text-[#6E615A] block">Cuota Diaria:</span>
                <strong className="text-[#2C221E] text-sm font-extrabold block">
                  📌 {formatCurrency(loan.dailyPaymentAmount)} ({loan.paymentDays || 20} días)
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#6E615A] block">Fecha de Emisión:</span>
                <strong className="text-[#2C221E] block">📅 {formatDatePE(loan.startDate)}</strong>
              </div>
              <div>
                <span className="text-[#6E615A] block">Fecha de Vencimiento:</span>
                <strong className="text-[#C84B31] block font-bold">📆 {formatDatePE(loan.dueDate)}</strong>
              </div>
            </div>
          </div>

          {/* Pre-formatted Message Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6E615A] flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#2D7A5D]" />
              Mensaje preformateado (WhatsApp):
            </label>
            <div className="bg-white border border-[#E6DCD2] rounded-xl p-3 text-xs text-[#2C221E] font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto select-all">
              {constanciaMessage}
            </div>
          </div>

          {/* Validation Notice for missing phone */}
          {!hasPhone && (
            <div className="bg-[#FDF6EE] border border-[#E89D4F]/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#8C5319]">
              <AlertCircle className="w-4 h-4 text-[#E89D4F] shrink-0 mt-0.5" />
              <span>
                El cliente no tiene un número de teléfono registrado. Puedes copiar el texto de la constancia al portapapeles.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DCD2] flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-[#E6DCD2] hover:bg-[#F5F0EB] text-[#2C221E] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#2D7A5D]" />
                <span className="text-[#2D7A5D]">¡Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#D96B27]" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          {hasPhone && (
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
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
