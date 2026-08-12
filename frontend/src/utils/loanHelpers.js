export const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  const cleanStr = dateStr.toString().split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export function calculateCustomLoan(capital, paymentDays, interestRate = 20) {
  const cap = Number(capital) || 0;
  const rate = interestRate !== undefined && interestRate !== '' && !isNaN(Number(interestRate))
    ? Number(interestRate)
    : 20;
  const interestAmount = Number((cap * (rate / 100)).toFixed(2));
  const totalToPay = Number((cap + interestAmount).toFixed(2));
  const days = paymentDays && paymentDays > 0 ? Number(paymentDays) : 20;
  const dailyPaymentAmount = Math.ceil(totalToPay / (days || 1));

  return {
    capital: cap,
    interestRate: rate,
    interestAmount,
    totalToPay,
    paymentDays: days,
    dailyPaymentAmount,
  };
}

export function calculate20PercentLoan(capital, paymentDays, interestRate = 20) {
  return calculateCustomLoan(capital, paymentDays, interestRate);
}

export function formatCurrency(amount) {
  return `S/. ${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)}`;
}

export function formatDatePE(dateStr) {
  return formatDate(dateStr);
}

/**
 * Obtiene o calcula la fecha de vencimiento. Si due_date/fecha_vencimiento
 * no viene presente en la respuesta de la API, la calcula automáticamente sumando
 * la duración/plazo del préstamo a la fecha de inicio (start_date).
 */
export function getOrCalculateDueDate(loanOrClient) {
  if (!loanOrClient) return null;
  if (typeof loanOrClient === 'string') {
    return loanOrClient.split('T')[0];
  }

  const target = loanOrClient.activeLoan || loanOrClient.active_loan || loanOrClient;

  let rawDueDate =
    target.loan_due_date ||
    target.due_date ||
    target.fecha_vencimiento ||
    target.fechaVencimiento ||
    target.dueDate ||
    target.vencimiento ||
    target.end_date ||
    target.fecha_fin ||
    loanOrClient.loan_due_date ||
    loanOrClient.due_date ||
    loanOrClient.fecha_vencimiento ||
    loanOrClient.fechaVencimiento ||
    loanOrClient.dueDate ||
    loanOrClient.vencimiento ||
    loanOrClient.end_date ||
    loanOrClient.fecha_fin;

  if (!rawDueDate) {
    const rawStartDate =
      target.loan_start_date ||
      target.start_date ||
      target.fecha_inicio ||
      target.startDate ||
      target.fechaInicio ||
      target.createdAt ||
      target.created_at ||
      loanOrClient.loan_start_date ||
      loanOrClient.start_date ||
      loanOrClient.fecha_inicio ||
      loanOrClient.startDate ||
      loanOrClient.fechaInicio ||
      loanOrClient.createdAt ||
      loanOrClient.created_at;

    const rawDuration =
      target.duration ??
      target.duracion ??
      target.plazo ??
      target.term ??
      target.paymentDays ??
      target.payment_days ??
      target.total_installments ??
      target.days ??
      target.dias ??
      loanOrClient.duration ??
      loanOrClient.duracion ??
      loanOrClient.plazo ??
      loanOrClient.term ??
      loanOrClient.paymentDays ??
      loanOrClient.payment_days ??
      loanOrClient.total_installments ??
      loanOrClient.days ??
      loanOrClient.dias;

    const duration = rawDuration !== undefined && rawDuration !== null && !isNaN(Number(rawDuration)) && Number(rawDuration) > 0
      ? Number(rawDuration)
      : 20;

    if (rawStartDate) {
      try {
        const cleanDateStr = String(rawStartDate).split('T')[0].split(' ')[0];
        const parts = cleanDateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() + duration);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            rawDueDate = `${yyyy}-${mm}-${dd}`;
          }
        } else {
          const d = new Date(rawStartDate);
          if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() + duration);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            rawDueDate = `${yyyy}-${mm}-${dd}`;
          }
        }
      } catch (_) {}
    }
  }

  return rawDueDate ? String(rawDueDate).split('T')[0] : null;
}

export function getDueDateFormattedSpanish(loanOrClient) {
  if (!loanOrClient) return 'Sin fecha';

  const rawDueDateStr =
    loanOrClient.loan_due_date ||
    loanOrClient.due_date ||
    loanOrClient.fecha_vencimiento ||
    loanOrClient.fechaVencimiento ||
    loanOrClient.dueDate ||
    loanOrClient.vencimiento ||
    loanOrClient.end_date ||
    loanOrClient.activeLoan?.loan_due_date ||
    loanOrClient.activeLoan?.due_date ||
    loanOrClient.activeLoan?.fecha_vencimiento ||
    loanOrClient.active_loan?.loan_due_date ||
    loanOrClient.active_loan?.due_date ||
    loanOrClient.active_loan?.fecha_vencimiento ||
    getOrCalculateDueDate(loanOrClient);

  if (!rawDueDateStr) return 'Sin fecha';

  try {
    const cleanStr = String(rawDueDateStr).split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    let dateObj;
    if (parts.length === 3 && parts[0].length === 4) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(rawDueDateStr);
    }
    if (isNaN(dateObj.getTime())) return 'Sin fecha';

    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (_) {
    return 'Sin fecha';
  }
}

