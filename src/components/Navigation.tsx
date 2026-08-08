'use client';

import React from 'react';
import { LayoutDashboard, Route, CreditCard, UserPlus, BarChart3, Users } from 'lucide-react';

export type TabType = 'dashboard' | 'dailyRoute' | 'loans' | 'newClient' | 'reports' | 'clients';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCountToday: number;
  overdueCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingCountToday,
  overdueCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'dailyRoute' as TabType,
      label: 'Ruta Diaria',
      icon: Route,
      badge: pendingCountToday > 0 ? pendingCountToday : undefined,
    },
    {
      id: 'loans' as TabType,
      label: 'Préstamos',
      icon: CreditCard,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      id: 'newClient' as TabType,
      label: 'Nuevo Cliente',
      icon: UserPlus,
    },
    {
      id: 'reports' as TabType,
      label: 'Reportes',
      icon: BarChart3,
    },
    {
      id: 'clients' as TabType,
      label: 'Clientes',
      icon: Users,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Header Nav Tabs */}
      <nav className="hidden md:block bg-white dark:bg-[#1C1917] border-b border-[#E6DCD2] dark:border-[#3D352E] px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition-all relative whitespace-nowrap ${
                  isActive
                    ? 'border-[#D96B27] dark:border-[#E07A5F] text-[#D96B27] dark:text-[#E07A5F] bg-[#FDF3ED]/60 dark:bg-[#3D261A]/60 font-semibold'
                    : 'border-transparent text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5] hover:bg-[#F5F0EB]/50 dark:hover:bg-[#2D2824]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D96B27] dark:text-[#E07A5F]' : 'text-[#6E615A] dark:text-[#C2B29F]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 bg-[#C84B31] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom Bar (6 Columns) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C1917]/95 backdrop-blur-lg border-t border-[#E6DCD2] dark:border-[#3D352E] px-1 py-1.5 warm-shadow-lg transition-colors duration-300">
        <div className="grid grid-cols-6 items-center gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-[#D96B27] dark:text-[#E07A5F] bg-[#FDF3ED] dark:bg-[#3D261A]/70 font-bold scale-105'
                    : 'text-[#6E615A] dark:text-[#C2B29F] hover:text-[#2C221E] dark:hover:text-[#EAE0D5]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#D96B27] dark:text-[#E07A5F]' : 'text-[#6E615A] dark:text-[#C2B29F]'}`} />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-[#C84B31] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1C1917]">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] leading-tight truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
