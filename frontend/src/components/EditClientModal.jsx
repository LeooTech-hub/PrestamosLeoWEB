import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';

export function EditClientModal({ client, isOpen, onClose, onConfirmEdit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [identification, setIdentification] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setAddress(client.address || '');
      setIdentification(client.identification || '');
      setNotes(client.notes || '');
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirmEdit(client.id, {
        name,
        phone,
        address,
        identification: identification || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                Editar Datos del Cliente
              </h3>
              <p className="text-xs text-[#6E615A]">
                Actualiza el teléfono, dirección u observaciones.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#6E615A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Nombre Completo:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Teléfono / WhatsApp:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                DNI / Identificación:
              </label>
              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Dirección de Cobranza:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Notas / Referencia:
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Cobrar por las mañanas..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="border-t border-[#E6DCD2] pt-4 mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-xs hover:brightness-110"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
