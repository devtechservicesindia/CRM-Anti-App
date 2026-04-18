import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Monitor, CalendarDays, CreditCard,
  Gamepad2, BarChart3, Settings, LogOut, ChevronLeft, Zap,
  Gift, Star, Shield, UserCog
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// ─── Nav config per role ───────────────────────────────────────────────────────
type NavItem = {
  icon: React.ElementType;
  label: string;
  to: string;
  roles: string[];
  section?: string;
};

const navItems: NavItem[] = [
  // All roles
  { icon: LayoutDashboard, label: 'Dashboard',  to: '/',         roles: ['ADMIN', 'STAFF', 'CUSTOMER'], section: 'main' },
  { icon: CalendarDays,    label: 'Bookings',   to: '/bookings', roles: ['ADMIN', 'STAFF', 'CUSTOMER'], section: 'main' },
  { icon: Gamepad2,        label: 'Games',      to: '/games',    roles: ['ADMIN', 'STAFF', 'CUSTOMER'], section: 'main' },
  { icon: Gift,            label: 'Rewards',    to: '/rewards',  roles: ['ADMIN', 'STAFF', 'CUSTOMER'], section: 'main' },

  // Staff + Admin
  { icon: Users,           label: 'Customers',  to: '/customers', roles: ['ADMIN', 'STAFF'], section: 'management' },
  { icon: Monitor,         label: 'Stations',   to: '/stations',  roles: ['ADMIN', 'STAFF'], section: 'management' },
  { icon: CreditCard,      label: 'Payments',   to: '/payments',  roles: ['ADMIN', 'STAFF'], section: 'management' },

  // Admin only
  { icon: BarChart3,       label: 'Reports',    to: '/reports',   roles: ['ADMIN'], section: 'admin' },
  { icon: Settings,        label: 'Settings',   to: '/settings',  roles: ['ADMIN'], section: 'admin' },
];

const roleBadgeConfig = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  STAFF: { label: 'Staff', icon: UserCog, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  CUSTOMER: { label: 'Member', icon: Star, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
} as const;

const sectionLabels: Record<string, string> = {
  management: 'Management',
  admin: 'Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  };

  const role = user?.role ?? 'CUSTOMER';
  const filteredNav = navItems.filter(item => item.roles.includes(role));

  // Group by section, maintain order
  const grouped: { section: string; items: NavItem[] }[] = [];
  let currentSection = '';
  for (const item of filteredNav) {
    const section = item.section ?? 'main';
    if (section !== currentSection) {
      currentSection = section;
      grouped.push({ section, items: [] });
    }
    grouped[grouped.length - 1].items.push(item);
  }

  const badge = roleBadgeConfig[role as keyof typeof roleBadgeConfig];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300',
        'bg-[#0d0d18] border-r border-white/[0.06]',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center glow-purple">
          <Zap size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <div className="font-display font-bold text-lg text-white tracking-wider leading-none">
              <span>GAME</span>
              <span className="text-gradient">ZONE</span>
            </div>
            <div className="text-[9px] text-slate-600 tracking-[0.2em] uppercase mt-0.5">CRM Platform</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'ml-auto p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition',
            !sidebarOpen && 'hidden'
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {grouped.map(({ section, items }) => (
          <div key={section}>
            {/* Section divider — visible only when sidebar open and it's not the main section */}
            {sidebarOpen && section !== 'main' && (
              <div className="px-3 pt-4 pb-1">
                <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em]">
                  {sectionLabels[section]}
                </span>
              </div>
            )}
            {!sidebarOpen && section !== 'main' && (
              <div className="px-2 pt-3 pb-1">
                <div className="h-px bg-white/[0.06]" />
              </div>
            )}
            {items.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                  )
                }
                title={!sidebarOpen ? label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={cn(
                        'flex-shrink-0 transition',
                        isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    {sidebarOpen && <span>{label}</span>}
                    {isActive && sidebarOpen && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 pulse-glow" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {sidebarOpen && user && (
          <div className="glass-card p-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Role badge */}
            <div className="mt-2.5 flex items-center justify-between">
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1', badge.color)}>
                <badge.icon size={9} />
                {badge.label}
              </span>

              {/* Loyalty points — show for customers */}
              {role === 'CUSTOMER' && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <Star size={10} className="fill-amber-400" />
                  {user.loyaltyPoints} pts
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500',
            'hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20'
          )}
          title={!sidebarOpen ? 'Sign Out' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
