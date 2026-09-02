'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, Sun, Moon, ChevronDown } from 'lucide-react';
import { AlertNotification } from '@/types';
import { getInitialTheme, applyTheme } from '@/lib/themeUtils';

interface AdminTopbarProps {
  alerts: AlertNotification[];
  userName?: string;
  userRole: 'ADMIN' | 'COBRADOR';
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ alerts, userName = 'ADMIN', userRole }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getInitialTheme());
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const date = now ? new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(now) : '';
  const time = now ? new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now) : '';

  return (
    <header className="sticky top-0 z-30 border-b border-[#eee7df] bg-white/92 px-4 py-3 backdrop-blur-xl lg:px-7">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#1f1f1f]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff8ee] text-[#b77e08] shadow-sm">👋</span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black sm:text-lg">¡Bienvenido de vuelta, {userName}!</h1>
              <p className="hidden text-xs text-[#747474] sm:block">{date} · {time}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden h-11 w-[330px] items-center gap-2 rounded-2xl border border-[#ece7e0] bg-white px-4 shadow-sm xl:flex">
            <Search className="h-4 w-4 text-[#b58a2c]" />
            <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b7b7b7]" placeholder="Buscar clientes, préstamos, cobros..." />
          </div>

          <button onClick={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); applyTheme(next); }} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ece7e0] bg-white text-[#b47f13] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" title="Cambiar tema">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ece7e0] bg-white text-[#555] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b40000] px-1 text-[10px] font-bold text-white">{alerts.length > 9 ? '9+' : alerts.length}</span>}
          </button>

          <button className="hidden items-center gap-2 rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-2.5 text-sm font-bold text-[#3a3026] shadow-sm sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c59629] text-xs text-white">{userName.charAt(0).toUpperCase()}</span>
            {userRole}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
