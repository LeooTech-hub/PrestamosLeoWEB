'use client';

import React, { useState } from 'react';
import { Client, NewClientLoanFormData } from '@/types';
import { calculate20PercentLoan, formatCurrency, formatDatePE } from '@/services/loanService';
import confetti from 'canvas-confetti';
import {
  User,
  UserPlus,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  Percent,
  Sparkles,
  UserCheck,
  CalendarCheck,
} from 'lucide-react';

interface CalculatorViewProps {
  clients: Client[];
  onSubmitLoan: (data: NewClientLoanFormData) => Promise<void>;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  clients,
  onSubmitLoan,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [clientName, setClientName] = useState<string>('');
  const [clientAlias, setClientAlias] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [clientIdentification, setClientIdentification] = useState<string>('');

  const [capital, setCapital] = useState<number>(500); // S/. 500 default
  const [paymentDaysInput, setPaymentDaysInput] = useState<string>('20'); // Free string input
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Capital presets
  const capitalPresets = [100, 200, 500, 1000, 1500, 2000];
  const daysPresets = [10, 15, 20, 30];

  const parsedPaymentDays = Math.max(1, parseInt(paymentDaysInput, 10) || 1);

  // Auto calculate due date: startDate + parsedPaymentDays
  const computeDueDate = (): string => {
    if (!startDate || !parsedPaymentDays) return '';
    const start = new Date(startDate);
    const due = new Date(start);
    due.setDate(due.getDate() + parsedPaymentDays);
    return due.toISOString().split('T')[0];
  };

  const dueDate = computeDueDate();

