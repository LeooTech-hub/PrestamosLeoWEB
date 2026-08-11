import React, { useState } from 'react';
import { formatCurrency, calculate20PercentLoan } from '../utils/loanHelpers';
import { fetchDniData } from '../utils/reniecHelper';
import { X, PlusCircle, CheckCircle2, Search, Loader2 } from 'lucide-react';

export function QuickCreateLoanModal({ clients = [], isOpen, onClose, onSubmitLoan }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIdentification, setClientIdentification] = useState('');
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [dniStatusText, setDniStatusText] = useState('');

  const [capital, setCapital] = useState(500);
  const [paymentDays, setPaymentDays] = useState(20);
  const [interestRate, setInterestRate] = useState(20);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes] = useState('');
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

  const handleDniSearch = async (dniToSearch) => {
    const clean = String(dniToSearch || '').replace(/\D/g, '').slice(0, 8);
    if (clean.length !== 8) return;

    setIsSearchingDni(true);
    setDniStatusText('Buscando en RENIEC...');
    try {
      const data = await fetchDniData(clean);
      if (data && data.fullName) {
        setClientName(data.fullName);
        setDniStatusText('✓ Autocompletado');
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
    setClientIdentification(cleanVal);
    if (cleanVal.length === 8) {
      handleDniSearch(cleanVal);
    }
  };

  const calculated = calculateCustomLoan(capital || 0, paymentDays || 20, interestRate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const capNum = Number(capital);
    if (!clientName.trim() || !capNum || capNum <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitLoan({
        clientId: selectedClientId || undefined,
        clientName,
        clientPhone,
        clientAddress,
        clientIdentification,
        capital: capNum,
        amount: capNum,
        interest_rate: Number(interestRate) || 20,
        interestRate: Number(interestRate) || 20,
        paymentDays,
        days: paymentDays,
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
                placeholder=""
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
                  placeholder=""
                  className="w-full px-3 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#6E615A]">
                    DNI (Opcional):
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
                    value={clientIdentification}
                    onChange={(e) => handleIdentificationChange(e.target.value)}
                    onBlur={() => {
                      if (clientIdentification.length === 8 && !isSearchingDni && !clientName) {
                        handleDniSearch(clientIdentification);
                      }
                    }}
                    placeholder="8 dígitos"
                    className="w-full pl-3 pr-8 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDniSearch(clientIdentification)}
                    disabled={isSearchingDni || clientIdentification.length !== 8}
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
                Dirección de Cobro:
              </label>
              <input
                type="text"
                required
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-white border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                PRESTAMO SOLICITADO (S/.):
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={capital || ''}
                onChange={(e) => setCapital(e.target.value === '' ? '' : Number(e.target.value))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Interés / Comisión (%):
              </label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 shrink-0">
                  {[10, 15, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setInterestRate(rate)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                        Number(interestRate) === rate
                          ? 'terracotta-gradient text-white border-[#D96B27]'
                          : 'bg-[#FAF8F5] text-[#6E615A] border-[#E6DCD2] hover:bg-[#FDF3ED]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={interestRate ?? ''}
                    onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="20"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-[#6E615A]">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Días de Pago Acordados:
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={paymentDays}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentDays(val === '' ? '' : Math.min(365, Math.max(1, parseInt(val, 10) || 1)));
                }}
                placeholder="Número de días (1 - 365)"
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#FDF3ED] rounded-2xl border border-[#D96B27]/20 text-xs flex items-center justify-between">
            <div>
              <span className="text-[#6E615A] block">Total a Cobrar (+{interestRate || 20}%):</span>
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
