'use client';

import React, { useState } from 'react';
import { Loan } from '@/types';
import {
  formatCurrency,
  formatDatePE,
  getDaysDifferenceInfo,
  generateWhatsAppReminderMessage,
} from '@/services/loanService';
import { PaymentModal } from '../DailyRoute/PaymentModal';
import { SmartDeleteModal } from '../Modals/SmartDeleteModal';
import { EditLoanModal } from '../Clients/EditLoanModal';
import {
  CreditCard,
  Search,
  MessageCircle,
  Pencil,
  Trash2,
  Phone,
} from 'lucide-react';

interface LoansListViewProps {
  loans: Loan[];
  onRegisterPayment: (
    loanId: string,
    amount: number,
    notes?: string
  ) => Promise<{ updatedLoan: Loan }>;
  onUpdateLoan: (
    id: string,
    data: { capital: number; paymentDays: number; startDate: string; notes?: string }
  ) => Promise<void>;
  onDeleteLoan: (loanId: string, mode: 'ARCHIVE' | 'PERMANENT') => Promise<void>;
}

export const LoansListView: React.FC<LoansListViewProps> = ({
  loans,
  onRegisterPayment,
  onUpdateLoan,
  onDeleteLoan,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'OVERDUE' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const [selectedLoanForEdit, setSelectedLoanForEdit] = useState<Loan | null>(null);
  const [selectedLoanForDelete, setSelectedLoanForDelete] = useState<Loan | null>(null);

  // Active unarchived loans
  const activeLoans = loans.filter((l) => !l.isArchived);

  // Filter logic
  const filteredLoans = activeLoans.filter((loan) => {
    const diffInfo = getDaysDifferenceInfo(loan.dueDate);

    if (filter === 'ACTIVE') {
      if (loan.status === 'PAID' || diffInfo.diffDays < 0) return false;
    } else if (filter === 'EXPIRING') {
      if (loan.status === 'PAID' || diffInfo.diffDays < 0 || diffInfo.diffDays > 1) return false;
    } else if (filter === 'OVERDUE') {
      if (loan.status !== 'OVERDUE' && diffInfo.diffDays >= 0) return false;
    } else if (filter === 'PAID') {
      if (loan.status !== 'PAID') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        loan.clientName.toLowerCase().includes(q) ||
        loan.clientPhone.includes(q) ||
        (loan.clientAddress || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Counters
  const countVigentes = activeLoans.filter((l) => l.status !== 'PAID' && getDaysDifferenceInfo(l.dueDate).diffDays >= 0).length;
  const countExpiring = activeLoans.filter((l) => l.status !== 'PAID' && [0, 1].includes(getDaysDifferenceInfo(l.dueDate).diffDays)).length;
  const countOverdue = activeLoans.filter((l) => l.status === 'OVERDUE' || (l.status !== 'PAID' && getDaysDifferenceInfo(l.dueDate).diffDays < 0)).length;

  const handleSendReminder = (loan: Loan) => {
    const diffInfo = getDaysDifferenceInfo(loan.dueDate);
    const url = generateWhatsAppReminderMessage({
      clientName: loan.clientName,
      phone: loan.clientPhone,
      remainingAmount: loan.remainingAmount,
      totalToPay: loan.totalToPay,
      dueDate: loan.dueDate,
      daysDifference: diffInfo.diffDays,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C221E] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#D96B27]" />
            Consolidado de Préstamos ({activeLoans.length})
          </h2>
          <p className="text-xs sm:text-sm text-[#6E615A] mt-0.5">
            Gestión organizada por vencimientos, cobros y borrado inteligente.
          </p>
        </div>
      </div>

      {/* Search & Status Filter Tabs */}
      <div className="bg-white rounded-3xl p-4 border border-[#E6DCD2] warm-shadow space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A89B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, teléfono o dirección..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#E6DCD2] text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'ALL'
                  ? 'bg-[#2C221E] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              Todos ({activeLoans.length})
            </button>

            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'ACTIVE'
                  ? 'bg-[#2D7A5D] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              🟢 Vigentes ({countVigentes})
            </button>

            <button
              onClick={() => setFilter('EXPIRING')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'EXPIRING'
                  ? 'bg-[#E89D4F] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              🟡 Por Vencer ({countExpiring})
            </button>

            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'OVERDUE'
                  ? 'bg-[#C84B31] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              🔴 Vencidos ({countOverdue})
            </button>
          </div>
        </div>
      </div>

      {/* Loans Grid List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6DCD2] warm-shadow">
          <CreditCard className="w-12 h-12 text-[#A89B92] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-base text-[#2C221E]">No hay préstamos en este filtro</h3>
          <p className="text-xs text-[#6E615A] mt-1">
            Intenta cambiar de pestaña de estado o modificar la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoans.map((loan) => {
            const diffInfo = getDaysDifferenceInfo(loan.dueDate);
            const percent = Math.round((loan.paidAmount / loan.totalToPay) * 100);

            return (
              <div
                key={loan.id}
                className="bg-white rounded-3xl p-5 border border-[#E6DCD2] hover:border-[#D96B27]/40 warm-shadow transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-[#2C221E]">
                        {loan.clientName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#6E615A] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#E89D4F]" />
                          {loan.clientPhone}
                        </span>
                      </div>
                    </div>

                    {/* Expiration Days Badge */}
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                        diffInfo.color === 'RED'
                          ? 'bg-[#FDF2F0] text-[#C84B31] border-[#C84B31]/30'
                          : diffInfo.color === 'YELLOW'
                          ? 'bg-[#FDF6EE] text-[#E89D4F] border-[#E89D4F]/30'
                          : 'bg-[#EEF6F2] text-[#2D7A5D] border-[#2D7A5D]/30'
                      }`}
                    >
                      {diffInfo.label}
                    </span>
                  </div>

                  {/* Dates Row */}
                  <div className="flex items-center justify-between text-xs text-[#6E615A] mt-3 bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E6DCD2]/70">
                    <div>
                      <span className="block text-[10px]">Fecha Inicio:</span>
                      <strong className="text-[#2C221E]">{formatDatePE(loan.startDate)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px]">Vencimiento:</span>
                      <strong className="text-[#2C221E]">{formatDatePE(loan.dueDate)}</strong>
                    </div>
                  </div>

                  {/* Financials Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]/70">
                    <div>
                      <span className="text-[#6E615A] block text-[10px]">Capital:</span>
                      <strong className="text-[#2C221E]">{formatCurrency(loan.capital)}</strong>
                    </div>
                    <div>
                      <span className="text-[#6E615A] block text-[10px]">Total (20%):</span>
                      <strong className="text-[#D96B27]">{formatCurrency(loan.totalToPay)}</strong>
                    </div>
                    <div>
                      <span className="text-[#6E615A] block text-[10px]">Saldo:</span>
                      <strong className="text-[#C84B31]">{formatCurrency(loan.remainingAmount)}</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-[#6E615A] mb-1">
                      <span>
                        Día {loan.paidDaysCount}/{loan.paymentDays} ({formatCurrency(loan.dailyPaymentAmount)}/día)
                      </span>
                      <span className="text-[#2D7A5D]">{percent}% Pagado</span>
                    </div>
                    <div className="w-full bg-[#E6DCD2] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#2D7A5D] h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E6DCD2]/60">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      onClick={() => setSelectedLoanForPayment(loan)}
                      className="flex-1 py-2.5 px-2 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-xs hover:brightness-110 flex items-center justify-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </button>

                    <button
                      onClick={() => handleSendReminder(loan)}
                      className="py-2.5 px-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 font-bold text-xs hover:bg-[#25D366] hover:text-white transition-all flex items-center gap-1"
                      title="Enviar recordatorio WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedLoanForEdit(loan)}
                      className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#FDF3ED] text-[#D96B27] border border-[#E6DCD2] transition-all"
                      title="Editar Préstamo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedLoanForDelete(loan)}
                      className="p-2 rounded-xl bg-[#FDF2F0] hover:bg-[#C84B31] hover:text-white text-[#C84B31] border border-[#C84B31]/30 transition-all"
                      title="Eliminar / Archivar Préstamo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        loan={selectedLoanForPayment}
        isOpen={!!selectedLoanForPayment}
        onClose={() => setSelectedLoanForPayment(null)}
        onConfirmPayment={onRegisterPayment}
      />

      {/* Edit Loan Modal */}
      <EditLoanModal
        loan={selectedLoanForEdit}
        isOpen={!!selectedLoanForEdit}
        onClose={() => setSelectedLoanForEdit(null)}
        onConfirmEditLoan={onUpdateLoan}
      />

      {/* Smart Delete Modal */}
      <SmartDeleteModal
        target={selectedLoanForDelete ? { type: 'LOAN', item: selectedLoanForDelete } : null}
        paymentsCount={selectedLoanForDelete ? (selectedLoanForDelete.paidDaysCount > 0 ? selectedLoanForDelete.paidDaysCount : 0) : 0}
        isOpen={!!selectedLoanForDelete}
        onClose={() => setSelectedLoanForDelete(null)}
        onConfirmDelete={async (mode) => {
          if (selectedLoanForDelete) {
            await onDeleteLoan(selectedLoanForDelete.id, mode);
          }
        }}
      />
    </div>
  );
};
