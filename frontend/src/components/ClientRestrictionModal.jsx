import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { isClientRestricted } from '../utils/clientRestriction';

export function ClientRestrictionModal({ client, isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const restricted = isClientRestricted(client);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, client?.id]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(client.id, {
        isRestricted: !restricted,
        reason: restricted ? undefined : reason.trim() || undefined,
      });
      onClose();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || requestError?.message || 'No se pudo actualizar la restricción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1E1E1E] rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${restricted ? 'bg-[#EEF6F2] text-[#2D7A5D]' : 'bg-[#FDF2F0] text-[#C84B31]'}`}>
              {restricted ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#2C221E] dark:text-[#F3F4F6]">
                {restricted ? 'Quitar restricción' : 'Restringir cliente'}
              </h3>
              <p className="text-xs text-[#6E615A] dark:text-[#C2B29F]">{client.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-[#6E615A] hover:bg-[#FAF8F5]" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] text-xs leading-5 text-[#6E615A] dark:text-[#E5E7EB]">
          {restricted ? (
            <p>El cliente volverá a aparecer en préstamos, notificaciones, ruta diaria y Dashboard, y podrá recibir nuevos préstamos. Todo su historial se conserva.</p>
          ) : (
            <p>Este cliente dejará de aparecer en las vistas operativas de préstamos y en las notificaciones. Su historial, préstamos, pagos y deuda <strong>NO serán eliminados</strong>. Podrás quitar la restricción posteriormente.</p>
          )}
        </div>

        {!restricted && (
          <label className="block mt-4 text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB]">
            Motivo de restricción <span className="font-normal">(opcional)</span>
            <textarea
              value={reason}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej. deuda incobrable, cliente no ubicable…"
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-2xl bg-white dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#C84B31]"
            />
          </label>
        )}

        {error && <p className="mt-3 text-xs font-semibold text-[#C84B31]">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-xl border border-[#E6DCD2] text-xs font-bold text-[#6E615A] disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white disabled:opacity-50 ${restricted ? 'bg-[#2D7A5D]' : 'bg-[#C84B31]'}`}>
            {isSubmitting ? 'Guardando…' : restricted ? 'Quitar restricción' : 'Restringir cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