  // Calculation breakdown
  const breakdown = calculate20PercentLoan(capital, parsedPaymentDays);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'new') {
      setClientName('');
      setClientAlias('');
      setClientPhone('');
      setClientAddress('');
      setClientIdentification('');
    } else {
      const existing = clients.find((c) => c.id === clientId);
      if (existing) {
        setClientName(existing.name);
        setClientAlias(existing.alias || '');
        setClientPhone(existing.phone);
        setClientAddress(existing.address);
        setClientIdentification(existing.identification || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    if (!capital || capital <= 0) {
      alert('Por favor ingrese un monto de capital válido');
      return;
    }

    if (!parsedPaymentDays || parsedPaymentDays <= 0) {
      alert('Por favor ingrese un número válido de días de pago');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitLoan({
        clientId: selectedClientId === 'new' ? undefined : selectedClientId,
        clientName: clientName.trim(),
        clientAlias: clientAlias.trim(),
        alias: clientAlias.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim(),
        clientIdentification: clientIdentification.trim(),
        capital,
        paymentDays: parsedPaymentDays,
        startDate,
        notes: notes.trim(),
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D96B27', '#E89D4F', '#2D7A5D'],
        });
      } catch (err) {
        console.log('Confetti error', err);
      }

      setSuccessMessage(
        `¡Cliente ${clientName} registrado con préstamo de ${formatCurrency(capital)} a ${parsedPaymentDays} días!`
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error al registrar préstamo', error);
      alert('Ocurrió un error al registrar el cliente y préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#D96B27] dark:text-[#E07A5F]" />
            Registrar Cliente y Nuevo Préstamo
          </h2>
          <p className="text-xs sm:text-sm text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
            Alta rápida de clientes en Soles (S/.) con interés del 20% y días de pago acordados.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-[#EEF6F2] dark:bg-[#3D9970]/20 border border-[#2D7A5D]/30 dark:border-[#3D9970]/30 text-[#2D7A5D] dark:text-[#3D9970] p-4 rounded-2xl flex items-center gap-3 warm-shadow">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Personal Data */}
          <div className="bg-white dark:bg-[#26221F] rounded-3xl p-5 sm:p-6 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6DCD2]/60 dark:border-[#3D352E] pb-3">
              <h3 className="font-bold text-base text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D96B27] dark:text-[#E07A5F]" />
                1. Datos Personales del Cliente
              </h3>
            </div>

            {/* Select existing or new */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1.5">
                Cliente Nuevo o Seleccionar de Lista:
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
              >
                <option value="new">➕ Registrar un Cliente Nuevo</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} - 📱 {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                  Nombre Completo*:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Belinda Facundo"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] placeholder-[#A89B92] dark:placeholder-[#C2B29F] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
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
                  value={clientAlias}
                  onChange={(e) => setClientAlias(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                  Teléfono / WhatsApp*:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                  Dirección / Referencia de Cobro*:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                  DNI (Obligatorio):
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#A89B92] dark:text-[#C2B29F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clientIdentification}
                    onChange={(e) => setClientIdentification(e.target.value)}
                    placeholder="45987654"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1">
                  Notas / Observaciones:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de cobro"
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-medium text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Loan Setup */}
          <div className="bg-white dark:bg-[#26221F] rounded-3xl p-5 sm:p-6 border border-[#E6DCD2] dark:border-[#3D352E] warm-shadow transition-colors duration-300 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E6DCD2]/60 dark:border-[#3D352E] pb-3">
              <h3 className="font-bold text-base text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#D96B27] dark:text-[#E07A5F]" />
                2. Condición del Préstamo (S/.)
              </h3>
              <span className="bg-[#FDF3ED] dark:bg-[#3D261A] text-[#D96B27] dark:text-[#E07A5F] text-xs font-extrabold px-2.5 py-1 rounded-full border border-[#D96B27]/20 dark:border-[#E07A5F]/30 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                Interés: 20% Fijo
              </span>
            </div>

            {/* Presets Soles */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-2">
                Montos Frecuentes en Soles:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {capitalPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCapital(preset)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      capital === preset
                        ? 'terracotta-gradient text-white border-transparent shadow-sm'
                        : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#2C221E] dark:text-[#EAE0D5] border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#F5F0EB] dark:hover:bg-[#332D29]'
                    }`}
                  >
                    S/. {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Capital */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1.5">
                Monto Prestado en Soles (S/.):
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-[#D96B27] dark:text-[#E07A5F]">
                  S/.
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={capital || ''}
                  onChange={(e) => setCapital(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="500"
                  className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl font-black text-lg text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40 focus:border-[#D96B27] dark:focus:border-[#E07A5F]"
                  required
                />
              </div>
            </div>

            {/* Payment Days Setup */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]">
                Días de Pago Acordados:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {daysPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPaymentDaysInput(String(preset))}
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all border ${
                      parsedPaymentDays === preset
                        ? 'terracotta-gradient text-white border-transparent'
                        : 'bg-[#FAF8F5] dark:bg-[#1C1917] text-[#6E615A] dark:text-[#C2B29F] border-[#E6DCD2] dark:border-[#3D352E] hover:bg-[#E6DCD2]/30 dark:hover:bg-[#3D352E]/30'
                    }`}
                  >
                    {preset} días
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={paymentDaysInput}
                onChange={(e) => setPaymentDaysInput(e.target.value)}
                placeholder="Número de días (1 - 365)"
                className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-2xl text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40 focus:border-[#D96B27] dark:focus:border-[#E07A5F]"
                required
              />
            </div>

            {/* Dates Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#E89D4F]" />
                  Fecha de Inicio:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E6DCD2] dark:border-[#3D352E] rounded-xl text-xs sm:text-sm font-bold text-[#2C221E] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 dark:focus:ring-[#E07A5F]/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F] mb-1 flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-[#2D7A5D] dark:text-[#3D9970]" />
                  Fecha de Vencimiento (+{parsedPaymentDays} días):
                </label>
                <div className="px-3 py-2 bg-[#EEF6F2] dark:bg-[#3D9970]/15 border border-[#2D7A5D]/30 dark:border-[#3D9970]/30 rounded-xl text-xs sm:text-sm font-black text-[#2D7A5D] dark:text-[#3D9970]">
                  {formatDatePE(dueDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Card & Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-b from-[#2C221E] via-[#382C27] to-[#2C221E] dark:from-[#26221F] dark:via-[#201C19] dark:to-[#1C1917] text-white rounded-3xl p-6 shadow-xl sticky top-20 border border-[#4A3B35] dark:border-[#3D352E]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E89D4F]" />
                Resumen del Acuerdo
              </h3>
              <span className="bg-[#E89D4F]/20 text-[#E89D4F] border border-[#E89D4F]/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Perú S/.
              </span>
            </div>

            <div className="py-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#D5C8BC]">Capital a entregar:</span>
                <span className="font-bold text-white text-base">{formatCurrency(breakdown.capital)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[#E89D4F] font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Interés Ganancia (20%):
                </span>
                <span className="font-extrabold text-[#E89D4F] text-base">
                  +{formatCurrency(breakdown.interestAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Monto Total a Cancelar:</span>
                <span className="font-black text-2xl text-[#E89D4F] tracking-tight">
                  {formatCurrency(breakdown.totalToPay)}
                </span>
              </div>

              {/* Daily Payment Spotlight */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/15 text-center mt-4">
                <span className="text-xs text-[#D5C8BC] uppercase tracking-wider block font-semibold">
                  Cobro diario ({parsedPaymentDays} días acordados)
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1 text-[#D96B27] dark:text-[#E07A5F]">
                  {formatCurrency(breakdown.dailyPaymentAmount)}
                </p>
                <span className="text-[11px] text-[#E89D4F] font-medium mt-1 block">
                  Cobro periódico sugerido
                </span>
              </div>
            </div>

            {/* Terms Summary */}
            <div className="text-xs text-[#D5C8BC] bg-black/20 rounded-2xl p-3.5 space-y-1.5 border border-white/5">
              <div className="flex justify-between">
                <span>Fecha Inicio:</span>
                <strong className="text-white">{formatDatePE(startDate)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Fecha Vencimiento:</span>
                <strong className="text-white">{formatDatePE(dueDate)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Plazo Acordado:</span>
                <strong className="text-white">{parsedPaymentDays} días de pago</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-4 px-6 rounded-2xl terracotta-gradient text-white font-extrabold text-base shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Registrar Cliente & Préstamo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
