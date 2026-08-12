'use client';

import React, { useState } from 'react';
import { Client, Loan, Payment } from '@/types';
import { formatCurrency, formatDatePE, getDueDateFormattedSpanish, renderRemainingDays } from '@/services/loanService';
import { ClientDetailModal } from './ClientDetailModal';
import { EditClientModal } from './EditClientModal';
import { SmartDeleteModal } from '../Modals/SmartDeleteModal';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ChevronRight,
  UserPlus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  loans: Loan[];
  payments: Payment[];
  onNewLoanForClient: (client: Client) => void;
  onOpenNewLoanModal: () => void;
  onUpdateClient: (
    id: string,
    data: { name: string; phone: string; address: string; identification?: string; notes?: string }
  ) => Promise<void>;
  onUpdateLoan: (
    id: string,
    data: { capital: number; paymentDays: number; startDate: string; dueDate?: string; commission?: number; penaltyAmount?: number; notes?: string }
  ) => Promise<void>;
  onDeleteClient: (clientId: string, mode: 'ARCHIVE' | 'PERMANENT') => Promise<void>;
  onDeletePayment?: (paymentId: string) => Promise<void>;
  onUpdatePayment?: (id: string, data: { amount?: number; date?: string; notes?: string }) => Promise<void>;
  isAdmin?: boolean;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  loans,
  payments,
  onNewLoanForClient,
  onOpenNewLoanModal,
  onUpdateClient,
  onUpdateLoan,
  onDeleteClient,
  onDeletePayment,
  onUpdatePayment,
  isAdmin = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UP_TO_DATE' | 'OVERDUE' | 'PAID'>('ALL');
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  React.useEffect(() => {
    console.log("CLIENT DATA:", clients);
  }, [clients]);

  // Active unarchived clients
  const activeClients = clients.filter((c) => c.status === 'ACTIVE');

  const counts = React.useMemo(() => {
    let all = 0;
    let upToDate = 0;
    let overdue = 0;
    let paid = 0;

    activeClients.forEach((c) => {
      all++;
      const cLoans = loans.filter((l) => l.clientId === c.id && !l.isArchived);
      const hasOverdue = cLoans.some((l) => l.status === 'OVERDUE');
      const hasActive = cLoans.some((l) => l.status === 'ACTIVE');
      if (hasOverdue) {
        overdue++;
      } else if (hasActive) {
        upToDate++;
      } else if (cLoans.length > 0 && cLoans.every((l) => l.status === 'PAID')) {
        paid++;
      }
    });

    return { all, upToDate, overdue, paid };
  }, [activeClients, loans]);

  // Search filter
  const filteredClients = activeClients.filter((client) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      client.name.toLowerCase().includes(q) ||
      (client.alias && client.alias.toLowerCase().includes(q)) ||
      client.phone.includes(q) ||
      client.address.toLowerCase().includes(q) ||
      (client.identification && client.identification.includes(q));

    if (!matchesSearch) return false;

    const cLoans = loans.filter((l) => l.clientId === client.id && !l.isArchived);
    if (statusFilter === 'UP_TO_DATE') {
      const hasActive = cLoans.some((l) => l.status === 'ACTIVE');
      const hasOverdue = cLoans.some((l) => l.status === 'OVERDUE');
      return hasActive && !hasOverdue;
    } else if (statusFilter === 'OVERDUE') {
      return cLoans.some((l) => l.status === 'OVERDUE');
    } else if (statusFilter === 'PAID') {
      return cLoans.length > 0 && cLoans.every((l) => l.status === 'PAID');
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D96B27] dark:text-[#E07A5F]" />
            Gestión de Clientes & Historial
          </h2>
          <p className="text-xs sm:text-sm text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
            Directorio de clientes, apodos/alias, edición, filtro por estado y créditos en Soles (S/.).
          </p>
        </div>

        <button
          onClick={onOpenNewLoanModal}
          className="px-4 py-2.5 rounded-2xl terracotta-gradient text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Search & Filter Chips */}
      <div className="bg-white dark:bg-[#26221F] rounded-3xl p-4 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apodo/alias, teléfono, dirección o DNI..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] placeholder-[#A89B92] dark:placeholder-[#C2B29F] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'ALL'
                ? 'terracotta-gradient text-white border-[#D96B27] dark:border-[#E07A5F]'
                : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#E6DCD2]/40 dark:hover:bg-[#3D352E]/40'
            }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('UP_TO_DATE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'UP_TO_DATE'
                ? 'bg-[#2D7A5D] dark:bg-[#3D9970] text-white border-[#2D7A5D] dark:border-[#3D9970]'
                : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#E6DCD2]/40 dark:hover:bg-[#3D352E]/40'
            }`}
          >
            Al Día ({counts.upToDate})
          </button>
          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'OVERDUE'
                ? 'bg-[#C84B31] text-white border-[#C84B31]'
                : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#E6DCD2]/40 dark:hover:bg-[#3D352E]/40'
            }`}
          >
            Mora ({counts.overdue})
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'PAID'
                ? 'bg-[#2C221E] dark:bg-[#EAE0D5] text-white dark:text-[#1C1917] border-[#2C221E] dark:border-[#EAE0D5]'
                : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#E6DCD2]/40 dark:hover:bg-[#3D352E]/40'
            }`}
          >
            Finalizados ({counts.paid})
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-[#26221F] rounded-3xl p-12 text-center border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300">
          <Users className="w-12 h-12 text-[#E89D4F] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-base text-[#2C221E] dark:text-[#EAE0D5]">No se encontraron clientes</h3>
          <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-1">
            Intenta con otro término de búsqueda o registra un nuevo cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const clientLoans = loans.filter((l) => (l.clientId === client.id || l.client_id === client.id) && !l.isArchived);
            const activeLoans = clientLoans.filter((l) => l.status !== 'PAID');
            const hasOverdue = clientLoans.some((l) => l.status === 'OVERDUE');

            const activeLoan = activeLoans[0] || (client as any).active_loan || (client as any).activeLoan;

            const loanAmount = Number(
              activeLoan?.amount ??
              activeLoan?.monto ??
              activeLoan?.capital ??
              (client as any).amount ??
              (client as any).monto ??
              (client as any).loan_amount ??
              (client as any).capital ??
              (clientLoans.length > 0 ? clientLoans.reduce((acc: number, l: Loan) => acc + l.capital, 0) : 0)
            );

            const totalRemaining = activeLoans.length > 0
              ? activeLoans.reduce((acc: number, l: Loan) => acc + l.remainingAmount, 0)
              : (activeLoan ? (activeLoan.remainingAmount ?? activeLoan.remaining_amount ?? 0) : 0);

            const dueDateFormatted = getDueDateFormattedSpanish(activeLoan || client);

            const now = new Date();
            const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const hasPaymentToday = (payments || []).some((p) => {
              const pClientId = p?.clientId || p?.client_id;
              const pLoanId = p?.loanId || p?.loan_id;
              const matches = pClientId === client.id || (activeLoan && (pLoanId === activeLoan.id || pLoanId === (activeLoan as any).loan_id));
              if (!matches) return false;
              const pAmount = Number(p?.amount || 0);
              if (pAmount <= 0) return false;
              const pDateStr = String(p?.date || p?.payment_date || (p as any).paymentDate || '').split('T')[0];
              return pDateStr === localTodayStr;
            });

            const isPaidToday = hasPaymentToday || Boolean(client.isPaidToday && Number(client.todayPaidAmount || client.today_paid_amount || 0) > 0);

            let statusLabel = 'Sin Préstamo Activo';
            let statusStyle = 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E]';

            if (hasOverdue) {
              statusLabel = 'En Mora';
              statusStyle = 'bg-[#FDF2F0] dark:bg-[#C84B31]/20 text-[#C84B31] border-[#C84B31]/30';
            } else if (activeLoans.length > 0) {
              statusLabel = 'Al Día';
              statusStyle = 'bg-[#EEF6F2] dark:bg-[#3D9970]/20 text-[#2D7A5D] dark:text-[#3D9970] border-[#2D7A5D]/30 dark:border-[#3D9970]/30';
            }

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-[#26221F] rounded-3xl p-5 border border-[#E6DCD2] dark:border-[#3D352E] hover:border-[#D96B27]/50 dark:hover:border-[#E07A5F]/50 warm-shadow transition-colors duration-300 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FDF3ED] dark:bg-[#E07A5F]/15 text-[#D96B27] dark:text-[#E07A5F] font-black flex items-center justify-center text-base border border-[#D96B27]/20 dark:border-[#E07A5F]/30">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-1.5 flex-wrap">
                          <span>{client.name}</span>
                          {client.alias && (
                            <span className="text-[10px] font-extrabold bg-[#FDF3ED] dark:bg-[#3D261A] text-[#D96B27] dark:text-[#E07A5F] px-2 py-0.5 rounded-full border border-[#D96B27]/30 dark:border-[#E07A5F]/30">
                              ({client.alias})
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-[#E89D4F]" />
                            {client.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToEdit(client);
                        }}
                        className="p-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 text-[#D96B27] dark:text-[#E07A5F] border border-[#E6DCD2] dark:border-[#3D352E] transition-all flex items-center gap-1 text-xs font-semibold px-2"
                        title="Editar datos del cliente"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                          }}
                          className="p-1.5 rounded-xl bg-[#FDF2F0] dark:bg-[#C84B31]/15 hover:bg-[#C84B31] hover:text-white text-[#C84B31] border border-[#C84B31]/30 transition-all text-xs font-semibold"
                          title="Eliminar o Archivar Cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="mt-2 flex justify-between items-center flex-wrap gap-1.5">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                      {statusLabel}
                    </span>
                    {activeLoan && (
                      isPaidToday ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EEF6F2] dark:bg-[#3D9970]/20 text-[#2D7A5D] dark:text-[#3D9970] border border-[#2D7A5D]/30 dark:border-[#3D9970]/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> COBRADO HOY
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDF3ED] dark:bg-[#E07A5F]/20 text-[#D96B27] dark:text-[#E07A5F] border border-[#D96B27]/30 dark:border-[#E07A5F]/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> PAGO PENDIENTE HOY
                        </span>
                      )
                    )}
                  </div>

                  {/* Client Address */}
                  {client.address && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6E615A] dark:text-[#C2B29F] mt-2">
                      <MapPin className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}

                  {/* Client DNI */}
                  {(client.dni || client.documento || client.identification) && (
                    <div className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-1">
                      DNI: <strong className="text-[#2C221E] dark:text-[#EAE0D5]">{client.dni || client.documento || client.identification}</strong>
                    </div>
                  )}

                  {/* Fecha de Vencimiento */}
                  <div className="flex items-center justify-between gap-1 text-xs text-[#6E615A] dark:text-[#C2B29F] mt-1 font-medium flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D96B27] dark:text-[#E07A5F] shrink-0" />
                      <span>Fecha de Vencimiento: <strong className={activeLoan && (activeLoan as any).status !== 'NONE' ? 'text-[#2C221E] dark:text-[#EAE0D5] font-bold' : 'text-[#6E615A] dark:text-[#C2B29F] italic font-normal'}>{dueDateFormatted}</strong></span>
                    </div>
                    <span className="text-[10px] font-bold text-[#D96B27] dark:text-[#E07A5F]">
                      ({renderRemainingDays(client)})
                    </span>
                  </div>

                  {/* Loans Summary Row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 bg-[#FAF8F5] dark:bg-[#1C1917] p-3 rounded-2xl border border-[#E6DCD2]/70 dark:border-[#3D352E] text-xs">
                    <div>
                      <span className="text-[#6E615A] dark:text-[#C2B29F] block">Monto Préstamo:</span>
                      {activeLoan ? (
                        <strong className="text-[#2C221E] dark:text-[#EAE0D5]">{formatCurrency(loanAmount)}</strong>
                      ) : (
                        <span className="text-[#6E615A] dark:text-[#C2B29F] italic">Sin Préstamo Activo</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#6E615A] dark:text-[#C2B29F] block">Saldo Restante:</span>
                      {activeLoan ? (
                        <strong className={totalRemaining > 0 ? 'text-[#C84B31]' : 'text-[#2D7A5D] dark:text-[#3D9970]'}>
                          {formatCurrency(totalRemaining)}
                        </strong>
                      ) : (
                        <span className="text-[#6E615A] dark:text-[#C2B29F] italic">Sin Préstamo Activo</span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedClientForDetail(client)}
                  className="flex items-center justify-between pt-2 text-xs font-semibold text-[#D96B27] dark:text-[#E07A5F] cursor-pointer hover:underline"
                >
                  <span>Ver préstamos e historial completo</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Detail Modal */}
      <ClientDetailModal
        client={selectedClientForDetail}
        loans={selectedClientForDetail ? loans.filter((l) => l.clientId === selectedClientForDetail.id && !l.isArchived) : []}
        payments={selectedClientForDetail ? payments.filter((p) => p.clientId === selectedClientForDetail.id) : []}
        isOpen={!!selectedClientForDetail}
        onClose={() => setSelectedClientForDetail(null)}
        onNewLoanForClient={(client) => {
          onNewLoanForClient(client);
        }}
        onUpdateClient={onUpdateClient}
        onUpdateLoan={onUpdateLoan}
        onDeletePayment={onDeletePayment}
        onUpdatePayment={onUpdatePayment}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        key={clientToEdit?.id}
        client={clientToEdit}
        isOpen={!!clientToEdit}
        onClose={() => setClientToEdit(null)}
        onConfirmEdit={onUpdateClient}
      />

      {/* Smart Delete Modal for Client */}
      <SmartDeleteModal
        target={clientToDelete ? { type: 'CLIENT', item: clientToDelete } : null}
        paymentsCount={clientToDelete ? payments.filter((p) => p.clientId === clientToDelete.id).length : 0}
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirmDelete={async (mode) => {
          if (clientToDelete) {
            await onDeleteClient(clientToDelete.id, mode);
          }
        }}
      />
    </div>
  );
};
