'use client';

import React, { useState } from 'react';
import { AlertNotification } from '@/types';
import { formatCurrency, formatDatePE, generateWhatsAppReminderMessage } from '@/services/loanService';
import { Bell, X, AlertTriangle, Clock, MessageCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

interface NotificationDropdownProps {
  alerts: AlertNotification[];
  isOpen: boolean;
  onClose: () => void;
  onSelectLoan?: (loanId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  alerts,
  isOpen,
  onClose,
  onSelectLoan,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'EXPIRING'>('ALL');

  if (!isOpen) return null;

  const overdueAlerts = alerts.filter((a) => a.type === 'OVERDUE');
  const expiringAlerts = alerts.filter((a) => a.type === 'DUE_TODAY' || a.type === 'EXPIRING_SOON');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'OVERDUE') return a.type === 'OVERDUE';
    if (filter === 'EXPIRING') return a.type === 'DUE_TODAY' || a.type === 'EXPIRING_SOON';
    return true;
  });

  const handleSendReminder = (alert: AlertNotification) => {
    const url = generateWhatsAppReminderMessage({
      clientName: alert.clientName,
      phone: alert.clientPhone,
      remainingAmount: alert.remainingAmount,
      totalToPay: alert.totalToPay,
      dueDate: alert.dueDate,
      daysDifference: alert.daysDifference,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-[#E6DCD2] warm-shadow-lg space-y-4 max-h-[85vh] flex flex-col mt-12 sm:mt-14 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#2C221E]">
                Centro de Alertas ({alerts.length})
              </h3>
              <p className="text-[11px] text-[#6E615A]">Préstamos vencidos o a punto de vencer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#E6DCD2] shrink-0 text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              filter === 'ALL'
                ? 'bg-[#2C221E] text-white shadow-xs'
                : 'text-[#6E615A] hover:text-[#2C221E]'
            }`}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              filter === 'OVERDUE'
                ? 'bg-[#C84B31] text-white shadow-xs'
                : 'text-[#6E615A] hover:text-[#2C221E]'
            }`}
          >
            🔴 Vencidas ({overdueAlerts.length})
          </button>
          <button
            onClick={() => setFilter('EXPIRING')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              filter === 'EXPIRING'
                ? 'bg-[#E89D4F] text-white shadow-xs'
                : 'text-[#6E615A] hover:text-[#2C221E]'
            }`}
          >
            🟡 Próximas ({expiringAlerts.length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6E615A] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#2D7A5D] mx-auto opacity-70" />
              <p className="font-bold text-[#2C221E]">¡Sin alertas pendientes!</p>
              <p className="text-[11px]">Todos los préstamos están al día en la fecha actual.</p>
            </div>
          ) : (
            filteredAlerts.map((item) => {
              const isOverdue = item.type === 'OVERDUE';
              const isToday = item.type === 'DUE_TODAY';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
                    isOverdue
                      ? 'bg-[#FDF2F0]/80 border-[#C84B31]/40'
                      : isToday
                      ? 'bg-[#FDF6EE]/80 border-[#E89D4F]/40'
                      : 'bg-[#FAF8F5] border-[#E6DCD2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-[#2C221E]">
                          {item.clientName}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6E615A] block">
                        Vencimiento: <strong className="text-[#2C221E]">{formatDatePE(item.dueDate)}</strong>
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isOverdue
                          ? 'bg-[#C84B31] text-white border-transparent'
                          : 'bg-[#E89D4F] text-white border-transparent'
                      }`}
                    >
                      {isOverdue
                        ? `Vencido (${Math.abs(item.daysDifference || 0)}d)`
                        : isToday
                        ? 'Vence HOY'
                        : 'Vence Mañana'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-[#E6DCD2]/60">
                    <div>
                      <span className="text-[10px] text-[#6E615A] block">Saldo Restante:</span>
                      <strong className="text-sm text-[#C84B31] font-black">
                        {formatCurrency(item.remainingAmount)}
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
