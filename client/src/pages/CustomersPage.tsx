import { useEffect, useState, useMemo } from 'react';
import { Search, UserPlus, Star, Phone, Mail, ChevronRight, Activity, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { User } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

const TierBadge = ({ tier }: { tier?: string }) => {
  const config: Record<string, string> = {
    'Platinum': 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-800 shadow-[0_0_10px_rgba(203,213,225,0.5)]',
    'Gold': 'bg-gradient-to-r from-yellow-500 to-amber-400 text-amber-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    'Silver': 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900',
    'Bronze': 'bg-gradient-to-r from-orange-400 to-orange-300 text-orange-950',
  };
  
  const defaultStyle = 'bg-slate-800 text-slate-400 border border-slate-700';

  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${tier ? config[tier] : defaultStyle}`}>
      {tier || 'Bronze'}
    </span>
  );
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?role=CUSTOMER&limit=50`); // Fetch 50 and filter locally
      setUsers(data.users);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (tierFilter !== 'ALL' && u.tier !== tierFilter) return false;
      const q = search.toLowerCase();
      if (q && !u.name.toLowerCase().includes(q) && !(u.email && u.email.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [users, tierFilter, search]);

  return (
    <div>
      <Topbar title="Customer Management" subtitle="Track engagement and loyalty tiers" />
      <div className="p-6 space-y-6">

        {/* Global Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card p-4 flex flex-col justify-center items-center glow-amber border-amber-500/20">
             <Star className="text-amber-400 mb-2" size={24} />
             <div className="text-2xl font-bold text-white">{users.filter(u => u.tier === 'Gold' || u.tier === 'Platinum').length}</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Premium VIPs</div>
          </div>
          <div className="glass-card p-4 flex flex-col justify-center items-center">
             <Activity className="text-blue-400 mb-2" size={24} />
             <div className="text-2xl font-bold text-white">{users.reduce((acc, u) => acc + (u._count?.bookings || 0), 0)}</div>
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Total Visits</div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full md:w-auto">
             <div className="relative flex-1 sm:w-64">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
               <input
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search customers..."
                 className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition"
               />
             </div>
             <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:border-purple-500/50 transition h-full outline-none">
                   <option value="ALL">All Tiers</option>
                   <option value="Bronze">Bronze (Standard)</option>
                   <option value="Silver">Silver</option>
                   <option value="Gold">Gold</option>
                   <option value="Platinum">Platinum (VIP)</option>
                </select>
             </div>
          </div>
          <button
            className="flex w-full md:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition glow-purple"
          >
            <UserPlus size={16} /> Add Customer
          </button>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  {['Player', 'Status Tier', 'Contact', 'Total Spent', 'Visits', 'Points', ''].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest px-5 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12"><div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12 text-sm">No customers found based on filters</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} onClick={() => navigate(`/customers/${user.id}`)} className="border-b border-white/[0.03] hover:bg-white/[0.06] transition group cursor-pointer">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">Joined {formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><TierBadge tier={user.tier} /></td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {user.phone && <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><Phone size={10} />{user.phone}</div>}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Mail size={10} />{user.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-400">{formatCurrency(user.totalSpent || 0)}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-white">{user._count?.bookings || 0}</span>
                    </td>
                    <td className="px-5 py-4 flex items-center gap-1.5">
                       <Star size={12} className="text-amber-400" />
                       <span className="text-xs font-bold text-amber-400">{user.loyaltyPoints.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/5 text-slate-300 transition-all inline-flex">
                        <ChevronRight size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
