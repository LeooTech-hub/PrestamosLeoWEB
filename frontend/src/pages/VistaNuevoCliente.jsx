import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency, calculate20PercentLoan, formatDatePE } from '../utils/loanHelpers';
import { fetchDniData } from '../utils/reniecHelper';
import { UserPlus, User, Phone, MapPin, Calendar, Percent, CheckCircle2, Sparkles, Search, Loader2, Lock } from 'lucide-react';

const formatDateToISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDaysToDateStr = (startDateStr, days) => {
  if (!startDateStr) return '';
  const numDays = parseInt(days, 10);
  if (isNaN(numDays) || numDays <= 0) return startDateStr;
  const [y, m, d] = startDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + numDays);
  return formatDateToISO(dt);
};

const getDaysDifferenceBetweenDates = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 1;
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

export function VistaNuevoCliente({ clients = [], onSubmitLoan }) {
  const navigate = useNavigate();
  const location = useLocation();
  const capitalInputRef = useRef(null);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAlias, setClientAlias] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIdentification, setClientIdentification] = useState('');
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [dniStatusText, setDniStatusText] = useState('');

  const [capital, setCapital] = useState();
  const [paymentDays, setPaymentDays] = useState(20);
  const [interestRate, setInterestRate] = useState(20);
  const initialStartDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(() => addDaysToDateStr(initialStartDate, 20));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Escuchar si viene información de cliente desde location.state (+ Préstamo en tarjeta)
  useEffect(() => {
    const incomingClient = location.state?.selectedClient || location.state?.client;
    if (incomingClient) {
      const targetId = incomingClient.id || location.state?.clientId;
      const existing = clients.find((c) => c.id === targetId) || incomingClient;
      if (existing) {
        queueMicrotask(() => {
          setSelectedClientId(existing.id || targetId || '');
          setClientName(existing.name || '');
          setClientAlias(existing.alias || '');
          setClientPhone(existing.phone || '');
          setClientAddress(existing.address || '');
          setClientIdentification(existing.identification || '');
        });

        setTimeout(() => {
          if (capitalInputRef.current) {
            capitalInputRef.current.focus();
            capitalInputRef.current.select();
          }
        }, 100);
      }
    }
  }, [location.state, clients]);

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    const existing = clients.find((c) => c.id === clientId);
    if (existing) {
      setClientName(existing.name || '');
      setClientAlias(existing.alias || '');
      setClientPhone(existing.phone || '');
      setClientAddress(existing.address || '');
      setClientIdentification(existing.identification || '');

      setTimeout(() => {
        if (capitalInputRef.current) {
          capitalInputRef.current.focus();
          capitalInputRef.current.select();
        }
      }, 50);
    } else {
      setClientName('');
      setClientAlias('');
      setClientPhone('');
      setClientAddress('');
      setClientIdentification('');
    }
  };

  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);
    if (paymentDays && Number(paymentDays) > 0) {
      setEndDate(addDaysToDateStr(newStartDate, paymentDays));
    } else if (endDate) {
      const diff = getDaysDifferenceBetweenDates(newStartDate, endDate);
      setPaymentDays(diff);
    }
  };

  const handlePaymentDaysChange = (val) => {
    const clean = val === '' ? '' : Math.min(365, Math.max(1, parseInt(val, 10) || 1));
    setPaymentDays(clean);
    if (clean && startDate) {
      setEndDate(addDaysToDateStr(startDate, clean));
    }
  };

  const handleEndDateChange = (newEndDate) => {
    setEndDate(newEndDate);
    if (newEndDate && startDate) {
      const diff = getDaysDifferenceBetweenDates(startDate, newEndDate);
      setPaymentDays(diff);
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

  const calculated = calculate20PercentLoan(capital || 0, paymentDays || 20, interestRate);
  const isClientLocked = Boolean(selectedClientId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const capNum = Number(capital);
    if (!clientName.trim() || !capNum || capNum <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitLoan({
        clientId: selectedClientId || undefined,
        clientName,
        alias: clientAlias,
        clientAlias,
        clientPhone,
        clientAddress,
        clientIdentification,
        capital: capNum,
        amount: capNum,
        interest_rate: Number(interestRate) || 20,
        interestRate: Number(interestRate) || 20,
        paymentDays: Number(paymentDays) || 20,
        days: Number(paymentDays) || 20,
        startDate,
        dueDate: endDate,
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
      <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow flex items-center gap-3 transition-colors duration-300">
        <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#2C221E] dark:text-[#F3F4F6]">
            Generar Préstamo
          </h2>
          <p className="text-xs text-[#6E615A] dark:text-[#E5E7EB]">
            Selecciona un cliente existente o registra uno nuevo calculando el total y días acordados.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-3 transition-colors duration-300">
            <h3 className="text-sm font-extrabold text-[#2C221E] dark:text-[#F3F4F6] flex items-center gap-2">
              <User className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
              <span>Datos del Cliente</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1">
                Seleccionar Cliente Existente (Autocompletar):
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
              >
                <option value="">-- Registrar Nuevo Cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {isClientLocked && (
              <div className="p-3 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#D96B27] font-bold">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Cliente autocompletado. Datos personales bloqueados para evitar duplicados.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleClientSelect('')}
                  className="text-[11px] underline font-bold text-[#6E615A] hover:text-[#D96B27] whitespace-nowrap ml-2"
                >
                  Cambiar cliente
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E615A] mb-1">
                  Nombre y Apellidos:
                </label>
                <input
                  type="text"
                  required
                  disabled={isClientLocked}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Leonardo Rodriguez Rodriguez"
                  className={`w-full px-3 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none transition-all ${
                    isClientLocked
                      ? 'bg-[#FAF8F5] border-[#E6DCD2] text-[#6E615A] cursor-not-allowed opacity-85'
                      : 'bg-[#FAF8F5] border-[#E6DCD2] text-[#2C221E] focus:border-[#D96B27]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E615A] mb-1">
                  Apodo (Opcional):
                </label>
                <input
                  type="text"
                  disabled={isClientLocked}
                  value={clientAlias}
                  onChange={(e) => setClientAlias(e.target.value)}
                  placeholder="Lud"
                  className={`w-full px-3 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none transition-all ${
                    isClientLocked
                      ? 'bg-[#FAF8F5] border-[#E6DCD2] text-[#6E615A] cursor-not-allowed opacity-85'
                      : 'bg-[#FAF8F5] border-[#E6DCD2] text-[#2C221E] focus:border-[#D96B27]'
                  }`}
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
                    disabled={isClientLocked}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder=""
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none transition-all ${
                      isClientLocked
                        ? 'bg-[#FAF8F5] border-[#E6DCD2] text-[#6E615A] cursor-not-allowed opacity-85'
                        : 'bg-[#FAF8F5] border-[#E6DCD2] text-[#2C221E] focus:border-[#D96B27]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#6E615A]">
                    DNI (Obligatorio):
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
                    disabled={isClientLocked}
                    value={clientIdentification}
                    onChange={(e) => handleIdentificationChange(e.target.value)}
                    onBlur={() => {
                      if (!isClientLocked && clientIdentification.length === 8 && !isSearchingDni && !clientName) {
                        handleDniSearch(clientIdentification);
                      }
                    }}
                    placeholder="8 dígitos"
                    className={`w-full pl-3 pr-9 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none transition-all ${
                      isClientLocked
                        ? 'bg-[#FAF8F5] border-[#E6DCD2] text-[#6E615A] cursor-not-allowed opacity-85'
                        : 'bg-[#FAF8F5] border-[#E6DCD2] text-[#2C221E] focus:border-[#D96B27]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDniSearch(clientIdentification)}
                    disabled={isClientLocked || isSearchingDni || clientIdentification.length !== 8}
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
                  disabled={isClientLocked}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder=""
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none transition-all ${
                    isClientLocked
                      ? 'bg-[#FAF8F5] border-[#E6DCD2] text-[#6E615A] cursor-not-allowed opacity-85'
                      : 'bg-[#FAF8F5] border-[#E6DCD2] text-[#2C221E] focus:border-[#D96B27]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Sección de Condiciones del Préstamo */}
          <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow space-y-3 transition-colors duration-300">
            <h3 className="text-sm font-extrabold text-[#2C221E] dark:text-[#F3F4F6] flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
              <span>Condiciones del Préstamo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1">
                  Monto:
                </label>
                <input
                  ref={capitalInputRef}
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={capital || ''}
                  onChange={(e) => setCapital(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder=""
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl text-sm font-extrabold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1">
                  Fecha de Inicio:
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1">
                  Interés (%):
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
                            : 'bg-[#FAF8F5] dark:bg-[#24211E] text-[#6E615A] dark:text-[#E5E7EB] border-[#E6DCD2] dark:border-[#332F2C] hover:bg-[#FDF3ED]'
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
                      className="w-full px-3 py-1.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl text-xs font-bold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs font-bold text-[#6E615A]">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1">
                  Días:
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={paymentDays}
                  onChange={(e) => handlePaymentDaysChange(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl text-xs font-bold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1 flex items-center justify-between">
                  <span>Fecha de vencimiento:</span>
                  {endDate && (
                    <span className="text-[11px] font-extrabold text-[#2D7A5D] dark:text-[#3D9970]">
                      {formatDatePE(endDate)}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] dark:text-[#E5E7EB] mb-1">
                Observaciones:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones del cliente"
                className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-2xl text-xs font-medium text-[#2C221E] dark:text-[#F3F4F6] focus:outline-none focus:border-[#D96B27]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl border border-[#E6DCD2] dark:border-[#332F2C] warm-shadow sticky top-24 space-y-4 transition-colors duration-300">
            <div className="flex items-center gap-2 border-b border-[#E6DCD2] dark:border-[#332F2C] pb-3">
              <Sparkles className="w-5 h-5 text-[#E89D4F]" />
              <h3 className="font-extrabold text-base text-[#2C221E] dark:text-[#F3F4F6]">
                Resumen de Liquidación
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-[#6E615A] dark:text-[#E5E7EB]">Capital Solicitado:</span>
                <strong className="text-[#2C221E] dark:text-[#F3F4F6]">{formatCurrency(calculated.capital)}</strong>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[#6E615A] dark:text-[#E5E7EB]">Interés ({calculated.interestRate}%):</span>
                <strong className="text-[#D96B27] dark:text-[#E07A5F]">{formatCurrency(calculated.interestAmount)}</strong>
              </div>

              <div className="flex justify-between py-2 border-t border-b border-[#E6DCD2]/60 dark:border-[#332F2C] text-sm font-extrabold">
                <span className="text-[#2C221E] dark:text-[#F3F4F6]">Total a Cobrar:</span>
                <span className="text-[#2C221E] dark:text-[#F3F4F6]">{formatCurrency(calculated.totalToPay)}</span>
              </div>

              <div className="space-y-1 py-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E615A]">Fecha Inicio:</span>
                  <span className="font-bold text-[#2C221E]">{formatDatePE(startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E615A]">Fecha Vencimiento:</span>
                  <span className="font-bold text-[#2D7A5D]">{formatDatePE(endDate)}</span>
                </div>
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

