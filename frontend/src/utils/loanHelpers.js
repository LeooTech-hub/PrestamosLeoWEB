export function calculate20PercentLoan(capital, paymentDays) {
  const cap = Number(capital) || 0;
  const interestRate = 20;
  const interestAmount = Number((cap * 0.20).toFixed(2));
  const totalToPay = Number((cap + interestAmount).toFixed(2));
  const days = paymentDays && paymentDays > 0 ? Number(paymentDays) : 20;
  const dailyPaymentAmount = Math.ceil(totalToPay / days);

  return {
    capital: cap,
    interestRate,
    interestAmount,
    totalToPay,
    paymentDays: days,
    dailyPaymentAmount,
  };
}

export function formatCurrency(amount) {
  return `S/. ${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)}`;
}

export function formatDatePE(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getDaysDifferenceInfo(dueDateStr) {
  if (!dueDateStr) return { label: 'Sin fecha', color: 'GRAY', diffDays: 0 };

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  const due = new Date(dueDateStr);

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

  const text = `📄 *COMPROBANTE DE PAGO - PRESTAMOS LEO*
---------------------------------------
👤 *Cliente:* ${params.clientName}
💰 *Monto Recibido:* ${formatCurrency(params.paymentAmount)}
📅 *Fecha:* ${dateStr}

📊 *ESTADO DE LA CUENTA:*
- *Días Pagados:* ${params.paidDaysCount} de ${params.totalPaymentDays} días
- *Saldo Restante:* ${formatCurrency(params.remainingAmount)}
- *Total Préstamo:* ${formatCurrency(params.totalToPay)}

¡Muchas gracias por su puntualidad! 🙏✨`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
}
