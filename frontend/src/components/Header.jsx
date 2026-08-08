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

  const part1Date = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(currentTime);

  const part2Year = new Intl.DateTimeFormat('es-PE', {
    year: 'numeric'
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(currentTime).toUpperCase();

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  
  const dateLine1 = capitalize(part1Date);
  const dateLine2 = `De ${part2Year} | ${formattedTime}`;
  
  const alertsCount = alerts.length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#181614]/95 backdrop-blur-md border-b border-[#E6DCD2] dark:border-[#332F2C] px-4 py-3 sm:px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              loading="eager"
              className="w-9 h-9 object-contain rounded-full shadow-sm ring-2 ring-[#D96B27]/20 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h1 className="font-bold text-lg tracking-tight text-[#2C221E] truncate">
                Prestamos<span className="text-[#D96B27]">Leo</span>
              </h1>
              <div className="flex flex-col text-xs text-neutral-500 capitalize truncate mt-0.5">
                <div className="flex items-center gap-1 truncate">
                  <Calendar className="w-3 h-3 text-[#E89D4F] shrink-0" />
                  <span className="truncate">{dateLine1}</span>
                </div>
                <div className="flex items-center gap-1 pl-4 truncate">
                  <span className="truncate text-[10px] sm:text-xs text-neutral-400">{dateLine2}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions & User Profile */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            
            {/* ROW 1: Notificaciones, Modo Oscuro */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] hover:text-[#D96B27] hover:bg-[#FDF3ED] transition-all active:scale-95"
                title="Centro de Alertas"
              >
                <Bell className="w-[18px] h-[18px] text-[#2C221E]" />
                {alertsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#C84B31] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {alertsCount}
                  </span>
                )}
              </button>

              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#E89D4F] dark:hover:text-[#E89D4F] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                {theme === 'dark' ? (
                  <Sun className="w-[18px] h-[18px] text-[#E89D4F]" />
                ) : (
                  <Moon className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
                )}
              </button>
            </div>

            {/* ROW 2: Recargar, Salir */}
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                title="Actualizar datos"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                <RefreshCw className="w-[18px] h-[18px] text-[#2C221E] dark:text-[#E5E7EB]" />
              </button>

              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="w-8 h-8 p-1.5 flex items-center justify-center rounded-xl bg-transparent border-none text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#C84B31] dark:hover:text-[#C84B31] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>

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
