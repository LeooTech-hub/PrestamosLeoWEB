import React, { useState } from 'react';
import { formatCurrency, formatDatePE } from '../utils/loanHelpers';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { BarChart3, Plus, Trash2, Receipt, Pencil } from 'lucide-react';

export function VistaReportes({
  report,
  period = 'WEEKLY',
  onPeriodChange,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('OTROS');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddExpense(amount, category, description);
      setAmount(0);
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!report) {
    return (
      <div className="text-center py-20 text-xs font-semibold text-[#6E615A]">
        Cargando reporte financiero...
      </div>
    );
  }

  const handleExportToExcel = () => {
    if (!report) return;
    const totalMoras = report.totalMoras || 0;
    const grossProfit = report.grossProfit || (report.interestCollected + totalMoras);
    const netProfit = report.netProfit || (grossProfit - report.totalExpenses);

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #FAF8F5; color: #2C221E; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th { background-color: #D96B27; color: white; font-weight: bold; text-align: left; padding: 8px 12px; border: 1px solid #E6DCD2; }
          td { border: 1px solid #E6DCD2; padding: 8px 12px; background-color: #ffffff; }
          .header-title { font-size: 18px; font-weight: bold; color: #D96B27; margin-bottom: 5px; }
          .period-info { font-size: 12px; color: #6E615A; margin-bottom: 15px; }
          .kpi-table th { background-color: #2C221E; }
          .total-row td { font-weight: bold; background-color: #FDF3ED; color: #2C221E; }
          .positive { color: #2D7A5D; font-weight: bold; }
          .negative { color: #C84B31; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">PRESTAMOS LEO - REPORTE FINANCIERO</div>
        <div class="period-info">Período: ${report.periodLabel} (${report.startDate} a ${report.endDate})</div>

        <h3>RESUMEN FINANCIERO DEL PERÍODO</h3>
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Concepto / Métrica</th>
              <th>Monto (S/.)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Capital Invertido / Prestado</td><td>S/. ${Number(report.capitalInvested || 0).toFixed(2)}</td></tr>
            <tr><td>Total Cobrado (Principal)</td><td>S/. ${Number(report.principalCollected || report.realCollected || 0).toFixed(2)}</td></tr>
            <tr><td>Moras / Penalidades Recaudadas</td><td class="positive">S/. ${Number(totalMoras).toFixed(2)}</td></tr>
            <tr><td>Total Cobrado Efectivo (Principal + Moras)</td><td class="positive">S/. ${Number(report.realCollected || 0).toFixed(2)}</td></tr>
            <tr><td>Ganancia Bruta (Intereses + Moras)</td><td class="positive">S/. ${Number(grossProfit).toFixed(2)}</td></tr>
            <tr><td>Gastos Operativos (Egresos)</td><td class="negative">-S/. ${Number(report.totalExpenses || 0).toFixed(2)}</td></tr>
            <tr class="total-row"><td>GANANCIA NETA LIMPIA</td><td>S/. ${Number(netProfit).toFixed(2)}</td></tr>
            <tr><td>Saldo Pendiente por Cobrar</td><td>S/. ${Number(report.remainingToCollect || 0).toFixed(2)}</td></tr>
          </tbody>
        </table>

        <h3>DESGLOSE DE GASTOS OPERATIVOS</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto (S/.)</th>
            </tr>
          </thead>
          <tbody>
            ${(report.expensesList || []).length === 0 ? '<tr><td colspan="4">No hay gastos registrados</td></tr>' : 
              (report.expensesList || []).map(e => `
                <tr>
                  <td>${e.date || ''}</td>
                  <td>${e.category || ''}</td>
                  <td>${e.description || ''}</td>
                  <td class="negative">-S/. ${Number(e.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Financiero_PrestamosLeo_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToPDF = () => {
    if (!report) return;
    const totalMoras = report.totalMoras || 0;
    const grossProfit = report.grossProfit || (report.interestCollected + totalMoras);
    const netProfit = report.netProfit || (grossProfit - report.totalExpenses);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para exportar a PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Financiero - PrestamosLeo</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF8F5; color: #2C221E; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E6DCD2; padding-bottom: 12px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 900; color: #D96B27; }
          .brand span { color: #2D7A5D; }
          .period-tag { background: #FDF3ED; border: 1px solid #D96B27; color: #D96B27; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: white; border: 1px solid #E6DCD2; border-radius: 16px; padding: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
          .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6E615A; margin-bottom: 4px; display: block; }
          .card-val { font-size: 18px; font-weight: 900; }
          .val-green { color: #2D7A5D; }
          .val-orange { color: #D96B27; }
          .val-red { color: #C84B31; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #E6DCD2; }
          th { background: #2C221E; color: white; font-size: 11px; text-transform: uppercase; text-align: left; padding: 10px 14px; }
          td { font-size: 12px; padding: 10px 14px; border-bottom: 1px solid #E6DCD2; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #6E615A; border-top: 1px solid #E6DCD2; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">PRESTAMOS <span>LEO</span></div>
            <div style="font-size: 12px; color: #6E615A;">Reporte Financiero Oficial (Perú S/.)</div>
          </div>
          <div class="period-tag">${report.periodLabel} (${report.startDate} a ${report.endDate})</div>
        </div>

        <div class="grid">
          <div class="card">
            <span class="card-label">Total Cobrado</span>
            <div class="card-val val-green">S/. ${Number(report.realCollected || 0).toFixed(2)}</div>
          </div>
          <div class="card">
            <span class="card-label">Moras / Penalidades</span>
            <div class="card-val val-orange">S/. ${Number(totalMoras).toFixed(2)}</div>
          </div>
          <div class="card">
            <span class="card-label">Gastos Operativos</span>
            <div class="card-val val-red">S/. ${Number(report.totalExpenses || 0).toFixed(2)}</div>
          </div>
          <div class="card" style="background:#2C221E; color:white;">
            <span class="card-label" style="color:#D5C8BC;">Ganancia Neta</span>
            <div class="card-val" style="color:#E89D4F;">S/. ${Number(netProfit).toFixed(2)}</div>
          </div>
        </div>

        <h3 style="font-size:14px; margin-top:20px; color:#2C221E;">Resumen de Indicadores Financieros</h3>
        <table>
          <thead>
            <tr>
              <th>Métrica / Concepto</th>
              <th>Detalle</th>
              <th>Monto (S/.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Capital Invertido</strong></td>
              <td>Total de capital colocado en préstamos durante el período</td>
              <td>S/. ${Number(report.capitalInvested || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Cobranza Principal</strong></td>
              <td>Abonos directos al capital de préstamos</td>
              <td>S/. ${Number(report.principalCollected || report.realCollected || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Moras Recaudadas</strong></td>
              <td>Ingresos adicionales por moras/interés punitorio</td>
              <td style="color:#2D7A5D; font-weight:bold;">+S/. ${Number(totalMoras).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Ganancia Bruta</strong></td>
              <td>Intereses (20%) + Moras cobradas</td>
              <td style="color:#2D7A5D; font-weight:bold;">S/. ${Number(grossProfit).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Gastos Operativos</strong></td>
              <td>Combustible, transporte y papelería</td>
              <td style="color:#C84B31; font-weight:bold;">-S/. ${Number(report.totalExpenses || 0).toFixed(2)}</td>
            </tr>
            <tr style="background:#FDF3ED; font-weight:bold;">
              <td><strong>GANANCIA NETA LIMPIA</strong></td>
              <td>Ganancia Bruta menos Gastos Operativos</td>
              <td style="color:#D96B27; font-size:14px;">S/. ${Number(netProfit).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size:14px; margin-top:25px; color:#2C221E;">Gastos Operativos Registrados</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto (S/.)</th>
            </tr>
          </thead>
          <tbody>
            ${(report.expensesList || []).length === 0 ? '<tr><td colspan="4" style="text-align:center;">No hay egresos registrados</td></tr>' : 
              (report.expensesList || []).map(e => `
                <tr>
                  <td>${e.date || ''}</td>
                  <td><strong>${e.category || ''}</strong></td>
                  <td>${e.description || ''}</td>
                  <td style="color:#C84B31; font-weight:bold;">-S/. ${Number(e.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>

        <div class="footer">
          PrestamosLeoWEB © 2026 • Documento Generado el ${new Date().toLocaleString('es-PE')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#2C221E]">
              Reporte Financiero De Ingresos y Egresos
            </h2>
            <p className="text-xs text-[#6E615A]">
              Análisis de ingresos, moras, gastos y ganancias netas por período.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Buttons */}
          <button
            onClick={handleExportToPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D96B27] hover:bg-[#c25a1d] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            title="Exportar Reporte a PDF"
          >
            <span>Exportar a PDF</span>
          </button>

          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D7A5D] hover:bg-[#23634b] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            title="Exportar Reporte a Excel (.xls)"
          >
            <span>Exportar a Excel</span>
          </button>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#E6DCD2]">
            <button
              onClick={() => onPeriodChange('WEEKLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === 'WEEKLY'
                  ? 'terracotta-gradient text-white shadow-xs'
                  : 'text-[#6E615A] hover:bg-white'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => onPeriodChange('BIWEEKLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === 'BIWEEKLY'
                  ? 'terracotta-gradient text-white shadow-xs'
                  : 'text-[#6E615A] hover:bg-white'
              }`}
            >
              Quincenal
            </button>
            <button
              onClick={() => onPeriodChange('MONTHLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === 'MONTHLY'
                  ? 'terracotta-gradient text-white shadow-xs'
                  : 'text-[#6E615A] hover:bg-white'
              }`}
            >
              Mensual
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Cobranza Real Recaudada
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#2D7A5D]">
            {formatCurrency(report.realCollected)}
          </div>
          <p className="text-[11px] text-[#6E615A]">
            Ingreso total a caja
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Moras Recaudadas
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#D96B27]">
            {formatCurrency(report.totalMoras || 0)}
          </div>
          <p className="text-[11px] text-[#D96B27] font-bold">
            Penalizaciones cobradas
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Ganancia Bruta
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#2D7A5D]">
            {formatCurrency(report.grossProfit || ((report.interestCollected || 0) + (report.totalMoras || 0)))}
          </div>
          <p className="text-[11px] text-[#6E615A]">
            Intereses + Moras
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-2">
          <span className="text-[10px] font-bold text-[#6E615A] uppercase tracking-wider block">
            Gastos Operativos
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#C84B31]">
            {formatCurrency(report.totalExpenses)}
          </div>
          <p className="text-[11px] text-[#C84B31] font-semibold">
            {(report.expensesList || []).length} egresos registrados
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#2C221E] to-[#3D302A] text-white p-5 rounded-3xl shadow-lg space-y-2 border border-[#4A3B35]">
          <span className="text-[10px] font-bold text-[#D5C8BC] uppercase tracking-wider block">
            Ganancia Neta Limpia
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#E89D4F]">
            {formatCurrency(report.netProfit)}
          </div>
          <p className="text-[11px] text-[#D5C8BC] font-bold">
            Ganancia Bruta - Gastos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-4">
          <h3 className="font-extrabold text-base text-[#2C221E] flex items-center gap-2 border-b border-[#E6DCD2] pb-3">
            <Receipt className="w-4 h-4 text-[#D96B27]" />
            <span>Registrar Gasto Operativo</span>
          </h3>

          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Monto del Gasto (S/.):
              </label>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="25"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-extrabold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Categoría:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              >
                <option value="COMBUSTIBLE">Combustible / Moto</option>
                <option value="TRANSPORTE">Pasajes / Transporte</option>
                <option value="ALIMENTACION">Alimentación</option>
                <option value="IMPRESIONES">Impresiones / Papelería</option>
                <option value="OTROS">Otros Gastos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6E615A] mb-1">
                Descripción:
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del gasto"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6DCD2] rounded-xl text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#D96B27]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl terracotta-gradient text-white font-extrabold text-xs shadow-xs hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Agregar Gasto'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E6DCD2] warm-shadow space-y-4">
          <h3 className="font-extrabold text-base text-[#2C221E] flex items-center justify-between border-b border-[#E6DCD2] pb-3">
            <span>Lista de Gastos Registrados</span>
            <span className="text-xs font-normal text-[#6E615A]">
              Total: {formatCurrency(report.totalExpenses)}
            </span>
          </h3>

          {(report.expensesList || []).length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6E615A]">
              No hay egresos registrados en este período.
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {report.expensesList.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6DCD2]/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-[#2C221E] block font-bold">
                      {exp.description}
                    </strong>
                    <span className="text-[#6E615A] text-[11px]">
                      {exp.category} • {formatDatePE(exp.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <strong className="text-[#C84B31] font-extrabold text-sm mr-1">
                      -{formatCurrency(exp.amount)}
                    </strong>

                    {onUpdateExpense && (
                      <button
                        onClick={() => setEditingExpense(exp)}
                        className="p-1.5 rounded-xl text-[#6E615A] hover:bg-white hover:text-[#D96B27] border border-transparent hover:border-[#E6DCD2] transition-all"
                        title="Editar Gasto"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-xl text-[#6E615A] hover:bg-[#FDF2F0] hover:text-[#C84B31] border border-transparent hover:border-[#C84B31]/20 transition-all"
                      title="Eliminar Gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onConfirmEditExpense={onUpdateExpense}
      />
    </div>
  );
}
