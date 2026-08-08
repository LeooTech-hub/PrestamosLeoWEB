import React, { useState } from 'react';
import { formatCurrency, formatDatePE, getDaysDifferenceInfo, generateWhatsAppReminderMessage } from '../utils/loanHelpers';
import { PaymentModal } from '../components/PaymentModal';
import { EditLoanModal } from '../components/EditLoanModal';
import { SmartDeleteModal } from '../components/SmartDeleteModal';
import { LoanConstanciaModal } from '../components/LoanConstanciaModal';
import { CreditCard, Search, Phone, Pencil, Trash2, MessageSquare, RotateCcw, FileText } from 'lucide-react';

export function VistaPrestamos({ loans = [], onRegisterPayment, onUpdateLoan, onDeleteLoan, onRevertPayment }) {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentLoan, setPaymentLoan] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [deletingLoan, setDeletingLoan] = useState(null);
  const [constanciaLoan, setConstanciaLoan] = useState(null);
  const [revertingLoanId, setRevertingLoanId] = useState(null);

  const handleRevert = async (loan) => {
    if (!onRevertPayment) return;
    const confirmMsg = `¿Deseas reabrir el préstamo de ${loan.clientName} y deshacer el último pago registrado?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setRevertingLoanId(loan.id);
      await onRevertPayment(loan.id);
    } catch (err) {
      console.error('Error al revertir pago:', err);
      alert(err.response?.data?.error || err.message || 'Error al revertir el pago');
    } finally {
      setRevertingLoanId(null);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    if (loan.isArchived) return false;
    if (filter === 'ALL' && (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE')) return false;
    if (filter === 'ACTIVE' && loan.status !== 'ACTIVE') return false;
    if (filter === 'OVERDUE' && loan.status !== 'OVERDUE') return false;
    if (filter === 'PAID' && loan.status !== 'PAID') return false;

    const term = searchTerm.toLowerCase();
    return (
      (loan.clientName || '').toLowerCase().includes(term) ||
      (loan.clientPhone || '').includes(term) ||
      (loan.clientAddress || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#2C221E]">
              Cartera de Préstamos
            </h2>
            <p className="text-xs text-[#6E615A]">
              Control completo de préstamos vigentes, en mora y cancelados.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E6DCD2] warm-shadow overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-[#2C221E] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            Todos ({loans.filter((l) => !l.isArchived && (l.status === 'ACTIVE' || l.status === 'OVERDUE')).length})
          </button>

          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ACTIVE'
                ? 'bg-[#D96B27] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            Vigentes ({loans.filter((l) => l.status === 'ACTIVE' && !l.isArchived).length})
          </button>

          <button
            onClick={() => setFilter('OVERDUE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'OVERDUE'
                ? 'bg-[#C84B31] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            En Mora ({loans.filter((l) => l.status === 'OVERDUE' && !l.isArchived).length})
          </button>

          <button
            onClick={() => setFilter('PAID')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'PAID'
                ? 'bg-[#2D7A5D] text-white shadow-xs'
                : 'text-[#6E615A] hover:bg-[#FAF8F5]'
            }`}
          >
            Cancelados ({loans.filter((l) => l.status === 'PAID' && !l.isArchived).length})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#E89D4F] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o teléfono..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DCD2] rounded-2xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27] warm-shadow"
          />
        </div>
      </div>

      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DCD2] warm-shadow">
          <CreditCard className="w-8 h-8 text-[#6E615A] mx-auto mb-2" />
          <h3 className="text-base font-extrabold text-[#2C221E]">
            No hay préstamos para mostrar
          </h3>
          <p className="text-xs text-[#6E615A] mt-1">
            Prueba a cambiar el filtro o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => {
            const daysInfo = getDaysDifferenceInfo(loan.dueDate);

            return (
              <div
                key={loan.id}
                className={`bg-white rounded-3xl p-5 border transition-all warm-shadow flex flex-col justify-between ${
                  loan.status === 'OVERDUE'
                    ? 'border-[#C84B31]/40'
                    : loan.status === 'PAID'
                    ? 'border-[#2D7A5D]/30 bg-[#EEF6F2]/20'
                    : 'border-[#E6DCD2]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-[#E6DCD2]/60 pb-3 mb-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#2C221E] line-clamp-1">
                        {loan.clientName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-[#6E615A] mt-0.5">
                        <Phone className="w-3 h-3 text-[#E89D4F]" />
                        <span>{loan.clientPhone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setConstanciaLoan(loan)}
                        className="p-1 rounded-lg hover:bg-[#EEF6F2] text-[#6E615A] hover:text-[#2D7A5D] transition-colors cursor-pointer"
                        title="Enviar Constancia de Préstamo"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#2D7A5D]" />
                      </button>

                      <button
                        onClick={() => setEditingLoan(loan)}
                        className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#6E615A] hover:text-[#D96B27]"
                        title="Editar Préstamo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingLoan(loan)}
                        className="p-1 rounded-lg hover:bg-[#FDF2F0] text-[#6E615A] hover:text-[#C84B31]"
                        title="Eliminar Préstamo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        daysInfo.color === 'RED'
                          ? 'bg-[#FDF2F0] text-[#C84B31] border-[#C84B31]/30'
                          : daysInfo.color === 'YELLOW'
                          ? 'bg-[#FDF3ED] text-[#D96B27] border-[#D96B27]/30'
                          : 'bg-[#EEF6F2] text-[#2D7A5D] border-[#2D7A5D]/30'
                      }`}
                    >
                      {daysInfo.label}
                    </span>

                    <span className="text-[10px] font-semibold text-[#6E615A]">
                      Vence: {formatDatePE(loan.dueDate)}
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6DCD2]/60 space-y-1 text-xs mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6E615A]">
                        {loan.penaltyAmount > 0 ? 'Desglose del Préstamo:' : 'Préstamo + 20%:'}
                      </span>
                      <strong className="text-[#2C221E] text-right">
                        {loan.penaltyAmount > 0
                          ? `Capital: ${formatCurrency(loan.capital)} + Int: ${formatCurrency(loan.interestAmount)} + Mora: ${formatCurrency(loan.penaltyAmount)} = ${formatCurrency(loan.totalToPay)}`
                          : `${formatCurrency(loan.capital)} + ${formatCurrency(loan.interestAmount)} = ${formatCurrency(loan.totalToPay)}`}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#6E615A]">Cuota Diaria ({loan.paymentDays} días):</span>
                      <strong className="text-[#2D7A5D]">
                        {formatCurrency(loan.dailyPaymentAmount)}/día
                      </strong>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-[#E6DCD2]/40">
                      <span className="text-[#6E615A]">Cobrado / Restante:</span>
                      <span>
                        <strong className="text-[#2D7A5D]">{formatCurrency(loan.paidAmount)}</strong> /{' '}
                        <strong className="text-[#C84B31]">{formatCurrency(loan.remainingAmount)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#E6DCD2]/60">
                  {loan.status !== 'PAID' ? (
                    <button
                      onClick={() => setPaymentLoan(loan)}
                      className="flex-1 py-2 px-3 rounded-xl terracotta-gradient text-white text-xs font-extrabold shadow-xs hover:brightness-110 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      {/* CAMBIO AQUÍ: S/. estilizado y en negrita */}
                      <span className="font-black text-xs">S/.</span>
                      <span>Cobrar</span>
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <div className="flex-1 py-2 px-2.5 rounded-xl bg-[#2D7A5D] text-white text-xs font-extrabold text-center truncate">
                        CANCELADO COMPLETO
                      </div>
                      <button
                        onClick={() => handleRevert(loan)}
                        disabled={revertingLoanId === loan.id}
                        className="py-2 px-2.5 rounded-xl bg-white border border-[#E6DCD2] text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FAF8F5] text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        title="Reabrir / Deshacer Pago"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${revertingLoanId === loan.id ? 'animate-spin' : ''}`} />
                        <span>Reabrir</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setConstanciaLoan(loan)}
                    className="p-2 rounded-xl bg-white border border-[#E6DCD2] text-[#2D7A5D] hover:bg-[#EEF6F2] hover:border-[#2D7A5D]/30 transition-all cursor-pointer"
                    title="Enviar Constancia de Préstamo"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <a
                    href={generateWhatsAppReminderMessage({
                      clientName: loan.clientName,
                      phone: loan.clientPhone,
                      remainingAmount: loan.remainingAmount,
                      totalToPay: loan.totalToPay,
                      dueDate: loan.dueDate,
                      daysDifference: daysInfo.diffDays,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-[#E6DCD2] text-[#25D366] hover:bg-[#EEF6F2]"
                    title="Recordatorio WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaymentModal
        loan={paymentLoan}
        isOpen={!!paymentLoan}
        onClose={() => setPaymentLoan(null)}
        onConfirmPayment={onRegisterPayment}
      />

      <EditLoanModal
        loan={editingLoan}
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        onConfirmEditLoan={onUpdateLoan}
      />

      <LoanConstanciaModal
        loan={constanciaLoan}
        isOpen={!!constanciaLoan}
        onClose={() => setConstanciaLoan(null)}
      />

      <SmartDeleteModal
        title="Eliminar Préstamo"
        targetName={`Préstamo de ${deletingLoan?.clientName || ''}`}
        isOpen={!!deletingLoan}
        onClose={() => setDeletingLoan(null)}
        onConfirm={async (mode) => {
          if (deletingLoan) {
            await onDeleteLoan(deletingLoan.id, mode);
            setDeletingLoan(null);
          }
        }}
      />
    </div>
  );
}