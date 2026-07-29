import React, { useState } from 'react';
import { Wallet, RefreshCw, Calendar, Sparkles, Bell, PlusCircle } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export function Header({ alerts = [], onRefresh, onResetDemo, onOpenQuickCreateLoan }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const today = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);
  const alertsCount = alerts.length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6DCD2] px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl terracotta-gradient flex items-center justify-center text-white shadow-sm ring-2 ring-[#D96B27]/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#2C221E]">
                  Prestamos<span className="text-[#D96B27]">Leo</span>
                </h1>
                <span className="bg-[#FDF3ED] text-[#D96B27] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D96B27]/20 uppercase">
                  Perú S/. 20%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-[#6E615A] capitalize">
                <Calendar className="w-3 h-3 text-[#E89D4F]" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQuickCreateLoan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">+ Crear Préstamo</span>
              <span className="sm:hidden">Préstamo</span>
            </button>

            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-white border border-[#E6DCD2] text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] transition-all active:scale-95 warm-shadow"
              title="Centro de Alertas"
            >
              <Bell className="w-4 h-4 text-[#2C221E]" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C84B31] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>

            <button
              onClick={onRefresh}
              title="Actualizar datos"
              className="p-2 rounded-xl bg-white border border-[#E6DCD2] text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] transition-all active:scale-95 warm-shadow"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onResetDemo}
              title="Restablecer datos de prueba"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E6DCD2] text-[#6E615A] hover:bg-[#F5F0EB] hover:text-[#2C221E] transition-all warm-shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E89D4F]" />
              <span>Datos Demo</span>
            </button>
          </div>
        </div>
      </header>

      <NotificationDropdown
        alerts={alerts}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
