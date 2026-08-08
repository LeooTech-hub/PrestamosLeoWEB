'use client';

import React, { useState } from 'react';
import { Client } from '@/types';
import { X, CheckCircle2, User, Phone, MapPin, FileText } from 'lucide-react';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEdit: (
    id: string,
    data: { name: string; alias?: string; phone: string; address: string; identification?: string; notes?: string }
  ) => Promise<void>;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onConfirmEdit,
}) => {
  const [name, setName] = useState<string>(client?.name || '');
  const [alias, setAlias] = useState<string>(client?.alias || '');
  const [phone, setPhone] = useState<string>(client?.phone || '');
  const [address, setAddress] = useState<string>(client?.address || '');
  const [identification, setIdentification] = useState<string>(client?.identification || '');
  const [notes, setNotes] = useState<string>(client?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor ingrese el teléfono del cliente');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmEdit(client.id, {
        name: name.trim(),
        alias: alias.trim() || undefined,
        phone: phone.trim(),
        address: address.trim(),
        identification: identification.trim(),
        notes: notes.trim(),
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
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
          <div>
            <span className="text-xs font-bold text-[#D96B27] uppercase tracking-wider">
              Edición de Cliente
            </span>
            <h3 className="text-lg font-extrabold text-[#2C221E]">
              {client.name} {client.alias ? `(${client.alias})` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Nombre Completo*:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A89B92] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Apodo / Alias (Opcional):
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] mb-1">
              Teléfono / WhatsApp*:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#A89B92] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Número de teléfono"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] mb-1">
              Dirección / Referencia de Cobro*:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#A89B92] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección o referencia"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] mb-1">
              DNI / Documento:
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#A89B92] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder="Número de DNI"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E615A] mb-1">
              Notas / Observaciones de Cobro:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones de cobro"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] text-[#6E615A] font-bold text-xs hover:bg-[#FAF8F5]"
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
