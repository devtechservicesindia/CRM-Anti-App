import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

interface TopbarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Topbar({ title, subtitle, action }: TopbarProps) {
  const { user } = useAuthStore();
  const { toggleSidebar, sidebarOpen } = useUIStore();

  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-30">
      {/* Hamburger when sidebar closed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-white font-display tracking-wide">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 w-64">
        <Search size={15} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none flex-1"
        />
      </div>

      {/* Action slot */}
      {action && <div className="flex items-center gap-2">{action}</div>}

      {/* Notifications */}
      <button className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/10 transition">
        <Bell size={18} className="text-slate-400" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full pulse-glow" />
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold glow-purple">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
