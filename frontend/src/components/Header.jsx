import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Bell, PlusCircle, Trash2, LogOut, User, Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { getInitialTheme, applyTheme } from '../utils/themeUtils';

export function Header({
  alerts = [],
  onRefresh,
  onOpenQuickCreateLoan,
  onOpenTrash,
  user,
  onLogout
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

  const formattedDate = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(currentTime).toUpperCase();

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const alertsCount = alerts.length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#181614]/95 backdrop-blur-md border-b border-[#E6DCD2] dark:border-[#332F2C] px-4 py-3 sm:px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              loading="eager"
              className="h-10 w-10 object-contain rounded-full shadow-sm ring-2 ring-[#D96B27]/20 shrink-0"
            />
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-[#2C221E]">
                    Prestamos<span className="text-[#D96B27]">Leo</span>
                  </h1>
                </div>

                {/* Fecha y Hora en tiempo real */}
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-neutral-500 capitalize truncate">
                  <Calendar className="w-3 h-3 text-[#E89D4F] shrink-0" />
                  <span className="truncate">
                    {capitalize(formattedDate)} | {formattedTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions & User Profile */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
            {/* ROW 1: Trash + Refresh + Notifications */}
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenTrash}
                title="Papelera de Reciclaje"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-lg bg-transparent border-none text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5 sm:w-[18px] sm:h-[18px] text-[#2C221E]" />
              </button>

              <button
                onClick={onRefresh}
                title="Actualizar datos"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-lg bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5 sm:w-[18px] sm:h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              </button>

              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-8 h-8 p-1.5 flex items-center justify-center rounded-lg bg-transparent border-none text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] transition-all active:scale-95"
                title="Centro de Alertas"
              >
                <Bell className="w-5 h-5 sm:w-[18px] sm:h-[18px] text-[#2C221E]" />
                {alertsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#C84B31] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {alertsCount}
                  </span>
                )}
              </button>
            </div>

            {/* ROW 2: Theme Switcher + Logout */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
                className="p-1 flex items-center justify-center rounded-lg bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#E89D4F] dark:hover:text-[#E89D4F] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 opacity-80 hover:opacity-100"
              >
                {theme === 'dark' ? (
                  <Sun className="w-[18px] h-[18px] text-[#E89D4F]" />
                ) : (
                  <Moon className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
                )}
              </button>

              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="p-1 flex items-center justify-center rounded-lg bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#C84B31] dark:hover:text-[#C84B31] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 opacity-80 hover:opacity-100"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span className="text-xs font-semibold sm:hidden ml-1">Salir</span>
              </button>
            </div>

            {/* Separator & User Badge (Desktop only) */}
            <div className="h-6 w-px bg-[#E6DCD2] mx-1 hidden sm:block"></div>
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white border border-[#E6DCD2] rounded-xl warm-shadow">
                <div className="w-6 h-6 rounded-full bg-[#FDF3ED] text-[#D96B27] flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-[#2C221E] truncate max-w-[120px]">{user.name || 'Usuario'}</p>
                  <p className="text-[10px] text-[#6E615A] truncate max-w-[120px]">{user.email}</p>
                </div>
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
