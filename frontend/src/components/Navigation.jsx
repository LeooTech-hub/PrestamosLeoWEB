import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Route, CreditCard, UserPlus, BarChart3, Users } from 'lucide-react';

export function Navigation({ pendingCountToday = 0, overdueCount = 0 }) {
  const tabs = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/ruta-diaria',
      label: 'Ruta Diaria',
      icon: Route,
      badge: pendingCountToday > 0 ? pendingCountToday : undefined,
    },
    {
      to: '/prestamos',
      label: 'Préstamos',
      icon: CreditCard,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      to: '/nuevo-cliente',
      label: 'Nuevo Cliente',
      icon: UserPlus,
    },
    {
      to: '/reportes',
      label: 'Reportes',
      icon: BarChart3,
    },
    {
      to: '/clientes',
      label: 'Clientes',
      icon: Users,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Header Nav Tabs */}
      <nav className="hidden md:block bg-white border-b border-[#E6DCD2] px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition-all relative whitespace-nowrap ${
                    isActive
                      ? 'border-[#D96B27] text-[#D96B27] bg-[#FDF3ED]/60 font-semibold'
                      : 'border-transparent text-[#6E615A] hover:text-[#2C221E] hover:bg-[#F5F0EB]/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D96B27]' : 'text-[#6E615A]'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="ml-1 bg-[#C84B31] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom Bar (6 Columns) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E6DCD2] px-1 py-1.5 warm-shadow-lg">
        <div className="grid grid-cols-6 items-center gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
                    isActive
                      ? 'text-[#D96B27] bg-[#FDF3ED] font-bold scale-105'
                      : 'text-[#6E615A] hover:text-[#2C221E]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#D96B27]' : 'text-[#6E615A]'}`} />
                      {tab.badge !== undefined && (
                        <span className="absolute -top-1.5 -right-2 bg-[#C84B31] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] leading-tight truncate w-full text-center">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
