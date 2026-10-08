'use client';

import React, { useState } from 'react';
import { Loan } from '@/types';
import {
  formatCurrency,
  formatDatePE,
  formatPaymentAmount,
  formatScheduleAmount,
  getLoanPaymentTerms,
  generateLoanConstanciaMessage,
  generateWeeklyPaymentSchedule,
} from '@/services/loanService';
import { X, FileText, Copy, Check, MessageSquare, AlertCircle, Calendar } from 'lucide-react';

interface LoanConstanciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

export const LoanConstanciaModal: React.FC<LoanConstanciaModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !loan) return null;

  const clientName = loan.clientName || loan.client_name || (loan as any).name || 'Cliente';
  const clientPhone = loan.clientPhone || (loan as any).phone || '';
  const opNumber = loan.operationNumber || loan.operation_number || (loan as any).loan_operation_number;
  const cleanPhone = clientPhone.replace(/\D/g, '');
  const hasPhone = cleanPhone.length > 0;
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

  const constanciaMessage = generateLoanConstanciaMessage(loan);
  const paymentTerms = getLoanPaymentTerms(loan);
  const scheduleResult = generateWeeklyPaymentSchedule(loan);

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

  const cap = loan.capital != null ? loan.capital : ((loan as any).amount != null ? (loan as any).amount : ((loan as any).amount_borrowed != null ? (loan as any).amount_borrowed : 0));
  const interestVal = loan.interestAmount != null
    ? loan.interestAmount
    : ((loan as any).interest_amount != null ? (loan as any).interest_amount : Number(((Number(cap) || 0) * 0.20).toFixed(2)));
  const totalVal = loan.totalToPay ?? (loan as any).totalAmount ?? (loan as any).total_amount ?? (loan as any).total_to_pay ?? ((Number(cap) || 0) + (Number(interestVal) || 0) + (Number(loan.penaltyAmount || 0)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#26221F] rounded-3xl max-w-md sm:max-w-lg w-full border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
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
          <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black text-[#2D7A5D] dark:text-[#3D9970] bg-[#EEF6F2] dark:bg-[#3D9970]/20 px-2.5 py-1 rounded-full border border-[#2D7A5D]/20 dark:border-[#3D9970]/30">
                📄 CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO
              </span>
              {opNumber && (
                <span className="font-mono text-xs font-extrabold text-[#D96B27] dark:text-[#E07A5F] bg-white dark:bg-[#26221F] px-2.5 py-1 rounded-lg border border-[#E6DCD2] dark:border-[#3D352E]">
                  Operación: {opNumber}
                </span>
              )}
            </div>

            <div className="pt-1 flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs text-[#6E615A] dark:text-[#C2B29F] block">Cliente</span>
                <strong className="text-[#2C221E] dark:text-[#EAE0D5] text-base font-extrabold block">
                  👤 {clientName}
                </strong>
              </div>
              {opNumber && (
                <div className="text-right">
                  <span className="text-xs text-[#6E615A] dark:text-[#C2B29F] block">Número de Operación</span>
                  <strong className="font-mono text-[#D96B27] dark:text-[#E07A5F] text-sm font-extrabold block">
                    {opNumber}
                  </strong>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#26221F] p-3 rounded-xl border border-[#E6DCD2]/70 dark:border-[#3D352E] grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-[#6E615A] dark:text-[#C2B29F] block">Monto Prestado:</span>
                <strong className="text-[#2C221E] dark:text-[#EAE0D5] text-base font-extrabold block">
                  💰 {formatCurrency(cap)}
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#6E615A] dark:text-[#C2B29F] block">Interés / Comisión:</span>
                <strong className="text-[#D96B27] dark:text-[#E07A5F] text-base font-extrabold block">
                  📈 {formatCurrency(interestVal)}
                </strong>
              </div>
              <div className="pt-1 border-t border-[#E6DCD2]/50 dark:border-[#3D352E]">
                <span className="text-xs text-[#6E615A] dark:text-[#C2B29F] block">Monto Total a Pagar:</span>
                <strong className="text-[#2D7A5D] dark:text-[#3D9970] text-base font-black block">
                  💵 {formatCurrency(totalVal)}
                </strong>
              </div>
              <div className="pt-1 border-t border-[#E6DCD2]/50 dark:border-[#3D352E]">
                <span className="text-xs text-[#6E615A] dark:text-[#C2B29F] block">{paymentTerms.label}:</span>
                <strong className="text-[#2C221E] dark:text-[#EAE0D5] text-sm font-extrabold block">
                  📌 {formatScheduleAmount(paymentTerms.amount)}{paymentTerms.frequency === 'AGREED_DATE' ? '' : ' (' + paymentTerms.periods + ' ' + paymentTerms.unit + ')'}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              {opNumber && (
                <div>
                  <span className="text-[#6E615A] dark:text-[#C2B29F] block">N° Operación:</span>
                  <strong className="font-mono text-[#D96B27] dark:text-[#E07A5F] block font-bold">{opNumber}</strong>
                </div>
              )}
              <div>
                <span className="text-[#6E615A] dark:text-[#C2B29F] block">Fecha de Emisión:</span>
                <strong className="text-[#2C221E] dark:text-[#EAE0D5] block">📅 {formatDatePE(loan.startDate || loan.start_date || (loan as any).fecha_inicio)}</strong>
              </div>
              <div>
                <span className="text-[#6E615A] dark:text-[#C2B29F] block">Fecha de Vencimiento:</span>
                <strong className="text-[#C84B31] block font-bold">📆 {formatDatePE(loan.dueDate || loan.due_date || (loan as any).fecha_vencimiento)}</strong>
              </div>
            </div>
          </div>

          {/* Sección Cronograma de Pagos */}
          {(scheduleResult.isWeekly || (scheduleResult.schedule && scheduleResult.schedule.length > 0) || scheduleResult.hasInconsistency) && (
            <div className="bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#D96B27]/10 border border-[#D96B27]/20 flex items-center justify-center text-[#D96B27]">
                    <Calendar className="w-4 h-4 text-[#D96B27]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#2C221E] dark:text-[#EAE0D5] uppercase tracking-wider">
                      Cronograma de pagos
                    </h4>
                    <span className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] block">
                      {scheduleResult.isWeekly ? `Frecuencia semanal · ${scheduleResult.schedule.length} cuotas` : 'Fechas programadas de amortización'}
                    </span>
                  </div>
                </div>
                {scheduleResult.schedule.length > 0 && (
                  <span className="text-[11px] font-extrabold text-[#2D7A5D] dark:text-[#3D9970] bg-[#EEF6F2] dark:bg-[#3D9970]/20 px-2.5 py-0.5 rounded-full border border-[#2D7A5D]/20 dark:border-[#3D9970]/30">
                    {scheduleResult.schedule.length} {scheduleResult.schedule.length === 1 ? 'cuota' : 'cuotas'}
                  </span>
                )}
              </div>

              {scheduleResult.hasInconsistency && (
                <div className="bg-[#FDF6EE] dark:bg-[#E89D4F]/10 border border-[#E89D4F]/40 p-3 rounded-xl flex items-start gap-2 text-xs text-[#8C5319] dark:text-[#E89D4F]">
                  <AlertCircle className="w-4 h-4 text-[#E89D4F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Aviso sobre plazo contractual:</strong>
                    <span>{scheduleResult.inconsistencyReason}</span>
                  </div>
                </div>
              )}

              {scheduleResult.schedule.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {scheduleResult.schedule.map((item: any) => (
                      <div
                        key={item.installmentNumber}
                        className="bg-white dark:bg-[#26221F] rounded-xl p-2.5 border border-[#E6DCD2]/70 dark:border-[#3D352E] flex items-center justify-between shadow-2xs hover:border-[#D96B27]/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] flex items-center justify-center font-mono font-black text-[#D96B27] dark:text-[#E07A5F] text-xs shrink-0">
                            {item.installmentNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-[#2C221E] dark:text-[#EAE0D5] block">
                              Cuota {item.installmentNumber}
                            </span>
                            <span className="text-[11px] text-[#6E615A] dark:text-[#C2B29F] block">
                              {item.formattedShortDate}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <strong className="text-sm font-black text-[#2D7A5D] dark:text-[#3D9970] font-mono block">
                            {item.formattedAmount}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#E6DCD2]/70 dark:border-[#3D352E] flex items-center justify-between text-xs px-1">
                    <span className="text-[#6E615A] dark:text-[#C2B29F] font-semibold">Total:</span>
                    <strong className="text-[#2C221E] dark:text-[#EAE0D5] font-black font-mono text-sm">
                      {formatScheduleAmount(scheduleResult.totalAmount)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pre-formatted Message Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6E615A] dark:text-[#C2B29F] flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#2D7A5D] dark:text-[#3D9970]" />
              Mensaje preformateado (WhatsApp):
            </label>
            <div className="bg-white dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl p-3 text-xs text-[#2C221E] dark:text-[#EAE0D5] font-mono whitespace-pre-wrap leading-relaxed select-all">
              {constanciaMessage}
            </div>
          </div>

          {/* Validation Notice for missing phone */}
          {!hasPhone && (
            <div className="bg-[#FDF6EE] dark:bg-[#E89D4F]/10 border border-[#E89D4F]/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#8C5319] dark:text-[#E89D4F]">
              <AlertCircle className="w-4 h-4 text-[#E89D4F] shrink-0 mt-0.5" />
              <span>
                El cliente no tiene un número de teléfono registrado. Puedes copiar el texto de la constancia al portapapeles.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] dark:bg-[#1C1917] border-t border-[#E6DCD2] dark:border-[#3D352E] flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#26221F] border border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#F5F0EB] dark:hover:bg-[#3D352E] text-[#2C221E] dark:text-[#EAE0D5] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#2D7A5D] dark:text-[#3D9970]" />
                <span className="text-[#2D7A5D] dark:text-[#3D9970]">¡Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
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
            className="w-full sm:w-auto px-3 py-2.5 text-xs text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5] font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
