'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, Calendar, Bell, PlusCircle, Sun, Moon, LogOut, Trash2 } from 'lucide-react';
import { AlertNotification } from '@/types';
import { NotificationDropdown } from './Notifications/NotificationDropdown';
import { getInitialTheme, applyTheme } from '@/lib/themeUtils';

interface HeaderProps {
  alerts: AlertNotification[];
  onRefresh: () => void;
  onResetDemo?: () => void;
  onOpenQuickCreateLoan: () => void;
  onOpenTrash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  alerts,
  onRefresh,
  onOpenQuickCreateLoan,
  onOpenTrash,
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

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const part1Date = currentTime ? new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(currentTime) : '';

  const part2Year = currentTime ? new Intl.DateTimeFormat('es-PE', {
    year: 'numeric'
  }).format(currentTime) : '';

  const formattedTime = currentTime ? new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(currentTime).toUpperCase() : '';

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const dateLine1 = capitalize(part1Date);
  const dateLine2 = currentTime ? `De ${part2Year} | ${formattedTime}` : '';

  const alertsCount = alerts.length;

  return (
    <>
      {/* ─── HEADER ─────────────────────────────────────────────────
          Mobile:  Logo + Título | [Bell] [Refresh] [Theme]
          Desktop: Logo + Título + Fecha | [+ Crear] [Bell] [Refresh] [Theme]
          flex-nowrap + overflow-hidden evita que los ítems se encimen.
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-auto py-2.5 px-4 w-full bg-[#FAF8F5]/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-[#E6DCD2] dark:border-[#3D352E] flex items-center justify-center transition-colors duration-300 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 flex-nowrap">
          {/* ── Brand & Logo ─────────────────────────────── */}
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <Image
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain rounded-full shadow-sm ring-2 ring-[#D96B27]/20 dark:ring-[#E07A5F]/30 shrink-0"
            />
            <div className="flex flex-col min-w-0 overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight text-[#2C221E] dark:text-[#EAE0D5] truncate leading-none">
                Prestamos<span className="text-[#D96B27] dark:text-[#E07A5F]">Leo</span>
              </h1>
              <div className="flex flex-col text-xs font-semibold text-neutral-700 dark:text-neutral-300 capitalize truncate mt-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#E89D4F] shrink-0" />
                  <span className="truncate">{dateLine1}</span>
                </div>
                {currentTime && (
                  <div className="flex items-center pl-[20px] truncate mt-[2px]">
                    <span className="truncate">{dateLine2}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Quick Actions (Right Side) ── */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 flex-shrink-0 flex-nowrap">
            {/* 1º Notificaciones */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-neutral-800 transition-all active:scale-95"
              title="Centro de Alertas"
            >
              <Bell className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
              {alertsCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#C84B31] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1C1917] animate-pulse">
                  {alertsCount > 9 ? '9+' : alertsCount}
                </span>
              )}
            </button>

            {/* 2º Historial / Papelera */}
            <button
              onClick={onOpenTrash}
              title="Historial de Borrados"
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              <Trash2 className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
            </button>

            {/* 3º Modo Oscuro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Activar Modo Nocturno Cálido'}
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#E89D4F] dark:hover:text-[#E89D4F] hover:bg-[#FDF3ED] dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-[#E89D4F]" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              )}
            </button>

            {/* 4º Cerrar Sesión */}
            <button
              onClick={() => console.log('Logout clicked')}
              title="Cerrar Sesión"
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#C84B31] dark:hover:text-[#C84B31] hover:bg-[#FDF3ED] dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              <LogOut className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
            </button>

            {/* 5º Badge "ADMIN" */}
            <div className="flex items-center justify-center px-2.5 py-1 rounded-full border border-[#E6DCD2] dark:border-[#3D352E] bg-[#F4EBE1] dark:bg-[#2A241F] text-[#D96B27] dark:text-[#E07A5F] font-bold text-[11px] shadow-sm">
              ADMIN
            </div>
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
