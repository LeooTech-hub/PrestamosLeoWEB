'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, Calendar, Bell, PlusCircle, Sun, Moon } from 'lucide-react';
import { AlertNotification } from '@/types';
import { NotificationDropdown } from './Notifications/NotificationDropdown';
import { getInitialTheme, applyTheme } from '@/lib/themeUtils';

interface HeaderProps {
  alerts: AlertNotification[];
  onRefresh: () => void;
  onResetDemo?: () => void;
  onOpenQuickCreateLoan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  alerts,
  onRefresh,
  onOpenQuickCreateLoan,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

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
      {/* ─── HEADER ─────────────────────────────────────────────────
          Mobile:  Logo + Título | [Bell] [Refresh] [Theme]
          Desktop: Logo + Título + Fecha | [+ Crear] [Bell] [Refresh] [Theme]
          flex-nowrap + overflow-hidden evita que los ítems se encimen.
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-[#E6DCD2] dark:border-[#3D352E] px-4 sm:px-6 py-2.5 sm:py-3 transition-colors duration-300 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-nowrap">

          {/* ── Brand & Logo ─────────────────────────────── */}
          {/* min-w-0 + overflow-hidden garantizan que el bloque izquierdo
              se comprima antes de empujar los botones de acción */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <Image
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full shadow-sm ring-2 ring-[#D96B27]/20 dark:ring-[#E07A5F]/30 shrink-0"
            />
            <div className="min-w-0 overflow-hidden">
              {/* Título siempre visible; badge "20%" oculto en el móvil más pequeño */}
              <div className="flex items-center gap-1 sm:gap-2">
                <h1 className="font-extrabold text-[15px] sm:text-xl tracking-tight text-[#2C221E] dark:text-[#EAE0D5] truncate leading-none">
                  Prestamos<span className="text-[#D96B27] dark:text-[#E07A5F]">Leo</span>
                </h1>
                {/* Badge — visible sólo ≥ 640 px (hidden en móvil) */}
                <span className="hidden sm:inline-flex bg-[#FDF3ED] dark:bg-[#26221F] text-[#D96B27] dark:text-[#E07A5F] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D96B27]/20 dark:border-[#E07A5F]/30 uppercase shrink-0 whitespace-nowrap">
                  Perú S/. 20%
                </span>
              </div>

              {/* Fecha completa — sólo en sm+ (≥ 640 px) */}
              <div className="hidden sm:flex items-center gap-1 text-[12px] text-[#6E615A] dark:text-[#C2B29F] capitalize mt-0.5 truncate">
                <Calendar className="w-3 h-3 text-[#E89D4F] shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* ── Quick Actions (siempre a la derecha, nunca se envuelven) ── */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">

            {/* + Crear Préstamo — SOLO visible en sm+ */}
            <button
              onClick={onOpenQuickCreateLoan}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>+ Crear Préstamo</span>
            </button>

            {/* Campana de Alertas */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-white dark:bg-[#26221F] border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 transition-all active:scale-95 warm-shadow"
              title="Centro de Alertas"
            >
              <Bell className="w-4 h-4 text-[#2C221E] dark:text-[#EAE0D5]" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C84B31] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1C1917] animate-pulse">
                  {alertsCount > 9 ? '9+' : alertsCount}
                </span>
              )}
            </button>

            {/* Actualizar */}
            <button
              onClick={onRefresh}
              title="Actualizar datos"
              className="p-2 rounded-xl bg-white dark:bg-[#26221F] border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 transition-all active:scale-95 warm-shadow"
            >
              <RefreshCw className="w-4 h-4 text-[#2C221E] dark:text-[#EAE0D5]" />
            </button>

            {/* Modo Día / Modo Nocturno Cálido */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Activar Modo Nocturno Cálido'}
              className={`p-2 rounded-xl border transition-all active:scale-95 warm-shadow ${
                theme === 'dark'
                  ? 'bg-[#2D2824] border-[#4A3F37] text-[#E89D4F] hover:bg-[#3D352E]'
                  : 'bg-white border-[#E6DCD2] text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED]'
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#E89D4F]" />
              ) : (
                <Moon className="w-4 h-4 text-[#2C221E]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown */}
      <NotificationDropdown
        alerts={alerts}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
};
