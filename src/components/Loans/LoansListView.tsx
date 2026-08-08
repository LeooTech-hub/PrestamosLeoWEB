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
import { LoanConstanciaModal } from '../Modals/LoanConstanciaModal';
import {
  CreditCard,
  Search,
  MessageCircle,
  Pencil,
  Trash2,
  Phone,
  FileText,
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
    data: { capital: number; paymentDays: number; startDate: string; dueDate?: string; commission?: number; penaltyAmount?: number; notes?: string }
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
  const [selectedLoanForConstancia, setSelectedLoanForConstancia] = useState<Loan | null>(null);
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
  const countOverdue  = activeLoans.filter((l) => l.status === 'OVERDUE' || (l.status !== 'PAID' && getDaysDifferenceInfo(l.dueDate).diffDays < 0)).length;

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
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto">

      {/* ── Título ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#D96B27] dark:text-[#E07A5F] shrink-0" />
            <span>Consolidado de Préstamos ({activeLoans.length})</span>
          </h2>
          <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-0.5 ml-7 sm:ml-0">
            Gestión organizada por vencimientos, cobros y borrado inteligente.
          </p>
        </div>
      </div>

      {/* ── Buscador + Filtros ── */}
      <div className="bg-white dark:bg-[#26221F] rounded-3xl p-3 sm:p-4 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300 space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente, teléfono o dirección..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] placeholder-[#A89B92] dark:placeholder-[#C2B29F] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
          />
        </div>

        {/* Filter Pills — scrollable horizontalmente en móvil */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#1C1917] p-1 rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] text-[11px] sm:text-xs font-bold overflow-x-auto scrollbar-none">
          {(
            [
              { key: 'ALL',      label: `Todos (${activeLoans.length})` },
              { key: 'ACTIVE',   label: `🟢 Vigentes (${countVigentes})` },
              { key: 'EXPIRING', label: `🟡 Por Vencer (${countExpiring})` },
              { key: 'OVERDUE',  label: `🔴 Vencidos (${countOverdue})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === key
                  ? key === 'ALL'      ? 'bg-[#2C221E] dark:bg-[#EAE0D5] text-white dark:text-[#1C1917] shadow-xs'
                  : key === 'ACTIVE'   ? 'bg-[#2D7A5D] dark:bg-[#3D9970] text-white shadow-xs'
                  : key === 'EXPIRING' ? 'bg-[#E89D4F] text-white shadow-xs'
                                       : 'bg-[#C84B31] text-white shadow-xs'
                  : 'text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid de tarjetas ── */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-[#26221F] rounded-3xl p-10 text-center border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300">
          <CreditCard className="w-12 h-12 text-[#A89B92] dark:text-[#C2B29F] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-base text-[#2C221E] dark:text-[#EAE0D5]">No hay préstamos en este filtro</h3>
          <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-1">
            Intenta cambiar de pestaña de estado o modificar la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredLoans.map((loan) => {
            const diffInfo = getDaysDifferenceInfo(loan.dueDate);
            const percent = Math.round((loan.paidAmount / loan.totalToPay) * 100);

            return (
              <div
                key={loan.id}
                className="bg-white dark:bg-[#26221F] rounded-3xl p-3.5 sm:p-5 border border-[#E6DCD2] dark:border-[#3D352E] hover:border-[#D96B27]/40 dark:hover:border-[#E07A5F]/40 warm-shadow transition-colors duration-300 flex flex-col justify-between space-y-3"
              >
                {/* ── Cabecera: nombre + badge vencimiento ── */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#2C221E] dark:text-[#EAE0D5] truncate">
                        {loan.clientName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
                        <Phone className="w-3 h-3 text-[#E89D4F] shrink-0" />
                        <span className="truncate">{loan.clientPhone}</span>
                      </div>
                    </div>

                    {/* Badge de días — texto más compacto en móvil */}
                    <span
                      className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border shrink-0 max-w-[120px] sm:max-w-none text-center leading-tight ${
                        diffInfo.color === 'RED'
                          ? 'bg-[#FDF2F0] dark:bg-[#C84B31]/20 text-[#C84B31] border-[#C84B31]/30'
                          : diffInfo.color === 'YELLOW'
                          ? 'bg-[#FDF6EE] dark:bg-[#E89D4F]/20 text-[#E89D4F] border-[#E89D4F]/30'
                          : 'bg-[#EEF6F2] dark:bg-[#3D9970]/20 text-[#2D7A5D] dark:text-[#3D9970] border-[#2D7A5D]/30 dark:border-[#3D9970]/30'
                      }`}
                    >
                      {diffInfo.label}
                    </span>
                  </div>

                  {/* ── Fechas ── */}
                  <div className="flex items-center justify-between text-xs text-[#6E615A] dark:text-[#C2B29F] mt-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] px-3 py-2 rounded-2xl border border-[#E6DCD2]/70 dark:border-[#3D352E]">
                    <div>
                      <span className="block text-[9px] sm:text-[10px]">Fecha Inicio:</span>
                      <strong className="text-[#2C221E] dark:text-[#EAE0D5] text-[11px] sm:text-xs">{formatDatePE(loan.startDate)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] sm:text-[10px]">Vencimiento:</span>
                      <strong className="text-[#2C221E] dark:text-[#EAE0D5] text-[11px] sm:text-xs">{formatDatePE(loan.dueDate)}</strong>
                    </div>
                  </div>

                  {/* ── Financials — 3 columnas adaptativas ──
                      En móvil el texto es más pequeño para que "S/. 1,200" no se corte.
                      Cada celda puede truncar el valor si es muy largo. */}
                  <div className="mt-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] p-2.5 rounded-2xl border border-[#E6DCD2]/70 dark:border-[#3D352E] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#2C221E] dark:text-[#EAE0D5] truncate">
                      {loan.penaltyAmount && loan.penaltyAmount > 0
                        ? `Capital: ${formatCurrency(loan.capital)} + Int: ${formatCurrency(loan.interestAmount)} + Mora: ${formatCurrency(loan.penaltyAmount)} = ${formatCurrency(loan.totalToPay)}`
                        : `Capital: ${formatCurrency(loan.capital)} + 20% = ${formatCurrency(loan.totalToPay)}`}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#E6DCD2]/40 dark:border-[#3D352E]">
                      <div className="min-w-0">
                        <span className="text-[#6E615A] dark:text-[#C2B29F] block text-[9px] sm:text-[10px]">Capital:</span>
                        <strong className="text-[#2C221E] dark:text-[#EAE0D5] text-[11px] sm:text-xs block truncate">
                          {formatCurrency(loan.capital)}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#6E615A] dark:text-[#C2B29F] block text-[9px] sm:text-[10px]">
                          {loan.penaltyAmount && loan.penaltyAmount > 0 ? 'Total (+Mora):' : 'Total a Cobrar:'}
                        </span>
                        <strong className="text-[#D96B27] dark:text-[#E07A5F] text-[11px] sm:text-xs block truncate">
                          {formatCurrency(loan.totalToPay)}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#6E615A] dark:text-[#C2B29F] block text-[9px] sm:text-[10px]">Saldo:</span>
                        <strong className="text-[#C84B31] text-[11px] sm:text-xs block truncate">
                          {formatCurrency(loan.remainingAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ── Barra de progreso ── */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                      <span>
                        Día {loan.paidDaysCount}/{loan.paymentDays}
                        <span className="hidden sm:inline"> ({formatCurrency(loan.dailyPaymentAmount)}/día)</span>
                      </span>
                      <span className="text-[#2D7A5D] dark:text-[#3D9970]">{percent}% Pagado</span>
                    </div>
                    <div className="w-full bg-[#E6DCD2] dark:bg-[#3D352E] rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className="bg-[#2D7A5D] dark:bg-[#3D9970] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {/* Cuota diaria — sólo visible en móvil debajo de la barra */}
                    <p className="sm:hidden text-[10px] text-[#6E615A] dark:text-[#C2B29F] mt-0.5 text-right">
                      {formatCurrency(loan.dailyPaymentAmount)}/día
                    </p>
                  </div>
                </div>

                {/* ── Acciones ──────────────────────────────────────────
                    Móvil: [Cobrar flex-1] [WA icono] | [✏] [🗑]
                    El botón "Cobrar" absorbe el espacio disponible.
                    WhatsApp muestra sólo icono en móvil, texto en sm+.
                    Editar y Eliminar son iconos cuadrados compactos.
                ─────────────────────────────────────────────────────── */}
                <div className="pt-2 flex items-center justify-between gap-1.5 sm:gap-2 border-t border-[#E6DCD2]/60 dark:border-[#3D352E]">
                  {/* Cobrar + WhatsApp */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedLoanForPayment(loan)}
                      className="flex-1 py-2 sm:py-2.5 px-2 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1 min-w-0"
                    >
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>S/. Cobrar</span>
                    </button>

                    <button
                      onClick={() => handleSendReminder(loan)}
                      className="p-2 sm:py-2.5 sm:px-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 font-bold text-xs hover:bg-[#25D366] hover:text-white active:scale-95 transition-all flex items-center gap-1 shrink-0"
                      title="Enviar recordatorio WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>

                  {/* Constancia, Editar & Eliminar */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedLoanForConstancia(loan)}
                      className="p-2 rounded-xl bg-[#EEF6F2] dark:bg-[#3D9970]/15 hover:bg-[#2D7A5D] hover:text-white text-[#2D7A5D] dark:text-[#3D9970] border border-[#2D7A5D]/30 active:scale-95 transition-all cursor-pointer"
                      title="Enviar Constancia de Préstamo"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedLoanForEdit(loan)}
                      className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 text-[#D96B27] dark:text-[#E07A5F] border border-[#E6DCD2] dark:border-[#3D352E] active:scale-95 transition-all"
                      title="Editar Préstamo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedLoanForDelete(loan)}
                      className="p-2 rounded-xl bg-[#FDF2F0] dark:bg-[#C84B31]/15 hover:bg-[#C84B31] hover:text-white text-[#C84B31] border border-[#C84B31]/30 active:scale-95 transition-all"
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

      {/* Modals */}
      <PaymentModal
        loan={selectedLoanForPayment}
        isOpen={!!selectedLoanForPayment}
        onClose={() => setSelectedLoanForPayment(null)}
        onConfirmPayment={onRegisterPayment}
      />

      <EditLoanModal
        loan={selectedLoanForEdit}
        isOpen={!!selectedLoanForEdit}
        onClose={() => setSelectedLoanForEdit(null)}
        onConfirmEditLoan={onUpdateLoan}
      />

      <LoanConstanciaModal
        loan={selectedLoanForConstancia}
        isOpen={!!selectedLoanForConstancia}
        onClose={() => setSelectedLoanForConstancia(null)}
      />

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
