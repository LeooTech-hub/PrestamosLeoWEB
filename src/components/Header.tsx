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
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#181614]/95 backdrop-blur-md border-b border-[#E6DCD2] dark:border-[#332F2C] px-4 py-3 sm:px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain rounded-full shadow-sm ring-2 ring-[#D96B27]/20 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#2C221E] dark:text-[#F3F4F6]">
                  Prestamos<span className="text-[#D96B27] dark:text-[#E07A5F]">Leo</span>
                </h1>
                <span className="bg-[#FDF3ED] dark:bg-[#2C221E] text-[#D96B27] dark:text-[#E07A5F] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D96B27]/20 dark:border-[#E07A5F]/20 uppercase">
                  Perú S/. 20%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-[#6E615A] dark:text-[#E5E7EB] capitalize">
                <Calendar className="w-3 h-3 text-[#E89D4F]" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Loan Button */}
            <button
              onClick={onOpenQuickCreateLoan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">+ Crear Préstamo</span>
              <span className="sm:hidden">Préstamo</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-white dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#2C221E] transition-all active:scale-95 warm-shadow"
              title="Centro de Alertas"
            >
              <Bell className="w-4 h-4 text-[#2C221E] dark:text-[#E5E7EB]" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C84B31] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              title="Actualizar datos"
              className="p-2 rounded-xl bg-white dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#2C221E] transition-all active:scale-95 warm-shadow"
            >
              <RefreshCw className="w-4 h-4 text-[#2C221E] dark:text-[#E5E7EB]" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
              className="p-2 rounded-xl bg-white dark:bg-[#24211E] border border-[#E6DCD2] dark:border-[#332F2C] text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#2C221E] transition-all active:scale-95 warm-shadow"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#E89D4F]" />
              ) : (
                <Moon className="w-4 h-4 text-[#2C221E] dark:text-[#E5E7EB]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown Modal */}
      <NotificationDropdown
        alerts={alerts}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
};
