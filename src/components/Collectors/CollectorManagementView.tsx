'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Clock, DollarSign, UserCheck, RefreshCw, X, ChevronRight, Activity, ArrowRightLeft } from 'lucide-react';
import { collectorService, CollectorStat, ActivityLog } from '@/services/collectorService';
import { Client } from '@/types';
import { loanService } from '@/services/loanService';

interface CollectorManagementViewProps {
  isAdmin: boolean;
}

export const CollectorManagementView: React.FC<CollectorManagementViewProps> = ({ isAdmin }) => {
  // State
  const [stats, setStats] = useState<CollectorStat[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<CollectorStat | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [assignTargetCollector, setAssignTargetCollector] = useState<CollectorStat | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [collectors, setCollectors] = useState<CollectorStat[]>([]);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await collectorService.getCollectorStats();
      setStats(res.stats || []);
      setCollectors(res.stats || []);
    } catch (err) {
      console.error('Error loading collector stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (collectorId: string) => {
    try {
      setIsActivityLoading(true);
      const res = await collectorService.getCollectorActivity(collectorId);
      setActivities(res.activities || []);
    } catch (err) {
      console.error('Error loading activity:', err);
      setActivities([]);
    } finally {
      setIsActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (selectedCollector) {
      loadActivity(selectedCollector.id);
    }
  }, [selectedCollector, loadActivity]);

  const handleOpenAssign = async (collector: CollectorStat) => {
    setAssignTargetCollector(collector);
    setSelectedClientIds([]);
    try {
      const clients = await loanService.getClients();
      setAllClients(clients);
    } catch (_) {}
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignTargetCollector || selectedClientIds.length === 0) return;
    setIsAssigning(true);
    try {
      await collectorService.assignClients(selectedClientIds, assignTargetCollector.id);
      setSuccessMsg(`${selectedClientIds.length} cliente(s) asignados a ${assignTargetCollector.name}`);
      setShowAssignModal(false);
      setSelectedClientIds([]);
      await loadStats();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al asignar clientes');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const formatCurrency = (amount: number) =>
    `S/. ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  const formatTime = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Users className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-[#6E615A] dark:text-[#C2B29F] font-medium">Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2C221E] dark:text-[#EAE0D5] flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D96B27] to-[#C25A19] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </span>
            Panel de Cobradores
          </h2>
          <p className="text-sm text-[#6E615A] dark:text-[#C2B29F] mt-1">
            Gestión de cartera, rendimiento y actividad en tiempo real
          </p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D96B27] text-white font-semibold text-sm hover:bg-[#C25A19] transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-sm animate-fade-in">
          <UserCheck className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-[#D96B27] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#6E615A] dark:text-[#C2B29F]">Cargando datos de cobradores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collector Cards - Left Column */}
          <div className="lg:col-span-1 space-y-3">
            {stats.length === 0 ? (
              <div className="text-center py-10 text-[#6E615A] dark:text-[#C2B29F] text-sm">
                No hay cobradores registrados
              </div>
            ) : (
              stats.map((collector) => (
                <div
                  key={collector.id}
                  onClick={() => setSelectedCollector(collector)}
                  className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md group ${
                    selectedCollector?.id === collector.id
                      ? 'border-[#D96B27] dark:border-[#E07A5F] bg-gradient-to-br from-[#FDF3ED] to-white dark:from-[#3D261A] dark:to-[#1C1917] shadow-md'
                      : 'border-[#E6DCD2] dark:border-[#3D352E] bg-white dark:bg-[#242120] hover:border-[#D96B27]/40'
                  }`}
                >
                  {/* Role badge */}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    collector.role === 'ADMIN'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {collector.role}
                  </span>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D96B27] to-[#C25A19] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {collector.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#2C221E] dark:text-[#EAE0D5] truncate">{collector.name}</p>
                      <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] truncate">{collector.email}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917]/60">
                      <p className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] leading-tight">Hoy</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(collector.collectedToday)}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917]/60">
                      <p className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] leading-tight">Total</p>
                      <p className="text-xs font-bold text-[#D96B27] dark:text-[#E07A5F]">{formatCurrency(collector.collectedTotal)}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917]/60">
                      <p className="text-[10px] text-[#6E615A] dark:text-[#C2B29F] leading-tight">Clientes</p>
                      <p className="text-xs font-bold text-[#2C221E] dark:text-[#EAE0D5]">{collector.assignedClients}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenAssign(collector); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#D96B27] text-white text-xs font-semibold hover:bg-[#C25A19] transition-all active:scale-95"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      Asignar Cartera
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedCollector(collector); }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] text-xs font-semibold hover:bg-[#FAF8F5] dark:hover:bg-[#242120] transition-all"
                    >
                      <Activity className="w-3 h-3" />
                      Ver
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Activity Timeline - Right Column */}
          <div className="lg:col-span-2">
            {selectedCollector ? (
              <div className="rounded-2xl border border-[#E6DCD2] dark:border-[#3D352E] bg-white dark:bg-[#242120] overflow-hidden">
                {/* Timeline Header */}
                <div className="p-4 border-b border-[#E6DCD2] dark:border-[#3D352E] bg-gradient-to-r from-[#FDF3ED] dark:from-[#3D261A] to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D96B27] to-[#C25A19] flex items-center justify-center text-white font-bold text-sm">
                        {selectedCollector.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#2C221E] dark:text-[#EAE0D5]">{selectedCollector.name}</p>
                        <p className="text-xs text-[#6E615A] dark:text-[#C2B29F]">Cronograma de Actividad en Tiempo Real</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-[#6E615A] dark:text-[#C2B29F]">En vivo</span>
                    </div>
                  </div>

                  {/* Summary stats for selected collector */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1C1917]/60 border border-[#E6DCD2] dark:border-[#3D352E]">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] uppercase font-semibold text-[#6E615A] dark:text-[#C2B29F]">Recaudado Hoy</span>
                      </div>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(selectedCollector.collectedToday)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1C1917]/60 border border-[#E6DCD2] dark:border-[#3D352E]">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#D96B27]" />
                        <span className="text-[10px] uppercase font-semibold text-[#6E615A] dark:text-[#C2B29F]">Recaudado Histórico</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#D96B27] dark:text-[#E07A5F]">
                        {formatCurrency(selectedCollector.collectedTotal)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1C1917]/60 border border-[#E6DCD2] dark:border-[#3D352E]">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] uppercase font-semibold text-[#6E615A] dark:text-[#C2B29F]">Clientes Asignados</span>
                      </div>
                      <p className="text-lg font-extrabold text-[#2C221E] dark:text-[#EAE0D5]">
                        {selectedCollector.assignedClients}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {isActivityLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-[#D96B27] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Clock className="w-10 h-10 text-[#E6DCD2] dark:text-[#3D352E]" />
                      <p className="text-sm text-[#6E615A] dark:text-[#C2B29F]">Sin actividad registrada aún</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[#E6DCD2] dark:bg-[#3D352E]" />
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div key={activity.id} className="relative flex items-start gap-4">
                            {/* Timeline dot */}
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.actionType === 'PAGO_REGISTRADO'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400'
                                : 'bg-[#FDF3ED] dark:bg-[#3D261A] border-2 border-[#D96B27]'
                            }`}>
                              <DollarSign className={`w-4 h-4 ${
                                activity.actionType === 'PAGO_REGISTRADO'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-[#D96B27]'
                              }`} />
                            </div>
                            {/* Activity content */}
                            <div className="flex-1 pb-4">
                              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1917]/60 border border-[#E6DCD2] dark:border-[#3D352E] hover:border-[#D96B27]/30 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-[#2C221E] dark:text-[#EAE0D5] leading-tight">
                                    {activity.description}
                                  </p>
                                  {activity.amount > 0 && (
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                      +{formatCurrency(activity.amount)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Clock className="w-3 h-3 text-[#6E615A] dark:text-[#C2B29F]" />
                                  <span className="text-[11px] text-[#6E615A] dark:text-[#C2B29F]">
                                    {formatTime(activity.createdAt)}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    activity.actionType === 'PAGO_REGISTRADO'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-[#FDF3ED] dark:bg-[#3D261A] text-[#D96B27]'
                                  }`}>
                                    {activity.actionType.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-[#E6DCD2] dark:border-[#3D352E]">
                <div className="w-16 h-16 rounded-full bg-[#FDF3ED] dark:bg-[#3D261A] flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#D96B27] dark:text-[#E07A5F]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#2C221E] dark:text-[#EAE0D5]">Selecciona un cobrador</p>
                  <p className="text-sm text-[#6E615A] dark:text-[#C2B29F] mt-1">para ver su actividad en tiempo real</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Clients Modal */}
      {showAssignModal && assignTargetCollector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#242120] rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E6DCD2] dark:border-[#3D352E] bg-gradient-to-r from-[#FDF3ED] dark:from-[#3D261A] to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#2C221E] dark:text-[#EAE0D5]">
                    Asignar Cartera a {assignTargetCollector.name}
                  </h3>
                  <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] mt-0.5">
                    Selecciona los clientes a asignar
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] transition-colors"
                >
                  <X className="w-4 h-4 text-[#6E615A] dark:text-[#C2B29F]" />
                </button>
              </div>
              {selectedClientIds.length > 0 && (
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#D96B27]/10 dark:bg-[#D96B27]/20 text-sm font-semibold text-[#D96B27] dark:text-[#E07A5F]">
                  {selectedClientIds.length} cliente(s) seleccionado(s)
                </div>
              )}
            </div>

            {/* Client List */}
            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {allClients.length === 0 ? (
                <p className="text-center text-sm text-[#6E615A] dark:text-[#C2B29F] py-6">No hay clientes disponibles</p>
              ) : (
                allClients.map((client) => (
                  <label
                    key={client.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedClientIds.includes(client.id)
                        ? 'border-[#D96B27] dark:border-[#E07A5F] bg-[#FDF3ED] dark:bg-[#3D261A]'
                        : 'border-[#E6DCD2] dark:border-[#3D352E] hover:border-[#D96B27]/40 hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917]/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(client.id)}
                      onChange={() => toggleClientSelection(client.id)}
                      className="w-4 h-4 accent-[#D96B27]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#2C221E] dark:text-[#EAE0D5] truncate">{client.name}</p>
                      {client.phone && (
                        <p className="text-xs text-[#6E615A] dark:text-[#C2B29F] truncate">{client.phone}</p>
                      )}
                    </div>
                    {selectedClientIds.includes(client.id) && (
                      <ChevronRight className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F] flex-shrink-0" />
                    )}
                  </label>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6DCD2] dark:border-[#3D352E] flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] font-semibold text-sm hover:bg-[#FAF8F5] dark:hover:bg-[#1C1917] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedClientIds.length === 0 || isAssigning}
                className="flex-1 py-2.5 rounded-xl bg-[#D96B27] text-white font-bold text-sm hover:bg-[#C25A19] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {isAssigning ? 'Asignando...' : `Asignar ${selectedClientIds.length > 0 ? `(${selectedClientIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
