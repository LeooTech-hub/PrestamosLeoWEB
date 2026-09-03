'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, Calendar, Bell, PlusCircle, Sun, Moon, LogOut, Trash2, Users, Shield } from 'lucide-react';
import { AlertNotification } from '@/types';
import { NotificationDropdown } from './Notifications/NotificationDropdown';
import { getInitialTheme, applyTheme } from '@/lib/themeUtils';
import { getStoredUser, clearAuth } from '@/lib/auth';

interface HeaderProps {
  alerts: AlertNotification[];
  onRefresh: () => void;
  onResetDemo?: () => void;
  onOpenQuickCreateLoan: () => void;
  onOpenTrash?: () => void;
  onOpenUserManagement?: () => void;
  userRole?: 'ADMIN' | 'COBRADOR';
}

export const Header: React.FC<HeaderProps> = ({
  alerts,
  onRefresh,
  onOpenQuickCreateLoan,
  onOpenTrash,
  onOpenUserManagement,
  userRole,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getInitialTheme());
  const [resolvedRole, setResolvedRole] = useState<'ADMIN' | 'COBRADOR'>('COBRADOR');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const user = getStoredUser();
    const role = userRole || user?.role || 'COBRADOR';
    setResolvedRole(role as 'ADMIN' | 'COBRADOR');
  }, [userRole]);

  const isAdmin = resolvedRole === 'ADMIN';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.reload();
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

  const formattedTime = currentTime ? new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(currentTime).toUpperCase() : '';

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const dateLine1 = capitalize(part1Date);
  const dateLine2 = currentTime ? `Hora: ${formattedTime}` : '';

  const alertsCount = alerts.length;

  return (
    <>
      {/* ─── HEADER ─────────────────────────────────────────────────
          Mobile:  Logo + Título | [Bell] [Refresh] [Theme]
          Desktop: Logo + Título + Fecha | [+ Crear] [Bell] [Refresh] [Theme]
          flex-nowrap + overflow-hidden evita que los ítems se encimen.
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-auto py-3 px-4 w-full bg-white/92 dark:bg-[#171514]/92 backdrop-blur-xl border-b border-[#EEE5DC] dark:border-[#3A312B] flex items-center justify-center transition-colors duration-300 overflow-hidden shadow-[0_10px_28px_rgba(82,46,20,.05)]">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 flex-nowrap">
          {/* ── Brand & Logo ─────────────────────────────── */}
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <Image
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              width={36}
              height={36}
              className="w-11 h-11 object-contain rounded-full shadow-[0_8px_20px_rgba(181,137,31,.15)] ring-1 ring-[#D6AA43]/30 dark:ring-[#D6AA43]/25 shrink-0"
            />
            <div className="flex flex-col min-w-0 overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight text-[#2C221E] dark:text-[#EAE0D5] truncate leading-none">
                Prestamos<span className="text-[#B40000] dark:text-[#F06A5C]">Leo</span>
              </h1>
              <div className="flex flex-col text-xs font-semibold text-stone-700 dark:text-stone-300 capitalize truncate mt-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#C89422] shrink-0" />
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
              className="relative w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#B40000] dark:hover:text-[#F06A5C] hover:bg-[#FFF3F3] dark:hover:bg-[#2A211D] transition-all active:scale-95"
              title="Centro de Alertas"
            >
              <Bell className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
              {alertsCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#C84B31] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1C1917] animate-pulse">
                  {alertsCount > 9 ? '9+' : alertsCount}
                </span>
              )}
            </button>

            {/* 2º Historial / Papelera — ADMIN only */}
            {isAdmin && (
              <button
                onClick={onOpenTrash}
                title="Historial de Borrados"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#B40000] dark:hover:text-[#F06A5C] hover:bg-[#FFF3F3] dark:hover:bg-[#2A211D] transition-all active:scale-95"
              >
                <Trash2 className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
              </button>
            )}

            {/* 3º Modo Oscuro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Activar Modo Nocturno Cálido'}
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#C89422] dark:hover:text-[#C89422] hover:bg-[#FDF3ED] dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-[#C89422]" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              )}
            </button>

            {/* 4º Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#A80000] dark:hover:text-[#F06A5C] hover:bg-[#FFF3F3] dark:hover:bg-[#2A211D] transition-all active:scale-95"
            >
              <LogOut className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
            </button>

            {/* 5º Ícono Directo de Usuarios */}
            <button
              type="button"
              id="open-user-management-btn"
              onClick={onOpenUserManagement}
              title="Gestión de Usuarios"
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#C2B29F] hover:text-[#B40000] dark:hover:text-[#F06A5C] hover:bg-[#FFF3F3] dark:hover:bg-[#2A211D] transition-all active:scale-95"
            >
              <Users className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#EAE0D5]" />
            </button>

            {/* 6º Role Badge — ADMIN */}
            <button
              type="button"
              id="role-badge-btn"
              onClick={onOpenUserManagement}
              title="Gestión de Usuarios"
              className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-full border font-bold text-[11px] shadow-sm transition-all duration-150 border-[#D96B27]/40 dark:border-[#E07A5F]/40 bg-[#FDF3ED] dark:bg-[#D96B27]/20 text-[#B40000] dark:text-[#F06A5C] cursor-pointer hover:bg-amber-100 dark:hover:bg-[#D96B27]/30 active:scale-95"
            >
              <Shield className="w-3 h-3" />
              {resolvedRole}
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
