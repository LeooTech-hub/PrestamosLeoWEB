'use client';

import React, { useState } from 'react';
import { Client, Loan, Payment } from '@/types';
import { formatCurrency } from '@/services/loanService';
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
    data: { capital: number; paymentDays: number; startDate: string; notes?: string }
  ) => Promise<void>;
  onDeleteClient: (clientId: string, mode: 'ARCHIVE' | 'PERMANENT') => Promise<void>;
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
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Active unarchived clients
  const activeClients = clients.filter((c) => c.status === 'ACTIVE');

  // Search filter
  const filteredClients = activeClients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.phone.includes(q) ||
      client.address.toLowerCase().includes(q) ||
      (client.identification && client.identification.includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C221E] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D96B27]" />
            Gestión de Clientes & Historial
          </h2>
          <p className="text-xs sm:text-sm text-[#6E615A] mt-0.5">
            Directorio de clientes, edición, borrado inteligente e historial de créditos en Soles (S/.).
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

      {/* Search Input */}
      <div className="bg-white rounded-3xl p-4 border border-[#E6DCD2] warm-shadow">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A89B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono, dirección o DNI..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
          />
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E6DCD2] warm-shadow">
          <Users className="w-12 h-12 text-[#A89B92] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-base text-[#2C221E]">No se encontraron clientes</h3>
          <p className="text-xs text-[#6E615A] mt-1">
            Intenta con otro término de búsqueda o registra un nuevo cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const clientLoans = loans.filter((l) => l.clientId === client.id && !l.isArchived);
            const activeLoans = clientLoans.filter((l) => l.status !== 'PAID');
            const hasOverdue = clientLoans.some((l) => l.status === 'OVERDUE');

            const totalBorrowed = clientLoans.reduce((acc, l) => acc + l.capital, 0);
            const totalRemaining = activeLoans.reduce((acc, l) => acc + l.remainingAmount, 0);

            let statusLabel = 'Sin Préstamos Activos';
            let statusStyle = 'bg-[#FAF8F5] text-[#6E615A] border-[#E6DCD2]';

            if (hasOverdue) {
              statusLabel = 'En Mora';
              statusStyle = 'bg-[#FDF2F0] text-[#C84B31] border-[#C84B31]/30';
            } else if (activeLoans.length > 0) {
              statusLabel = 'Al Día';
              statusStyle = 'bg-[#EEF6F2] text-[#2D7A5D] border-[#2D7A5D]/30';
            }

            return (
              <div
                key={client.id}
                className="bg-white rounded-3xl p-5 border border-[#E6DCD2] hover:border-[#D96B27]/50 warm-shadow transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FDF3ED] text-[#D96B27] font-black flex items-center justify-center text-base border border-[#D96B27]/20">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-[#2C221E]">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#6E615A] mt-0.5">
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
                        className="p-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FDF3ED] text-[#D96B27] border border-[#E6DCD2] transition-all flex items-center gap-1 text-xs font-semibold px-2"
                        title="Editar datos del cliente"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToDelete(client);
                        }}
                        className="p-1.5 rounded-xl bg-[#FDF2F0] hover:bg-[#C84B31] hover:text-white text-[#C84B31] border border-[#C84B31]/30 transition-all text-xs font-semibold"
                        title="Eliminar o Archivar Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Client Address */}
                  {client.address && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6E615A] mt-2">
                      <MapPin className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}

                  {/* Loans Summary Row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]/70 text-xs">
                    <div>
                      <span className="text-[#6E615A] block">Total Prestaron:</span>
                      <strong className="text-[#2C221E]">{formatCurrency(totalBorrowed)}</strong>
                    </div>
                    <div>
                      <span className="text-[#6E615A] block">Saldo Restante:</span>
                      <strong className={totalRemaining > 0 ? 'text-[#C84B31]' : 'text-[#2D7A5D]'}>
                        {formatCurrency(totalRemaining)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedClientForDetail(client)}
                  className="flex items-center justify-between pt-2 text-xs font-semibold text-[#D96B27] cursor-pointer hover:underline"
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
      />

      {/* Edit Client Modal */}
      <EditClientModal
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
