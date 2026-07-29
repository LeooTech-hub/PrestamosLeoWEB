'use client';

import React, { useState } from 'react';
import { Client, Loan, Payment } from '@/types';
import { formatCurrency, formatDatePE } from '@/services/loanService';
import { EditClientModal } from './EditClientModal';
import { EditLoanModal } from './EditLoanModal';
import {
  X,
  Phone,
  CreditCard,
  History,
  CheckCircle2,
  Plus,
  Pencil,
} from 'lucide-react';

interface ClientDetailModalProps {
  client: Client | null;
  loans: Loan[];
  payments: Payment[];
  isOpen: boolean;
  onClose: () => void;
  onNewLoanForClient: (client: Client) => void;
  onUpdateClient: (
    id: string,
    data: { name: string; phone: string; address: string; identification?: string; notes?: string }
  ) => Promise<void>;
  onUpdateLoan: (
    id: string,
    data: { capital: number; paymentDays: number; startDate: string; notes?: string }
  ) => Promise<void>;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  loans,
  payments,
  isOpen,
  onClose,
  onNewLoanForClient,
  onUpdateClient,
  onUpdateLoan,
}) => {
  const [isEditingClient, setIsEditingClient] = useState<boolean>(false);
  const [selectedLoanForEdit, setSelectedLoanForEdit] = useState<Loan | null>(null);

  if (!isOpen || !client) return null;

  const totalCapitalBorrowed = loans.reduce((acc, l) => acc + l.capital, 0);
  const totalPaidByClient = loans.reduce((acc, l) => acc + l.paidAmount, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#E6DCD2] warm-shadow-lg overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#2C221E] to-[#3D302A] text-white p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-lg shadow-sm">
                {client.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white">{client.name}</h3>
                  <button
                    onClick={() => setIsEditingClient(true)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#E89D4F] transition-all flex items-center gap-1 text-[11px] font-semibold px-2"
                    title="Editar Cliente"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#D5C8BC] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#E89D4F]" />
                    {client.phone}
                  </span>
                  {client.identification && (
                    <span>DNI: {client.identification}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {/* Client Info Grid */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E6DCD2] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs relative">
              <div>
                <span className="text-[#6E615A] block">Dirección / Ref:</span>
                <strong className="text-[#2C221E] block truncate">{client.address || 'No registrada'}</strong>
              </div>
              <div>
                <span className="text-[#6E615A] block">Total Prestaron:</span>
                <strong className="text-[#D96B27] font-extrabold block">{formatCurrency(totalCapitalBorrowed)}</strong>
              </div>
              <div>
                <span className="text-[#6E615A] block">Total Pagado:</span>
                <strong className="text-[#2D7A5D] font-extrabold block">{formatCurrency(totalPaidByClient)}</strong>
              </div>
              {client.notes && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-[#E6DCD2]">
                  <span className="text-[#6E615A] block">Observaciones de Cobro:</span>
                  <p className="text-[#2C221E] italic mt-0.5">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Action: New Loan for this Client */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#2C221E] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#D96B27]" />
                Préstamos Activos & Historial ({loans.length})
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onNewLoanForClient(client);
                }}
                className="px-3 py-1.5 rounded-xl terracotta-gradient text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Préstamo</span>
              </button>
            </div>

            {/* Active Loans Section */}
            <div className="space-y-3">
              {loans.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#6E615A] bg-[#FAF8F5] rounded-2xl">
                  Este cliente no tiene préstamos registrados.
                </div>
              ) : (
                loans.map((loan) => {
                  const loanPayments = payments.filter((p) => p.loanId === loan.id);
                  const percent = Math.round((loan.paidAmount / loan.totalToPay) * 100);

                  return (
                    <div
                      key={loan.id}
                      className="bg-white rounded-2xl p-4 border border-[#E6DCD2] warm-shadow space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              loan.status === 'PAID'
                                ? 'bg-[#EEF6F2] text-[#2D7A5D] border border-[#2D7A5D]/30'
                                : loan.status === 'OVERDUE'
                                ? 'bg-[#FDF2F0] text-[#C84B31] border border-[#C84B31]/30'
                                : 'bg-[#FDF6EE] text-[#E89D4F] border border-[#E89D4F]/30'
                            }`}
                          >
                            {loan.status === 'PAID'
                              ? 'PAGADO'
                              : loan.status === 'OVERDUE'
                              ? 'EN MORA'
                              : 'ACTIVO'}
                          </span>
                          <span className="text-xs font-bold text-[#6E615A]">
                            {loan.paymentDays} Días de Pago
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6E615A]">
                          <span>Inicio: {formatDatePE(loan.startDate)}</span>
                          <button
                            onClick={() => setSelectedLoanForEdit(loan)}
                            className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F0EB] text-[#D96B27] border border-[#E6DCD2] transition-all"
                            title="Editar Condiciones del Préstamo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs bg-[#FAF8F5] p-3 rounded-xl">
                        <div>
                          <span className="text-[#6E615A] block">Capital:</span>
                          <strong className="text-[#2C221E]">{formatCurrency(loan.capital)}</strong>
                        </div>
                        <div>
                          <span className="text-[#6E615A] block">Total (20%):</span>
                          <strong className="text-[#D96B27]">{formatCurrency(loan.totalToPay)}</strong>
                        </div>
                        <div>
                          <span className="text-[#6E615A] block">Saldo Restante:</span>
                          <strong className="text-[#C84B31]">{formatCurrency(loan.remainingAmount)}</strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-[#6E615A] mb-1">
                          <span>
                            Día {loan.paidDaysCount}/{loan.paymentDays} ({formatCurrency(loan.dailyPaymentAmount)}/día)
                          </span>
                          <span className="text-[#2D7A5D]">{percent}% Pagado</span>
                        </div>
                        <div className="w-full bg-[#E6DCD2] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#2D7A5D] h-2 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Payment History */}
                      <div className="pt-2 border-t border-[#E6DCD2]/60">
                        <span className="text-[11px] font-bold text-[#6E615A] flex items-center gap-1 mb-2">
                          <History className="w-3.5 h-3.5 text-[#E89D4F]" />
                          Historial de Cobros Recibidos ({loanPayments.length}):
                        </span>
                        {loanPayments.length === 0 ? (
                          <span className="text-[11px] text-[#A89B92] italic">
                            Aún no se han registrado pagos para este préstamo.
                          </span>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {loanPayments.map((pay) => (
                              <div
                                key={pay.id}
                                className="flex items-center justify-between bg-[#EEF6F2]/40 p-2 rounded-xl text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D7A5D]" />
                                  <span className="font-medium text-[#2C221E]">
                                    {pay.notes || 'Pago del día'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[#6E615A]">{formatDatePE(pay.date)}</span>
                                  <strong className="text-[#2D7A5D] font-bold">
                                    +{formatCurrency(pay.amount)}
                                  </strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DCD2] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-[#E6DCD2] text-[#6E615A] font-bold text-xs rounded-xl hover:bg-[#F5F0EB]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Edit Client Sub-modal */}
      <EditClientModal
        client={client}
        isOpen={isEditingClient}
        onClose={() => setIsEditingClient(false)}
        onConfirmEdit={onUpdateClient}
      />

      {/* Edit Loan Sub-modal */}
      <EditLoanModal
        loan={selectedLoanForEdit}
        isOpen={!!selectedLoanForEdit}
        onClose={() => setSelectedLoanForEdit(null)}
        onConfirmEditLoan={onUpdateLoan}
      />
    </>
  );
};
