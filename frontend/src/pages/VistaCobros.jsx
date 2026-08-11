import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Receipt, Calendar, Filter, ChevronDown, Search, User } from "lucide-react";
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
      if (Array.isArray(res.data)) {
        setPayments(res.data);
      } else if (res.data && Array.isArray(res.data.payments)) {
        setPayments(res.data.payments);
      } else if (res.data && Array.isArray(res.data.data)) {
        setPayments(res.data.data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("[VistaCobros]", err);
      setError("No se pudo cargar el historial de cobros.");
      setPayments([]);
    } finally { setIsLoading(false); }
  }, [startDate, endDate, collectorId, isAdmin]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
        if (isAdmin && collectorId) params.append("collector_id", collectorId);
        const res = await api.get(`/payments/history?${params.toString()}`);
        if (isMounted) {
          if (Array.isArray(res.data)) {
            setPayments(res.data);
          } else if (res.data && Array.isArray(res.data.payments)) {
            setPayments(res.data.payments);
          } else if (res.data && Array.isArray(res.data.data)) {
            setPayments(res.data.data);
          } else {
            setPayments([]);
          }
        }
      } catch (err) {
        console.error("[VistaCobros]", err);
        if (isMounted) {
          setError("No se pudo cargar el historial de cobros.");
          setPayments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, collectorId, isAdmin]);

  const setQuickFilter = (mode) => {
    const today = todayISO();
    if (mode === "today") { setStartDate(today); setEndDate(today); }
    else if (mode === "week") { setStartDate(weekStartISO()); setEndDate(today); }
    else if (mode === "month") { setStartDate(monthStartISO()); setEndDate(today); }
  };

  const safePayments = Array.isArray(payments) ? payments : [];

  const filtered = safePayments.filter(p => {
    if (!p) return false;
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (p.client_name || "").toLowerCase().includes(q) ||
           (p.collector_name || "").toLowerCase().includes(q) ||
           (p.notes || "").toLowerCase().includes(q);
  });

  const totalRecaudado = filtered.reduce((s, p) => s + Number(p?.amount || 0), 0);

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

  return (
    <div className="space-y-5">
      {/* 1. Encabezado Superior con Estilo Unificado */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E6DCD2] dark:border-[#27272A] rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl terracotta-gradient flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#2C221E] dark:text-[#F3F4F6] tracking-tight leading-tight">
              HISTORIAL DE COBROS
            </h2>
            <p className="text-[#6E615A] dark:text-[#C2B29F] text-xs mt-0.5">
              {isAdmin ? "Vista completa de todas las transacciones" : "Tus cobros registrados"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end text-right w-full sm:w-auto">
          <span className="text-[10px] font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-widest mb-1">
            Total Cobrado
          </span>
          <span className="bg-[#FFF3EB] text-[#D95D39] border border-[#FAD7C0] dark:bg-[#2C221E] dark:text-[#E07A5F] dark:border-[#D96B27]/40 px-4 py-1.5 rounded-full font-extrabold text-xl tracking-tight shadow-xs">
            +{formatCurrency(totalRecaudado)}
          </span>
          <span className="text-[11px] font-medium text-[#6E615A] dark:text-[#C2B29F] mt-1">
            {filtered.length} {filtered.length === 1 ? "cobro" : "cobros"}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6DCD2] dark:border-[#332F2C] p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#D96B27]" /> Período rápido:
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

      {/* 2. Tarjetas / Filas de Cobros con Vida y Color */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E6DCD2] dark:border-[#27272A] shadow-sm">
          <div className="w-9 h-9 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]">Cargando historial de cobros…</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
          <button type="button" onClick={fetchHistory} className="mt-3 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all cursor-pointer">Reintentar</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#18181B] rounded-2xl border border-[#E6DCD2] dark:border-[#27272A] shadow-sm">
          <Receipt className="w-10 h-10 text-[#E6DCD2] dark:text-[#27272A] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#6E615A] dark:text-[#C2B29F]">No hay cobros registrados en este periodo.</p>
          <p className="text-xs text-[#9A8A84] dark:text-[#6E615A] mt-1">Prueba con otro rango de fechas o elimina el filtro de cobrador.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_80px] gap-3 px-4 py-2 bg-[#FAF8F5] dark:bg-[#18181B] rounded-xl border border-[#E6DCD2] dark:border-[#27272A]">
            {["Cliente", "Fecha y Hora", "Día", "Monto", "Cobrador", ""].map(h => (
              <span key={h} className="text-[10px] font-bold text-[#6E615A] dark:text-[#C2B29F] uppercase tracking-widest">{h}</span>
            ))}
          </div>

          {(Array.isArray(filtered) ? filtered : []).map(p => (
            <div
              key={p.id}
              className="bg-white dark:bg-[#18181B] border border-[#E6DCD2] dark:border-[#27272A] rounded-2xl p-4 shadow-sm hover:border-[#E89D4F]/50 transition-all group"
            >
              {/* Mobile */}
              <div className="md:hidden flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="font-extrabold text-sm text-[#2C221E] dark:text-[#F3F4F6] truncate">{p.client_name || "Cliente"}</p>
                  <p className="text-xs text-[#6E615A] dark:text-[#C2B29F]">{p.notes || "Pago registrado"}</p>
                  <p className="text-xs text-[#9A8A84] dark:text-[#6E615A]">{formatDateWithTime(p.date, p.created_at)}</p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="bg-[#FFF3EB] text-[#D95D39] border border-[#FAD7C0] dark:bg-[#2C221E] dark:text-[#E07A5F] dark:border-[#D96B27]/40 px-3 py-1 rounded-full text-xs font-bold">
                      Día {p.day_number ?? 1}
                    </span>
                    <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] dark:bg-[#1E2D27] dark:text-[#3D9970] dark:border-[#2D7A5D]/40 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                      <User className="w-3 h-3 shrink-0" />
                      {p.collector_name || "ADMIN"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[#059669] dark:text-[#3D9970] font-black text-xl">+{formatCurrency(p.amount)}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      {onUpdatePayment && (
                        <button type="button" onClick={() => setEditingPayment(p)}
                          className="p-1.5 rounded-lg text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] hover:bg-[#FDF3ED] border border-transparent hover:border-[#E6DCD2] transition-all cursor-pointer" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeletePayment && (
                        <button type="button" onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                          className="p-1.5 rounded-lg text-[#6E615A] dark:text-[#C2B29F] hover:text-[#C84B31] hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer disabled:opacity-50" title="Anular">
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
                  <p className="font-extrabold text-sm text-[#2C221E] dark:text-[#F3F4F6] truncate">{p.client_name || "Cliente"}</p>
                  <p className="text-xs text-[#9A8A84] dark:text-[#6E615A] truncate">{p.notes || "Pago registrado"}</p>
                </div>
                <div className="text-xs text-[#6E615A] dark:text-[#C2B29F] font-medium">{formatDateWithTime(p.date, p.created_at)}</div>
                <div>
                  <span className="bg-[#FFF3EB] text-[#D95D39] border border-[#FAD7C0] dark:bg-[#2C221E] dark:text-[#E07A5F] dark:border-[#D96B27]/40 px-3 py-1 rounded-full text-xs font-bold inline-block">
                    Día {p.day_number ?? 1}
                  </span>
                </div>
                <div className="text-[#059669] dark:text-[#3D9970] font-black text-xl">+{formatCurrency(p.amount)}</div>
                <div>
                  <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] dark:bg-[#1E2D27] dark:text-[#3D9970] dark:border-[#2D7A5D]/40 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0" />
                    {p.collector_name || "ADMIN"}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  {isAdmin && onUpdatePayment && (
                    <button type="button" onClick={() => setEditingPayment(p)}
                      className="p-1.5 rounded-lg text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] hover:bg-[#FDF3ED] border border-transparent hover:border-[#E6DCD2] transition-all cursor-pointer" title="Editar pago">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && onDeletePayment && (
                    <button type="button" onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                      className="p-1.5 rounded-lg text-[#6E615A] dark:text-[#C2B29F] hover:text-[#C84B31] hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer disabled:opacity-50" title="Anular pago">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-[#18181B] rounded-2xl border border-[#E6DCD2] dark:border-[#27272A] shadow-sm">
            <span className="text-xs font-semibold text-[#6E615A] dark:text-[#C2B29F]">{filtered.length} cobro{filtered.length !== 1 ? "s" : ""} mostrado{filtered.length !== 1 ? "s" : ""}</span>
            <span className="text-lg font-black text-[#059669] dark:text-[#3D9970]">Total: +{formatCurrency(totalRecaudado)}</span>
          </div>
        </div>
      )}

      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          isOpen={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          onConfirmEditPayment={handleEditSave}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
