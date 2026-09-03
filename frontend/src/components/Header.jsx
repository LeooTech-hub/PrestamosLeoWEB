import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Bell, PlusCircle, Trash2, LogOut, User, Users, Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { getInitialTheme, applyTheme } from '../utils/themeUtils';
import { LOGO_LR_TRANSPARENT } from '../assets/logoLR';

export function Header({
  alerts = [],
  onRefresh,
  onOpenQuickCreateLoan,
  onOpenTrash,
  user,
  onLogout,
  onOpenUserManagement,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const part1Date = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(currentTime).toUpperCase();

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  
  const dateLine1 = capitalize(part1Date);
  const dateLine2 = `Hora: ${formattedTime}`;
  
  const alertsCount = alerts.length;
  const isAdmin = !user?.role || user?.role === 'ADMIN';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/92 dark:bg-[#181614]/92 backdrop-blur-xl border-b border-[#EEE5DC] dark:border-[#332F2C] shadow-[0_10px_28px_rgba(82,46,20,.05)] px-4 py-3 sm:px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_LR_TRANSPARENT}
              alt="PrestamosLeo Logo"
              loading="eager"
              className="w-12 h-12 object-contain drop-shadow-[0_6px_12px_rgba(181,137,31,.25)] shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h1 className="font-bold text-lg tracking-tight text-[#2C221E] truncate">
                Prestamos<span className="text-[#B40000]">Leo</span>
              </h1>
              <div className="flex flex-col text-xs font-semibold text-stone-700 capitalize truncate mt-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#C89422] shrink-0" />
                  <span className="truncate">{dateLine1}</span>
                </div>
                <div className="flex items-center pl-[20px] truncate mt-[2px]">
                  <span className="truncate">{dateLine2}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions & User Profile */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 flex-shrink-0 flex-nowrap">
            
            {/* 1º Notificaciones */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] hover:text-[#B40000] hover:bg-[#FDF3ED] transition-all active:scale-95"
              title="Centro de Alertas"
            >
              <Bell className="w-[18px] h-[18px] text-[#2C221E]" />
              {alertsCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#C84B31] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>

            {/* 2º Historial / Papelera (Solo ADMIN) */}
            {isAdmin && onOpenTrash && (
              <button
                onClick={onOpenTrash}
                title="Historial de Borrados"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#B40000] dark:hover:text-[#E07A5F] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                <Trash2 className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              </button>
            )}

            {/* 3º Modo Oscuro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#C89422] dark:hover:text-[#C89422] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-[#C89422]" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              )}
            </button>

            {/* 4º Cerrar Sesión */}
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#C84B31] dark:hover:text-[#C84B31] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              <LogOut className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
            </button>

            {/* 5º Ícono de Usuarios (Solo ADMIN) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenUserManagement}
                title="Gestión de Usuarios"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#B40000] dark:hover:text-[#E07A5F] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                <Users className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              </button>
            )}

            {/* 6º Role Badge */}
            {isAdmin ? (
              <button
                type="button"
                onClick={onOpenUserManagement}
                title="Gestión de Usuarios"
                className="bg-[#FFF8E8] hover:bg-[#FFF1C7] text-[#8D650E] border border-[#D6AA43]/35 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                ADMIN
              </button>
            ) : (
              <div className="bg-stone-200 text-stone-800 dark:bg-neutral-700 dark:text-neutral-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                COBRADOR
              </div>
            )}
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
