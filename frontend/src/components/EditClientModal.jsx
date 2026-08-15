import React, { useState, useEffect } from 'react';
import { fetchDniData } from '../utils/reniecHelper';
import { X, User, Phone, MapPin, FileText, CheckCircle2, Search, Loader2, AlertCircle } from 'lucide-react';

export function EditClientModal({ client, isOpen, onClose, onConfirmEdit }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    alias: client?.alias || '',
    phone: client?.phone || '',
    address: client?.address || '',
    identification: client?.identification || client?.dni || client?.documento || '',
    notes: client?.notes || '',
    mora: client?.mora ?? client?.loan_mora ?? client?.penaltyAmount ?? client?.penalty_amount ?? client?.activeLoan?.mora ?? client?.activeLoan?.penaltyAmount ?? client?.activeLoan?.penalty_amount ?? client?.late_fee ?? 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [dniStatusText, setDniStatusText] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        alias: client.alias || '',
        phone: client.phone || '',
        address: client.address || '',
        identification: client.identification || client.dni || client.documento || '',
        notes: client.notes || '',
        mora: client.mora ?? client.loan_mora ?? client.penaltyAmount ?? client.penalty_amount ?? client.activeLoan?.mora ?? client.activeLoan?.penaltyAmount ?? client.activeLoan?.penalty_amount ?? client.late_fee ?? 0,
      });
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDniSearch = async (dniToSearch) => {
    const clean = String(dniToSearch || '').replace(/\D/g, '').slice(0, 8);
    if (clean.length !== 8) return;
 
    setIsSearchingDni(true);
    setDniStatusText('Buscando en RENIEC...');
    try {
      const data = await fetchDniData(clean);
      if (data && data.fullName) {
        handleChange('name', data.fullName);
        setDniStatusText('✓ Nombre autocompletado');
        setTimeout(() => setDniStatusText(''), 3500);
      }
    } catch (err) {
      console.warn('RENIEC Error:', err.response?.data?.error || err.message);
      setDniStatusText('DNI no encontrado. Ingrese el nombre manualmente.');
      setTimeout(() => setDniStatusText(''), 4000);
    } finally {
      setIsSearchingDni(false);
    }
  };

  const handleIdentificationChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 8);
    handleChange('identification', cleanVal);
    if (cleanVal.length === 8) {
      handleDniSearch(cleanVal);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const moraNum = parseFloat(formData.mora) || 0;
      await onConfirmEdit(client.id, {
        name: formData.name.trim(),
        alias: formData.alias?.trim() || undefined,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        identification: formData.identification?.trim() || undefined,
        dni: formData.identification?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        mora: moraNum,
        late_fee: moraNum,
        lateFee: moraNum,
        penalty: moraNum,
        penaltyAmount: moraNum,
        penalty_amount: moraNum,
        recargo: moraNum,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Nombre Completo:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Apodo / Alias (Opcional):
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => handleChange('alias', e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
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
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#6E615A]">
                  DNI:
                </label>
                {isSearchingDni && (
                  <span className="text-[10px] font-bold text-[#D96B27] animate-pulse flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#D96B27]" />
                    RENIEC...
                  </span>
                )}
                {!isSearchingDni && dniStatusText && (
                  <span className="text-[10px] font-semibold text-[#6E615A]">
                    {dniStatusText}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  value={formData.identification}
                  onChange={(e) => handleIdentificationChange(e.target.value)}
                  onBlur={() => {
                    if (formData.identification.length === 8 && !isSearchingDni && !formData.name) {
                      handleDniSearch(formData.identification);
                    }
                  }}
                  placeholder="Opcional"
                  className="w-full pl-3 pr-8 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
                <button
                  type="button"
                  onClick={() => handleDniSearch(formData.identification)}
                  disabled={isSearchingDni || formData.identification.length !== 8}
                  className="absolute right-2 top-2 p-0.5 text-[#6E615A] hover:text-[#D96B27] disabled:opacity-40 transition-colors"
                  title="Buscar DNI en RENIEC"
                >
                  {isSearchingDni ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D96B27]" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
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
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          {/* Mora / Recargo Adicional */}
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Mora / Recargo (S/.):
            </label>
            <div className="relative">
              <AlertCircle className="w-4 h-4 text-[#C84B31] absolute left-3 top-3" />
              <input
                type="number"
                step="any"
                min="0"
                name="mora"
                value={formData.mora}
                onChange={(e) => handleChange('mora', e.target.value === '' ? '' : e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#C84B31] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
            <p className="text-[10px] text-[#6E615A] mt-0.5">
              Aplica recargo o penalidad adicional a la cuenta o préstamo del cliente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Notas / Referencia:
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Observaciones de cobro"
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
