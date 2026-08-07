import React, { useState } from 'react';
import { formatCurrency, generateWhatsAppReminderMessage } from '../utils/loanHelpers';
import { PaymentModal } from '../components/PaymentModal';
import { Route, Search, Phone, MapPin, CheckCircle2, DollarSign, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';

export function VistaRutaDiaria({ todayCollections = [], onRegisterPayment, onReorderClients }) {
  const [filter, setFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  const pendingCount = todayCollections.filter((c) => !c.isPaidToday).length;
  const paidCount = todayCollections.filter((c) => c.isPaidToday).length;
  const totalTargetToday = todayCollections.reduce((sum, c) => sum + (c.loan?.dailyPaymentAmount || 0), 0);
  const totalCollectedToday = todayCollections.reduce((sum, c) => sum + (c.amountPaidToday || 0), 0);

  const filteredCollections = todayCollections.filter((c) => {
    if (filter === 'PENDING' && c.isPaidToday) return false;
    if (filter === 'PAID' && !c.isPaidToday) return false;

    const term = searchTerm.toLowerCase();
    const clientName = c.loan?.clientName || '';
    const clientAlias = c.loan?.clientAlias || '';
    const clientPhone = c.loan?.clientPhone || '';
    const clientAddress = c.loan?.clientAddress || '';

    return (
      clientName.toLowerCase().includes(term) ||
      clientAlias.toLowerCase().includes(term) ||
      clientPhone.includes(term) ||
      clientAddress.toLowerCase().includes(term)
    );
  });

  const handleMoveOrder = async (index, direction) => {
    if (!onReorderClients) return;
    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredCollections.length) return;

    const currentList = [...todayCollections];
    const itemA = filteredCollections[index];
    const itemB = filteredCollections[newIndex];

    const posA = currentList.findIndex((x) => x.loan?.clientId === itemA.loan?.clientId);
    const posB = currentList.findIndex((x) => x.loan?.clientId === itemB.loan?.clientId);

    if (posA !== -1 && posB !== -1) {
      const temp = currentList[posA];
      currentList[posA] = currentList[posB];
      currentList[posB] = temp;

      const orderedIds = currentList.map((x) => x.loan?.clientId).filter(Boolean);
      await onReorderClients(orderedIds);
    }
  };

  return (
    <div className="space-y-6">
      {/* Route Summary Banner */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#2C221E]">
              Ruta Diaria de Cobranza
            </h2>
            <p className="text-xs text-[#6E615A]">
              Control en vivo de cuotas del día en Soles (S/.).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2] text-center min-w-[100px]">
            <span className="text-[10px] font-bold text-[#6E615A] block uppercase">Recaudado Hoy</span>
            <strong className="text-sm font-extrabold text-[#2D7A5D]">
              {formatCurrency(totalCollectedToday)}
            </strong>
          </div>

          <div className="flex-1 md:flex-initial bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2] text-center min-w-[100px]">
            <span className="text-[10px] font-bold text-[#6E615A] block uppercase">Meta Diaria</span>
            <strong className="text-sm font-extrabold text-[#2C221E]">
              {formatCurrency(totalTargetToday)}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E6DCD2] warm-shadow">
          <button
            onClick={() => setFilter('PENDING')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'PENDING'
                ? 'bg-[#C84B31] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            Pendientes ({pendingCount})
          </button>

          <button
            onClick={() => setFilter('PAID')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'PAID'
                ? 'bg-[#2D7A5D] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            Cobrados ({paidCount})
          </button>

          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-[#2C221E] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            Todos ({todayCollections.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o dirección..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27] warm-shadow"
          />
        </div>
      </div>

      {/* Cards List */}
      {filteredCollections.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DCD2] warm-shadow">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#EEF6F2] text-[#2D7A5D] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#2C221E]">
            ¡No hay cobros pendientes!
          </h3>
          <p className="text-xs text-[#6E615A] max-w-sm mx-auto mt-1">
            Todos los clientes de este filtro han realizado su pago del día.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map(({ loan, isPaidToday, amountPaidToday }, idx) => {
            const isOverdue = loan?.status === 'OVERDUE';

            return (
              <div
                key={loan.id}
                className={`bg-white rounded-3xl p-5 border transition-all warm-shadow flex flex-col justify-between ${
                  isPaidToday
                    ? 'border-[#2D7A5D]/30 bg-[#EEF6F2]/30'
                    : isOverdue
                    ? 'border-[#C84B31]/30'
                    : 'border-[#E6DCD2]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-[#E6DCD2]/60 pb-3 mb-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-black text-white bg-[#2C221E] px-2 py-0.5 rounded-lg shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#2C221E] flex items-center gap-1.5 flex-wrap">
                          <span>{loan.clientName}</span>
                          {loan.clientAlias && (
                            <span className="text-[10px] font-extrabold bg-[#FDF3ED] text-[#D96B27] px-2 py-0.5 rounded-full border border-[#D96B27]/30">
                              ({loan.clientAlias})
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#6E615A] mt-0.5">
                          <Phone className="w-3 h-3 text-[#E89D4F]" />
                          <span>{loan.clientPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaidToday
                            ? 'bg-[#2D7A5D] text-white border-transparent'
                            : isOverdue
                            ? 'bg-[#FDF2F0] text-[#C84B31] border-[#C84B31]/30'
                            : 'bg-[#FDF3ED] text-[#D96B27] border-[#D96B27]/30'
                        }`}
                      >
                        {isPaidToday ? 'PAGADO HOY' : isOverdue ? 'EN MORA' : 'PENDIENTE'}
                      </span>

                      {onReorderClients && (
                        <div className="flex items-center gap-0.5 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E6DCD2]">
                          <button
                            onClick={() => handleMoveOrder(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-1 rounded-md hover:bg-white text-[#6E615A] hover:text-[#D96B27] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Mover arriba en la ruta"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(idx, 'DOWN')}
                            disabled={idx === filteredCollections.length - 1}
                            className="p-1 rounded-md hover:bg-white text-[#6E615A] hover:text-[#D96B27] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Mover abajo en la ruta"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#6E615A] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
                    <span className="line-clamp-1">{loan.clientAddress || 'Sin dirección'}</span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]/60 space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#6E615A]">Cuota Diaria Acordada:</span>
                      <strong className="text-[#2C221E] font-extrabold">
                        {formatCurrency(loan.dailyPaymentAmount)}
                      </strong>
                    </div>

                    {amountPaidToday > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#6E615A]">Cobrado Hoy:</span>
                        <strong className="text-[#2D7A5D] font-extrabold">
                          {formatCurrency(amountPaidToday)}
                        </strong>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-[#6E615A]">Días Pagados:</span>
                      <span>
                        <strong>{loan.paidDaysCount}</strong> / {loan.paymentDays} días
                      </span>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-[#E6DCD2]/40">
                      <span className="text-[#6E615A]">Saldo Restante Total:</span>
                      <strong className="text-[#C84B31]">
                        {formatCurrency(loan.remainingAmount)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    disabled={loan.remainingAmount <= 0 || loan.status === 'PAID'}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      loan.remainingAmount <= 0 || loan.status === 'PAID'
                        ? 'bg-[#EEF6F2] text-[#2D7A5D] border border-[#2D7A5D]/20 cursor-default opacity-75'
                        : isPaidToday
                        ? 'bg-[#EEF6F2] text-[#2D7A5D] border border-[#2D7A5D]/40 hover:bg-[#2D7A5D] hover:text-white cursor-pointer active:scale-95'
                        : 'terracotta-gradient text-white shadow-xs hover:brightness-110 active:scale-95'
                    }`}
                  >
                    <span className="text-xs font-black">S/.</span>
                    <span>
                      {loan.remainingAmount <= 0 || loan.status === 'PAID'
                        ? 'Pagado Completo'
                        : isPaidToday
                        ? 'Abonar más'
                        : 'Cobrar Cuota'}
                    </span>
                  </button>

                  <a
                    href={generateWhatsAppReminderMessage({
                      clientName: loan.clientName,
                      phone: loan.clientPhone,
                      remainingAmount: loan.remainingAmount,
                      totalToPay: loan.totalToPay,
                      dueDate: loan.dueDate,
                      daysDifference: isOverdue ? -1 : 0,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-white border border-[#E6DCD2] text-[#25D366] hover:bg-[#EEF6F2] transition-all"
                    title="Recordatorio WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaymentModal
        loan={selectedLoan}
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        onConfirmPayment={onRegisterPayment}
      />
    </div>
  );
}
