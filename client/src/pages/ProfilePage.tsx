import { useAuthStore } from '@/store/auth.store';
import Topbar from '@/components/layout/Topbar';
import { Star, Mail, Phone, Shield, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div>
      <Topbar title="Profile" subtitle="Your account details" />
      <div className="p-6 max-w-2xl">
        <div className="glass-card p-8 animate-slide-in">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-3xl font-bold glow-purple">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
              { icon: Shield, label: 'Role', value: user?.role },
              { icon: Star, label: 'Loyalty Points', value: `${user?.loyaltyPoints?.toLocaleString() || 0} pts` },
              { icon: CalendarDays, label: 'Member Since', value: user?.createdAt ? formatDate(user.createdAt) : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