export const renderRemainingDays = (client) => {
  if (!client) return 'Sin fecha';
  const dueDateStr =
    client?.activeLoan?.dueDate ||
    client?.activeLoan?.due_date ||
    client?.active_loan?.dueDate ||
    client?.active_loan?.due_date ||
    client?.due_date ||
    client?.dueDate ||
    client?.loan_due_date ||
    client?.fecha_vencimiento ||
    client?.fechaVencimiento ||
    getOrCalculateDueDate(client);

  if (!dueDateStr) return 'Sin fecha';

  let due;
  const cleanStr = String(dueDateStr).split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    due = new Date(dueDateStr);
  }

  if (isNaN(due.getTime())) return 'Sin fecha';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (isNaN(diffDays)) return 'Sin fecha';

  return diffDays >= 0 ? `Quedan ${diffDays} días` : `Venció hace ${Math.abs(diffDays)} días`;
};

export const formatDueDate = (dateStrOrLoan) => {
  if (!dateStrOrLoan) return 'Sin Préstamo Activo';
  if (typeof dateStrOrLoan === 'object') {
    const formatted = getDueDateFormattedSpanish(dateStrOrLoan);
    return formatted === 'Sin Préstamo Activo' ? 'Sin Préstamo Activo' : `Vence: ${formatted}`;
  }
  const cleanDate = dateStrOrLoan.toString().split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `Vence: ${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStrOrLoan);
  if (isNaN(d.getTime())) return 'Sin Préstamo Activo';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `Vence: ${day}/${month}/${year}`;
};

export function getDaysDifferenceInfo(dueDateStr) {
  if (!dueDateStr) return { label: 'Sin fecha', color: 'GRAY', diffDays: 0 };

  const cleanDate = String(dueDateStr).split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');
  const due = parts.length === 3 && parts[0].length === 4
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(dueDateStr);

  if (Number.isNaN(due.getTime())) {
    return { label: 'Sin fecha', color: 'GRAY', diffDays: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      label: `Vencido hace ${absDays} día${absDays > 1 ? 's' : ''}`,
      color: 'RED',
      diffDays,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Vence HOY',
      color: 'YELLOW',
      diffDays,
    };
  } else if (diffDays === 1) {
    return {
      label: 'Vence mañana (1 día)',
      color: 'YELLOW',
      diffDays,
    };
  } else {
    return {
      label: `Quedan ${diffDays} días`,
      color: 'GREEN',
      diffDays,
    };
  }
}

export function generateWhatsAppReminderMessage(params) {
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const dueDateFormatted = formatDatePE(params.dueDate);

  let statusHeader = '';
  if (params.daysDifference < 0) {
    statusHeader = `⚠️ *RECORDATORIO DE PRÉSTAMO VENCIDO*`;
  } else if (params.daysDifference === 0) {
    statusHeader = `🔔 *RECORDATORIO DE PRÉSTAMO - VENCE HOY*`;
  } else {
    statusHeader = `🗓️ *RECORDATORIO DE PRÉSTAMO*`;
  }

  const text = `${statusHeader}
---------------------------------------
Estimado(a) *${params.clientName}*, le saludamos de *Prestamos Leo*.

📌 *Estado de su Cuenta:*
- *Saldo Pendiente:* ${formatCurrency(params.remainingAmount)} de ${formatCurrency(params.totalToPay)}
- *Fecha de Vencimiento:* ${dueDateFormatted}

Le invitamos a realizar su abono del día para mantener su crédito al día. ¡Agradecemos su puntualidad! 🙏✨`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppMessage(params) {
  const dateStr = formatDatePE(new Date().toISOString().split('T')[0]);
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

  const text = 
  `📄 *COMPROBANTE DE PAGO - PRESTAMOS LEO*
---------------------------------------
👤 *Cliente:* ${params.clientName}
💰 *Monto Recibido:* ${formatCurrency(params.paymentAmount)}
📅 *Fecha:* ${dateStr}

📊 *ESTADO DE LA CUENTA:*
- *Días Pagados:* ${params.paidDaysCount} de ${params.totalPaymentDays} días
- *Saldo Restante:* ${formatCurrency(params.remainingAmount)}
- *Total Préstamo:* ${formatCurrency(params.totalToPay)}

¡Muchas gracias por su puntualidad! 🙏✨
Recordar que credito pagado, credito renovado`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
}

export function generateLoanConstanciaMessage(loan) {
  if (!loan) return '';
  const clientName = loan.clientName || 'Cliente';
  const startDate = formatDatePE(loan.startDate);
  const capital = formatCurrency(loan.capital);
  const interestVal = loan.interestAmount != null
    ? loan.interestAmount
    : Number(((loan.capital || 0) * 0.20).toFixed(2));
  const interest = formatCurrency(interestVal);
  const penalty = loan.penaltyAmount && loan.penaltyAmount > 0 ? `\n⚠️ *Mora / Cargo Adicional:* ${formatCurrency(loan.penaltyAmount)}` : '';
  const totalToPay = formatCurrency(loan.totalToPay);
  const dueDate = formatDatePE(loan.dueDate);
  const dailyPayment = formatCurrency(loan.dailyPaymentAmount);
  const days = loan.paymentDays || 20;

  return `📄 *CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO*

👤 *Cliente:* ${clientName}
📅 *Fecha de Emisión:* ${startDate}
💰 *Monto Prestado:* ${capital}
📈 *Interés / Comisión:* ${interest}${penalty}
💵 *Monto Total a Pagar:* ${totalToPay}
📆 *Fecha de Vencimiento:* ${dueDate}
📌 *Cuota Diaria:* ${dailyPayment} (${days} días)

_Gracias por su confianza. Ante cualquier consulta estamos para atenderle._`;
}
