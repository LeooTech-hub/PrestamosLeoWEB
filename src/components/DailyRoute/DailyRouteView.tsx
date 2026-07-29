'use client';

import React, { useState } from 'react';
import { Loan } from '@/types';
import { formatCurrency, generateWhatsAppMessage, formatDatePE } from '@/services/loanService';
import { PaymentModal } from './PaymentModal';
import {
  Route,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  MessageCircle,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

interface DailyRouteViewProps {
  todayCollections: {
    loan: Loan;
    isPaidToday: boolean;
    amountPaidToday: number;
  }[];
  onRegisterPayment: (
    loanId: string,
    amount: number,
    notes?: string
  ) => Promise<{ updatedLoan: Loan }>;
}

export const DailyRouteView: React.FC<DailyRouteViewProps> = ({
  todayCollections,
  onRegisterPayment,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);

  // Apply filters & search
  const filteredCollections = todayCollections.filter(({ loan, isPaidToday }) => {
    if (filter === 'PENDING' && isPaidToday) return false;
    if (filter === 'PAID' && !isPaidToday) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = loan.clientName.toLowerCase().includes(q);
      const matchPhone = loan.clientPhone.includes(q);
      const matchAddress = (loan.clientAddress || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress;
    }

    return true;
  });

  const pendingCount = todayCollections.filter((c) => !c.isPaidToday).length;
  const paidCount = todayCollections.filter((c) => c.isPaidToday).length;

  const handleSendWhatsAppReminder = (loan: Loan) => {
    const url = generateWhatsAppMessage({
      clientName: loan.clientName,
      phone: loan.clientPhone,
      paymentAmount: loan.dailyPaymentAmount,
      remainingAmount: loan.remainingAmount,
      totalToPay: loan.totalToPay,
      paidDaysCount: loan.paidDaysCount,
      totalPaymentDays: loan.paymentDays,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C221E] flex items-center gap-2">
            <Route className="w-6 h-6 text-[#D96B27]" />
            Ruta Diaria de Cobranza (S/.)
          </h2>
          <p className="text-xs sm:text-sm text-[#6E615A] mt-0.5">
            Recorrido interactivo de cobro periódico en Soles Peruanos.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-[#FDF2F0] text-[#C84B31] border border-[#C84B31]/20 rounded-2xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{pendingCount} Pendientes</span>
          </div>
          <div className="bg-[#EEF6F2] text-[#2D7A5D] border border-[#2D7A5D]/20 rounded-2xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{paidCount} Cobrados</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#E6DCD2] warm-shadow space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A89B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, teléfono o referencia de cobro..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#E6DCD2]">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'PENDING'
                  ? 'bg-[#C84B31] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              Pendientes ({pendingCount})
            </button>

            <button
              onClick={() => setFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'PAID'
                  ? 'bg-[#2D7A5D] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              Cobrados ({paidCount})
            </button>

            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'ALL'
                  ? 'bg-[#2C221E] text-white shadow-xs'
                  : 'text-[#6E615A] hover:text-[#2C221E]'
              }`}
            >
              Todos ({todayCollections.length})
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      {filteredCollections.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6DCD2] warm-shadow">
          <CheckCircle2 className="w-12 h-12 text-[#2D7A5D] mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-lg text-[#2C221E]">No hay cobros en esta lista</h3>
          <p className="text-xs text-[#6E615A] mt-1">
            {filter === 'PENDING'
              ? '¡Excelente trabajo! Has completado todos los cobros del día.'
              : 'No se encontraron clientes con el filtro actual.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCollections.map(({ loan, isPaidToday }) => {
            const percent = Math.round((loan.paidAmount / loan.totalToPay) * 100);
            const isOverdue = loan.status === 'OVERDUE';

            return (
              <div
                key={loan.id}
                className={`bg-white rounded-3xl p-5 border transition-all warm-shadow flex flex-col justify-between space-y-4 ${
                  isPaidToday
                    ? 'border-[#2D7A5D]/40 bg-[#FAFDFB]'
                    : isOverdue
                    ? 'border-[#C84B31]/40 bg-[#FFFDFD]'
                    : 'border-[#E6DCD2] hover:border-[#D96B27]/40'
                }`}
              >
                {/* Top Card Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-[#2C221E]">
                        {loan.clientName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#6E615A] mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#E89D4F]" />
                          <a
                            href={`tel:${loan.clientPhone}`}
                            className="hover:underline hover:text-[#D96B27]"
                          >
                            {loan.clientPhone}
                          </a>
                        </span>
                        {loan.clientAddress && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3.5 h-3.5 text-[#E89D4F]" />
                            <span className="truncate">{loan.clientAddress}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPaidToday ? (
                        <span className="bg-[#EEF6F2] text-[#2D7A5D] border border-[#2D7A5D]/30 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cobrado
                        </span>
                      ) : isOverdue ? (
                        <span className="bg-[#FDF2F0] text-[#C84B31] border border-[#C84B31]/30 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          En Mora
                        </span>
                      ) : (
                        <span className="bg-[#FDF6EE] text-[#E89D4F] border border-[#E89D4F]/30 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Loan Breakdown Card */}
                  <div className="mt-4 bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#E6DCD2]/70 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#6E615A]">Monto Diario a Cobrar:</span>
                      <strong className="text-base text-[#D96B27] font-black">
                        {formatCurrency(loan.dailyPaymentAmount)}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-[#6E615A]">
                      <span>
                        Días de pago:{' '}
                        <strong className="text-[#2C221E]">{loan.paymentDays} Días</strong>
                      </span>
                      <span>
                        Progreso:{' '}
                        <strong className="text-[#2D7A5D]">
                          {loan.paidDaysCount}/{loan.paymentDays} días
                        </strong>
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="w-full bg-[#E6DCD2] rounded-full h-2 overflow-hidden mt-1">
                        <div
                          className="bg-[#2D7A5D] h-2 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#6E615A] mt-1">
                        <span>Abonado: {formatCurrency(loan.paidAmount)}</span>
                        <span>Saldo: {formatCurrency(loan.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedLoanForPayment(loan)}
                    className={`flex-1 py-3 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                      isPaidToday
                        ? 'bg-[#F5F0EB] text-[#2C221E] hover:bg-[#E6DCD2]'
                        : 'terracotta-gradient text-white hover:brightness-110'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isPaidToday ? 'Ver / Re-abonar' : 'Registrar Pago'}</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsAppReminder(loan)}
                    title="Enviar comprobante WhatsApp"
                    className="py-3 px-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 font-bold text-xs hover:bg-[#25D366] hover:text-white transition-all flex items-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
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
    </div>
  );
};
