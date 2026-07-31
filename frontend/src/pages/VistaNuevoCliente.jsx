import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, calculate20PercentLoan } from '../utils/loanHelpers';
import { fetchDniData } from '../utils/reniecHelper';
import { UserPlus, User, Phone, MapPin, Calendar, Percent, CheckCircle2, Sparkles, Search, Loader2 } from 'lucide-react';

export function VistaNuevoCliente({ clients = [], onSubmitLoan }) {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIdentification, setClientIdentification] = useState('');
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [dniStatusText, setDniStatusText] = useState('');

  const [capital, setCapital] = useState(500);
  const [paymentDays, setPaymentDays] = useState(20);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setClientIdentification(cleanVal);
    if (cleanVal.length === 8) {
      handleDniSearch(cleanVal);
    }
  };

  const calculated = calculate20PercentLoan(capital || 0, paymentDays || 20);

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
        paymentDays,
        startDate,
        notes,
      });
      navigate('/prestamos');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#2C221E]">
            Generar Préstamo
          </h2>
          <p className="text-xs text-[#6E615A]">
            Selecciona un cliente existente o registra uno nuevo calculando el total y días acordados.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-3">
            <h3 className="text-sm font-extrabold text-[#2C221E] flex items-center gap-2">
              <User className="w-4 h-4 text-[#D96B27]" />
              <span>Datos del Cliente</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Seleccionar Cliente Existente (Autocompletar):
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
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
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
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#6E615A]">
                    DNI / Identificación (Opcional):
                  </label>
                  {isSearchingDni && (
                    <span className="text-[10px] font-bold text-[#D96B27] animate-pulse flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-[#D96B27]" />
                      Buscando en RENIEC...
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
                    className="w-full pl-3 pr-9 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDniSearch(clientIdentification)}
                    disabled={isSearchingDni || clientIdentification.length !== 8}
                    className="absolute right-2 top-2.5 p-0.5 text-[#6E615A] hover:text-[#D96B27] disabled:opacity-40 transition-colors"
                    title="Buscar DNI en RENIEC"
                  >
                    {isSearchingDni ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D96B27]" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Dirección:
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder=""
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-3">
            <h3 className="text-sm font-extrabold text-[#2C221E] flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#D96B27]" />
              <span>Condiciones del Préstamo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E615A] mb-1">
                  Prestamo / Monto (S/.):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={capital || ''}
                  onChange={(e) => setCapital(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="500"
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-sm font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E615A] mb-1">
                  Fecha de Inicio:
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Días de Pago:
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
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-bold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Observaciones:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones del cliente"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-[#E6DCD2] warm-shadow sticky top-24 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E6DCD2] pb-3">
              <Sparkles className="w-5 h-5 text-[#E89D4F]" />
              <h3 className="font-extrabold text-base text-[#2C221E]">
                Resumen de Liquidación
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-[#6E615A]">Capital Solicitado:</span>
                <strong className="text-[#2C221E]">{formatCurrency(calculated.capital)}</strong>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[#6E615A]">Interés (20% Fijo):</span>
                <strong className="text-[#D96B27]">{formatCurrency(calculated.interestAmount)}</strong>
              </div>

              <div className="flex justify-between py-2 border-t border-b border-[#E6DCD2]/60 text-sm font-extrabold">
                <span className="text-[#2C221E]">Total a Cobrar:</span>
                <span className="text-[#2C221E]">{formatCurrency(calculated.totalToPay)}</span>
              </div>

              <div className="bg-[#EEF6F2] p-3 rounded-2xl border border-[#2D7A5D]/20 space-y-1">
                <span className="text-[10px] font-bold text-[#2D7A5D] uppercase tracking-wider block">
                  Cuota Diaria Estimada
                </span>
                <div className="text-xl font-black text-[#2D7A5D]">
                  {formatCurrency(calculated.dailyPaymentAmount)}
                  <span className="text-xs font-semibold text-[#6E615A] block">
                    x {calculated.paymentDays} días de pago
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Generando...' : 'Confirmar y Otorgar Préstamo'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
