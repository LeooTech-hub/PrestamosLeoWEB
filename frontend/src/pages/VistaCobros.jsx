import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Receipt, Calendar, Filter, ChevronDown, Search } from "lucide-react";
import api from "../api";
import { formatCurrency } from "../utils/loanHelpers";
import { EditPaymentModal } from "../components/EditPaymentModal";

function formatDateWithTime(dateStr, createdAtStr) {
  const str = createdAtStr || dateStr;
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d.getTime())) return dateStr || "—";
  const day = d.getDate();
  const month = d.toLocaleString("es-ES", { month: "long" });
  const time = d.toLocaleString("es-ES", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} ${month} || ${time.toLowerCase()}`;
}

function todayISO() { return new Date().toISOString().split("T")[0]; }
function weekStartISO() {
  const d = new Date(); const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split("T")[0];
}
function monthStartISO() { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; }

export function VistaCobros({ user, onUpdatePayment, onDeletePayment, onRefreshData }) {
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [collectorId, setCollectorId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [payments, setPayments] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    api.get("/admin/collectors/list")
      .then(res => { const list = Array.isArray(res.data) ? res.data : (res.data?.collectors || []); setCollectors(list); })
      .catch(() => {});
  }, [isAdmin]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true); setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (isAdmin && collectorId) params.append("collector_id", collectorId);
      const res = await api.get(`/payments/history?${params.toString()}`);
      const raw = Array.isArray(res.data) ? res.data : (res.data?.payments || res.data?.data || []);
      setPayments(raw);
    } catch (err) {
      console.error("[VistaCobros]", err);
      setError("No se pudo cargar el historial de cobros.");
    } finally { setIsLoading(false); }
  }, [startDate, endDate, collectorId, isAdmin]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const setQuickFilter = (mode) => {
    const today = todayISO();
    if (mode === "today") { setStartDate(today); setEndDate(today); }
    else if (mode === "week") { setStartDate(weekStartISO()); setEndDate(today); }
    else if (mode === "month") { setStartDate(monthStartISO()); setEndDate(today); }
  };

  const filtered = payments.filter(p => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (p.client_name || "").toLowerCase().includes(q) ||
           (p.collector_name || "").toLowerCase().includes(q) ||
           (p.notes || "").toLowerCase().includes(q);
  });

  const totalRecaudado = filtered.reduce((s, p) => s + Number(p.amount || 0), 0);

  const handleDelete = async (payment) => {
    if (!onDeletePayment) return;
    if (!window.confirm(`¿Anular cobro de ${formatCurrency(payment.amount)} de ${payment.client_name}?`)) return;
    try {
      setDeletingId(payment.id);
      await onDeletePayment(payment.id);
      await fetchHistory();
      if (onRefreshData) onRefreshData();
    } catch (err) { console.error("[VistaCobros] delete:", err); }
    finally { setDeletingId(null); }
  };

  const handleEditSave = async (id, data) => {
    if (!onUpdatePayment) return;
    await onUpdatePayment(id, data);
    setEditingPayment(null);
    await fetchHistory();
    if (onRefreshData) onRefreshData();
  };

  const collectorBadgeClass = (name) =>
    String(name || "").toUpperCase() === "ADMIN"
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
      : "bg-[#E89D4F]/10 text-[#D96B27] border-[#E89D4F]/30";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D96B27] via-[#E89D4F] to-[#C25A19] rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight leading-tight">Historial General de Cobros</h2>
              <p className="text-white/80 text-xs mt-0.5">{isAdmin ? "Vista completa de todas las transacciones" : "Tus cobros registrados"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">Total filtrado</p>
            <p className="text-2xl font-extrabold tracking-tight">+{formatCurrency(totalRecaudado)}</p>
            <p className="text-white/70 text-[10px] mt-0.5">{filtered.length} cobros</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6DCD2] dark:border-[#332F2C] p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Período rápido:
          </span>
          {[{ label: "Hoy", mode: "today" }, { label: "Esta Semana", mode: "week" }, { label: "Este Mes", mode: "month" }].map(({ label, mode }) => (
            <button key={mode} type="button" onClick={() => setQuickFilter(mode)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] text-[#6E615A] dark:text-[#C2B29F] hover:bg-[#FDF3ED] hover:text-[#D96B27] hover:border-[#E89D4F]/50 transition-all active:scale-95">
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl px-3 py-1.5">
            <label className="text-[10px] font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wide">Desde</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] bg-transparent border-none outline-none cursor-pointer" />
          </div>
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl px-3 py-1.5">
            <label className="text-[10px] font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wide">Hasta</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] bg-transparent border-none outline-none cursor-pointer" />
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl px-3 py-1.5 min-w-[180px]">
              <Filter className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
              <select value={collectorId} onChange={e => setCollectorId(e.target.value)}
                className="text-xs font-semibold text-[#2C221E] dark:text-[#F3F4F6] bg-transparent border-none outline-none cursor-pointer flex-1">
                <option value="">Todos los Cobradores</option>
                {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-[#6E615A] shrink-0" />
            </div>
          )}
          <button type="button" onClick={fetchHistory}
            className="px-4 py-1.5 rounded-xl bg-[#D96B27] hover:bg-[#C25A19] text-white text-xs font-bold transition-all active:scale-95 shadow-sm">
            Aplicar
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#FAF8F5] dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] rounded-xl px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-[#6E615A] dark:text-[#C2B29F] shrink-0" />
          <input type="text" placeholder="Buscar por cliente, cobrador o nota…" value={searchText} onChange={e => setSearchText(e.target.value)}
            className="flex-1 text-xs font-medium text-[#2C221E] dark:text-[#F3F4F6] bg-transparent border-none outline-none placeholder:text-[#9A8A84]" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-9 h-9 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#6E615A]">Cargando historial de cobros…</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
          <button type="button" onClick={fetchHistory} className="mt-3 px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all">Reintentar</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6DCD2] dark:border-[#332F2C]">
          <Receipt className="w-10 h-10 text-[#E6DCD2] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#6E615A] dark:text-[#C2B29F]">Sin cobros en el período seleccionado</p>
          <p className="text-xs text-[#9A8A84] mt-1">Prueba con otro rango de fechas o elimina el filtro de cobrador.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_80px] gap-3 px-4 py-2 bg-[#FAF8F5] dark:bg-[#24211E] rounded-xl border border-[#E6DCD2] dark:border-[#332F2C]">
            {["Cliente", "Fecha y Hora", "Día", "Monto", "Cobrador", ""].map(h => (
              <span key={h} className="text-[10px] font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-widest">{h}</span>
            ))}
          </div>

          {filtered.map(p => (
            <div key={p.id} className="group bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6DCD2] dark:border-[#332F2C] px-4 py-3 hover:border-[#E89D4F]/50 hover:shadow-sm transition-all">
              {/* Mobile */}
              <div className="md:hidden flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#2C221E] dark:text-[#F3F4F6] truncate">{p.client_name || "Cliente"}</p>
                  <p className="text-[11px] text-[#6E615A] dark:text-[#C2B29F] mt-0.5">Día {p.day_number ?? 1} • {p.notes || "Pago registrado"}</p>
                  <p className="text-[11px] text-[#9A8A84] mt-0.5">{formatDateWithTime(p.date, p.created_at)}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${collectorBadgeClass(p.collector_name)}`}>
                    👤 {p.collector_name || "ADMIN"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-base font-extrabold text-[#2D7A5D] dark:text-[#3D9970]">+{formatCurrency(p.amount)}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      {onUpdatePayment && (
                        <button type="button" onClick={() => setEditingPayment(p)}
                          className="p-1 rounded-lg text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] border border-transparent hover:border-[#E6DCD2] transition-all" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeletePayment && (
                        <button type="button" onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                          className="p-1 rounded-lg text-[#6E615A] hover:text-[#C84B31] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50" title="Anular">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_80px] gap-3 items-center">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2C221E] dark:text-[#F3F4F6] truncate">{p.client_name || "Cliente"}</p>
                  <p className="text-[11px] text-[#9A8A84] truncate">{p.notes || "Pago registrado"}</p>
                </div>
                <div className="text-xs text-[#6E615A] dark:text-[#C2B29F] font-medium">{formatDateWithTime(p.date, p.created_at)}</div>
                <div>
                  <span className="text-xs font-semibold bg-[#FAF8F5] dark:bg-[#24211E] text-[#6E615A] dark:text-[#C2B29F] px-2 py-0.5 rounded-lg border border-[#E6DCD2] dark:border-[#332F2C]">
                    Día {p.day_number ?? 1}
                  </span>
                </div>
                <div className="font-extrabold text-[#2D7A5D] dark:text-[#3D9970] text-sm">+{formatCurrency(p.amount)}</div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${collectorBadgeClass(p.collector_name)}`}>
                    👤 {p.collector_name || "ADMIN"}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  {isAdmin && onUpdatePayment && (
                    <button type="button" onClick={() => setEditingPayment(p)}
                      className="p-1 rounded-lg text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] border border-transparent hover:border-[#E6DCD2] transition-all" title="Editar pago">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && onDeletePayment && (
                    <button type="button" onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                      className="p-1 rounded-lg text-[#6E615A] hover:text-[#C84B31] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50" title="Anular pago">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8F5] dark:bg-[#24211E] rounded-2xl border border-[#E6DCD2] dark:border-[#332F2C]">
            <span className="text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]">{filtered.length} cobro{filtered.length !== 1 ? "s" : ""} mostrado{filtered.length !== 1 ? "s" : ""}</span>
            <span className="text-sm font-extrabold text-[#2D7A5D] dark:text-[#3D9970]">Total: +{formatCurrency(totalRecaudado)}</span>
          </div>
        </div>
      )}

      {editingPayment && (
        <EditPaymentModal payment={editingPayment} onSave={handleEditSave} onClose={() => setEditingPayment(null)} />
      )}
    </div>
  );
}
