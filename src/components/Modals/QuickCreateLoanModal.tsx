'use client';

import React, { useState } from 'react';
import { Client, NewClientLoanFormData } from '@/types';
import { calculate20PercentLoan, formatCurrency, formatDatePE } from '@/services/loanService';
import confetti from 'canvas-confetti';
import {
  X,
  Search,
  CheckCircle2,
  DollarSign,
  Calendar,
  CalendarCheck,
  UserCheck,
  UserPlus,
  Percent,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface QuickCreateLoanModalProps {
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitLoan: (data: NewClientLoanFormData) => Promise<void>;
  onRedirectToNewClient: () => void;
}

export const QuickCreateLoanModal: React.FC<QuickCreateLoanModalProps> = ({
  clients,
  isOpen,
  onClose,
  onSubmitLoan,
  onRedirectToNewClient,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Loan condition states
  const [capital, setCapital] = useState<number>(500);
  const [paymentDaysInput, setPaymentDaysInput] = useState<string>('20');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter clients for predictive search
  const matchingClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.identification && c.identification.includes(q)) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const parsedPaymentDays = Math.max(1, parseInt(paymentDaysInput, 10) || 1);

  const computeDueDate = (): string => {
    if (!startDate || !parsedPaymentDays) return '';
    const start = new Date(startDate);
    const due = new Date(start);
    due.setDate(due.getDate() + parsedPaymentDays);
    return due.toISOString().split('T')[0];
  };

  const dueDate = computeDueDate();
  const breakdown = calculate20PercentLoan(capital, parsedPaymentDays);
  const daysPresets = [10, 15, 20, 30];
  const capitalPresets = [100, 200, 500, 1000, 1500, 2000];

  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    setSearchQuery(c.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      alert('Por favor selecciona un cliente de la lista predictiva');
      return;
    }

    if (!capital || capital <= 0) {
      alert('Por favor ingresa un monto de capital válido');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitLoan({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phone,
        clientAddress: selectedClient.address,
        clientIdentification: selectedClient.identification,
        capital,
        paymentDays: parsedPaymentDays,
        startDate,
        notes: notes.trim(),
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#D96B27', '#E89D4F', '#2D7A5D'],
        });
      } catch (err) {
        console.log('Confetti error', err);
      }

      onClose();
    } catch (error) {
      console.error('Error creando préstamo rápido', error);
      alert('Ocurrió un error al registrar el préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6DCD2] warm-shadow-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
          <div>
            <span className="text-xs font-bold text-[#D96B27] uppercase tracking-wider">
              Nuevo Préstamo Rápido
            </span>
            <h3 className="text-lg font-extrabold text-[#2C221E]">
              Búsqueda Predictiva de Cliente
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
          {/* Predictive Client Search */}
          <div>
            <label className="block text-xs font-bold text-[#2C221E] mb-1.5">
              1. Buscar Cliente (por Nombre, Teléfono o DNI):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#A89B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedClient && e.target.value !== selectedClient.name) {
                    setSelectedClient(null);
                  }
                }}
                placeholder="Buscar cliente registrado..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-xs sm:text-sm font-semibold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
              />
            </div>

            {/* Predictive Dropdown Suggestions */}
            {!selectedClient && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-[#E6DCD2] rounded-2xl bg-[#FAF8F5] p-1.5 space-y-1">
                {matchingClients.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#6E615A]">
                    <span>No se encontró ningún cliente.</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRedirectToNewClient();
                      }}
                      className="block mx-auto mt-1 font-bold text-[#D96B27] hover:underline"
                    >
                      ➕ Registrar como Cliente Nuevo
                    </button>
                  </div>
                ) : (
                  matchingClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectClient(c)}
                      className="p-2.5 rounded-xl hover:bg-white hover:border-[#D96B27]/30 border border-transparent cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-[#2C221E] block">{c.name}</strong>
                        <span className="text-[#6E615A] text-[11px]">
                          📱 {c.phone} {c.address ? `• 📍 ${c.address}` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#2D7A5D] bg-[#EEF6F2] px-2 py-0.5 rounded-full">
                        Seleccionar
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Client Card */}
            {selectedClient && (
              <div className="mt-2 bg-[#EEF6F2] border border-[#2D7A5D]/30 rounded-2xl p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#2D7A5D]" />
                  <div>
                    <strong className="text-[#2C221E] block">{selectedClient.name}</strong>
                    <span className="text-[#6E615A] text-[11px]">📱 {selectedClient.phone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="text-[11px] font-bold text-[#C84B31] hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Loan Setup Section (Active when client is selected or chosen) */}
          <div className="space-y-4 pt-2 border-t border-[#E6DCD2]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2C221E] flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-[#D96B27]" />
                2. Condiciones del Préstamo (S/.)
              </span>
              <span className="text-[11px] font-bold text-[#D96B27] bg-[#FDF3ED] px-2 py-0.5 rounded-full">
                20% Interés
              </span>
            </div>

            {/* Presets Soles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {capitalPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCapital(preset)}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all ${
                    capital === preset
                      ? 'terracotta-gradient text-white border-transparent shadow-xs'
                      : 'bg-[#FAF8F5] text-[#2C221E] border-[#E6DCD2]'
                  }`}
                >
                  S/. {preset}
                </button>
              ))}
            </div>

            {/* Custom Capital */}
            <div>
              <label className="block text-xs font-semibold text-[#6E615A] mb-1">
                Monto Prestado en Soles:
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={capital || ''}
                onChange={(e) => setCapital(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl text-base font-extrabold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40"
                required
              />
            </div>

            {/* Payment Days */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#6E615A]">
                Días de Pago Acordados:
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={paymentDaysInput}
                onChange={(e) => setPaymentDaysInput(e.target.value)}
                placeholder="Número de días (1 - 365)"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#D96B27]/40 focus:border-[#D96B27]"
                required
              />
            </div>

            {/* Dates Calculation */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#6E615A] font-semibold mb-1">Fecha Inicio:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[#6E615A] font-semibold mb-1">Vencimiento (+{parsedPaymentDays}d):</label>
                <div className="px-2.5 py-1.5 bg-[#EEF6F2] border border-[#2D7A5D]/30 rounded-xl font-black text-[#2D7A5D]">
                  {formatDatePE(dueDate)}
                </div>
              </div>
            </div>

            {/* Breakdown Card */}
            <div className="bg-[#FAF8F5] border border-[#E6DCD2] rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6E615A]">Interés (20%):</span>
                <strong className="text-[#E89D4F]">+{formatCurrency(breakdown.interestAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E615A]">Total a Cancelar:</span>
                <strong className="text-[#2C221E] font-black">{formatCurrency(breakdown.totalToPay)}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E6DCD2]">
                <span className="text-[#6E615A] font-semibold">Cobro Diario:</span>
                <strong className="text-[#D96B27] font-black">{formatCurrency(breakdown.dailyPaymentAmount)} / día</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#E6DCD2] text-[#6E615A] font-bold text-xs hover:bg-[#FAF8F5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedClient}
              className="flex-1 py-3 rounded-2xl terracotta-gradient text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Crear Préstamo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
