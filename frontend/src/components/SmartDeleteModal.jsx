import React, { useState } from 'react';
import { AlertTriangle, Archive, Trash2, X } from 'lucide-react';

export function SmartDeleteModal({ title, targetName, isOpen, onClose, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (mode) => {
    setIsSubmitting(true);
    try {
      await onConfirm(mode);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#C84B31]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-[#2C221E]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#6E615A] mb-4">
          ¿Cómo deseas proceder con <strong className="text-[#2C221E]">{targetName}</strong>?
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleAction('ARCHIVE')}
            disabled={isSubmitting}
            className="w-full p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6DCD2] hover:bg-[#FDF3ED] hover:border-[#D96B27]/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2C221E] group-hover:text-[#D96B27]">
              <Archive className="w-4 h-4 text-[#D96B27]" />
              <span>Archivar (Recomendado)</span>
            </div>
            <p className="text-[11px] text-[#6E615A] mt-1 pl-6">
              Oculta el registro de la vista principal pero conserva el historial de cobranzas intacto.
            </p>
          </button>

          <button
            onClick={() => handleAction('PERMANENT')}
            disabled={isSubmitting}
            className="w-full p-3.5 rounded-2xl bg-[#FDF2F0] border border-[#C84B31]/30 hover:bg-[#C84B31] text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#C84B31] group-hover:text-white">
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Definitivamente</span>
            </div>
            <p className="text-[11px] text-[#6E615A] group-hover:text-white/90 mt-1 pl-6">
              Borra permanentemente este registro y sus pagos asociados de la base de datos.
            </p>
          </button>
        </div>

        <div className="border-t border-[#E6DCD2] pt-3 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] text-xs font-bold text-[#6E615A] border border-[#E6DCD2]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
