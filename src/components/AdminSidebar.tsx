'use client';

import React from 'react';
import Image from 'next/image';
import { LayoutDashboard, Route, CreditCard, Banknote, UserPlus, BarChart3, Users, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { TabType } from './Navigation';

interface AdminSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenUserManagement: () => void;
  onOpenCollectors: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  userName?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUserManagement,
  onOpenCollectors,
  onLogout,
  isAdmin,
  userName = 'ADMIN',
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dailyRoute' as TabType, label: 'Ruta Diaria', icon: Route },
    { id: 'loans' as TabType, label: 'Préstamos', icon: CreditCard },
    { id: 'newClient' as TabType, label: 'Nuevo Cliente', icon: UserPlus },
    { id: 'reports' as TabType, label: 'Reportes', icon: BarChart3, adminOnly: false },
    { id: 'clients' as TabType, label: 'Clientes', icon: Users },
  ];

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-[250px] shrink-0 flex-col border-r border-[#eee7df] bg-white px-5 py-5 shadow-[8px_0_30px_rgba(82,46,20,.03)]">
      <div className="flex flex-col items-center border-b border-[#f0ece7] pb-5">
        <Image src="/Logo_PrestamosLeo.png" alt="Logo PrestamosLeo" width={112} height={112} className="h-24 w-24 object-contain" priority />
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#111]">Prestamos<span className="text-[#b40000]">Leo</span></h2>
        <p className="mt-1 text-xs text-[#6f6f6f]">Sistema de Gestión Integral</p>
      </div>

      <nav className="mt-5 space-y-1.5">
        {tabs.map(({ id, label, icon: Icon, adminOnly }) => {
          if (adminOnly && !isAdmin) return null;
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${active ? 'bg-[#fff2f2] text-[#b40000] shadow-[inset_3px_0_0_#b40000]' : 'text-[#4c4c4c] hover:bg-[#faf7f4] hover:text-[#111]'}`}>
              <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-[#b40000]' : 'text-[#6d6d6d]'}`} />
              {label}
            </button>
          );
        })}

        <button onClick={onOpenUserManagement} className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#4c4c4c] transition-all hover:bg-[#faf7f4] hover:text-[#111]">
          <Users className="h-5 w-5 text-[#6d6d6d] transition-transform group-hover:scale-110" /> Usuarios
        </button>
        {isAdmin && (
          <button onClick={onOpenCollectors} className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#4c4c4c] transition-all hover:bg-[#faf7f4] hover:text-[#111]">
            <Settings className="h-5 w-5 text-[#6d6d6d] transition-transform group-hover:rotate-12" /> Configuración
          </button>
        )}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-[#eadfce] bg-gradient-to-br from-[#fffaf3] to-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#d9aa39] to-[#b98518] font-bold text-white shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[#242424]">{userName}</p>
              <p className="text-xs text-[#6d6d6d]">{isAdmin ? 'Administrador' : 'Cobrador'}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#147c3a]"><span className="h-2 w-2 rounded-full bg-[#20a34a]" /> En línea</span>
            </div>
          </div>
        </div>

        <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ece7e0] bg-white px-4 py-3 text-sm font-semibold text-[#4b4b4b] transition-all hover:border-red-200 hover:bg-red-50 hover:text-[#a30000]">
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </button>

        <div className="rounded-2xl border border-[#f0ece6] bg-[#fffdf9] p-4 text-center text-[11px] leading-5 text-[#737373]">
          <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-[#c4911e]" />
          <p className="font-semibold text-[#343434]">Prestamos<span className="text-[#b40000]">Leo</span></p>
          <p>© 2026 Todos los derechos reservados.</p>
        </div>
      </div>
    </aside>
  );
};
