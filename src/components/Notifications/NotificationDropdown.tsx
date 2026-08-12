'use client';

import React, { useState } from 'react';
import { AlertNotification } from '@/types';
import { formatCurrency, formatDatePE, generateWhatsAppReminderMessage } from '@/services/loanService';
import { Bell, X, MessageCircle, CheckCircle2 } from 'lucide-react';

interface NotificationDropdownProps {
  alerts: AlertNotification[];
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  alerts,
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'EXPIRING'>('ALL');

  if (!isOpen) return null;

  const overdueAlerts = alerts.filter((a) => a.type === 'OVERDUE');
  const expiringAlerts = alerts.filter((a) => a.type === 'DUE_TODAY' || a.type === 'DUE_TOMORROW');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'OVERDUE') return a.type === 'OVERDUE';
    if (filter === 'EXPIRING') return a.type === 'DUE_TODAY' || a.type === 'DUE_TOMORROW';
    return true;
  });

  const handleSendReminder = (alert: AlertNotification) => {
    const url = generateWhatsAppReminderMessage({
      clientName: alert.clientName,
      phone: alert.clientPhone,
      remainingAmount: alert.remainingAmount ?? alert.remaining_amount,
      totalToPay: alert.totalToPay ?? alert.total_to_pay,
      dueDate: alert.dueDate ?? alert.due_date,
      daysDifference: alert.daysDifference ?? alert.daysRemaining,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#26221F] rounded-3xl max-w-md w-full p-5 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow-lg space-y-4 max-h-[85vh] flex flex-col mt-12 sm:mt-14 overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#3D352E] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F0] dark:bg-[#C84B31]/20 text-[#C84B31] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#2C221E] dark:text-[#EAE0D5]">
                Centro de Alertas ({alerts.length})
              </h3>
              <p className="text-[11px] text-[#6E615A] dark:text-[#C2B29F]">Préstamos vencidos o a punto de vencer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#1C1917] p-1 rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] shrink-0 text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              filter === 'ALL'
                ? 'bg-[#2C221E] dark:bg-[#EAE0D5] text-white dark:text-[#1C1917] shadow-xs'
                : 'text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5]'
            }`}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              filter === 'OVERDUE'
                ? 'bg-[#C84B31] text-white shadow-xs'
                : 'text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5]'
            }`}
          >
            🔴 Vencidas ({overdueAlerts.length})
          </button>
          <button
            onClick={() => setFilter('EXPIRING')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              filter === 'EXPIRING'
                ? 'bg-[#E89D4F] text-white shadow-xs'
                : 'text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5]'
            }`}
          >
            🟡 Próximas ({expiringAlerts.length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6E615A] dark:text-[#C2B29F] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#2D7A5D] dark:text-[#3D9970] mx-auto opacity-70" />
              <p className="font-bold text-[#2C221E] dark:text-[#EAE0D5]">¡Sin alertas pendientes!</p>
              <p className="text-[11px]">Todos los préstamos están al día en la fecha actual.</p>
            </div>
          ) : (
            filteredAlerts.map((item) => {
              const isOverdue = item.type === 'OVERDUE';
              const isToday = item.type === 'DUE_TODAY';
              const statusLabel = isOverdue ? 'VENCIDO' : isToday ? 'VENCE HOY' : 'VENCE MAÑANA';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
                    isOverdue
                      ? 'bg-[#FDF2F0]/80 dark:bg-[#C84B31]/15 border-[#C84B31]/40'
                      : isToday
                      ? 'bg-[#FDF6EE]/80 dark:bg-[#E89D4F]/15 border-[#E89D4F]/40'
                      : 'bg-[#FAF8F5] dark:bg-[#1C1917] border-[#E6DCD2] dark:border-[#3D352E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-[#2C221E] dark:text-[#EAE0D5]">
                          {item.clientName}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6E615A] dark:text-[#C2B29F] block">
                        Vencimiento: <strong className="text-[#2C221E] dark:text-[#EAE0D5]">{formatDatePE(item.dueDate ?? item.due_date)}</strong>
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isOverdue
                          ? 'bg-[#C84B31] text-white border-transparent'
                          : 'bg-[#E89D4F] text-white border-transparent'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/80 dark:bg-[#26221F]/80 p-2.5 rounded-xl border border-[#E6DCD2]/60 dark:border-[#3D352E]">
                    <div>
                      <span className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] block">Saldo Restante:</span>
                      <strong className="text-sm text-[#C84B31] font-black">
                        {formatCurrency(item.remainingAmount ?? item.remaining_amount)}
                      </strong>
                    </div>

                    {/* WhatsApp Action Button */}
                    <button
                      onClick={() => handleSendReminder(item)}
                      className="py-2 px-3 rounded-xl bg-[#25D366] text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs hover:bg-[#1EBE57] transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Recordar por WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
