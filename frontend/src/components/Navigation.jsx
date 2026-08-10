import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Route, CreditCard, UserPlus, BarChart3, Users } from 'lucide-react';

export function Navigation({ pendingCountToday = 0, overdueCount = 0, onOpenUserManagement, user }) {
  const isAdmin = !user?.role || user?.role === 'ADMIN';

  const allTabs = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'COBRADOR'],
    },
    {
      to: '/ruta-diaria',
      label: 'Ruta Diaria',
      icon: Route,
      badge: pendingCountToday > 0 ? pendingCountToday : undefined,
      roles: ['ADMIN', 'COBRADOR'],
    },
    {
      to: '/prestamos',
      label: 'Préstamos',
      icon: CreditCard,
      badge: overdueCount > 0 ? overdueCount : undefined,
      roles: ['ADMIN', 'COBRADOR'],
    },
    {
      to: '/nuevo-cliente',
      label: 'Nuevo Cliente',
      icon: UserPlus,
      roles: ['ADMIN', 'COBRADOR'],
    },
    {
      to: '/reportes',
      label: 'Reportes',
      icon: BarChart3,
      roles: ['ADMIN'],
    },
    {
      to: '/clientes',
      label: 'Clientes',
      icon: Users,
      roles: ['ADMIN', 'COBRADOR'],
    },
    {
      to: '#',
      label: 'Usuarios',
      icon: Users,
      isUserManagement: true,
      roles: ['ADMIN'],
    },
  ];

  const tabs = allTabs.filter(tab => isAdmin || tab.roles.includes('COBRADOR'));
  const gridClass = tabs.length === 7 ? 'grid-cols-7' : tabs.length === 6 ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <>
      {/* Desktop / Tablet Header Nav Tabs */}
      <nav className="hidden md:block bg-white dark:bg-[#1E1E1E] border-b border-[#E6DCD2] dark:border-[#332F2C] px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            if (tab.isUserManagement) {
              return (
                <button
                  key={tab.label}
                  onClick={onOpenUserManagement}
                  className="flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 border-transparent text-[#D96B27] dark:text-[#E07A5F] hover:text-[#C25A19] dark:hover:text-[#E07A5F] hover:bg-[#FDF3ED]/60 dark:hover:bg-[#2C221E]/60 transition-all relative whitespace-nowrap font-semibold cursor-pointer"
                  title="Gestión de Usuarios"
                >
                  <Icon className="w-4 h-4 text-[#D96B27] dark:text-[#E07A5F]" />
                  <span>{tab.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3.5 font-medium text-sm border-b-2 transition-all relative whitespace-nowrap ${
                    isActive
                      ? 'border-[#D96B27] dark:border-[#E07A5F] text-[#D96B27] dark:text-[#E07A5F] bg-[#FDF3ED]/60 dark:bg-[#2C221E]/60 font-semibold'
                      : 'border-transparent text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#2C221E] dark:hover:text-[#F3F4F6] hover:bg-[#F5F0EB]/50 dark:hover:bg-[#24211E]/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D96B27] dark:text-[#E07A5F]' : 'text-[#6E615A] dark:text-[#E5E7EB]'}`} />
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

      {/* Mobile Fixed Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-lg border-t border-[#E6DCD2] dark:border-[#332F2C] px-1 py-1.5 warm-shadow-lg transition-colors duration-300">
        <div className={`grid ${gridClass} items-center gap-0.5`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            if (tab.isUserManagement) {
              return (
                <button
                  key={tab.label}
                  onClick={onOpenUserManagement}
                  className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative text-[#D96B27] dark:text-[#E07A5F] font-bold active:scale-95 cursor-pointer"
                >
                  <div className="relative">
                    <Icon className="w-4 h-4 mb-0.5 text-[#D96B27] dark:text-[#E07A5F]" />
                  </div>
                  <span className="text-[9px] leading-tight truncate w-full text-center">
                    {tab.label}
                  </span>
                </button>
              );
            }
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
                    isActive
                      ? 'text-[#D96B27] dark:text-[#E07A5F] bg-[#FDF3ED] dark:bg-[#2C221E] font-bold scale-105'
                      : 'text-[#6E615A] dark:text-[#E5E7EB] hover:text-[#2C221E] dark:hover:text-[#F3F4F6]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#D96B27] dark:text-[#E07A5F]' : 'text-[#6E615A] dark:text-[#E5E7EB]'}`} />
                      {tab.badge !== undefined && (
                        <span className="absolute -top-1.5 -right-2 bg-[#C84B31] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1E1E1E]">
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
