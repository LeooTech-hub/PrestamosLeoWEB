import React from 'react';
import { formatCurrency, generateWhatsAppReminderMessage } from '../utils/loanHelpers';
import { Bell, X, MessageSquare } from 'lucide-react';

export function NotificationDropdown({ alerts = [], isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-3xl max-w-md w-full p-5 warm-shadow-lg relative overflow-hidden max-h-[80vh] flex flex-col transition-colors duration-300">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#332F2C] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#2C221E] dark:text-[#F3F4F6]">
                Centro de Alertas ({alerts.length})
              </h3>
              <p className="text-[11px] text-[#6E615A] dark:text-[#E5E7EB]">
                Préstamos por vencer o en estado de mora.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#24211E] text-[#6E615A] dark:text-[#E5E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6E615A]">
              ¡Excelente! No hay alertas de mora ni préstamos vencidos.
            </div>
          ) : (
            alerts.map((alert) => {
              const isOverdue = alert.type === 'OVERDUE';
              const isToday = alert.type === 'DUE_TODAY';
              const statusLabel = isOverdue ? 'VENCIDO' : isToday ? 'VENCE HOY' : 'VENCE MAÑANA';

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-2xl border text-xs space-y-2 transition-all ${
                    isOverdue
                      ? 'bg-[#FDF2F0] border-[#C84B31]/30'
                      : isToday
                      ? 'bg-[#FDF3ED] border-[#D96B27]/30'
                      : 'bg-[#FAF8F5] border-[#E6DCD2]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-[#2C221E] font-extrabold block text-sm">
                        {alert.clientName}
                      </strong>
                      <span className="text-[#6E615A] text-[11px]">
                        DNI / Teléf: {alert.clientPhone}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isOverdue
                          ? 'bg-[#C84B31] text-white border-transparent'
                          : isToday
                          ? 'bg-[#D96B27] text-white border-transparent'
                          : 'bg-[#E89D4F]/20 text-[#2C221E] border-[#E89D4F]/30'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#E6DCD2]/60">
                    <div>
                      <span className="text-[10px] text-[#6E615A] block">Saldo Restante:</span>
                      <strong className="text-[#C84B31]">{formatCurrency(alert.remainingAmount ?? alert.remaining_amount)}</strong>
                    </div>

                    <a
                      href={generateWhatsAppReminderMessage({
                        clientName: alert.clientName,
                        phone: alert.clientPhone,
                        remainingAmount: alert.remainingAmount ?? alert.remaining_amount,
                        totalToPay: alert.totalToPay ?? alert.total_to_pay,
                        dueDate: alert.dueDate ?? alert.due_date,
                        daysDifference: alert.daysDifference ?? alert.daysRemaining,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold text-[11px] hover:brightness-105"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Recordar</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
