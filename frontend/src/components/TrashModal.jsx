import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, X, Users, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../api';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';

export function TrashModal({ isOpen, onClose, onDataChanged }) {
  const [activeTab, setActiveTab] = useState('CLIENTS'); // 'CLIENTS' | 'LOANS'
  const [archivedClients, setArchivedClients] = useState([]);
  const [archivedLoans, setArchivedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [confirmPurgeTarget, setConfirmPurgeTarget] = useState(null); // { id, type: 'client'|'loan', name }

  const fetchTrashData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/trash');
      setArchivedClients(res.data.clients || []);
      setArchivedLoans(res.data.loans || []);
    } catch (err) {
      console.error('Error cargando papelera:', err);
      setArchivedClients([]);
      setArchivedLoans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTrashData();
      setConfirmPurgeTarget(null);
    }
  }, [isOpen, fetchTrashData]);

  if (!isOpen) return null;

  const handleRestoreClient = async (id) => {
    setSubmittingId(id);
    try {
      await api.put(`/clients/${id}/restore`);
      await fetchTrashData();
      if (onDataChanged) await onDataChanged();
    } catch (err) {
      console.error('Error al restaurar cliente:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRestoreLoan = async (id) => {
    setSubmittingId(id);
    try {
      await api.put(`/loans/${id}/restore`);
      await fetchTrashData();
      if (onDataChanged) await onDataChanged();
    } catch (err) {
      console.error('Error al restaurar préstamo:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePurgeClient = async (id) => {
    setSubmittingId(id);
    try {
      await api.delete(`/clients/${id}?mode=PURGE`);
      setConfirmPurgeTarget(null);
      await fetchTrashData();
      if (onDataChanged) await onDataChanged();
    } catch (err) {
      console.error('Error al borrar definitivamente cliente:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePurgeLoan = async (id) => {
    setSubmittingId(id);
    try {
      await api.delete(`/loans/${id}?mode=PURGE`);
      setConfirmPurgeTarget(null);
      await fetchTrashData();
      if (onDataChanged) await onDataChanged();
    } catch (err) {
      console.error('Error al borrar definitivamente préstamo:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center font-bold border border-[#C84B31]/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#2C221E]">
                Papelera de Reciclaje
              </h3>
              <p className="text-xs text-[#6E615A]">
                Restaura registros o elimínalos definitivamente de TiDB Cloud.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E6DCD2] mt-4 pb-2">
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CLIENTS'
                ? 'bg-[#2C221E] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes Eliminados ({archivedClients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOANS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LOANS'
                ? 'bg-[#2C221E] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Préstamos Eliminados ({archivedLoans.length})</span>
          </button>

          <button
            onClick={fetchTrashData}
            title="Recargar Papelera"
            className="ml-auto p-2 rounded-xl hover:bg-[#FAF8F5] text-[#6E615A] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <div className="w-8 h-8 border-3 border-[#D96B27] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#6E615A] font-semibold">Cargando elementos archivados...</p>
            </div>
          ) : activeTab === 'CLIENTS' ? (
            archivedClients.length === 0 ? (
              <div className="text-center py-12 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/70">
                <Trash2 className="w-8 h-8 text-[#6E615A]/40 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#2C221E]">No hay clientes en la papelera</p>
                <p className="text-[11px] text-[#6E615A] mt-0.5">Los clientes eliminados aparecerán aquí.</p>
              </div>
            ) : (
              archivedClients.map((client) => {
                const isSubmitting = submittingId === client.id;
                return (
                  <div
                    key={client.id}
                    className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 warm-shadow"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-extrabold text-[#2C221E]">
                          {client.name}
                        </strong>
                        {client.identification && (
                          <span className="text-[10px] bg-white border border-[#E6DCD2] px-2 py-0.5 rounded-md text-[#6E615A]">
                            DNI: {client.identification}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E615A]">
                        Tel: <span className="font-semibold text-[#2C221E]">{client.phone || 'Sin tel'}</span> • Dir: {client.address || 'Sin dirección'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleRestoreClient(client.id)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EEF6F2] border border-[#2D7A5D]/30 text-[#2D7A5D] text-xs font-extrabold hover:bg-[#2D7A5D] hover:text-white transition-all disabled:opacity-50"
                        title="Restaurar Cliente"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        onClick={() =>
                          setConfirmPurgeTarget({
                            id: client.id,
                            type: 'client',
                            name: client.name,
                          })
                        }
                        disabled={isSubmitting}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FDF2F0] border border-[#C84B31]/30 text-[#C84B31] text-xs font-extrabold hover:bg-[#C84B31] hover:text-white transition-all disabled:opacity-50"
                        title="Eliminar Definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Definitivamente</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : archivedLoans.length === 0 ? (
            <div className="text-center py-12 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/70">
              <Trash2 className="w-8 h-8 text-[#6E615A]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#2C221E]">No hay préstamos en la papelera</p>
              <p className="text-[11px] text-[#6E615A] mt-0.5">Los préstamos eliminados aparecerán aquí.</p>
            </div>
          ) : (
            archivedLoans.map((loan) => {
              const isSubmitting = submittingId === loan.id;
              return (
                <div
                  key={loan.id}
                  className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 warm-shadow"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-extrabold text-[#2C221E]">
                        {loan.clientName}
                      </strong>
                      <span className="text-[10px] bg-[#FDF3ED] text-[#D96B27] font-bold px-2 py-0.5 rounded-md border border-[#D96B27]/20">
                        {formatCurrency(loan.capital)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E615A]">
                      Total: <strong className="text-[#2C221E]">{formatCurrency(loan.totalToPay)}</strong> ({loan.paymentDays} Días) • Inicio: {formatDatePE(loan.startDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleRestoreLoan(loan.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EEF6F2] border border-[#2D7A5D]/30 text-[#2D7A5D] text-xs font-extrabold hover:bg-[#2D7A5D] hover:text-white transition-all disabled:opacity-50"
                      title="Restaurar Préstamo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>

                    <button
                      onClick={() =>
                        setConfirmPurgeTarget({
                          id: loan.id,
                          type: 'loan',
                          name: `Préstamo de ${loan.clientName} (${formatCurrency(loan.capital)})`,
                        })
                      }
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FDF2F0] border border-[#C84B31]/30 text-[#C84B31] text-xs font-extrabold hover:bg-[#C84B31] hover:text-white transition-all disabled:opacity-50"
                      title="Eliminar Definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Definitivamente</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E6DCD2] pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2C221E] text-white font-bold text-xs hover:bg-[#2C221E]/90 transition-all"
          >
            Cerrar
          </button>
        </div>

        {/* Confirm Purge Sub-Modal */}
        {confirmPurgeTarget && (
          <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-5 border border-[#E6DCD2] warm-shadow-lg max-w-md w-full text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center mx-auto border border-[#C84B31]/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-[#2C221E]">
                ¿Eliminar definitivamente?
              </h4>
              <p className="text-xs text-[#6E615A]">
                Estás a punto de borrar de forma irreversible:{' '}
                <strong className="text-[#C84B31]">{confirmPurgeTarget.name}</strong>. Esta acción eliminará físicamente los datos de TiDB Cloud.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setConfirmPurgeTarget(null)}
                  disabled={!!submittingId}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmPurgeTarget.type === 'client') {
                      handlePurgeClient(confirmPurgeTarget.id);
                    } else {
                      handlePurgeLoan(confirmPurgeTarget.id);
                    }
                  }}
                  disabled={!!submittingId}
                  className="px-4 py-2 rounded-xl bg-[#C84B31] text-white text-xs font-extrabold hover:bg-[#C84B31]/90 shadow-xs transition-all disabled:opacity-50"
                >
                  {submittingId ? 'Borrando...' : 'Sí, Eliminar Definitivamente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
