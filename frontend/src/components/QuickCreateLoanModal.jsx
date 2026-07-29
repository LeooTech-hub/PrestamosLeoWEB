import React, { useState } from 'react';
import { formatCurrency, calculate20PercentLoan } from '../utils/loanHelpers';
import { X, PlusCircle, CheckCircle2 } from 'lucide-react';

export function QuickCreateLoanModal({ clients = [], isOpen, onClose, onSubmitLoan }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIdentification, setClientIdentification] = useState('');

  const [capital, setCapital] = useState(500);
  const [paymentDays, setPaymentDays] = useState(20);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    const existing = clients.find((c) => c.id === clientId);
    if (existing) {
      setClientName(existing.name);
      setClientPhone(existing.phone);
      setClientAddress(existing.address);
      setClientIdentification(existing.identification || '');
    } else {
      setClientName('');
      setClientPhone('');
      setClientAddress('');
      setClientIdentification('');
    }
  };

  const calculated = calculate20PercentLoan(capital || 0, paymentDays || 20);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !capital || capital <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitLoan({
        clientId: selectedClientId || undefined,
        clientName,
        clientPhone,
        clientAddress,
        clientIdentification,
        capital,
        paymentDays,
        startDate,
        notes,
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
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl terracotta-gradient text-white flex items-center justify-center font-bold shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                + Crear Préstamo Rápido
              </h3>
              <p className="text-xs text-[#6E615A]">
                Selecciona un cliente registrado o ingresa los datos del nuevo.
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Buscar / Seleccionar Cliente Existente:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
            >
              <option value="">-- Registrar Nuevo Cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/60">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Nombre Completo del Cliente:
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#6E615A] mb-1">
                  Teléfono:
                </label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej. 912345678"
                  className="w-full px-3 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E615A] mb-1">
                  DNI (Opcional):
                </label>
                <input
                  type="text"
                  value={clientIdentification}
                  onChange={(e) => setClientIdentification(e.target.value)}
                  placeholder="Ej. 45987654"
                  className="w-full px-3 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Dirección de Cobro:
              </label>
              <input
                type="text"
                required
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Ej. Av. Larco 450"
                className="w-full px-3 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Capital Solicitado (S/.):
              </label>
              <input
                type="number"
                required
                min={50}
                step={50}
                value={capital || ''}
                onChange={(e) => setCapital(Number(e.target.value))}
                placeholder="500"
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-sm font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Fecha de Inicio:
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E615A] mb-1">
              Días de Pago Acordados:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setPaymentDays(days)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    paymentDays === days
                      ? 'terracotta-gradient text-white border-transparent'
                      : 'bg-[#FAF8F5] text-[#2C221E] border-[#E6DCD2]'
                  }`}
                >
                  {days} Días
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#FDF3ED] rounded-2xl border border-[#D96B27]/20 text-xs flex items-center justify-between">
            <div>
              <span className="text-[#6E615A] block">Total a Cobrar (+20%):</span>
              <strong className="text-[#2C221E] text-sm font-extrabold">
                {formatCurrency(calculated.totalToPay)}
              </strong>
            </div>

            <div className="text-right">
              <span className="text-[#6E615A] block">Cuota Diaria:</span>
              <strong className="text-[#2D7A5D] text-sm font-extrabold">
                {formatCurrency(calculated.dailyPaymentAmount)}/día
              </strong>
            </div>
          </div>

          <div className="border-t border-[#E6DCD2] pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DCD2] text-xs font-bold text-[#6E615A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl terracotta-gradient text-white text-xs font-extrabold shadow-sm hover:brightness-110"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrar Préstamo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
