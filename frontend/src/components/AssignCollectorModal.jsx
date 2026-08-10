import React, { useState } from 'react';
import { UserCheck, X, Shield, User, Loader2 } from 'lucide-react';
import api from '../api';

export function AssignCollectorModal({
  isOpen,
  onClose,
  selectedClientIds = [],
  collectors = [],
  onAssignSuccess,
}) {
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) {
      setError('Selecciona al menos un cliente');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.put('/clients/assign', {
        clientIds: selectedClientIds,
        collectorId: selectedCollectorId === 'unassigned' ? null : selectedCollectorId,
      });
      if (onAssignSuccess) {
        await onAssignSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al asignar cobrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl max-w-md w-full border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#2C221E] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D96B27]/20 flex items-center justify-center text-[#D96B27]">
              <UserCheck className="w-5 h-5 text-[#E07A5F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Asignar Cliente(s) a Cobrador</h2>
              <p className="text-[11px] text-white/70">
                {selectedClientIds.length} cliente(s) seleccionado(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleAssign} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#6E615A] dark:text-[#C2B29F]">
              Selecciona el Cobrador de Cartera:
            </label>

            <select
              value={selectedCollectorId}
              onChange={(e) => setSelectedCollectorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E6DCD2] dark:border-[#332F2C] bg-[#FAF8F5] dark:bg-[#2A241F] text-[#2C221E] dark:text-[#EAE0D5] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D96B27]/50"
              required
            >
              <option value="">-- Seleccionar Cobrador --</option>
              <option value="unassigned">🚫 Sin Asignar (Quitar Cobrador)</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} ({c.email}) {c.role === 'ADMIN' ? '[ADMIN]' : '[COBRADOR]'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E6DCD2] dark:border-[#332F2C] text-[#6E615A] dark:text-[#C2B29F] font-bold text-xs hover:bg-stone-100 dark:hover:bg-neutral-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCollectorId}
              className="flex-1 py-2.5 rounded-xl bg-[#D96B27] hover:bg-[#C25A19] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Asignando...</span>
                </>
              ) : (
                <span>Confirmar Asignación</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
