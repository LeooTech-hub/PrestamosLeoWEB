export const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  const parts = parseDateParts(dateStr);
  if (parts) {
    const dd = String(parts.day).padStart(2, '0');
    const mm = String(parts.month).padStart(2, '0');
    return `${dd}/${mm}/${parts.year}`;
  }
  return '--';
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

export const SPANISH_SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

/**
 * Parsea de forma segura una fecha sin desfase de zona horaria (UTC/local).
 * Retorna { year, month (1-12), day (1-31) } o null.
 */
export function parseDateParts(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return {
      year: dateStr.getFullYear(),
      month: dateStr.getMonth() + 1,
      day: dateStr.getDate(),
    };
  }
  const clean = String(dateStr).split('T')[0].split(' ')[0].trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10),
    };
  }
  const peMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(clean);
  if (peMatch) {
    return {
      year: parseInt(peMatch[3], 10),
      month: parseInt(peMatch[2], 10),
      day: parseInt(peMatch[1], 10),
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }
  return null;
}

/**
 * Suma días a una fecha respetando el calendario real (bisiestos, cambios de mes y año).
 * Retorna fecha en formato ISO YYYY-MM-DD.
 */
export function addDaysSafe(dateStr, daysToAdd) {
  const parts = parseDateParts(dateStr);
  if (!parts) return null;
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + Number(daysToAdd));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Diferencia en días de calendario entre dos fechas (endDate - startDate).
 */
