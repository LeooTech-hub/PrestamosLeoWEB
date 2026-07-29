import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import { SmartDeleteModal } from '../components/SmartDeleteModal';
import { EditClientModal } from '../components/EditClientModal';
import { EditLoanModal } from '../components/EditLoanModal';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Eye,
  Trash2,
  X,
  User,
  FileText,
  CreditCard,
  History,
  Pencil,
} from 'lucide-react';

export function VistaClientes({
  clients = [],
  loans = [],
  payments = [],
  onUpdateClient,
  onUpdateLoan,
  onDeleteClient,
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('LOANS');

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      (client.name || '').toLowerCase().includes(term) ||
      (client.phone || '').includes(term) ||
      (client.address || '').toLowerCase().includes(term) ||
      (client.identification && client.identification.includes(term))
    );
  });

  const handleOpenDetail = (client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  const clientLoans = selectedClient ? loans.filter((l) => l.clientId === selectedClient.id) : [];
  const clientPayments = selectedClient ? payments.filter((p) => p.clientId === selectedClient.id) : [];
  const activeLoans = clientLoans.filter((l) => l.status !== 'PAID' && !l.isArchived);
  const paidLoans = clientLoans.filter((l) => l.status === 'PAID' && !l.isArchived);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#2C221E]">
              Directorio de Clientes
            </h2>
            <p className="text-xs text-[#6E615A]">
              Gestiona el historial de clientes, préstamos y pagos registrados.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/nuevo-cliente')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl terracotta-gradient text-white text-xs font-extrabold shadow-sm hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#E89D4F] absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, teléfono, DNI o dirección..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27] warm-shadow transition-all"
        />
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DCD2] warm-shadow">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#6E615A] mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#2C221E]">
            No se encontraron clientes
          </h3>
          <p className="text-xs text-[#6E615A] max-w-sm mx-auto mt-1">
            Intenta cambiar el término de búsqueda o registra un nuevo cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const currentLoans = loans.filter((l) => l.clientId === client.id && !l.isArchived);
            const currentActive = currentLoans.filter((l) => l.status !== 'PAID');
            const totalRemaining = currentActive.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
            const hasOverdue = currentActive.some((l) => l.status === 'OVERDUE');

            return (
              <div
                key={client.id}
                className="bg-white rounded-3xl p-5 border border-[#E6DCD2] warm-shadow hover:border-[#D96B27]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#E6DCD2]/60 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FDF3ED] text-[#D96B27] font-black flex items-center justify-center text-base border border-[#D96B27]/20">
                        {client.name ? client.name.charAt(0) : 'C'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#2C221E] line-clamp-1">
                          {client.name}
                        </h3>
                        <span className="text-[11px] text-[#6E615A]">
                          Registrado: {formatDatePE((client.createdAt || '').split('T')[0])}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingClient(client)}
                      className="p-1.5 rounded-xl text-[#6E615A] hover:bg-[#FDF2F0] hover:text-[#C84B31] transition-all"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#6E615A] mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
                      <span className="font-semibold text-[#2C221E]">{client.phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
                      <span className="line-clamp-1">{client.address || 'Sin dirección'}</span>
                    </div>

                    {client.identification && (
                      <div className="text-[11px] text-[#6E615A]">
                        DNI: <strong className="text-[#2C221E]">{client.identification}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-[#E6DCD2]/60 pt-3 space-y-3">
                  <div className="flex items-center justify-between bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E6DCD2]/70 text-xs">
                    <div>
                      <span className="text-[10px] text-[#6E615A] block">Deuda Total Activa:</span>
                      <strong className={`font-extrabold ${hasOverdue ? 'text-[#C84B31]' : 'text-[#2C221E]'}`}>
                        {formatCurrency(totalRemaining)}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#6E615A] block">Préstamos:</span>
                      <span className="font-bold text-[#D96B27]">
                        {currentActive.length} Activo{currentActive.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenDetail(client)}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#2C221E] hover:bg-[#FDF3ED] hover:text-[#D96B27] transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>

                    <button
                      onClick={() => navigate('/nuevo-cliente')}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-xs hover:brightness-110 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Préstamo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Detail Modal */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-[#E6DCD2] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF3ED] text-[#D96B27] font-black flex items-center justify-center text-lg border border-[#D96B27]/20">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2C221E]">
                      {selectedClient.name}
                    </h3>
                    <button
                      onClick={() => setIsEditClientOpen(true)}
                      className="p-1.5 rounded-xl hover:bg-[#FDF3ED] text-[#D96B27] border border-[#E6DCD2] transition-all"
                      title="Editar Cliente"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E615A] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#E89D4F]" />
                      {selectedClient.phone}
                    </span>
                    {selectedClient.identification && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#E89D4F]" />
                        DNI: {selectedClient.identification}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 bg-[#FAF8F5] px-4 rounded-2xl border border-[#E6DCD2]/70 mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#6E615A]">
                <MapPin className="w-4 h-4 text-[#E89D4F] shrink-0" />
                <span>{selectedClient.address || 'Sin dirección registrada'}</span>
              </div>
              {selectedClient.notes && (
                <div className="flex items-center gap-1 text-[#6E615A] italic">
                  <FileText className="w-3.5 h-3.5 text-[#E89D4F]" />
                  <span>{selectedClient.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-b border-[#E6DCD2] mt-4 pb-2">
              <button
                onClick={() => setActiveTab('LOANS')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'LOANS'
                    ? 'bg-[#2C221E] text-white shadow-xs'
                    : 'text-[#6E615A] hover:bg-[#FAF8F5]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Préstamos ({clientLoans.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('PAYMENTS')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'PAYMENTS'
                    ? 'bg-[#2C221E] text-white shadow-xs'
                    : 'text-[#6E615A] hover:bg-[#FAF8F5]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Historial de Pagos ({clientPayments.length})</span>
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate('/nuevo-cliente');
                }}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-xs hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Préstamo</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {activeTab === 'LOANS' ? (
                clientLoans.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#6E615A]">
                    Este cliente aún no registra préstamos.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLoans.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#D96B27] uppercase tracking-wider block">
                          Préstamos Vigentes ({activeLoans.length})
                        </span>
                        {activeLoans.map((loan) => (
                          <div
                            key={loan.id}
                            className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 space-y-2"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <strong className="text-sm font-extrabold text-[#2C221E] block">
                                  Capital: {formatCurrency(loan.capital)} + 20% = {formatCurrency(loan.totalToPay)}
                                </strong>
                                <span className="text-xs text-[#6E615A]">
                                  Modalidad: {loan.paymentDays} Días de Pago ({formatCurrency(loan.dailyPaymentAmount)}/día)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    loan.status === 'OVERDUE'
                                      ? 'bg-[#FDF2F0] text-[#C84B31] border-[#C84B31]/30'
                                      : 'bg-[#EEF6F2] text-[#2D7A5D] border-[#2D7A5D]/30'
                                  }`}
                                >
                                  {loan.status === 'OVERDUE' ? 'En Mora' : 'Vigente'}
                                </span>

                                <button
                                  onClick={() => setEditingLoan(loan)}
                                  className="p-1 rounded-lg hover:bg-white text-[#D96B27] border border-[#E6DCD2]"
                                  title="Editar Préstamo"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-xl border border-[#E6DCD2]/60">
                              <div>
                                <span className="text-[#6E615A] block text-[10px]">Fecha Inicio:</span>
                                <strong>{formatDatePE(loan.startDate)}</strong>
                              </div>
                              <div>
                                <span className="text-[#6E615A] block text-[10px]">Vencimiento:</span>
                                <strong>{formatDatePE(loan.dueDate)}</strong>
                              </div>
                              <div>
                                <span className="text-[#6E615A] block text-[10px]">Cobrado:</span>
                                <strong className="text-[#2D7A5D]">{formatCurrency(loan.paidAmount)}</strong>
                              </div>
                              <div>
                                <span className="text-[#6E615A] block text-[10px]">Saldo:</span>
                                <strong className="text-[#C84B31]">{formatCurrency(loan.remainingAmount)}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {paidLoans.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-[#2D7A5D] uppercase tracking-wider block">
                          Préstamos Cancelados ({paidLoans.length})
                        </span>
                        {paidLoans.map((loan) => (
                          <div
                            key={loan.id}
                            className="bg-[#EEF6F2]/50 border border-[#2D7A5D]/20 rounded-2xl p-3 text-xs flex justify-between items-center opacity-80"
                          >
                            <div>
                              <strong className="text-[#2C221E] block">
                                {formatCurrency(loan.totalToPay)} ({loan.paymentDays} Días)
                              </strong>
                              <span className="text-[#6E615A]">
                                Inicio: {formatDatePE(loan.startDate)} • Vencía: {formatDatePE(loan.dueDate)}
                              </span>
                            </div>
                            <span className="bg-[#2D7A5D] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                              CANCELADO
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : clientPayments.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6E615A]">
                  No hay pagos registrados para este cliente.
                </div>
              ) : (
                <div className="space-y-2">
                  {clientPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-3 flex justify-between items-center text-xs"
                    >
                      <div>
                        <strong className="text-[#2C221E] text-sm block">
                          +{formatCurrency(payment.amount)}
                        </strong>
                        <span className="text-[#6E615A]">
                          {formatDatePE(payment.date)} • {payment.notes || 'Abono'}
                        </span>
                      </div>
                      <span className="bg-[#E89D4F]/20 text-[#2C221E] font-semibold text-[10px] px-2 py-0.5 rounded-full border border-[#E89D4F]/30">
                        Día {payment.dayNumber}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#E6DCD2] pt-3 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#2C221E] text-white font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <EditClientModal
        client={selectedClient}
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        onConfirmEdit={onUpdateClient}
      />

      <EditLoanModal
        loan={editingLoan}
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        onConfirmEditLoan={onUpdateLoan}
      />

      <SmartDeleteModal
        title="Eliminar Cliente"
        targetName={deletingClient?.name || ''}
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={async (mode) => {
          if (deletingClient) {
            await onDeleteClient(deletingClient.id, mode);
            setDeletingClient(null);
          }
        }}
      />
    </div>
  );
}
