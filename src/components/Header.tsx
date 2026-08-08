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
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-[#E6DCD2] dark:border-[#3D352E] px-3 sm:px-6 py-2 sm:py-3 transition-colors duration-300 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <Image
              src="/Logo_PrestamosLeo.png"
              alt="PrestamosLeo Logo"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full shadow-sm ring-2 ring-[#D96B27]/20 dark:ring-[#E07A5F]/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-base sm:text-xl tracking-tight text-[#2C221E] dark:text-[#EAE0D5] truncate">
                  Prestamos<span className="text-[#D96B27] dark:text-[#E07A5F]">Leo</span>
                </h1>
                <span className="bg-[#FDF3ED] dark:bg-[#26221F] text-[#D96B27] dark:text-[#E07A5F] text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-[#D96B27]/20 dark:border-[#E07A5F]/30 uppercase shrink-0">
                  Perú S/. 20%
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[12px] text-[#6E615A] dark:text-[#C2B29F] capitalize">
                <Calendar className="w-3 h-3 text-[#E89D4F]" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Loan Button - Hidden on mobile (< sm) */}
            <button
              onClick={onOpenQuickCreateLoan}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl terracotta-gradient text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Crear Préstamo</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#26221F] border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 transition-all active:scale-95 warm-shadow"
              title="Centro de Alertas"
            >
              <Bell className="w-4 h-4 text-[#2C221E] dark:text-[#EAE0D5]" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C84B31] text-white text-[9px] sm:text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1C1917] animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              title="Actualizar datos"
              className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#26221F] border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 transition-all active:scale-95 warm-shadow"
            >
              <RefreshCw className="w-4 h-4 text-[#2C221E] dark:text-[#EAE0D5]" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
              className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#26221F] border border-[#E6DCD2] dark:border-[#3D352E] text-[#6E615A] dark:text-[#C2B29F] hover:text-[#D96B27] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED] dark:hover:bg-[#E07A5F]/15 transition-all active:scale-95 warm-shadow"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#E89D4F]" />
              ) : (
                <Moon className="w-4 h-4 text-[#2C221E] dark:text-[#EAE0D5]" />
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
