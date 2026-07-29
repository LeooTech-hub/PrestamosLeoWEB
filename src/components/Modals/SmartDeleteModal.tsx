'use client';

import React, { useState } from 'react';
import { Loan, Client } from '@/types';
import { formatCurrency } from '@/services/loanService';
import { AlertTriangle, Archive, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SmartDeleteModalProps {
  target: { type: 'LOAN'; item: Loan } | { type: 'CLIENT'; item: Client } | null;
  paymentsCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (mode: 'ARCHIVE' | 'PERMANENT') => Promise<void>;
}

export const SmartDeleteModal: React.FC<SmartDeleteModalProps> = ({
  target,
  paymentsCount = 0,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [selectedMode, setSelectedMode] = useState<'ARCHIVE' | 'PERMANENT'>('ARCHIVE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !target) return null;

  const isLoan = target.type === 'LOAN';
  const itemName = isLoan ? `Préstamo de ${target.item.clientName}` : target.item.name;
  const hasHistory = paymentsCount > 0 || (isLoan && target.item.paidAmount > 0);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirmDelete(selectedMode);
      onClose();
    } catch (error) {
      console.error('Error en borrado inteligente', error);
      alert('Ocurrió un error al procesar la solicitud de borrado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#E6DCD2] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF2F0] text-[#C84B31] flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#C84B31] uppercase tracking-wider">
                Confirmación de Borrado Seguro
              </span>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                {itemName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        {hasHistory ? (
          <div className="bg-[#FDF2F0] border border-[#C84B31]/30 rounded-2xl p-4 text-xs text-[#C84B31] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>¡Advertencia: Registro con Historial!</span>
            </div>
            <p className="leading-relaxed">
              Este {isLoan ? 'préstamo' : 'cliente'} cuenta con{' '}
              <strong>{paymentsCount} cobro(s) registrado(s)</strong> por{' '}
              <strong>{formatCurrency(isLoan ? target.item.paidAmount : 0)}</strong>. Borrar permanentemente eliminará las transacciones del historial financiero.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#6E615A] leading-relaxed">
            Selecciona la opción de borrado deseada para este registro.
          </p>
        )}

        {/* Mode Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#2C221E]">
            Selecciona la acción a realizar:
          </label>

          {/* Option 1: Archive (Recommended) */}
          <div
            onClick={() => setSelectedMode('ARCHIVE')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              selectedMode === 'ARCHIVE'
                ? 'border-[#2D7A5D] bg-[#EEF6F2] ring-2 ring-[#2D7A5D]/20'
                : 'border-[#E6DCD2] bg-[#FAF8F5] hover:bg-[#F5F0EB]'
            }`}
          >
            <div className="p-2 rounded-xl bg-white text-[#2D7A5D] shadow-xs shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between font-bold text-[#2C221E]">
                <span>Archivar / Marcar Inactivo</span>
                <span className="text-[10px] bg-[#2D7A5D] text-white font-bold px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>
              <p className="text-[#6E615A] text-[11px] mt-0.5">
                Conserva el historial de pagos y reportes financieros, ocultándolo de la ruta de cobro diaria.
              </p>
            </div>
          </div>

          {/* Option 2: Permanent Delete */}
          <div
            onClick={() => setSelectedMode('PERMANENT')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              selectedMode === 'PERMANENT'
                ? 'border-[#C84B31] bg-[#FDF2F0] ring-2 ring-[#C84B31]/20'
                : 'border-[#E6DCD2] bg-[#FAF8F5] hover:bg-[#F5F0EB]'
            }`}
          >
            <div className="p-2 rounded-xl bg-white text-[#C84B31] shadow-xs shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold text-[#C84B31] block">
                Eliminar Definitivamente
              </span>
              <p className="text-[#6E615A] text-[11px] mt-0.5">
                Borra irreversiblemente el registro de la base de datos local.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] text-[#6E615A] font-bold text-xs hover:bg-[#FAF8F5]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-2xl text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
              selectedMode === 'ARCHIVE'
                ? 'sage-gradient hover:brightness-110'
                : 'bg-[#C84B31] hover:bg-[#AA3D26]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{selectedMode === 'ARCHIVE' ? 'Confirmar Archivado' : 'Eliminar Ahora'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