export function diffDaysSafe(startDateStr, endDateStr) {
  const p1 = parseDateParts(startDateStr);
  const p2 = parseDateParts(endDateStr);
  if (!p1 || !p2) return null;
  const utc1 = Date.UTC(p1.year, p1.month - 1, p1.day, 12, 0, 0);
  const utc2 = Date.UTC(p2.year, p2.month - 1, p2.day, 12, 0, 0);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha en formato "08 oct 2026" según regla comercial.
 */
export function formatDateShortSpanish(dateStr) {
  const parts = parseDateParts(dateStr);
  if (!parts) return '--';
  const dd = String(parts.day).padStart(2, '0');
  const monthName = SPANISH_SHORT_MONTHS[parts.month - 1] || '';
  return `${dd} ${monthName} ${parts.year}`;
}

/**
 * Formatea una fecha para el mensaje de WhatsApp en formato "08 oct".
 */
export function formatDateDayMonthSpanish(dateStr) {
  const parts = parseDateParts(dateStr);
  if (!parts) return '--';
  const dd = String(parts.day).padStart(2, '0');
  const monthName = SPANISH_SHORT_MONTHS[parts.month - 1] || '';
  return `${dd} ${monthName}`;
}

/**
 * Formato monetario del cronograma "S/ 80.00".
 */
export function formatScheduleAmount(amount) {
  const num = Number(amount) || 0;
  return 'S/ ' + new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Distribuye un importe entre cuotas con precisión de céntimos,
 * ajustando cualquier diferencia por redondeo en la última cuota.
 * Garantiza que la suma del arreglo sea exactamente igual al total.
 */
export function distributeAmountAcrossInstallments(totalAmount, count) {
  const numInstallments = Math.max(1, parseInt(count, 10) || 1);
  const totalCents = Math.round((Number(totalAmount) || 0) * 100);
  if (numInstallments === 1) {
    return [totalCents / 100];
  }
  const baseCents = Math.round(totalCents / numInstallments);
  const amounts = [];
  let sumFirst = 0;
  for (let i = 0; i < numInstallments - 1; i++) {
    amounts.push(baseCents / 100);
    sumFirst += baseCents;
  }
  const lastCents = totalCents - sumFirst;
  amounts.push(lastCents / 100);
  return amounts;
}

/**
 * Determina si el préstamo es de frecuencia semanal.
 */
export function isWeeklyLoan(loan) {
  if (!loan) return false;
  const rawFreq = String(
    loan.paymentFrequency ||
    loan.payment_frequency ||
    loan.frequency ||
    ''
  ).trim().toUpperCase();
  return rawFreq === 'WEEKLY' || rawFreq === 'SEMANAL';
}

/**
 * Obtiene el número de cuotas / semanas para un préstamo semanal.
 */
export function getWeeklyInstallmentCount(loan) {
  if (!loan) return 1;

  // A) Si existe un cronograma contractual REAL almacenado con cuotas reales, utilizar su cantidad.
  const existingSchedule = loan.schedule || loan.cronograma || loan.paymentSchedule || loan.payment_schedule || (Array.isArray(loan.installments) ? loan.installments : null);
  if (Array.isArray(existingSchedule) && existingSchedule.length > 0) {
    return existingSchedule.length;
  }

  // B) Si existe una propiedad explícita que inequívocamente representa cantidad de cuotas (NO plazo en días)
  const explicitCount = Number(
    loan.weeklyInstallments ??
    loan.weekly_installments ??
    loan.numberOfInstallments ??
    loan.number_of_installments ??
    loan.installmentsCount ??
    loan.installments_count ??
    loan.cuotas ??
    loan.weeks ??
    loan.semanas
  );
  if (explicitCount && explicitCount > 0) {
    return explicitCount;
  }

  // C) Si NO existe cantidad explícita de cuotas, para préstamos SEMANALES calcularla mediante:
  //    diffDays(fechaEmision, fechaVencimiento) / 7
  const rawStart = loan.startDate || loan.start_date || loan.fecha_inicio || loan.fechaInicio || loan.createdAt || loan.created_at;
  const rawDue = loan.dueDate || loan.due_date || loan.fecha_vencimiento || loan.fechaVencimiento || getOrCalculateDueDate(loan);
  const diff = diffDaysSafe(rawStart, rawDue);

  if (diff && diff > 0) {
    if (diff % 7 === 0) {
      return diff / 7;
    }
    return Math.max(1, Math.round(diff / 7));
  }

  // Fallback si no hay fechas disponibles en el objeto del préstamo:
  // Plazo en días dividido entre 7 (NUNCA usar directamente días como cuotas)
  const rawDays = Number(loan.paymentDays ?? loan.payment_days ?? loan.days ?? loan.duration ?? loan.total_installments ?? loan.totalInstallments);
  if (rawDays && rawDays > 0) {
    if (rawDays % 7 === 0) {
      return rawDays / 7;
    }
    if (rawDays <= 12) {
      return rawDays;
    }
    return Math.max(1, Math.round(rawDays / 7));
  }

  return 1;
}

export function getLoanPaymentTerms(loan) {
  if (!loan) {
    return {
      frequency: 'AGREED_DATE',
      periods: 1,
      amount: 0,
      label: 'Pago en Fecha Acordada',
      unit: 'días',
    };
  }
  const isWeekly = isWeeklyLoan(loan);
  const frequency = isWeekly ? 'WEEKLY' : (loan.paymentFrequency || loan.payment_frequency || 'AGREED_DATE');
  const days = Math.max(1, Number(loan.paymentDays ?? loan.payment_days ?? loan.days ?? 20) || 20);
  const total = Math.max(0, Number(loan.totalToPay ?? loan.totalAmount ?? loan.total_amount ?? loan.total_to_pay ?? 0) || 0);
  const periods = isWeekly ? getWeeklyInstallmentCount(loan) : days;
  return {
    frequency,
    periods,
    amount: Number((total / (frequency === 'AGREED_DATE' ? 1 : periods)).toFixed(2)),
    label: frequency === 'DAILY' ? 'Cuota Diaria' : frequency === 'WEEKLY' ? 'Cuota Semanal' : 'Pago en Fecha Acordada',
    unit: frequency === 'DAILY' ? 'días' : 'semanas',
  };
}

export function formatPaymentAmount(amount) {
  return 'S/. ' + new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
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
  const opNumber = params.operationNumber || params.operation_number;
  const opLine = opNumber ? `\n*Operación:* ${opNumber}` : '';

  const text = 
  `📄 *COMPROBANTE DE PAGO - PRESTAMOS LEO*
---------------------------------------
👤 *Cliente:* ${params.clientName}${opLine}
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

/**
 * Genera el cronograma de cuotas para préstamos semanales o devuelve el contractual.
 */
export function generateWeeklyPaymentSchedule(loan) {
  if (!loan) {
    return {
      isWeekly: false,
      isConsistent: false,
      hasInconsistency: false,
      inconsistencyReason: null,
      totalAmount: 0,
      installmentsCount: 0,
      schedule: [],
    };
  }

  // 1. Si existe un cronograma contractual previamente registrado, respetarlo como fuente principal
  const existingSchedule = loan.schedule || loan.cronograma || loan.paymentSchedule || loan.payment_schedule || (Array.isArray(loan.installments) ? loan.installments : null);
  if (Array.isArray(existingSchedule) && existingSchedule.length > 0) {
    const mapped = existingSchedule.map((item, idx) => {
      const rawDate = item.dueDate || item.due_date || item.date || item.fecha || item.paymentDate;
      const amt = Number(item.amount ?? item.monto ?? item.cuota ?? 0);
      const parts = parseDateParts(rawDate);
      const isoDate = parts ? `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}` : (rawDate ? String(rawDate).split('T')[0] : '');
      return {
        installmentNumber: Number(item.installmentNumber || item.number || item.cuotaNumber || (idx + 1)),
        dueDate: isoDate,
        date: formatDatePE(rawDate),
        amount: amt,
        formattedAmount: formatScheduleAmount(amt),
        formattedPaymentAmount: formatPaymentAmount(amt),
        formattedDate: formatDatePE(rawDate),
        formattedShortDate: formatDateShortSpanish(rawDate),
        whatsappDate: formatDateDayMonthSpanish(rawDate),
      };
    });
    const sum = Number(mapped.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2));
    return {
      isWeekly: isWeeklyLoan(loan),
      isContractualCustom: true,
      isConsistent: true,
      hasInconsistency: false,
      inconsistencyReason: null,
      totalAmount: sum,
      weeklyAmount: mapped[0]?.amount || 0,
      installmentAmount: mapped[0]?.amount || 0,
      installmentsCount: mapped.length,
      schedule: mapped,
    };
  }

  const isWeekly = isWeeklyLoan(loan);
  const totalAmount = Math.max(0, Number(
    loan.totalToPay ??
    loan.totalAmount ??
    loan.total_amount ??
    loan.total_to_pay ??
    ((Number(loan.capital) || 0) + (Number(loan.interestAmount) || 0) + (Number(loan.penaltyAmount) || 0))
  ) || 0);

  if (!isWeekly) {
    return {
      isWeekly: false,
      isConsistent: true,
      hasInconsistency: false,
      inconsistencyReason: null,
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: 0,
      schedule: [],
    };
  }

  const rawStart = loan.startDate || loan.start_date || loan.fecha_inicio || loan.fechaInicio || loan.createdAt || loan.created_at;
  const rawDue = loan.dueDate || loan.due_date || loan.fecha_vencimiento || loan.fechaVencimiento || getOrCalculateDueDate(loan);

  const startParts = parseDateParts(rawStart);
  const dueParts = parseDateParts(rawDue);

  if (!startParts || !dueParts) {
    return {
      isWeekly: true,
      isConsistent: false,
      hasInconsistency: true,
      inconsistencyReason: 'Faltan fechas contractuales para calcular el cronograma semanal.',
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: 0,
      schedule: [],
    };
  }

  const isoStartDate = `${startParts.year}-${String(startParts.month).padStart(2, '0')}-${String(startParts.day).padStart(2, '0')}`;
  const isoDueDate = `${dueParts.year}-${String(dueParts.month).padStart(2, '0')}-${String(dueParts.day).padStart(2, '0')}`;

  const diffDays = diffDaysSafe(isoStartDate, isoDueDate);

  if (diffDays === null || diffDays <= 0) {
    return {
      isWeekly: true,
      isConsistent: false,
      hasInconsistency: true,
      inconsistencyReason: 'La fecha de vencimiento debe ser posterior a la fecha de emisión.',
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: 0,
      schedule: [],
    };
  }

  const weeksCount = getWeeklyInstallmentCount(loan);
  const expectedDueDate = addDaysSafe(isoStartDate, weeksCount * 7);
  const isConsistent = expectedDueDate === isoDueDate;

  if (!isConsistent) {
    return {
      isWeekly: true,
      isConsistent: false,
      hasInconsistency: true,
      inconsistencyReason: `Inconsistencia contractual: El vencimiento registrado (${formatDatePE(isoDueDate)}) no coincide con el ciclo de ${weeksCount} semanas desde la emisión (${formatDatePE(expectedDueDate)}).`,
      totalAmount,
      weeklyAmount: 0,
      installmentAmount: 0,
      installmentsCount: weeksCount,
      schedule: [],
    };
  }

  const amounts = distributeAmountAcrossInstallments(totalAmount, weeksCount);
  const schedule = [];

  for (let i = 1; i <= weeksCount; i++) {
    const installmentDate = addDaysSafe(isoStartDate, i * 7);
    const amount = amounts[i - 1];
    schedule.push({
      installmentNumber: i,
      dueDate: installmentDate,
      date: formatDatePE(installmentDate),
      amount,
      formattedAmount: formatScheduleAmount(amount),
      formattedPaymentAmount: formatPaymentAmount(amount),
      formattedDate: formatDatePE(installmentDate),
      formattedShortDate: formatDateShortSpanish(installmentDate),
      whatsappDate: formatDateDayMonthSpanish(installmentDate),
    });
  }

  return {
    isWeekly: true,
    isConsistent: true,
    hasInconsistency: false,
    inconsistencyReason: null,
    totalAmount,
    weeklyAmount: amounts[0] || 0,
    installmentAmount: amounts[0] || 0,
    installmentsCount: weeksCount,
    schedule,
  };
}

export const getLoanPaymentSchedule = generateWeeklyPaymentSchedule;

export function formatMoneyMethod(method) {
  return method === 'YAPE' ? 'Yape' : method === 'CASH' ? 'Efectivo' : 'No registrado';
}

export function generateLoanConstanciaMessage(loan) {
  if (!loan) return '';
  const clientName = loan.clientName || loan.client_name || loan.name || 'Cliente';
  const opNumber = loan.operationNumber || loan.operation_number || loan.loan_operation_number || loan.activeLoan?.operationNumber || loan.activeLoan?.operation_number || loan.active_loan?.operation_number;
  const opLine = opNumber ? `\n*Operación:* ${opNumber}` : '';
  const startDate = formatDatePE(loan.startDate || loan.start_date || loan.fecha_inicio || loan.fechaInicio || loan.createdAt || loan.created_at);
  const cap = loan.capital != null ? loan.capital : (loan.amount != null ? loan.amount : (loan.amount_borrowed != null ? loan.amount_borrowed : 0));
  const capital = formatCurrency(cap);
  const interestVal = loan.interestAmount != null
    ? loan.interestAmount
    : (loan.interest_amount != null ? loan.interest_amount : Number(((Number(cap) || 0) * 0.20).toFixed(2)));
  const interest = formatCurrency(interestVal);
  const penaltyAmount = loan.penaltyAmount != null ? loan.penaltyAmount : (loan.penalty_amount != null ? loan.penalty_amount : loan.mora);
  const penalty = penaltyAmount && Number(penaltyAmount) > 0 ? `\n⚠️ *Mora / Cargo Adicional:* ${formatCurrency(penaltyAmount)}` : '';
  const totalVal = loan.totalToPay ?? loan.totalAmount ?? loan.total_amount ?? loan.total_to_pay ?? ((Number(cap) || 0) + (Number(interestVal) || 0) + (Number(penaltyAmount) || 0));
  const totalToPay = formatCurrency(totalVal);
  const dueDate = formatDatePE(loan.dueDate || loan.due_date || loan.fecha_vencimiento || loan.fechaVencimiento || getOrCalculateDueDate(loan));
  const terms = getLoanPaymentTerms(loan);
  const isWeekly = isWeeklyLoan(loan);

  const paymentLine = terms.frequency === 'AGREED_DATE'
    ? '📌 *Pago en Fecha Acordada:* ' + formatPaymentAmount(terms.amount)
    : isWeekly
      ? '📌 *Cuota Semanal:* ' + formatPaymentAmount(terms.amount)
        + '\n📌 *Semanas de Pago:* ' + terms.periods
      : '📌 *' + terms.label + ':* ' + formatPaymentAmount(terms.amount)
        + '\n📌 *' + (terms.frequency === 'WEEKLY' ? 'Semanas de Pago' : 'Días de Pago') + ':* ' + terms.periods;

  const scheduleResult = generateWeeklyPaymentSchedule(loan);
  let scheduleSection = '';
  if (scheduleResult.isWeekly && scheduleResult.schedule && scheduleResult.schedule.length > 0) {
    const lines = scheduleResult.schedule.map(
      (item) => `${item.installmentNumber}. ${item.whatsappDate || formatDateDayMonthSpanish(item.dueDate)}: ${formatPaymentAmount(item.amount)}`
    );
    scheduleSection = `\n\n📌 *FECHAS DE CANCELACIÓN:*\n\n${lines.join('\n')}`;
  } else if (scheduleResult.isWeekly && scheduleResult.hasInconsistency) {
    scheduleSection = `\n\n⚠️ *Aviso de Fechas:* ${scheduleResult.inconsistencyReason}`;
  }

  const deliverySection = `\n\n*Préstamo efectuado en:* ${formatMoneyMethod(loan.disbursementMethod ?? loan.disbursement_method)}`;
  const yapeSection = '\n\n📲 *Yape:* 906329361 - Leonardo Rod';
  const footerSection = '\n\n_Gracias por su confianza. Ante cualquier consulta estamos para atenderle._';

  return `📄 *CONSTANCIA DE PRÉSTAMO - PRESTAMOSLEO*

👤 *Cliente:* ${clientName}${opLine}
📅 *Fecha de Emisión:* ${startDate}
💰 *Monto Prestado:* ${capital}
📈 *Interés / Comisión:* ${interest}${penalty}
💵 *Monto Total a Pagar:* ${totalToPay}
📆 *Fecha de Vencimiento:* ${dueDate}
${paymentLine}${scheduleSection}${deliverySection}${yapeSection}${footerSection}`;
}

/**
 * Obtiene el valor numérico UTC (timestamp en ms) seguro para comparar y ordenar vencimientos.
 * Reutiliza getOrCalculateDueDate y parseDateParts para evitar cualquier desfase de zona horaria (UTC/GMT-5).
 * Retorna un timestamp numérico (a las 00:00:00 UTC del día de calendario) o null si la fecha no es válida.
 */
export function getLoanDueDateSortValue(loanOrDueDate) {
  if (!loanOrDueDate) return null;
  const rawDue = typeof loanOrDueDate === 'string' || loanOrDueDate instanceof Date
    ? loanOrDueDate
    : getOrCalculateDueDate(loanOrDueDate);

  if (!rawDue) return null;
  const parts = parseDateParts(rawDue);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

/**
 * Comparador seguro de vencimientos de préstamos (orden ascendente).
 * Préstamos con fecha válida van antes que préstamos sin fecha válida.
 */
export function compareLoansByDueDate(loanA, loanB) {
  const timeA = getLoanDueDateSortValue(loanA);
  const timeB = getLoanDueDateSortValue(loanB);

  const hasDateA = timeA !== null && !isNaN(timeA);
  const hasDateB = timeB !== null && !isNaN(timeB);

  if (hasDateA && !hasDateB) return -1;
  if (!hasDateA && hasDateB) return 1;
  if (hasDateA && hasDateB && timeA !== timeB) {
    return timeA - timeB;
  }
  return 0;
}

/**
 * Prioridad de estados para la visualización ordenada:
 * 1. ACTIVE (Vigentes)
 * 2. OVERDUE / EXPIRED (En Mora)
 * 3. PAID (Cancelados)
 */
export function getLoanStatusPriority(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE') return 1;
  if (s === 'OVERDUE' || s === 'EXPIRED') return 2;
  if (s === 'PAID') return 3;
  return 4;
}

/**
 * Ordena préstamos para la visualización en la vista de Préstamos:
 * - NO muta el array original. Retorna una copia ordenada.
 * - Pestaña 'TODOS' (o general):
 *     1. Préstamos vigentes (ACTIVE), ordenados por fecha de vencimiento ascendente (dueDate más cercana primero).
 *     2. Préstamos en mora (OVERDUE), conservando su orden actual.
 *     3. Préstamos cancelados (PAID), conservando su orden actual.
 * - Pestaña 'VIGENTES' (ACTIVE):
 *     - Ordenados por fecha de vencimiento ascendente (dueDate más cercana primero).
 *     - Préstamos sin fecha de vencimiento válida van al final del grupo.
 *     - Si tienen la misma fecha de vencimiento, mantienen un orden estrictamente estable.
 * - Pestaña 'EN MORA' (OVERDUE):
 *     - Conservan su orden actual.
 * - Pestaña 'CANCELADOS' (PAID):
 *     - Conservan su orden actual.
 */
export function sortLoansForDisplay(loansList, currentFilter = 'ALL') {
  if (!Array.isArray(loansList) || loansList.length <= 1) {
    return Array.isArray(loansList) ? [...loansList] : [];
  }

  const indexed = loansList.map((loan, index) => ({
    loan,
    index,
    dueTimestamp: getLoanDueDateSortValue(loan),
  }));

  indexed.sort((a, b) => {
    const loanA = a.loan;
    const loanB = b.loan;

    const priorityA = getLoanStatusPriority(loanA?.status);
    const priorityB = getLoanStatusPriority(loanB?.status);

    // 1. En la pestaña TODOS (o mezcla de estados), priorizar por estado:
    // 1º Vigentes (ACTIVE)
    // 2º En Mora (OVERDUE)
    // 3º Cancelados (PAID)
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 2. Si ambos son VIGENTES (ACTIVE):
    // Ordenar por fecha de vencimiento ascendente (dueDate más cercana primero)
    if (priorityA === 1) {
      const timeA = a.dueTimestamp;
      const timeB = b.dueTimestamp;

      const hasDateA = timeA !== null && !isNaN(timeA);
      const hasDateB = timeB !== null && !isNaN(timeB);

      // Préstamos sin fecha válida van al final del grupo vigente
      if (hasDateA && !hasDateB) return -1;
      if (!hasDateA && hasDateB) return 1;

      if (hasDateA && hasDateB && timeA !== timeB) {
        return timeA - timeB;
      }

      // Si tienen la misma fecha de vencimiento (o ambos no tienen fecha válida),
      // mantener orden estable respetando la posición original
      return a.index - b.index;
    }

    // 3. Si ambos son EN MORA (OVERDUE):
    // "Dentro de los préstamos en mora: los de mayor antigüedad de mora primero, si la vista
    // ya tiene una regla existente. Si no existe una regla explícita, conservar su orden actual."
    if (priorityA === 2) {
      return a.index - b.index;
    }

    // 4. Si ambos son CANCELADOS (PAID):
    // "Dentro de cancelados: conservar su orden actual."
    if (priorityA === 3) {
      return a.index - b.index;
    }

    // Cualquier otro grupo: conservar su orden actual
    return a.index - b.index;
  });

  return indexed.map((item) => item.loan);
}

