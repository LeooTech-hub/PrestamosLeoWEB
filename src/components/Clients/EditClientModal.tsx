'use client';

import React, { useState, useEffect } from 'react';
import { Client } from '@/types';
import { X, CheckCircle2, User, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEdit: (
    id: string,
    data: {
      name: string;
      alias?: string;
      phone: string;
      address: string;
      identification?: string;
      dni?: string;
      notes?: string;
      mora?: number;
      late_fee?: number;
      lateFee?: number;
      penaltyAmount?: number;
      penalty_amount?: number;
      recargo?: number;
    }
  ) => Promise<void>;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onConfirmEdit,
}) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    alias: client?.alias || '',
    phone: client?.phone || '',
    address: client?.address || '',
    identification: client?.identification || client?.dni || '',
    notes: client?.notes || '',
    mora: (client as any)?.mora ?? (client as any)?.loan_mora ?? (client as any)?.penaltyAmount ?? (client as any)?.penalty_amount ?? (client as any)?.activeLoan?.mora ?? (client as any)?.activeLoan?.penaltyAmount ?? (client as any)?.activeLoan?.penalty_amount ?? (client as any)?.late_fee ?? 0,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        alias: client.alias || '',
        phone: client.phone || '',
        address: client.address || '',
        identification: client.identification || client.dni || '',
        notes: client.notes || '',
        mora: (client as any)?.mora ?? (client as any)?.loan_mora ?? (client as any)?.penaltyAmount ?? (client as any)?.penalty_amount ?? (client as any)?.activeLoan?.mora ?? (client as any)?.activeLoan?.penaltyAmount ?? (client as any)?.activeLoan?.penalty_amount ?? (client as any)?.late_fee ?? 0,
      });
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Por favor ingrese el teléfono del cliente');
      return;
    }

    try {
      setIsSubmitting(true);
      const moraNum = parseFloat(String(formData.mora)) || 0;
      await onConfirmEdit(client.id, {
        name: formData.name.trim(),
        alias: formData.alias.trim() || undefined,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        identification: formData.identification.trim() || undefined,
        dni: formData.identification.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        mora: moraNum,
        late_fee: moraNum,
        lateFee: moraNum,
        penaltyAmount: moraNum,
        penalty_amount: moraNum,
        recargo: moraNum,
      });
      onClose();
    } catch (error) {
      console.error('Error al editar cliente', error);
      alert('Ocurrió un error al actualizar los datos del cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#26221F] rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow-lg relative overflow-hidden transition-colors duration-300">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] dark:border-[#3D352E] pb-4">
          <div>
            <span className="text-xs font-bold text-[#D96B27] dark:text-[#E07A5F] uppercase tracking-wider">
              Edición de Cliente
            </span>
            <h3 className="text-lg font-extrabold text-[#2C221E] dark:text-[#EAE0D5]">
              {client.name} {client.alias ? `(${client.alias})` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                Nombre Completo*:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                Apodo / Alias (Opcional):
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => handleChange('alias', e.target.value)}
                placeholder=""
                className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
              Teléfono / WhatsApp*:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Número de teléfono"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
              Dirección / Referencia de Cobro*:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Dirección o referencia"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
              DNI / Documento:
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.identification}
                onChange={(e) => handleChange('identification', e.target.value)}
                placeholder="Número de DNI"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
              />
            </div>
          </div>

          {/* Mora / Recargo Adicional */}
          <div>
            <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
              Mora / Recargo (S/.):
            </label>
            <div className="relative">
              <AlertCircle className="w-4 h-4 text-[#C84B31] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="any"
                min="0"
                value={formData.mora}
                onChange={(e) => handleChange('mora', e.target.value === '' ? '' : e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-bold text-[#C84B31] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
              />
            </div>
            <p className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
              Aplica recargo o penalidad adicional a la cuenta o préstamo del cliente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
              Notas / Observaciones de Cobro:
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observaciones de cobro"
              className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] font-bold text-xs hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
