import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import { SmartDeleteModal } from '../components/SmartDeleteModal';
import { EditClientModal } from '../components/EditClientModal';
import { EditLoanModal } from '../components/EditLoanModal';
import { EditPaymentModal } from '../components/EditPaymentModal';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal';
import { AssignCollectorModal } from '../components/AssignCollectorModal';
import api from '../api';
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
  Receipt,
  UserCheck,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';

export function VistaClientes({
  clients = [],
  loans = [],
  payments = [],
  onUpdateClient,
  onUpdateLoan,
  onDeleteClient,
  onDeletePayment,
  onUpdatePayment,
  onAssignPortfolio,
  user,
}) {
  const isAdmin = user && String(user.role || '').toUpperCase() === 'ADMIN';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'UP_TO_DATE', 'OVERDUE', 'PAID'
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('LOANS');
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  // Portfolio assignment state (ADMIN only)
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [collectors, setCollectors] = useState([]);
  const [collectorFilter, setCollectorFilter] = useState('ALL');
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Load collectors list for ADMIN
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/admin/collectors/list')
      .then(res => {
        const list = res.data?.collectors || res.data?.users || (Array.isArray(res.data) ? res.data : []);
        setCollectors(list);
      })
      .catch((err) => {
        console.error('Error al cargar cobradores:', err);
        setCollectors([]);
      });
  }, [isAdmin]);

  const toggleSelectClient = (clientId) => {
    setSelectedClientIds(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClientIds.length === (filteredClients || []).length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds((filteredClients || []).map(c => c?.id).filter(Boolean));
    }
  };

  const handleAssignSuccess = async () => {
    setSelectedClientIds([]);
    setIsSelectMode(false);
    if (onAssignPortfolio) await onAssignPortfolio();
  };

  const handleDeletePaymentClick = async (payment) => {
    if (!onDeletePayment) return;
    const confirmMsg = `¿Deseas anular este pago de ${formatCurrency(payment?.amount)}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingPaymentId(payment?.id);
      await onDeletePayment(payment?.id);
    } catch (err) {
      console.error('Error al anular pago:', err);
      alert(err.response?.data?.error || err.message || 'Error al anular el pago');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const counts = React.useMemo(() => {
    let all = 0;
    let upToDate = 0;
    let overdue = 0;
    let paid = 0;

    (clients || []).forEach((c) => {
      all++;
      const cLoans = (loans || []).filter((l) => (l?.clientId === c?.id || l?.client_id === c?.id) && !l?.isArchived);
      const hasOverdue = cLoans.some((l) => l?.status === 'OVERDUE');
      const hasActive = cLoans.some((l) => l?.status === 'ACTIVE');
      if (hasOverdue) {
        overdue++;
      } else if (hasActive) {
        upToDate++;
      } else if (cLoans.length > 0 && cLoans.every((l) => l?.status === 'PAID')) {
        paid++;
      }
    });

    return { all, upToDate, overdue, paid };
  }, [clients, loans]);

  // Apply collector filter (client-side, from already-filtered list by backend)
  const collectorFilteredClients = React.useMemo(() => {
    if (!isAdmin || collectorFilter === 'ALL') return (clients || []);
    if (collectorFilter === 'UNASSIGNED') {
      return (clients || []).filter(c => !c?.assignedTo && !c?.assigned_to && !c?.assigned_to_user_id);
    }
    return (clients || []).filter(c => c?.assignedTo === collectorFilter || c?.assigned_to === collectorFilter || c?.assigned_to_user_id === collectorFilter);
  }, [clients, isAdmin, collectorFilter]);

  const filteredClients = (collectorFilteredClients || []).filter((client) => {
    const term = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !term ||
      (client?.name || '').toLowerCase().includes(term) ||
      (client?.alias || '').toLowerCase().includes(term) ||
      (client?.phone || '').includes(term) ||
      (client?.address || '').toLowerCase().includes(term) ||
      (client?.identification && String(client.identification).toLowerCase().includes(term));

    if (!matchesSearch) return false;

    const cLoans = (loans || []).filter((l) => (l?.clientId === client?.id || l?.client_id === client?.id) && !l?.isArchived);
    if (statusFilter === 'UP_TO_DATE') {
      const hasActive = cLoans.some((l) => l?.status === 'ACTIVE');
      const hasOverdue = cLoans.some((l) => l?.status === 'OVERDUE');
      return hasActive && !hasOverdue;
    } else if (statusFilter === 'OVERDUE') {
      return cLoans.some((l) => l?.status === 'OVERDUE');
    } else if (statusFilter === 'PAID') {
      return cLoans.length > 0 && cLoans.every((l) => l?.status === 'PAID');
    }

    return true;
  });

  const handleOpenDetail = (client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  const activeSelectedClient = selectedClient ? ((clients || []).find((c) => c?.id === selectedClient?.id) || selectedClient) : null;
  const clientLoans = activeSelectedClient ? (loans || []).filter((l) => l?.clientId === activeSelectedClient?.id || l?.client_id === activeSelectedClient?.id) : [];
  const clientPayments = activeSelectedClient ? (payments || []).filter((p) => p?.clientId === activeSelectedClient?.id || p?.client_id === activeSelectedClient?.id) : [];
  const activeLoans = clientLoans.filter((l) => l?.status !== 'PAID' && !l?.isArchived);
  const paidLoans = clientLoans.filter((l) => l?.status === 'PAID' && !l?.isArchived);

  // collectorFilteredClients is defined above filteredClients

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
              Gestiona el historial de clientes, apodos, préstamos y estado de cartera.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              {isSelectMode ? (
                <>
                  <button
                    onClick={() => { setIsSelectMode(false); setSelectedClientIds([]); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[#E6DCD2] text-[#6E615A] text-xs font-bold hover:bg-stone-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    disabled={selectedClientIds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#2D7A5D] disabled:opacity-50 text-white text-xs font-bold shadow-sm hover:brightness-110 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Asignar ({selectedClientIds.length})</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[#D96B27]/40 bg-[#FDF3ED] text-[#D96B27] text-xs font-bold hover:bg-[#FDEBD8] transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Asignar Cobrador</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={() => navigate('/nuevo-cliente')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl terracotta-gradient text-white text-xs font-extrabold shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Admin Portfolio Filter Bar */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-[#E6DCD2] warm-shadow">
          <Filter className="w-4 h-4 text-[#D96B27] shrink-0" />
          <span className="text-xs font-bold text-[#6E615A] mr-1">Ver Cartera de:</span>
          <button
            onClick={() => setCollectorFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              collectorFilter === 'ALL'
                ? 'terracotta-gradient text-white border-[#D96B27]'
                : 'bg-[#FAF8F5] text-[#6E615A] border-[#E6DCD2] hover:bg-[#FDF3ED]'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setCollectorFilter('UNASSIGNED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              collectorFilter === 'UNASSIGNED'
                ? 'bg-[#6E615A] text-white border-[#6E615A]'
                : 'bg-[#FAF8F5] text-[#6E615A] border-[#E6DCD2] hover:bg-[#FAF8F5]'
            }`}
          >
            Sin Asignar
          </button>
          {collectors.map(col => (
            <button
              key={col.id}
              onClick={() => setCollectorFilter(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                collectorFilter === col.id
                  ? 'bg-[#2D7A5D] text-white border-[#2D7A5D]'
                  : 'bg-[#FAF8F5] text-[#6E615A] border-[#E6DCD2] hover:bg-[#EEF6F2] hover:text-[#2D7A5D]'
              }`}
            >
              👤 {col.name}
            </button>
          ))}
        </div>
      )}

      {/* Search Bar & Advanced Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-[#E89D4F] absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, apodo/alias, teléfono, DNI o dirección..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27] warm-shadow transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {isSelectMode && isAdmin && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border bg-[#FDF3ED] text-[#D96B27] border-[#D96B27]/40 hover:bg-[#FDEBD8]"
            >
              {selectedClientIds.length === filteredClients.length && filteredClients.length > 0
                ? <><CheckSquare className="w-3.5 h-3.5" /> Deseleccionar todo</>
                : <><Square className="w-3.5 h-3.5" /> Seleccionar todo ({filteredClients.length})</>}
            </button>
          )}
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
              statusFilter === 'ALL'
                ? 'terracotta-gradient text-white border-[#D96B27] shadow-xs'
                : 'bg-white text-[#6E615A] border-[#E6DCD2] hover:bg-[#FAF8F5]'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter('UP_TO_DATE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
              statusFilter === 'UP_TO_DATE'
                ? 'bg-[#2D7A5D] text-white border-[#2D7A5D] shadow-xs'
                : 'bg-white text-[#6E615A] border-[#E6DCD2] hover:bg-[#FAF8F5]'
            }`}
          >
            Al Día ({counts.upToDate})
          </button>

          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
              statusFilter === 'OVERDUE'
                ? 'bg-[#C84B31] text-white border-[#C84B31] shadow-xs'
                : 'bg-white text-[#6E615A] border-[#E6DCD2] hover:bg-[#FAF8F5]'
            }`}
          >
            Mora ({counts.overdue})
          </button>

          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
              statusFilter === 'PAID'
                ? 'bg-[#2C221E] text-white border-[#2C221E] shadow-xs'
                : 'bg-white text-[#6E615A] border-[#E6DCD2] hover:bg-[#FAF8F5]'
            }`}
          >
            Finalizados ({counts.paid})
          </button>
        </div>
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
            const isChecked = selectedClientIds.includes(client.id);

            return (
              <div
                key={client.id}
                className={`bg-white rounded-3xl p-5 border warm-shadow hover:border-[#D96B27]/40 transition-all flex flex-col justify-between relative ${
                  isSelectMode && isChecked ? 'border-[#D96B27] ring-2 ring-[#D96B27]/30' : 'border-[#E6DCD2]'
                }`}
              >
                {/* Checkbox overlay for select mode */}
                {isSelectMode && isAdmin && (
                  <button
                    onClick={() => toggleSelectClient(client.id)}
                    className="absolute top-3 left-3 z-10 w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                    title={isChecked ? 'Deseleccionar' : 'Seleccionar'}
                  >
                    {isChecked
                      ? <CheckSquare className="w-5 h-5 text-[#D96B27]" />
                      : <Square className="w-5 h-5 text-[#B5A49A] hover:text-[#D96B27]" />}
                  </button>
                )}
                <div>
                  <div className={`flex items-start justify-between gap-2 border-b border-[#E6DCD2]/60 pb-3 mb-3 ${isSelectMode && isAdmin ? 'pl-7' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FDF3ED] text-[#D96B27] font-black flex items-center justify-center text-base border border-[#D96B27]/20">
                        {client.name ? client.name.charAt(0) : 'C'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#2C221E] flex items-center gap-1.5 flex-wrap">
                          <span>{client.name}</span>
                          {client.alias && (
                            <span className="text-[10px] font-extrabold bg-[#FDF3ED] text-[#D96B27] px-2 py-0.5 rounded-full border border-[#D96B27]/30">
                              ({client.alias})
                            </span>
                          )}
                        </h3>
                        <span className="text-[11px] text-[#6E615A]">
                          Registrado: {formatDatePE((client.createdAt || '').split('T')[0])}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setIsEditClientOpen(true);
                        }}
                        className="p-1.5 rounded-xl text-[#6E615A] hover:bg-[#FDF3ED] hover:text-[#D96B27] transition-all"
                        title="Editar Cliente"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingClient(client)}
                        className="p-1.5 rounded-xl text-[#6E615A] hover:bg-[#FDF2F0] hover:text-[#C84B31] transition-all"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

                    {(client.dni || client.documento || client.identification) && (
                      <div className="text-[11px] text-[#6E615A]">
                        DNI: <strong className="text-[#2C221E]">{client.dni || client.documento || client.identification}</strong>
                      </div>
                    )}
                    {/* Assigned collector badge (ADMIN view) */}
                    {isAdmin && client.assignedToName && (
                      <div className="flex items-center gap-1 text-[11px] text-[#2D7A5D] font-semibold mt-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{client.assignedToName}</span>
                      </div>
                    )}
                    {isAdmin && !client.assignedTo && (
                      <div className="text-[11px] text-[#B5A49A] italic mt-1">Sin cobrador asignado</div>
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
                      onClick={() => navigate('/nuevo-cliente', { state: { selectedClient: client } })}
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
                  {selectedClient?.name ? selectedClient.name.charAt(0) : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2C221E]">
                      {selectedClient?.name || 'Cliente'}
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
                      {selectedClient?.phone || 'Sin teléfono'}
                    </span>
                    {selectedClient?.identification && (
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
                  navigate('/nuevo-cliente', { state: { selectedClient: activeSelectedClient || selectedClient } });
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
                        {activeLoans.map((loan) => {
                          const mora = Number(loan.mora ?? loan.penaltyAmount ?? loan.penalty_amount ?? 0);
                          const total = Number(loan.totalToPay ?? loan.total_amount ?? 0);
                          const amount = Number(loan.capital ?? loan.amount ?? 0);
                          const interest = Number(loan.interestAmount ?? loan.interest ?? 0);
                          const remaining = Number(loan.remainingAmount ?? loan.remaining_amount ?? Math.max(0, total - Number(loan.paidAmount || 0)));

                          return (
                            <div
                              key={loan.id}
                              className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 space-y-2"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <strong className="text-sm font-extrabold text-[#2C221E] block">
                                    {mora > 0
                                      ? `Capital: ${formatCurrency(amount)} + Int: ${formatCurrency(interest)} + Mora: ${formatCurrency(mora)} = ${formatCurrency(total)}`
                                      : `Capital: ${formatCurrency(amount)} + 20% = ${formatCurrency(total)}`}
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
                                  <strong className="text-[#C84B31]">{formatCurrency(remaining)}</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                      className={`bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-3 flex justify-between items-center text-xs transition-all ${
                        deletingPaymentId === payment.id ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <div>
                        <strong className="text-[#2C221E] text-sm block">
                          +{formatCurrency(payment.amount)}
                        </strong>
                        <span className="text-[#6E615A]">
                          {formatDatePE(payment.date)} • {payment.notes || 'Abono'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#E89D4F]/20 text-[#2C221E] font-semibold text-[10px] px-2 py-0.5 rounded-full border border-[#E89D4F]/30">
                          Día {payment.dayNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForReceipt({ payment, loan: loans.find(l => l.id === payment.loanId) })}
                          className="p-1.5 rounded-xl text-[#2D7A5D] hover:text-[#D96B27] hover:bg-[#EEF6F2] border border-[#2D7A5D]/20 hover:border-[#D96B27]/30 transition-all cursor-pointer"
                          title="Generar / Reenviar Constancia de Pago"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        {onUpdatePayment && (
                          <button
                            type="button"
                            onClick={() => setEditingPayment(payment)}
                            className="p-1.5 rounded-xl text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E6DCD2] transition-all cursor-pointer"
                            title="Editar este pago"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentClick(payment)}
                          disabled={deletingPaymentId === payment.id}
                          className="p-1.5 rounded-xl text-[#A89B92] hover:text-[#DC2626] hover:bg-[#FDF2F0] border border-transparent hover:border-[#DC2626]/20 transition-all cursor-pointer disabled:opacity-50"
                          title="Anular / Eliminar este pago"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${deletingPaymentId === payment.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
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
        key={activeSelectedClient?.id}
        client={activeSelectedClient}
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

      <EditPaymentModal
        payment={editingPayment}
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        onConfirmEditPayment={onUpdatePayment}
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

      <PaymentReceiptModal
        isOpen={!!selectedPaymentForReceipt}
        onClose={() => setSelectedPaymentForReceipt(null)}
        payment={selectedPaymentForReceipt?.payment || null}
        client={activeSelectedClient}
        loan={selectedPaymentForReceipt?.loan || null}
      />

      {/* Assign Collector Modal (ADMIN only) */}
      <AssignCollectorModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedClientIds={selectedClientIds}
        collectors={collectors}
        onAssignSuccess={handleAssignSuccess}
      />
    </div>
  );
}
